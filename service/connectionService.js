// service/connectionService.js
const ApiError = require('../error/ApiError');
const UserConnectionRepository = require('../repository/userConnectionRepository');
const UserRepository = require('../repository/userRepository');
const { User } = require('../models/legacy_models');
const { Op } = require('sequelize');
const { ConnectionRequest } = require('../models/legacy_models');

class ConnectionService {
   /**
    * Отправить запрос на подключение
    * Универсальный метод для любого направления
    */
   async sendConnectionRequest(senderId, receiverId, message = '') {
      // 1. Получаем информацию об отправителе и получателе
      const sender = await UserRepository.findUserById(senderId);
      const receiver = await UserRepository.findUserById(receiverId);

      if (!sender || !receiver) {
         throw ApiError.notFound('Пользователь не найден');
      }

      // 2. Валидация ролей
      if (sender.role === 'trainer' && receiver.role === 'trainer') {
         throw ApiError.badRequest('Тренер не может отправлять запрос другому тренеру');
      }
      if (sender.role === 'trainee' && receiver.role === 'trainee') {
         throw ApiError.badRequest('Подопечный не может отправлять запрос другому подопечному');
      }

      // 3. Проверяем существование активной связи
      const existingConnection = await UserConnectionRepository.findConnectionBetween(
         senderId,
         receiverId
      );
      if (existingConnection) {
         throw ApiError.badRequest('Связь уже установлена');
      }

      // 4. Проверяем существование pending запроса в любом направлении
      const existingRequest = await UserConnectionRepository.findExistingRequest(
         senderId,
         receiverId
      );
      if (existingRequest && existingRequest.status === 'pending') {
         throw ApiError.badRequest('Запрос уже отправлен');
      }

      // 5. Если был rejected/cancelled запрос - удаляем его или перезаписываем
      if (existingRequest) {
         await existingRequest.destroy();
      }

      // 6. Создаем новый запрос
      return await UserConnectionRepository.createConnectionRequest({
         sender_id: senderId,
         receiver_id: receiverId,
         sender_role: sender.role,
         message: message || this.getDefaultMessage(sender.role, receiver.role)
      });
   }

   /**
    * Получить дефолтное сообщение в зависимости от ролей
    */
   getDefaultMessage(senderRole, receiverRole) {
      if (senderRole === 'trainee' && receiverRole === 'trainer') {
         return 'Хотел бы стать вашим подопечным';
      }
      if (senderRole === 'trainer' && receiverRole === 'trainee') {
         return 'Хотел бы стать вашим тренером';
      }
      return 'Запрос на подключение';
   }

   /**
    * Ответить на входящий запрос
    */
   async respondToRequest(requestId, userId, action) {
      // 1. Находим запрос с полными данными
      const request = await UserConnectionRepository.getRequestById(requestId);
      if (!request) {
         throw ApiError.notFound('Запрос не найден');
      }

      // 2. Проверяем, что запрос адресован этому пользователю
      if (request.receiver_id !== userId) {
         throw ApiError.forbidden('Нет прав для ответа на этот запрос');
      }

      // 3. Проверяем, что запрос еще в статусе pending
      if (request.status !== 'pending') {
         throw ApiError.badRequest(`Запрос уже ${this.getStatusText(request.status)}`);
      }

      // 4. Определяем новый статус
      const newStatus = action === 'accept' ? 'accepted' : 'rejected';

      // 5. Обновляем статус запроса
      await UserConnectionRepository.updateRequestStatus(requestId, newStatus);

      let connection = null;

      // 6. Если принято - создаем связь
      if (action === 'accept') {
         // Определяем кто тренер, кто подопечный
         let trainerId, traineeId;

         if (request.sender_role === 'trainer') {
            // Тренер отправил запрос подопечному
            trainerId = request.sender_id;
            traineeId = request.receiver_id;
         } else {
            // Подопечный отправил запрос тренеру
            trainerId = request.receiver_id;
            traineeId = request.sender_id;
         }

         connection = await UserConnectionRepository.createConnection(trainerId, traineeId);
      }

      return {
         success: true,
         action,
         status: newStatus,
         connectionCreated: action === 'accept',
         connection
      };
   }

   /**
    * Отменить исходящий запрос
    */
   async cancelRequest(requestId, userId) {
      const request = await UserConnectionRepository.getRequestById(requestId);

      if (!request) {
         throw ApiError.notFound('Запрос не найден');
      }

      // Проверяем, что пользователь - отправитель запроса
      if (request.sender_id !== userId) {
         throw ApiError.forbidden('Нельзя отменить чужой запрос');
      }

      if (request.status !== 'pending') {
         throw ApiError.badRequest(`Нельзя отменить запрос со статусом "${request.status}"`);
      }

      await UserConnectionRepository.cancelRequest(requestId);

      return {
         success: true,
         message: 'Запрос отменен'
      };
   }

   /**
    * Получить входящие запросы (пользователь - получатель)
    */
   async getIncomingRequests(userId, status = 'pending') {
      return await UserConnectionRepository.getIncomingRequests(userId, status);
   }

   /**
    * Получить исходящие запросы (пользователь - отправитель)
    */
   async getOutgoingRequests(userId, status = 'pending') {
      return await UserConnectionRepository.getOutgoingRequests(userId, status);
   }

   /**
    * Получить всех подопечных тренера
    */
   async getTrainees(trainerId) {
      return await UserConnectionRepository.getTrainees(trainerId);
   }

   /**
    * Получить всех тренеров подопечного
    */
   async getTrainers(traineeId) {
      return await UserConnectionRepository.getTrainers(traineeId);
   }

   /**
    * Удалить связь между пользователями
    */
   async removeConnection(userId, targetUserId) {
      // Проверяем, что связь существует
      const connection = await UserConnectionRepository.findConnectionBetween(userId, targetUserId);

      if (!connection) {
         throw ApiError.notFound('Связь не найдена');
      }

      // 🟢 НОВОЕ: Находим и обновляем статус принятого запроса
      const acceptedRequest = await UserConnectionRepository.findAcceptedRequestBetween(
         userId,
         targetUserId
      );

      if (acceptedRequest) {
         console.log(`🟢 Найден принятый запрос #${acceptedRequest.id}, меняем статус на 'cancelled'`);
         await UserConnectionRepository.updateRequestStatus(acceptedRequest.id, 'cancelled');
      }

      // Удаляем связь
      await UserConnectionRepository.deleteConnectionBetween(userId, targetUserId);

      return {
         success: true,
         message: 'Связь удалена'
      };
   }

   /**
    * Поиск тренеров для подопечного
    */
   // service/connectionService.js

   async searchTrainers(traineeId, filters = {}) {
      const { query, specialization, limit = 10, offset = 0 } = filters;

      // Получаем ID уже связанных тренеров
      const existingTrainers = await this.getTrainers(traineeId);
      const connectedTrainerIds = existingTrainers.map(t => t.id);

      // Получаем ID тренеров, которым уже отправлены запросы
      const outgoingRequests = await this.getOutgoingRequests(traineeId, 'pending');
      const pendingTrainerIds = outgoingRequests.map(req => req.receiver_id);

      // 🟢 ДОПОЛНИТЕЛЬНО: Проверяем, нет ли "висячих" accepted запросов
      // Такие тренеры не должны быть в excludeIds, так как связи с ними нет
      const acceptedRequests = await ConnectionRequest.findAll({
         where: {
            [Op.or]: [
               { sender_id: traineeId, status: 'accepted' },
               { receiver_id: traineeId, status: 'accepted' }
            ]
         }
      });

      const acceptedTrainerIds = [];
      for (const request of acceptedRequests) {
         const trainerId = request.sender_id === traineeId
            ? request.receiver_id
            : request.sender_id;

         // Проверяем, есть ли реальная связь
         const connection = await UserConnectionRepository.findConnectionBetween(
            traineeId,
            trainerId
         );

         if (!connection) {
            // Висячий accepted запрос - исправляем его
            console.log(`🟢 Исправляем висячий accepted запрос #${request.id}`);
            await UserConnectionRepository.updateRequestStatus(request.id, 'cancelled');
         } else {
            // Если связь есть - добавляем в исключения
            acceptedTrainerIds.push(trainerId);
         }
      }

      // Исключаем: себя, уже подключенных, и тех кому отправлен запрос
      const excludeIds = [
         traineeId,
         ...connectedTrainerIds,
         ...pendingTrainerIds,
         ...acceptedTrainerIds  // Добавляем только тех, у кого реально есть связь
      ].filter(id => id !== undefined && id !== null);

      return await UserConnectionRepository.searchTrainers({
         query,
         specialization,
         excludeIds,
         traineeId,
         limit: parseInt(limit),
         offset: parseInt(offset)
      });
   }

   /**
    * Поиск подопечных для тренера
    */
   async searchTrainees(trainerId, filters = {}) {
      const { query, limit = 10, offset = 0 } = filters;

      // Получаем ID уже связанных подопечных
      const existingTrainees = await this.getTrainees(trainerId);
      const connectedTraineeIds = existingTrainees.map(t => t.id);

      // Получаем ID подопечных, которым уже отправлены запросы
      const outgoingRequests = await this.getOutgoingRequests(trainerId, 'pending');
      const pendingTraineeIds = outgoingRequests.map(req => req.receiver_id);

      // Получаем ID подопечных, от которых есть входящие запросы
      const incomingRequests = await this.getIncomingRequests(trainerId, 'pending');
      const incomingTraineeIds = incomingRequests.map(req => req.sender_id);

      // Исключаем: себя, уже подключенных, и тех с кем есть активные запросы
      const excludeIds = [
         trainerId,
         ...connectedTraineeIds,
         ...pendingTraineeIds,
         ...incomingTraineeIds
      ].filter(id => id !== undefined && id !== null);

      return await UserConnectionRepository.searchTrainees({
         query,
         excludeIds,
         trainerId,      // Для получения статусов
         limit: parseInt(limit),
         offset: parseInt(offset)
      });
   }

   /**
    * Рекомендации тренеров для подопечного
    */
   async getTrainerRecommendations(traineeId, limit = 5) {
      // Получаем ID уже связанных тренеров
      const existingTrainers = await this.getTrainers(traineeId);
      const connectedTrainerIds = existingTrainers.map(t => t.id);

      // Получаем ID тренеров, которым уже отправлены запросы
      const outgoingRequests = await this.getOutgoingRequests(traineeId, 'pending');
      const pendingTrainerIds = outgoingRequests.map(req => req.receiver_id);

      // Исключаем: себя, уже подключенных, и тех кому отправлен запрос
      const excludeIds = [
         traineeId,
         ...connectedTrainerIds,
         ...pendingTrainerIds
      ].filter(id => id !== undefined && id !== null);

      return await UserConnectionRepository.getRecommendedTrainers(
         excludeIds,
         parseInt(limit)
      );
   }

   /**
    * Получить статистику подключений пользователя
    */
   async getConnectionStats(userId) {
      const user = await User.findByPk(userId);
      if (!user) {
         throw ApiError.notFound('Пользователь не найден');
      }

      const stats = {
         trainees_count: 0,
         trainers_count: 0,
         incoming_requests_count: 0,
         outgoing_requests_count: 0,
         pending_requests_count: 0,
         total_connections: 0,
         role: user.role
      };

      if (user.role === 'trainer') {
         stats.trainees_count = await UserConnectionRepository.countTrainees(userId);
         stats.incoming_requests_count = await UserConnectionRepository.countIncomingRequests(userId, 'pending');
         stats.outgoing_requests_count = await UserConnectionRepository.countOutgoingRequests(userId, 'pending');
      } else if (user.role === 'trainee') {
         stats.trainers_count = await UserConnectionRepository.countTrainers(userId);
         stats.outgoing_requests_count = await UserConnectionRepository.countOutgoingRequests(userId, 'pending');
         stats.incoming_requests_count = await UserConnectionRepository.countIncomingRequests(userId, 'pending');
      }

      stats.total_connections = stats.trainees_count + stats.trainers_count;
      stats.pending_requests_count = stats.incoming_requests_count + stats.outgoing_requests_count;

      return stats;
   }

   /**
    * Проверить статус связи между пользователями
    */
   async getConnectionStatus(userId, targetUserId) {
      // 1. Проверяем активную связь
      const connection = await UserConnectionRepository.findConnectionBetween(userId, targetUserId);
      if (connection) {
         return {
            status: 'connected',
            connection,
            direction: connection.trainer_id === userId ? 'trainer' : 'trainee'
         };
      }

      // 2. Проверяем существующие запросы
      const request = await UserConnectionRepository.findExistingRequest(userId, targetUserId);
      if (request) {
         let direction = 'outgoing';
         if (request.receiver_id === userId) {
            direction = 'incoming';
         }

         return {
            status: request.status,
            request_id: request.id,
            direction,
            sender_role: request.sender_role
         };
      }

      // 3. Нет связи и нет запросов
      return {
         status: 'none',
         direction: null
      };
   }

   // ============ DEPRECATED METHODS (для обратной совместимости) ============

   /**
    * @deprecated Используйте sendConnectionRequest с правильными параметрами
    */
   async sendConnectionRequestOld(traineeId, trainerId, message = '') {
      console.warn('Deprecated: use sendConnectionRequest(senderId, receiverId, message)');
      return await this.sendConnectionRequest(traineeId, trainerId, message);
   }

   /**
    * @deprecated Используйте sendConnectionRequest
    */
   async sendTraineeConnectionRequest(trainerId, traineeId, message = '') {
      console.warn('Deprecated: use sendConnectionRequest(trainerId, traineeId, message)');
      return await this.sendConnectionRequest(trainerId, traineeId, message);
   }
}

module.exports = new ConnectionService();