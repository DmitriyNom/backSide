// // service/connectionService.js
// const ApiError = require('../error/ApiError');
// const UserConnectionRepository = require('../repository/userConnectionRepository');
// const UserRepository = require('../repository/userRepository');
// const { User } = require('../models/legacy_models');
// const { Op } = require('sequelize');
// const { ConnectionRequest } = require('../models/legacy_models');

// class ConnectionService {
//    /**
//     * Отправить запрос на подключение
//     * Универсальный метод для любого направления
//     */
//    async sendConnectionRequest(senderId, receiverId, message = '') {
//       // 1. Получаем информацию об отправителе и получателе
//       const sender = await UserRepository.findUserById(senderId);
//       const receiver = await UserRepository.findUserById(receiverId);

//       if (!sender || !receiver) {
//          throw ApiError.notFound('Пользователь не найден');
//       }

//       // 2. Валидация ролей
//       if (sender.role === 'trainer' && receiver.role === 'trainer') {
//          throw ApiError.badRequest('Тренер не может отправлять запрос другому тренеру');
//       }
//       if (sender.role === 'trainee' && receiver.role === 'trainee') {
//          throw ApiError.badRequest('Подопечный не может отправлять запрос другому подопечному');
//       }

//       // 3. Проверяем существование активной связи
//       const existingConnection = await UserConnectionRepository.findConnectionBetween(
//          senderId,
//          receiverId
//       );
//       if (existingConnection) {
//          throw ApiError.badRequest('Связь уже установлена');
//       }

//       // 4. Проверяем существование pending запроса в любом направлении
//       const existingRequest = await UserConnectionRepository.findExistingRequest(
//          senderId,
//          receiverId
//       );
//       if (existingRequest && existingRequest.status === 'pending') {
//          throw ApiError.badRequest('Запрос уже отправлен');
//       }

//       // 5. Если был rejected/cancelled запрос - удаляем его или перезаписываем
//       if (existingRequest) {
//          await existingRequest.destroy();
//       }

//       // 6. Создаем новый запрос
//       return await UserConnectionRepository.createConnectionRequest({
//          sender_id: senderId,
//          receiver_id: receiverId,
//          sender_role: sender.role,
//          message: message || this.getDefaultMessage(sender.role, receiver.role)
//       });
//    }

//    /**
//     * Получить дефолтное сообщение в зависимости от ролей
//     */
//    getDefaultMessage(senderRole, receiverRole) {
//       if (senderRole === 'trainee' && receiverRole === 'trainer') {
//          return 'Хотел бы стать вашим подопечным';
//       }
//       if (senderRole === 'trainer' && receiverRole === 'trainee') {
//          return 'Хотел бы стать вашим тренером';
//       }
//       return 'Запрос на подключение';
//    }

//    /**
//     * Ответить на входящий запрос
//     */
//    async respondToRequest(requestId, userId, action) {
//       // 1. Находим запрос с полными данными
//       const request = await UserConnectionRepository.getRequestById(requestId);
//       if (!request) {
//          throw ApiError.notFound('Запрос не найден');
//       }

//       // 2. Проверяем, что запрос адресован этому пользователю
//       if (request.receiver_id !== userId) {
//          throw ApiError.forbidden('Нет прав для ответа на этот запрос');
//       }

//       // 3. Проверяем, что запрос еще в статусе pending
//       if (request.status !== 'pending') {
//          throw ApiError.badRequest(`Запрос уже ${this.getStatusText(request.status)}`);
//       }

//       // 4. Определяем новый статус
//       const newStatus = action === 'accept' ? 'accepted' : 'rejected';

//       // 5. Обновляем статус запроса
//       await UserConnectionRepository.updateRequestStatus(requestId, newStatus);

//       let connection = null;

//       // 6. Если принято - создаем связь
//       if (action === 'accept') {
//          // Определяем кто тренер, кто подопечный
//          let trainerId, traineeId;

//          if (request.sender_role === 'trainer') {
//             // Тренер отправил запрос подопечному
//             trainerId = request.sender_id;
//             traineeId = request.receiver_id;
//          } else {
//             // Подопечный отправил запрос тренеру
//             trainerId = request.receiver_id;
//             traineeId = request.sender_id;
//          }

//          connection = await UserConnectionRepository.createConnection(trainerId, traineeId);
//       }

//       return {
//          success: true,
//          action,
//          status: newStatus,
//          connectionCreated: action === 'accept',
//          connection
//       };
//    }

//    /**
//     * Отменить исходящий запрос
//     */
//    async cancelRequest(requestId, userId) {
//       const request = await UserConnectionRepository.getRequestById(requestId);

//       if (!request) {
//          throw ApiError.notFound('Запрос не найден');
//       }

//       // Проверяем, что пользователь - отправитель запроса
//       if (request.sender_id !== userId) {
//          throw ApiError.forbidden('Нельзя отменить чужой запрос');
//       }

//       if (request.status !== 'pending') {
//          throw ApiError.badRequest(`Нельзя отменить запрос со статусом "${request.status}"`);
//       }

//       await UserConnectionRepository.cancelRequest(requestId);

//       return {
//          success: true,
//          message: 'Запрос отменен'
//       };
//    }

//    /**
//     * Получить входящие запросы (пользователь - получатель)
//     */
//    async getIncomingRequests(userId, status = 'pending') {
//       return await UserConnectionRepository.getIncomingRequests(userId, status);
//    }

//    /**
//     * Получить исходящие запросы (пользователь - отправитель)
//     */
//    async getOutgoingRequests(userId, status = 'pending') {
//       return await UserConnectionRepository.getOutgoingRequests(userId, status);
//    }

//    /**
//     * Получить всех подопечных тренера
//     */
//    async getTrainees(trainerId) {
//       return await UserConnectionRepository.getTrainees(trainerId);
//    }

//    /**
//     * Получить всех тренеров подопечного
//     */
//    async getTrainers(traineeId) {
//       return await UserConnectionRepository.getTrainers(traineeId);
//    }

//    /**
//     * Удалить связь между пользователями
//     */
//    async removeConnection(userId, targetUserId) {
//       // Проверяем, что связь существует
//       const connection = await UserConnectionRepository.findConnectionBetween(userId, targetUserId);

//       if (!connection) {
//          throw ApiError.notFound('Связь не найдена');
//       }

//       // 🟢 НОВОЕ: Находим и обновляем статус принятого запроса
//       const acceptedRequest = await UserConnectionRepository.findAcceptedRequestBetween(
//          userId,
//          targetUserId
//       );

//       if (acceptedRequest) {
//          console.log(`🟢 Найден принятый запрос #${acceptedRequest.id}, меняем статус на 'cancelled'`);
//          await UserConnectionRepository.updateRequestStatus(acceptedRequest.id, 'cancelled');
//       }

//       // Удаляем связь
//       await UserConnectionRepository.deleteConnectionBetween(userId, targetUserId);

//       return {
//          success: true,
//          message: 'Связь удалена'
//       };
//    }

//    /**
//     * Поиск тренеров для подопечного
//     */
//    // service/connectionService.js

//    async searchTrainers(traineeId, filters = {}) {
//       const { query, specialization, limit = 10, offset = 0 } = filters;

//       // Получаем ID уже связанных тренеров
//       const existingTrainers = await this.getTrainers(traineeId);
//       const connectedTrainerIds = existingTrainers.map(t => t.id);

//       // Получаем ID тренеров, которым уже отправлены запросы
//       const outgoingRequests = await this.getOutgoingRequests(traineeId, 'pending');
//       const pendingTrainerIds = outgoingRequests.map(req => req.receiver_id);

//       // 🟢 ДОПОЛНИТЕЛЬНО: Проверяем, нет ли "висячих" accepted запросов
//       // Такие тренеры не должны быть в excludeIds, так как связи с ними нет
//       const acceptedRequests = await ConnectionRequest.findAll({
//          where: {
//             [Op.or]: [
//                { sender_id: traineeId, status: 'accepted' },
//                { receiver_id: traineeId, status: 'accepted' }
//             ]
//          }
//       });

//       const acceptedTrainerIds = [];
//       for (const request of acceptedRequests) {
//          const trainerId = request.sender_id === traineeId
//             ? request.receiver_id
//             : request.sender_id;

//          // Проверяем, есть ли реальная связь
//          const connection = await UserConnectionRepository.findConnectionBetween(
//             traineeId,
//             trainerId
//          );

//          if (!connection) {
//             // Висячий accepted запрос - исправляем его
//             console.log(`🟢 Исправляем висячий accepted запрос #${request.id}`);
//             await UserConnectionRepository.updateRequestStatus(request.id, 'cancelled');
//          } else {
//             // Если связь есть - добавляем в исключения
//             acceptedTrainerIds.push(trainerId);
//          }
//       }

//       // Исключаем: себя, уже подключенных, и тех кому отправлен запрос
//       const excludeIds = [
//          traineeId,
//          ...connectedTrainerIds,
//          ...pendingTrainerIds,
//          ...acceptedTrainerIds  // Добавляем только тех, у кого реально есть связь
//       ].filter(id => id !== undefined && id !== null);

//       return await UserConnectionRepository.searchTrainers({
//          query,
//          specialization,
//          excludeIds,
//          traineeId,
//          limit: parseInt(limit),
//          offset: parseInt(offset)
//       });
//    }

//    /**
//     * Поиск подопечных для тренера
//     */
//    async searchTrainees(trainerId, filters = {}) {
//       const { query, limit = 10, offset = 0 } = filters;

//       // Получаем ID уже связанных подопечных
//       const existingTrainees = await this.getTrainees(trainerId);
//       const connectedTraineeIds = existingTrainees.map(t => t.id);

//       // Получаем ID подопечных, которым уже отправлены запросы
//       const outgoingRequests = await this.getOutgoingRequests(trainerId, 'pending');
//       const pendingTraineeIds = outgoingRequests.map(req => req.receiver_id);

//       // Получаем ID подопечных, от которых есть входящие запросы
//       const incomingRequests = await this.getIncomingRequests(trainerId, 'pending');
//       const incomingTraineeIds = incomingRequests.map(req => req.sender_id);

//       // Исключаем: себя, уже подключенных, и тех с кем есть активные запросы
//       const excludeIds = [
//          trainerId,
//          ...connectedTraineeIds,
//          ...pendingTraineeIds,
//          ...incomingTraineeIds
//       ].filter(id => id !== undefined && id !== null);

//       return await UserConnectionRepository.searchTrainees({
//          query,
//          excludeIds,
//          trainerId,      // Для получения статусов
//          limit: parseInt(limit),
//          offset: parseInt(offset)
//       });
//    }

//    /**
//     * Рекомендации тренеров для подопечного
//     */
//    async getTrainerRecommendations(traineeId, limit = 5) {
//       // Получаем ID уже связанных тренеров
//       const existingTrainers = await this.getTrainers(traineeId);
//       const connectedTrainerIds = existingTrainers.map(t => t.id);

//       // Получаем ID тренеров, которым уже отправлены запросы
//       const outgoingRequests = await this.getOutgoingRequests(traineeId, 'pending');
//       const pendingTrainerIds = outgoingRequests.map(req => req.receiver_id);

//       // Исключаем: себя, уже подключенных, и тех кому отправлен запрос
//       const excludeIds = [
//          traineeId,
//          ...connectedTrainerIds,
//          ...pendingTrainerIds
//       ].filter(id => id !== undefined && id !== null);

//       return await UserConnectionRepository.getRecommendedTrainers(
//          excludeIds,
//          parseInt(limit)
//       );
//    }

//    /**
//     * Получить статистику подключений пользователя
//     */
//    async getConnectionStats(userId) {
//       const user = await User.findByPk(userId);
//       if (!user) {
//          throw ApiError.notFound('Пользователь не найден');
//       }

//       const stats = {
//          trainees_count: 0,
//          trainers_count: 0,
//          incoming_requests_count: 0,
//          outgoing_requests_count: 0,
//          pending_requests_count: 0,
//          total_connections: 0,
//          role: user.role
//       };

//       if (user.role === 'trainer') {
//          stats.trainees_count = await UserConnectionRepository.countTrainees(userId);
//          stats.incoming_requests_count = await UserConnectionRepository.countIncomingRequests(userId, 'pending');
//          stats.outgoing_requests_count = await UserConnectionRepository.countOutgoingRequests(userId, 'pending');
//       } else if (user.role === 'trainee') {
//          stats.trainers_count = await UserConnectionRepository.countTrainers(userId);
//          stats.outgoing_requests_count = await UserConnectionRepository.countOutgoingRequests(userId, 'pending');
//          stats.incoming_requests_count = await UserConnectionRepository.countIncomingRequests(userId, 'pending');
//       }

//       stats.total_connections = stats.trainees_count + stats.trainers_count;
//       stats.pending_requests_count = stats.incoming_requests_count + stats.outgoing_requests_count;

//       return stats;
//    }

//    /**
//     * Проверить статус связи между пользователями
//     */
//    async getConnectionStatus(userId, targetUserId) {
//       // 1. Проверяем активную связь
//       const connection = await UserConnectionRepository.findConnectionBetween(userId, targetUserId);
//       if (connection) {
//          return {
//             status: 'connected',
//             connection,
//             direction: connection.trainer_id === userId ? 'trainer' : 'trainee'
//          };
//       }

//       // 2. Проверяем существующие запросы
//       const request = await UserConnectionRepository.findExistingRequest(userId, targetUserId);
//       if (request) {
//          let direction = 'outgoing';
//          if (request.receiver_id === userId) {
//             direction = 'incoming';
//          }

//          return {
//             status: request.status,
//             request_id: request.id,
//             direction,
//             sender_role: request.sender_role
//          };
//       }

//       // 3. Нет связи и нет запросов
//       return {
//          status: 'none',
//          direction: null
//       };
//    }

//    // ============ DEPRECATED METHODS (для обратной совместимости) ============

//    /**
//     * @deprecated Используйте sendConnectionRequest с правильными параметрами
//     */
//    async sendConnectionRequestOld(traineeId, trainerId, message = '') {
//       console.warn('Deprecated: use sendConnectionRequest(senderId, receiverId, message)');
//       return await this.sendConnectionRequest(traineeId, trainerId, message);
//    }

//    /**
//     * @deprecated Используйте sendConnectionRequest
//     */
//    async sendTraineeConnectionRequest(trainerId, traineeId, message = '') {
//       console.warn('Deprecated: use sendConnectionRequest(trainerId, traineeId, message)');
//       return await this.sendConnectionRequest(trainerId, traineeId, message);
//    }
// }

// module.exports = new ConnectionService();

// service/connectionService.js
const ApiError = require('../error/ApiError');
const UserConnectionRepository = require('../repository/userConnectionRepository');
const UserRepository = require('../repository/userRepository');
const FriendService = require('./friendService');
const TrainingContextService = require('./trainingContextService');
const { User } = require('../models/legacy_models');
const { Op } = require('sequelize');
const { ConnectionRequest } = require('../models/legacy_models');

class ConnectionService {
   constructor() {
      // Флаг для постепенного переключения на новую архитектуру
      // Можно управлять через переменные окружения или конфиг
      this.useNewArchitecture = process.env.USE_NEW_ARCHITECTURE === 'true' || false;
   }

   // ============ УНИВЕРСАЛЬНЫЕ МЕТОДЫ С ПОДДЕРЖКОЙ НОВОЙ АРХИТЕКТУРЫ ============

   /**
    * Отправить запрос на подключение
    * Универсальный метод для любого направления
    * Поддерживает и старую, и новую архитектуру
    */
   async sendConnectionRequest(senderId, receiverId, message = '') {
      console.log(`🟡 ConnectionService.sendConnectionRequest: ${senderId} -> ${receiverId}`);

      // Если включена новая архитектура - используем FriendService
      if (this.useNewArchitecture) {
         try {
            console.log('🟢 Используем новую архитектуру (FriendService)');
            const result = await FriendService.sendFriendRequest(senderId, receiverId, message);

            // Преобразуем ответ в старый формат для обратной совместимости
            return this._convertFriendRequestToOldFormat(result);
         } catch (error) {
            console.error('🔴 Ошибка в новой архитектуре:', error.message);
            // Если ошибка в новой архитектуре, пробуем старую как fallback
            console.log('⚠ Fallback на старую архитектуру');
         }
      }

      // Старая логика (fallback или если новая архитектура выключена)
      console.log('🟢 Используем старую архитектуру');

      // 1. Получаем информацию об отправителе и получателе
      const sender = await UserRepository.findUserById(senderId);
      const receiver = await UserRepository.findUserById(receiverId);

      if (!sender || !receiver) {
         throw ApiError.notFound('Пользователь не найден');
      }

      // 2. Валидация ролей (предупреждаем, что это устаревшая проверка)
      console.warn('⚠ Валидация по ролям будет отключена в новой архитектуре');
      if (sender.role === 'trainer' && receiver.role === 'trainer') {
         // В новой архитектуре тренеры могут дружить, поэтому только предупреждение
         console.warn('⚠ Тренер отправляет запрос тренеру - в новой архитектуре это разрешено');
         // throw ApiError.badRequest('Тренер не может отправлять запрос другому тренеру');
      }
      if (sender.role === 'trainee' && receiver.role === 'trainee') {
         console.warn('⚠ Подопечный отправляет запрос подопечному - в новой архитектуре это разрешено');
         // throw ApiError.badRequest('Подопечный не может отправлять запрос другому подопечному');
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
      const request = await UserConnectionRepository.createConnectionRequest({
         sender_id: senderId,
         receiver_id: receiverId,
         sender_role: sender.role,
         message: message || this.getDefaultMessage(sender.role, receiver.role)
      });

      console.log(`✅ ConnectionService.sendConnectionRequest: запрос создан, ID: ${request.id}`);
      return request;
   }

   /**
    * Ответить на входящий запрос
    */
   async respondToRequest(requestId, userId, action) {
      console.log(`🟡 ConnectionService.respondToRequest: request ${requestId}, user ${userId}, action ${action}`);

      // Если включена новая архитектура - пробуем использовать FriendService
      if (this.useNewArchitecture) {
         try {
            console.log('🟢 Используем новую архитектуру (FriendService)');
            const result = await FriendService.respondToRequest(requestId, userId, action);

            // Преобразуем ответ в старый формат
            return this._convertFriendResponseToOldFormat(result, requestId, action);
         } catch (error) {
            console.error('🔴 Ошибка в новой архитектуре:', error.message);
            console.log('⚠ Fallback на старую архитектуру');
         }
      }

      // Старая логика
      const request = await UserConnectionRepository.getRequestById(requestId);
      if (!request) {
         throw ApiError.notFound('Запрос не найден');
      }

      if (request.receiver_id !== userId) {
         throw ApiError.forbidden('Нет прав для ответа на этот запрос');
      }

      if (request.status !== 'pending') {
         throw ApiError.badRequest(`Запрос уже ${this.getStatusText(request.status)}`);
      }

      const newStatus = action === 'accept' ? 'accepted' : 'rejected';
      await UserConnectionRepository.updateRequestStatus(requestId, newStatus);

      let connection = null;

      if (action === 'accept') {
         let trainerId, traineeId;
         if (request.sender_role === 'trainer') {
            trainerId = request.sender_id;
            traineeId = request.receiver_id;
         } else {
            trainerId = request.receiver_id;
            traineeId = request.sender_id;
         }
         connection = await UserConnectionRepository.createConnection(trainerId, traineeId);

         // 🟢 НОВОЕ: Если включена новая архитектура, дублируем в новые таблицы
         if (this.useNewArchitecture) {
            await this._syncToNewArchitecture(request, trainerId, traineeId);
         }
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
      console.log(`🟡 ConnectionService.cancelRequest: request ${requestId}, user ${userId}`);

      if (this.useNewArchitecture) {
         try {
            const result = await FriendService.cancelRequest(requestId, userId);
            return result;
         } catch (error) {
            console.error('🔴 Ошибка в новой архитектуре:', error.message);
         }
      }

      const request = await UserConnectionRepository.getRequestById(requestId);
      if (!request) {
         throw ApiError.notFound('Запрос не найден');
      }

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
    * Получить входящие запросы
    */
   async getIncomingRequests(userId, status = 'pending') {
      console.log(`🟡 ConnectionService.getIncomingRequests: user ${userId}, status ${status}`);

      if (this.useNewArchitecture && status === 'pending') {
         try {
            const requests = await FriendService.getFriendRequests(userId, 'incoming', status);
            // Преобразуем в старый формат
            return requests.map(req => this._convertFriendRequestToOld(req));
         } catch (error) {
            console.error('🔴 Ошибка в новой архитектуре:', error.message);
         }
      }

      return await UserConnectionRepository.getIncomingRequests(userId, status);
   }

   /**
    * Получить исходящие запросы
    */
   async getOutgoingRequests(userId, status = 'pending') {
      console.log(`🟡 ConnectionService.getOutgoingRequests: user ${userId}, status ${status}`);

      if (this.useNewArchitecture && status === 'pending') {
         try {
            const requests = await FriendService.getFriendRequests(userId, 'outgoing', status);
            return requests.map(req => this._convertFriendRequestToOld(req));
         } catch (error) {
            console.error('🔴 Ошибка в новой архитектуре:', error.message);
         }
      }

      return await UserConnectionRepository.getOutgoingRequests(userId, status);
   }

   /**
    * Получить всех подопечных тренера
    */
   async getTrainees(trainerId) {
      console.log(`🟡 ConnectionService.getTrainees: trainer ${trainerId}`);

      if (this.useNewArchitecture) {
         try {
            // В новой архитектуре "подопечные" - это друзья с контекстом trainer
            const friends = await FriendService.getFriends(trainerId);

            // Фильтруем тех, у кого есть контекст, где текущий пользователь - тренер
            const trainees = [];
            for (const friend of friends) {
               const contexts = friend.training_contexts || [];
               const hasTrainerContext = contexts.some(ctx =>
                  ctx.trainer_id === trainerId && ctx.status === 'active'
               );
               if (hasTrainerContext) {
                  trainees.push({
                     id: friend.id,
                     userName: friend.userName,
                     email: friend.email,
                     userAvatar: friend.userAvatar,
                     training_level: friend.training_level,
                     // Добавляем информацию о контекстах
                     training_contexts: contexts.filter(ctx => ctx.trainer_id === trainerId)
                  });
               }
            }

            return trainees;
         } catch (error) {
            console.error('🔴 Ошибка в новой архитектуре:', error.message);
         }
      }

      return await UserConnectionRepository.getTrainees(trainerId);
   }

   /**
    * Получить всех тренеров подопечного
    */
   async getTrainers(traineeId) {
      console.log(`🟡 ConnectionService.getTrainers: trainee ${traineeId}`);

      if (this.useNewArchitecture) {
         try {
            const friends = await FriendService.getFriends(traineeId);

            const trainers = [];
            for (const friend of friends) {
               const contexts = friend.training_contexts || [];
               const hasTraineeContext = contexts.some(ctx =>
                  ctx.trainee_id === traineeId && ctx.status === 'active'
               );
               if (hasTraineeContext) {
                  trainers.push({
                     id: friend.id,
                     userName: friend.userName,
                     email: friend.email,
                     userAvatar: friend.userAvatar,
                     sport_specialization: friend.sport_specialization,
                     training_contexts: contexts.filter(ctx => ctx.trainee_id === traineeId)
                  });
               }
            }

            return trainers;
         } catch (error) {
            console.error('🔴 Ошибка в новой архитектуре:', error.message);
         }
      }

      return await UserConnectionRepository.getTrainers(traineeId);
   }

   /**
    * Удалить связь между пользователями
    */
   async removeConnection(userId, targetUserId) {
      console.log(`🟡 ConnectionService.removeConnection: ${userId} -> ${targetUserId}`);

      if (this.useNewArchitecture) {
         try {
            // Проверяем, есть ли активные контексты
            const status = await FriendService.getFriendStatus(userId, targetUserId);

            if (status.training_contexts && status.training_contexts.length > 0) {
               throw ApiError.badRequest(
                  'Невозможно удалить связь, пока есть активные контексты тренировок. ' +
                  'Сначала завершите контексты.'
               );
            }

            // Удаляем из друзей
            await FriendService.removeFriend(userId, targetUserId);

            return {
               success: true,
               message: 'Связь удалена'
            };
         } catch (error) {
            if (error instanceof ApiError) throw error;
            console.error('🔴 Ошибка в новой архитектуре:', error.message);
         }
      }

      // Старая логика
      const connection = await UserConnectionRepository.findConnectionBetween(userId, targetUserId);
      if (!connection) {
         throw ApiError.notFound('Связь не найдена');
      }

      const acceptedRequest = await UserConnectionRepository.findAcceptedRequestBetween(
         userId,
         targetUserId
      );

      if (acceptedRequest) {
         console.log(`🟢 Найден принятый запрос #${acceptedRequest.id}, меняем статус на 'cancelled'`);
         await UserConnectionRepository.updateRequestStatus(acceptedRequest.id, 'cancelled');
      }

      await UserConnectionRepository.deleteConnectionBetween(userId, targetUserId);

      return {
         success: true,
         message: 'Связь удалена'
      };
   }

   // ============ МЕТОДЫ ПОИСКА (обновлены с поддержкой новой архитектуры) ============

   /**
    * Поиск тренеров для подопечного
    */
   async searchTrainers(traineeId, filters = {}) {
      console.log(`🟡 ConnectionService.searchTrainers: trainee ${traineeId}`);

      if (this.useNewArchitecture) {
         try {
            // В новой архитектуре ищем пользователей и обогащаем статусом дружбы
            const { query, specialization, limit = 10, offset = 0 } = filters;

            // Используем существующий репозиторий для поиска пользователей
            const result = await UserConnectionRepository.searchTrainers({
               query,
               specialization,
               excludeIds: [traineeId],
               limit: parseInt(limit),
               offset: parseInt(offset)
            });

            // Обогащаем статусом дружбы через FriendService
            const rowsWithStatus = await FriendService.enrichUsersWithFriendStatus(
               result.rows,
               traineeId
            );

            return {
               ...result,
               rows: rowsWithStatus
            };
         } catch (error) {
            console.error('🔴 Ошибка в новой архитектуре:', error.message);
         }
      }

      // Старая логика (без изменений)
      const { query, specialization, limit = 10, offset = 0 } = filters;

      const existingTrainers = await this.getTrainers(traineeId);
      const connectedTrainerIds = existingTrainers.map(t => t.id);

      const outgoingRequests = await this.getOutgoingRequests(traineeId, 'pending');
      const pendingTrainerIds = outgoingRequests.map(req => req.receiver_id);

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

         const connection = await UserConnectionRepository.findConnectionBetween(
            traineeId,
            trainerId
         );

         if (!connection) {
            console.log(`🟢 Исправляем висячий accepted запрос #${request.id}`);
            await UserConnectionRepository.updateRequestStatus(request.id, 'cancelled');
         } else {
            acceptedTrainerIds.push(trainerId);
         }
      }

      const excludeIds = [
         traineeId,
         ...connectedTrainerIds,
         ...pendingTrainerIds,
         ...acceptedTrainerIds
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
      console.log(`🟡 ConnectionService.searchTrainees: trainer ${trainerId}`);

      if (this.useNewArchitecture) {
         try {
            const { query, limit = 10, offset = 0 } = filters;

            const result = await UserConnectionRepository.searchTrainees({
               query,
               excludeIds: [trainerId],
               limit: parseInt(limit),
               offset: parseInt(offset)
            });

            const rowsWithStatus = await FriendService.enrichUsersWithFriendStatus(
               result.rows,
               trainerId
            );

            return {
               ...result,
               rows: rowsWithStatus
            };
         } catch (error) {
            console.error('🔴 Ошибка в новой архитектуре:', error.message);
         }
      }

      // Старая логика
      const { query, limit = 10, offset = 0 } = filters;

      const existingTrainees = await this.getTrainees(trainerId);
      const connectedTraineeIds = existingTrainees.map(t => t.id);

      const outgoingRequests = await this.getOutgoingRequests(trainerId, 'pending');
      const pendingTraineeIds = outgoingRequests.map(req => req.receiver_id);

      const incomingRequests = await this.getIncomingRequests(trainerId, 'pending');
      const incomingTraineeIds = incomingRequests.map(req => req.sender_id);

      const excludeIds = [
         trainerId,
         ...connectedTraineeIds,
         ...pendingTraineeIds,
         ...incomingTraineeIds
      ].filter(id => id !== undefined && id !== null);

      return await UserConnectionRepository.searchTrainees({
         query,
         excludeIds,
         trainerId,
         limit: parseInt(limit),
         offset: parseInt(offset)
      });
   }

   /**
    * Рекомендации тренеров для подопечного
    */
   async getTrainerRecommendations(traineeId, limit = 5) {
      console.log(`🟡 ConnectionService.getTrainerRecommendations: trainee ${traineeId}`);

      if (this.useNewArchitecture) {
         try {
            // Получаем рекомендации через старый репозиторий, но обогащаем статусом
            const existingTrainers = await this.getTrainers(traineeId);
            const connectedTrainerIds = existingTrainers.map(t => t.id);

            const outgoingRequests = await this.getOutgoingRequests(traineeId, 'pending');
            const pendingTrainerIds = outgoingRequests.map(req => req.receiver_id);

            const excludeIds = [
               traineeId,
               ...connectedTrainerIds,
               ...pendingTrainerIds
            ].filter(id => id !== undefined && id !== null);

            const trainers = await UserConnectionRepository.getRecommendedTrainers(
               excludeIds,
               parseInt(limit)
            );

            return await FriendService.enrichUsersWithFriendStatus(trainers, traineeId);
         } catch (error) {
            console.error('🔴 Ошибка в новой архитектуре:', error.message);
         }
      }

      // Старая логика
      const existingTrainers = await this.getTrainers(traineeId);
      const connectedTrainerIds = existingTrainers.map(t => t.id);

      const outgoingRequests = await this.getOutgoingRequests(traineeId, 'pending');
      const pendingTrainerIds = outgoingRequests.map(req => req.receiver_id);

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
      console.log(`🟡 ConnectionService.getConnectionStats: user ${userId}`);

      if (this.useNewArchitecture) {
         try {
            const user = await UserRepository.findUserById(userId);
            if (!user) {
               throw ApiError.notFound('Пользователь не найден');
            }

            const friendStats = await FriendService.getFriendStats(userId);

            // Преобразуем в старый формат статистики
            return {
               trainees_count: friendStats.friends_with_contexts, // приблизительно
               trainers_count: friendStats.friends_with_contexts, // приблизительно
               incoming_requests_count: friendStats.incoming_requests,
               outgoing_requests_count: friendStats.outgoing_requests,
               pending_requests_count: friendStats.incoming_requests + friendStats.outgoing_requests,
               total_connections: friendStats.total_friends,
               role: user.role
            };
         } catch (error) {
            console.error('🔴 Ошибка в новой архитектуре:', error.message);
         }
      }

      // Старая логика
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
      console.log(`🟡 ConnectionService.getConnectionStatus: ${userId} -> ${targetUserId}`);

      if (this.useNewArchitecture) {
         try {
            const status = await FriendService.getFriendStatus(userId, targetUserId);

            // Преобразуем в старый формат
            if (status.status === 'accepted') {
               return {
                  status: 'connected',
                  connection: { id: status.friendship_id },
                  direction: status.direction === 'outgoing' ? 'trainer' : 'trainee' // приблизительно
               };
            } else if (status.status === 'pending') {
               return {
                  status: 'pending',
                  request_id: status.friendship_id,
                  direction: status.direction,
                  sender_role: status.direction === 'outgoing' ?
                     (await UserRepository.findUserById(userId)).role :
                     (await UserRepository.findUserById(targetUserId)).role
               };
            } else {
               return {
                  status: 'none',
                  direction: null
               };
            }
         } catch (error) {
            console.error('🔴 Ошибка в новой архитектуре:', error.message);
         }
      }

      // Старая логика
      const connection = await UserConnectionRepository.findConnectionBetween(userId, targetUserId);
      if (connection) {
         return {
            status: 'connected',
            connection,
            direction: connection.trainer_id === userId ? 'trainer' : 'trainee'
         };
      }

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

      return {
         status: 'none',
         direction: null
      };
   }

   // ============ ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ============

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
    * Получить текстовое описание статуса
    */
   getStatusText(status) {
      const statusMap = {
         'pending': 'в ожидании',
         'accepted': 'принят',
         'rejected': 'отклонен',
         'cancelled': 'отменен',
         'blocked': 'заблокирован'
      };
      return statusMap[status] || status;
   }

   // ============ МЕТОДЫ ДЛЯ СИНХРОНИЗАЦИИ С НОВОЙ АРХИТЕКТУРОЙ ============

   /**
    * Синхронизировать старую связь с новыми таблицами
    * @private
    */
   async _syncToNewArchitecture(request, trainerId, traineeId) {
      try {
         console.log('🟢 Синхронизация с новой архитектурой');

         // Создаем запись в friends
         const Friend = require('../models/Friend');
         const friend = await Friend.create({
            user_id: request.sender_id,
            friend_id: request.receiver_id,
            status: 'accepted',
            acted_at: new Date()
         });

         // Создаем контекст тренировки
         const TrainingContext = require('../models/TrainingContext');
         await TrainingContext.create({
            friend_id: friend.id,
            sport: 'general', // TODO: получить из запроса или настроек
            trainer_id: trainerId,
            trainee_id: traineeId,
            status: 'active'
         });

         console.log('✅ Синхронизация завершена');
      } catch (error) {
         console.error('🔴 Ошибка при синхронизации:', error.message);
         // Не бросаем ошибку, чтобы не прерывать основной процесс
      }
   }

   /**
    * Конвертировать friend request в старый формат
    * @private
    */
   _convertFriendRequestToOld(friendRequest) {
      if (!friendRequest) return null;

      return {
         id: friendRequest.id,
         sender_id: friendRequest.user_id,
         receiver_id: friendRequest.friend_id,
         sender_role: friendRequest.sender?.role || 'user',
         message: friendRequest.message,
         status: friendRequest.status,
         created_at: friendRequest.created_at,
         updated_at: friendRequest.updated_at,
         sender: friendRequest.initiator,
         receiver: friendRequest.recipient
      };
   }

   /**
    * Конвертировать ответ от FriendService в старый формат
    * @private
    */
   _convertFriendResponseToOld(result, requestId, action) {
      return {
         success: true,
         action,
         status: result.status,
         connectionCreated: action === 'accept',
         connection: action === 'accept' ? { id: requestId } : null
      };
   }

   /**
    * Конвертировать friend request response в старый формат
    * @private
    */
   _convertFriendRequestToOldFormat(friendRequest) {
      return {
         id: friendRequest.id,
         sender_id: friendRequest.user_id,
         receiver_id: friendRequest.friend_id,
         sender_role: friendRequest.initiator?.role || 'user',
         message: friendRequest.message,
         status: friendRequest.status,
         created_at: friendRequest.created_at,
         updated_at: friendRequest.updated_at
      };
   }
}

module.exports = new ConnectionService();