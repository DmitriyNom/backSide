// repositories/userConnectionRepository.js
const { UserConnection, User, ConnectionRequest } = require('../models/legacy_models');
const { Op } = require('sequelize');

class UserConnectionRepository {
   // ============ МЕТОДЫ ДЛЯ ПОДТВЕРЖДЕННЫХ СВЯЗЕЙ (БЕЗ ИЗМЕНЕНИЙ) ============

   async checkConnection(trainerId, traineeId) {
      return await UserConnection.findOne({
         where: {
            trainer_id: trainerId,
            trainee_id: traineeId
         }
      });
   }

   async getTrainees(trainerId) {
      try {
         const connections = await UserConnection.findAll({
            where: { trainer_id: trainerId }
         });

         const traineeIds = connections.map(conn => conn.trainee_id);
         if (traineeIds.length === 0) return [];

         return await User.findAll({
            where: { id: traineeIds },
            attributes: ['id', 'userName', 'email', 'userAvatar', 'training_level']
         });
      } catch (error) {
         console.error('Error in getTrainees:', error);
         return [];
      }
   }

   async getTrainers(traineeId) {
      try {
         const connections = await UserConnection.findAll({
            where: { trainee_id: traineeId }
         });

         const trainerIds = connections.map(conn => conn.trainer_id);
         if (trainerIds.length === 0) return [];

         return await User.findAll({
            where: { id: trainerIds },
            attributes: ['id', 'userName', 'email', 'userAvatar', 'sport_specialization']
         });
      } catch (error) {
         console.error('Error in getTrainers:', error);
         return [];
      }
   }

   async createConnection(trainerId, traineeId) {
      return await UserConnection.create({
         trainer_id: trainerId,
         trainee_id: traineeId
      });
   }

   async deleteConnection(trainerId, traineeId) {
      return await UserConnection.destroy({
         where: {
            trainer_id: trainerId,
            trainee_id: traineeId
         }
      });
   }

   async findConnectionBetween(userId1, userId2) {
      return await UserConnection.findOne({
         where: {
            [Op.or]: [
               { trainer_id: userId1, trainee_id: userId2 },
               { trainer_id: userId2, trainee_id: userId1 }
            ]
         }
      });
   }

   async deleteConnectionBetween(userId1, userId2) {
      return await UserConnection.destroy({
         where: {
            [Op.or]: [
               { trainer_id: userId1, trainee_id: userId2 },
               { trainer_id: userId2, trainee_id: userId1 }
            ]
         }
      });
   }

   async getAllConnections(userId) {
      try {
         const connections = await UserConnection.findAll({
            where: {
               [Op.or]: [
                  { trainer_id: userId },
                  { trainee_id: userId }
               ]
            }
         });

         const userIds = connections.map(conn =>
            conn.trainer_id === userId ? conn.trainee_id : conn.trainer_id
         );

         if (userIds.length === 0) return [];

         const users = await User.findAll({
            where: { id: userIds },
            attributes: ['id', 'userName', 'userAvatar', 'role']
         });

         return connections.map(conn => {
            const otherUserId = conn.trainer_id === userId ? conn.trainee_id : conn.trainer_id;
            const user = users.find(u => u.id === otherUserId);
            return {
               id: conn.id,
               trainer_id: conn.trainer_id,
               trainee_id: conn.trainee_id,
               connected_at: conn.connected_at,
               otherUser: user || null
            };
         });
      } catch (error) {
         console.error('Error in getAllConnections:', error);
         return [];
      }
   }

   async countTrainees(trainerId) {
      return await UserConnection.count({
         where: { trainer_id: trainerId }
      });
   }

   async countTrainers(traineeId) {
      return await UserConnection.count({
         where: { trainee_id: traineeId }
      });
   }

   // ============ МЕТОДЫ ДЛЯ ЗАПРОСОВ (ПОЛНОСТЬЮ ПЕРЕРАБОТАНЫ) ============

   /**
    * Создать запрос на подключение
    * @param {Object} data - { sender_id, receiver_id, sender_role, message }
    */
   async createConnectionRequest(data) {
      try {
         return await ConnectionRequest.create({
            sender_id: data.sender_id,
            receiver_id: data.receiver_id,
            sender_role: data.sender_role,
            message: data.message || '',
            status: 'pending'
         });
      } catch (error) {
         console.error('Error in createConnectionRequest:', error);
         throw error;
      }
   }

   /**
    * Найти существующий запрос между пользователями (в любом направлении)
    */
   async findExistingRequest(userId1, userId2) {
      try {
         return await ConnectionRequest.findOne({
            where: {
               [Op.or]: [
                  { sender_id: userId1, receiver_id: userId2 },
                  { sender_id: userId2, receiver_id: userId1 }
               ]
            }
         });
      } catch (error) {
         console.error('Error in findExistingRequest:', error);
         return null;
      }
   }

   /**
    * Найти PENDING запрос между пользователями
    */
   async findPendingRequest(senderId, receiverId) {
      try {
         return await ConnectionRequest.findOne({
            where: {
               sender_id: senderId,
               receiver_id: receiverId,
               status: 'pending'
            }
         });
      } catch (error) {
         console.error('Error in findPendingRequest:', error);
         return null;
      }
   }

   /**
    * Получить запрос по ID
    */
   async getRequestById(id) {
      try {
         return await ConnectionRequest.findByPk(id, {
            include: [
               {
                  model: User,
                  as: 'sender',
                  attributes: ['id', 'userName', 'email', 'userAvatar', 'role']
               },
               {
                  model: User,
                  as: 'receiver',
                  attributes: ['id', 'userName', 'email', 'userAvatar', 'role']
               }
            ]
         });
      } catch (error) {
         console.error('Error in getRequestById:', error);
         return null;
      }
   }

   /**
    * Обновить статус запроса
    */
   async updateRequestStatus(id, status) {
      try {
         return await ConnectionRequest.update(
            { status },
            { where: { id } }
         );
      } catch (error) {
         console.error('Error in updateRequestStatus:', error);
         throw error;
      }
   }

   /**
    * Отменить запрос
    */
   async cancelRequest(requestId) {
      return await this.updateRequestStatus(requestId, 'cancelled');
   }

   /**
    * Получить ВХОДЯЩИЕ запросы (где пользователь - получатель)
    */
   async getIncomingRequests(userId, status = 'pending') {
      try {
         const where = {
            receiver_id: userId
         };

         if (status) {
            where.status = status;
         }

         return await ConnectionRequest.findAll({
            where,
            include: [
               {
                  model: User,
                  as: 'sender',
                  attributes: ['id', 'userName', 'email', 'userAvatar', 'role']
               }
            ],
            order: [['created_at', 'DESC']]
         });
      } catch (error) {
         console.error('Error in getIncomingRequests:', error);
         return [];
      }
   }

   /**
    * Получить ИСХОДЯЩИЕ запросы (где пользователь - отправитель)
    */
   async getOutgoingRequests(userId, status = 'pending') {
      try {
         const where = {
            sender_id: userId
         };

         if (status) {
            where.status = status;
         }

         return await ConnectionRequest.findAll({
            where,
            include: [
               {
                  model: User,
                  as: 'receiver',
                  attributes: ['id', 'userName', 'email', 'userAvatar', 'role']
               }
            ],
            order: [['created_at', 'DESC']]
         });
      } catch (error) {
         console.error('Error in getOutgoingRequests:', error);
         return [];
      }
   }

   /**
    * Получить запросы по статусу (универсальный метод)
    */
   async getRequestsByStatus(userId, status, direction = 'all') {
      try {
         let where = { status };

         if (direction === 'incoming') {
            where.receiver_id = userId;
         } else if (direction === 'outgoing') {
            where.sender_id = userId;
         } else {
            where = {
               [Op.or]: [
                  { sender_id: userId },
                  { receiver_id: userId }
               ],
               status
            };
         }

         return await ConnectionRequest.findAll({
            where,
            include: [
               {
                  model: User,
                  as: 'sender',
                  attributes: ['id', 'userName', 'userAvatar', 'role']
               },
               {
                  model: User,
                  as: 'receiver',
                  attributes: ['id', 'userName', 'userAvatar', 'role']
               }
            ],
            order: [['created_at', 'DESC']]
         });
      } catch (error) {
         console.error('Error in getRequestsByStatus:', error);
         return [];
      }
   }

   /**
    * Подсчитать количество входящих запросов
    */
   async countIncomingRequests(userId, status = 'pending') {
      try {
         return await ConnectionRequest.count({
            where: {
               receiver_id: userId,
               status
            }
         });
      } catch (error) {
         console.error('Error in countIncomingRequests:', error);
         return 0;
      }
   }

   /**
    * Подсчитать количество исходящих запросов
    */
   async countOutgoingRequests(userId, status = 'pending') {
      try {
         return await ConnectionRequest.count({
            where: {
               sender_id: userId,
               status
            }
         });
      } catch (error) {
         console.error('Error in countOutgoingRequests:', error);
         return 0;
      }
   }

   /**
 * Найти ПРИНЯТЫЙ запрос между пользователями
 * @param {number} userId1 - ID первого пользователя
 * @param {number} userId2 - ID второго пользователя
 * @returns {Promise<ConnectionRequest|null>}
 */
   async findAcceptedRequestBetween(userId1, userId2) {
      try {
         return await ConnectionRequest.findOne({
            where: {
               [Op.or]: [
                  { sender_id: userId1, receiver_id: userId2, status: 'accepted' },
                  { sender_id: userId2, receiver_id: userId1, status: 'accepted' }
               ]
            }
         });
      } catch (error) {
         console.error('Error in findAcceptedRequestBetween:', error);
         return null;
      }
   }

   // ============ МЕТОДЫ ДЛЯ ПОИСКА И СТАТИСТИКИ ============

   /**
    * Получить статистику подключений пользователя
    */
   async getConnectionStats(userId, userRole) {
      try {
         const stats = {
            trainees_count: 0,
            trainers_count: 0,
            incoming_requests_count: 0,
            outgoing_requests_count: 0,
            total_connections: 0
         };

         if (userRole === 'trainer') {
            stats.trainees_count = await this.countTrainees(userId);
            stats.incoming_requests_count = await this.countIncomingRequests(userId, 'pending');
         } else {
            stats.trainers_count = await this.countTrainers(userId);
            stats.outgoing_requests_count = await this.countOutgoingRequests(userId, 'pending');
         }

         stats.total_connections = stats.trainees_count + stats.trainers_count;
         return stats;
      } catch (error) {
         console.error('Error in getConnectionStats:', error);
         return {
            trainees_count: 0,
            trainers_count: 0,
            incoming_requests_count: 0,
            outgoing_requests_count: 0,
            total_connections: 0
         };
      }
   }

   // ============ МЕТОДЫ ПОИСКА (С ОБНОВЛЕННОЙ ЛОГИКОЙ СТАТУСОВ) ============


   /**
 * Получить рекомендованных тренеров для подопечного
 * @param {Array} excludeIds - ID тренеров, которые нужно исключить (уже связаны или есть запросы)
 * @param {number} limit - количество рекомендаций
 * @returns {Promise<Array>} - массив рекомендованных тренеров
 */
   async getRecommendedTrainers(excludeIds = [], limit = 5) {
      try {
         console.log(`[Repository] Getting recommended trainers. Exclude IDs:`, excludeIds, `Limit:`, limit);

         // Базовый where - только тренеры
         const where = {
            role: 'trainer'
         };

         // Исключаем тренеров, с которыми уже есть связь или запрос
         if (excludeIds && excludeIds.length > 0) {
            where.id = { [Op.notIn]: excludeIds };
            console.log(`[Repository] Excluding ${excludeIds.length} trainers`);
         }

         // Получаем рекомендованных тренеров
         const trainers = await User.findAll({
            where,
            attributes: [
               'id',
               'userName',
               'email',
               'userAvatar',
               'sport_specialization',
               'createdAt'
            ],
            limit: parseInt(limit),
            order: [
               // Сортируем по дате регистрации (новые тренеры выше)
               ['createdAt', 'DESC']
            ]
         });

         console.log(`[Repository] Found ${trainers.length} recommended trainers`);
         return trainers;

      } catch (error) {
         console.error('Error in getRecommendedTrainers:', error);
         return []; // Возвращаем пустой массив в случае ошибки
      }
   }

   async searchTrainers(filters = {}) {
      try {
         const {
            query,
            specialization,
            excludeIds = [],
            limit = 10,
            offset = 0,
            traineeId
         } = filters;

         const where = {
            role: 'trainer'
         };

         if (query) {
            where[Op.or] = [
               { userName: { [Op.iLike]: `%${query}%` } },
               { email: { [Op.iLike]: `%${query}%` } }
            ];
         }

         if (specialization) {
            where.sport_specialization = specialization;
         }

         const { rows: trainers, count } = await User.findAndCountAll({
            where,
            attributes: [
               'id', 'userName', 'email', 'userAvatar',
               'sport_specialization', 'createdAt'
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
         });

         // Добавляем статусы связей
         const trainersWithStatus = await this.addConnectionStatusToTrainers(
            trainers,
            traineeId
         );

         return {
            rows: trainersWithStatus,
            count
         };
      } catch (error) {
         console.error('Error in searchTrainers:', error);
         return { count: 0, rows: [] };
      }
   }

   async searchTrainees(filters = {}) {
      try {
         const {
            query,
            excludeIds = [],
            limit = 10,
            offset = 0,
            trainerId
         } = filters;

         const where = {
            role: 'trainee'
         };

         if (query) {
            where[Op.or] = [
               { userName: { [Op.iLike]: `%${query}%` } },
               { email: { [Op.iLike]: `%${query}%` } }
            ];
         }

         const { rows: trainees, count } = await User.findAndCountAll({
            where,
            attributes: [
               'id', 'userName', 'email', 'userAvatar',
               'training_level', 'createdAt'
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
         });

         // Добавляем статусы связей
         const traineesWithStatus = await this.addConnectionStatusToTrainees(
            trainees,
            trainerId
         );

         return {
            rows: traineesWithStatus,
            count
         };
      } catch (error) {
         console.error('Error in searchTrainees:', error);
         return { count: 0, rows: [] };
      }
   }

   // ============ МЕТОДЫ ДЛЯ ОБОГАЩЕНИЯ ДАННЫХ СТАТУСАМИ ============

   /**
    * Добавить статус связи к тренерам (для поиска)
    */
   async addConnectionStatusToTrainers(trainers, traineeId) {
      if (!traineeId || trainers.length === 0) {
         return trainers.map(trainer => ({
            ...trainer.toJSON(),
            connectionStatus: null
         }));
      }

      try {
         const trainerIds = trainers.map(t => t.id);

         // 1. Проверяем активные связи
         const connections = await UserConnection.findAll({
            where: {
               trainer_id: trainerIds,
               trainee_id: traineeId
            },
            attributes: ['trainer_id']
         });

         // 2. Проверяем запросы (используем новую модель!)
         const requests = await ConnectionRequest.findAll({
            where: {
               [Op.or]: [
                  // Запросы ОТ подопечного К тренеру
                  {
                     sender_id: traineeId,
                     receiver_id: trainerIds,
                     sender_role: 'trainee'
                  },
                  // Запросы ОТ тренера К подопечному
                  {
                     sender_id: trainerIds,
                     receiver_id: traineeId,
                     sender_role: 'trainer'
                  }
               ]
            },
            attributes: ['sender_id', 'receiver_id', 'status', 'sender_role']
         });

         const connectedTrainerIds = new Set(connections.map(c => c.trainer_id));

         // Мапа для статусов запросов
         const requestStatusMap = new Map();
         requests.forEach(req => {
            let trainerId = null;
            if (req.sender_role === 'trainer' && req.receiver_id === traineeId) {
               // Тренер отправил запрос подопечному
               trainerId = req.sender_id;
               requestStatusMap.set(trainerId, {
                  status: req.status,
                  direction: 'outgoing_from_trainer'
               });
            } else if (req.sender_role === 'trainee' && req.sender_id === traineeId) {
               // Подопечный отправил запрос тренеру
               trainerId = req.receiver_id;
               requestStatusMap.set(trainerId, {
                  status: req.status,
                  direction: 'outgoing_from_trainee'
               });
            }
         });

         return trainers.map(trainer => {
            const trainerId = trainer.id;
            let connectionStatus = null;

            if (connectedTrainerIds.has(trainerId)) {
               connectionStatus = 'connected';
            } else if (requestStatusMap.has(trainerId)) {
               const req = requestStatusMap.get(trainerId);
               if (req.status === 'pending') {
                  connectionStatus = req.direction === 'outgoing_from_trainee'
                     ? 'pending'     // Запрос отправлен подопечным
                     : 'incoming';   // Запрос от тренера (ожидает ответа подопечного)
               } else {
                  connectionStatus = req.status;
               }
            }

            return {
               ...trainer.toJSON(),
               connectionStatus
            };
         });

      } catch (error) {
         console.error('Error in addConnectionStatusToTrainers:', error);
         return trainers.map(trainer => ({
            ...trainer.toJSON(),
            connectionStatus: null
         }));
      }
   }

   /**
    * Добавить статус связи к подопечным (для поиска)
    */
   async addConnectionStatusToTrainees(trainees, trainerId) {
      if (!trainerId || trainees.length === 0) {
         return trainees.map(trainee => ({
            ...trainee.toJSON(),
            connectionStatus: null
         }));
      }

      try {
         const traineeIds = trainees.map(t => t.id);

         // 1. Проверяем активные связи
         const connections = await UserConnection.findAll({
            where: {
               trainer_id: trainerId,
               trainee_id: traineeIds
            },
            attributes: ['trainee_id']
         });

         // 2. Проверяем запросы (используем новую модель!)
         const requests = await ConnectionRequest.findAll({
            where: {
               [Op.or]: [
                  // Запросы ОТ тренера К подопечному
                  {
                     sender_id: trainerId,
                     receiver_id: traineeIds,
                     sender_role: 'trainer'
                  },
                  // Запросы ОТ подопечного К тренеру
                  {
                     sender_id: traineeIds,
                     receiver_id: trainerId,
                     sender_role: 'trainee'
                  }
               ]
            },
            attributes: ['sender_id', 'receiver_id', 'status', 'sender_role']
         });

         const connectedTraineeIds = new Set(connections.map(c => c.trainee_id));

         // Мапа для статусов запросов
         const requestStatusMap = new Map();
         requests.forEach(req => {
            let traineeId = null;
            if (req.sender_role === 'trainer' && req.sender_id === trainerId) {
               // Тренер отправил запрос подопечному
               traineeId = req.receiver_id;
               requestStatusMap.set(traineeId, {
                  status: req.status,
                  direction: 'outgoing_from_trainer'
               });
            } else if (req.sender_role === 'trainee' && req.receiver_id === trainerId) {
               // Подопечный отправил запрос тренеру
               traineeId = req.sender_id;
               requestStatusMap.set(traineeId, {
                  status: req.status,
                  direction: 'incoming_to_trainer'
               });
            }
         });

         return trainees.map(trainee => {
            const traineeId = trainee.id;
            let connectionStatus = null;

            if (connectedTraineeIds.has(traineeId)) {
               connectionStatus = 'connected';
            } else if (requestStatusMap.has(traineeId)) {
               const req = requestStatusMap.get(traineeId);
               if (req.status === 'pending') {
                  connectionStatus = req.direction === 'outgoing_from_trainer'
                     ? 'pending'     // Тренер отправил запрос
                     : 'incoming';   // Подопечный отправил запрос
               } else {
                  connectionStatus = req.status;
               }
            }

            return {
               ...trainee.toJSON(),
               connectionStatus
            };
         });

      } catch (error) {
         console.error('Error in addConnectionStatusToTrainees:', error);
         return trainees.map(trainee => ({
            ...trainee.toJSON(),
            connectionStatus: null
         }));
      }
   }

   // ============ МЕТОДЫ ДЛЯ СОВМЕСТИМОСТИ (DEPRECATED) ============
   // Эти методы оставлены для обратной совместимости, 
   // но внутри используют новые методы

   async getRequestsByTrainer(trainerId) {
      console.warn('Deprecated: use getIncomingRequests instead');
      return await this.getIncomingRequests(trainerId);
   }

   async getRequestsByTrainee(traineeId) {
      console.warn('Deprecated: use getOutgoingRequests instead');
      return await this.getOutgoingRequests(traineeId);
   }

   async findConnectionRequest(traineeId, trainerId) {
      console.warn('Deprecated: use findPendingRequest with correct params');
      // Пытаемся угадать направление
      const request = await this.findPendingRequest(traineeId, trainerId);
      if (request) return request;
      return await this.findPendingRequest(trainerId, traineeId);
   }

   async checkExistingRequest(userId1, userId2) {
      console.warn('Deprecated: use findExistingRequest instead');
      return await this.findExistingRequest(userId1, userId2);
   }

   async getRequestsWithStatus(userId, role, status) {
      console.warn('Deprecated: use getRequestsByStatus instead');
      if (role === 'trainer') {
         return await this.getIncomingRequests(userId, status);
      } else {
         return await this.getOutgoingRequests(userId, status);
      }
   }
}

module.exports = new UserConnectionRepository();