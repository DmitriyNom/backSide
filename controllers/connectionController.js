// controllers/connectionController.js
const ApiError = require('../error/ApiError');
const ConnectionService = require('../service/connectionService');
const { User } = require('../models/legacy_models');

class ConnectionController {
   // ============ УНИВЕРСАЛЬНЫЕ МЕТОДЫ ДЛЯ ВСЕХ РОЛЕЙ ============

   /**
    * Отправить запрос на подключение (УНИВЕРСАЛЬНЫЙ)
    * Работает для любого направления: 
    * - trainee → trainer
    * - trainer → trainee
    */
   async sendRequest(req, res, next) {
      try {
         const senderId = req.user.id;
         const { receiver_id, message } = req.body;

         // Валидация
         if (!receiver_id) {
            throw ApiError.badRequest('Не указан получатель');
         }

         const request = await ConnectionService.sendConnectionRequest(
            senderId,
            receiver_id,
            message
         );

         return res.status(201).json({
            success: true,
            data: request,
            message: 'Запрос успешно отправлен'
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Ответить на запрос (принять/отклонить)
    * Проверяет, что пользователь = получатель
    */
   async respondToRequest(req, res, next) {
      try {
         const userId = req.user.id;
         const { requestId } = req.params;
         const { action } = req.body;

         if (!['accept', 'reject'].includes(action)) {
            throw ApiError.badRequest('Действие должно быть "accept" или "reject"');
         }

         const result = await ConnectionService.respondToRequest(
            parseInt(requestId),
            userId,
            action
         );

         return res.json({
            success: true,
            data: result,
            message: action === 'accept'
               ? 'Запрос принят, связь установлена'
               : 'Запрос отклонен'
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Отменить исходящий запрос
    * Проверяет, что пользователь = отправитель
    */
   async cancelRequest(req, res, next) {
      try {
         const userId = req.user.id;
         const { requestId } = req.params;

         const result = await ConnectionService.cancelRequest(
            parseInt(requestId),
            userId
         );

         return res.json({
            success: true,
            message: 'Запрос успешно отменен'
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Получить ВХОДЯЩИЕ запросы (где пользователь - получатель)
    * Работает для любой роли!
    */
   async getIncomingRequests(req, res, next) {
      try {
         const userId = req.user.id;
         const { status = 'pending' } = req.query;

         const requests = await ConnectionService.getIncomingRequests(
            userId,
            status
         );

         return res.json({
            success: true,
            count: requests.length,
            data: requests
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Получить ИСХОДЯЩИЕ запросы (где пользователь - отправитель)
    * Работает для любой роли!
    */
   async getOutgoingRequests(req, res, next) {
      try {
         const userId = req.user.id;
         const { status = 'pending' } = req.query;

         const requests = await ConnectionService.getOutgoingRequests(
            userId,
            status
         );

         return res.json({
            success: true,
            count: requests.length,
            data: requests
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Получить ВСЕ запросы пользователя (и входящие, и исходящие)
    */
   async getAllRequests(req, res, next) {
      try {
         const userId = req.user.id;
         const { status = 'pending' } = req.query;

         const [incoming, outgoing] = await Promise.all([
            ConnectionService.getIncomingRequests(userId, status),
            ConnectionService.getOutgoingRequests(userId, status)
         ]);

         return res.json({
            success: true,
            data: {
               incoming,
               outgoing,
               total: incoming.length + outgoing.length
            }
         });
      } catch (e) {
         next(e);
      }
   }

   // ============ МЕТОДЫ ДЛЯ ПОДТВЕРЖДЕННЫХ СВЯЗЕЙ ============

   /**
    * Получить моих подопечных (для тренера)
    */
   async getMyTrainees(req, res, next) {
      try {
         const trainerId = req.user.id;

         // Проверяем роль
         if (req.user.role !== 'trainer') {
            throw ApiError.forbidden('Только тренер может просматривать подопечных');
         }

         const trainees = await ConnectionService.getTrainees(trainerId);

         return res.json({
            success: true,
            count: trainees.length,
            data: trainees
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Получить моих тренеров (для подопечного)
    */
   async getMyTrainers(req, res, next) {
      try {
         const traineeId = req.user.id;

         // Проверяем роль
         if (req.user.role !== 'trainee') {
            throw ApiError.forbidden('Только подопечный может просматривать тренеров');
         }

         const trainers = await ConnectionService.getTrainers(traineeId);

         return res.json({
            success: true,
            count: trainers.length,
            data: trainers
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Удалить связь (работает в обе стороны)
    */
   async removeConnection(req, res, next) {
      try {
         const userId = req.user.id;
         const { userId: targetUserId } = req.params;

         if (!targetUserId) {
            throw ApiError.badRequest('Не указан пользователь');
         }

         const result = await ConnectionService.removeConnection(
            userId,
            parseInt(targetUserId)
         );

         return res.json({
            success: true,
            message: 'Связь успешно удалена'
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Получить все связи пользователя
    */
   async getAllConnections(req, res, next) {
      try {
         const userId = req.user.id;

         const [trainees, trainers] = await Promise.all([
            ConnectionService.getTrainees(userId),
            ConnectionService.getTrainers(userId)
         ]);

         return res.json({
            success: true,
            data: {
               as_trainer: trainees,
               as_trainee: trainers,
               total: trainees.length + trainers.length
            }
         });
      } catch (e) {
         next(e);
      }
   }

   // ============ МЕТОДЫ ПОИСКА ============

   /**
    * Поиск тренеров (для подопечного)
    */
   async searchTrainers(req, res, next) {
      try {
         const traineeId = req.user.id;

         if (req.user.role !== 'trainee') {
            throw ApiError.forbidden('Только подопечный может искать тренеров');
         }

         const {
            query,
            specialization,
            limit = 10,
            offset = 0
         } = req.query;

         const result = await ConnectionService.searchTrainers(
            traineeId,
            {
               query,
               specialization,
               limit: parseInt(limit),
               offset: parseInt(offset)
            }
         );

         return res.json({
            success: true,
            ...result
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Поиск подопечных (для тренера)
    */
   async searchTrainees(req, res, next) {
      try {
         const trainerId = req.user.id;

         if (req.user.role !== 'trainer') {
            throw ApiError.forbidden('Только тренер может искать подопечных');
         }

         const {
            query,
            limit = 10,
            offset = 0
         } = req.query;

         const result = await ConnectionService.searchTrainees(
            trainerId,
            {
               query,
               limit: parseInt(limit),
               offset: parseInt(offset)
            }
         );

         return res.json({
            success: true,
            ...result
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Получить рекомендации тренеров
    */
   async getTrainerRecommendations(req, res, next) {
      try {
         const traineeId = req.user.id;

         if (req.user.role !== 'trainee') {
            throw ApiError.forbidden('Только подопечный может получать рекомендации');
         }

         const { limit = 5 } = req.query;

         const recommendations = await ConnectionService.getTrainerRecommendations(
            traineeId,
            parseInt(limit)
         );

         return res.json({
            success: true,
            count: recommendations.length,
            data: recommendations
         });
      } catch (e) {
         next(e);
      }
   }

   // ============ МЕТОДЫ СТАТИСТИКИ И СТАТУСОВ ============

   /**
    * Получить статистику связей
    */
   async getConnectionStats(req, res, next) {
      try {
         const userId = req.user.id;
         const stats = await ConnectionService.getConnectionStats(userId);

         return res.json({
            success: true,
            data: stats
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Проверить статус связи с конкретным пользователем
    */
   async getConnectionStatus(req, res, next) {
      try {
         const userId = req.user.id;
         const { targetUserId } = req.params;

         if (!targetUserId) {
            throw ApiError.badRequest('Не указан целевой пользователь');
         }

         const status = await ConnectionService.getConnectionStatus(
            userId,
            parseInt(targetUserId)
         );

         return res.json({
            success: true,
            data: status
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Получить количество непрочитанных/новых запросов
    */
   async getPendingRequestsCount(req, res, next) {
      try {
         const userId = req.user.id;

         const incoming = await ConnectionService.getIncomingRequests(userId, 'pending');

         return res.json({
            success: true,
            data: {
               incoming_count: incoming.length
            }
         });
      } catch (e) {
         next(e);
      }
   }

   // ============ DEPRECATED METHODS (для обратной совместимости) ============

   /**
    * @deprecated Используйте универсальный sendRequest
    */
   async sendTraineeRequest(req, res, next) {
      try {
         console.warn('⚠️ Deprecated: sendTraineeRequest устарел, используйте sendRequest');

         const trainerId = req.user.id;
         const { trainee_id, message } = req.body;

         // Перенаправляем на универсальный метод
         const request = await ConnectionService.sendConnectionRequest(
            trainerId,
            trainee_id,
            message
         );

         return res.status(201).json({
            success: true,
            data: request,
            message: 'Запрос успешно отправлен'
         });
      } catch (e) {
         next(e);
      }
   }
}

module.exports = new ConnectionController();