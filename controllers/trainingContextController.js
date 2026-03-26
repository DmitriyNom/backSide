// controllers/trainingContextController.js
const ApiError = require('../error/ApiError');
const TrainingContextService = require('../service/trainingContextService');
const FriendRepository = require('../repository/friendsRepository');
const UserRepository = require('../repository/userRepository');

class TrainingContextController {
   // ============ СОЗДАНИЕ КОНТЕКСТА ============

   /**
    * Создать контекст тренировки с другом
    * POST /api/friends/:friendId/contexts
    */
   async createContext(req, res, next) {
      try {
         const userId = req.user.id;
         const { friendId } = req.params;
         const { sport, trainer_id, trainee_id } = req.body;

         // Валидация
         if (!friendId) {
            throw ApiError.badRequest('Не указан друг');
         }

         if (!sport) {
            throw ApiError.badRequest('Не указан вид спорта');
         }

         if (!trainer_id || !trainee_id) {
            throw ApiError.badRequest('Необходимо указать trainer_id и trainee_id');
         }

         // Проверяем, что друг существует
         const friend = await UserRepository.findUserById(friendId);
         if (!friend) {
            throw ApiError.notFound('Друг не найден');
         }

         // Проверяем, что пользователи действительно друзья
         const friendship = await FriendRepository.findFriendship(userId, parseInt(friendId), 'accepted');
         if (!friendship) {
            throw ApiError.forbidden('Контекст тренировки можно создать только с другом');
         }

         const context = await TrainingContextService.createContext(
            userId,
            parseInt(friendId),
            { sport, trainer_id, trainee_id }
         );

         return res.status(201).json({
            success: true,
            data: context,
            message: 'Контекст тренировки успешно создан'
         });
      } catch (e) {
         next(e);
      }
   }

   // ============ ПОЛУЧЕНИЕ КОНТЕКСТОВ ============

   /**
    * Получить контексты тренировки с конкретным другом
    * GET /api/friends/:friendId/contexts
    */
   async getContextsWithFriend(req, res, next) {
      try {
         const userId = req.user.id;
         const { friendId } = req.params;
         const { status } = req.query;

         if (!friendId) {
            throw ApiError.badRequest('Не указан друг');
         }

         const contexts = await TrainingContextService.getContextsWithFriend(
            userId,
            parseInt(friendId),
            { status }
         );

         return res.json({
            success: true,
            count: contexts.length,
            data: contexts
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Получить все мои контексты тренировок
    * GET /api/contexts
    */
   async getAllMyContexts(req, res, next) {
      try {
         const userId = req.user.id;

         const contexts = await TrainingContextService.getAllUserContexts(userId);

         return res.json({
            success: true,
            count: contexts.length,
            data: contexts
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Получить контексты, где я тренер
    * GET /api/contexts/trainer
    */
   async getContextsAsTrainer(req, res, next) {
      try {
         const userId = req.user.id;
         const { status = 'active' } = req.query;

         const contexts = await TrainingContextService.getContextsAsTrainer(userId, { status });

         return res.json({
            success: true,
            count: contexts.length,
            data: contexts
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Получить контексты, где я ученик
    * GET /api/contexts/trainee
    */
   async getContextsAsTrainee(req, res, next) {
      try {
         const userId = req.user.id;
         const { status = 'active' } = req.query;

         const contexts = await TrainingContextService.getContextsAsTrainee(userId, { status });

         return res.json({
            success: true,
            count: contexts.length,
            data: contexts
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Получить активные контексты
    * GET /api/contexts/active
    */
   async getActiveContexts(req, res, next) {
      try {
         const userId = req.user.id;

         const result = await TrainingContextService.getActiveContexts(userId);

         return res.json({
            success: true,
            data: result
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Получить контекст по ID
    * GET /api/contexts/:contextId
    */
   async getContextById(req, res, next) {
      try {
         const userId = req.user.id;
         const { contextId } = req.params;

         if (!contextId) {
            throw ApiError.badRequest('Не указан ID контекста');
         }

         const context = await TrainingContextService.getContextById(
            parseInt(contextId),
            userId
         );

         return res.json({
            success: true,
            data: context
         });
      } catch (e) {
         next(e);
      }
   }

   // ============ УПРАВЛЕНИЕ СТАТУСОМ КОНТЕКСТА ============

   /**
    * Обновить статус контекста
    * PUT /api/contexts/:contextId/status
    */
   async updateContextStatus(req, res, next) {
      try {
         const userId = req.user.id;
         const { contextId } = req.params;
         const { status } = req.body;

         if (!contextId) {
            throw ApiError.badRequest('Не указан ID контекста');
         }

         if (!status) {
            throw ApiError.badRequest('Не указан статус');
         }

         const context = await TrainingContextService.updateContextStatus(
            parseInt(contextId),
            userId,
            status
         );

         const statusMessages = {
            active: 'Контекст тренировки активирован',
            paused: 'Контекст тренировки приостановлен',
            ended: 'Контекст тренировки завершен'
         };

         return res.json({
            success: true,
            data: context,
            message: statusMessages[status] || 'Статус контекста обновлен'
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Завершить контекст тренировки
    * POST /api/contexts/:contextId/end
    */
   async endContext(req, res, next) {
      try {
         const userId = req.user.id;
         const { contextId } = req.params;

         if (!contextId) {
            throw ApiError.badRequest('Не указан ID контекста');
         }

         const context = await TrainingContextService.endContext(
            parseInt(contextId),
            userId
         );

         return res.json({
            success: true,
            data: context,
            message: 'Контекст тренировки завершен'
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Приостановить контекст тренировки
    * POST /api/contexts/:contextId/pause
    */
   async pauseContext(req, res, next) {
      try {
         const userId = req.user.id;
         const { contextId } = req.params;

         if (!contextId) {
            throw ApiError.badRequest('Не указан ID контекста');
         }

         const context = await TrainingContextService.pauseContext(
            parseInt(contextId),
            userId
         );

         return res.json({
            success: true,
            data: context,
            message: 'Контекст тренировки приостановлен'
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Возобновить контекст тренировки
    * POST /api/contexts/:contextId/resume
    */
   async resumeContext(req, res, next) {
      try {
         const userId = req.user.id;
         const { contextId } = req.params;

         if (!contextId) {
            throw ApiError.badRequest('Не указан ID контекста');
         }

         const context = await TrainingContextService.resumeContext(
            parseInt(contextId),
            userId
         );

         return res.json({
            success: true,
            data: context,
            message: 'Контекст тренировки возобновлен'
         });
      } catch (e) {
         next(e);
      }
   }

   // ============ СТАТИСТИКА И ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ ============

   /**
    * Получить статистику по контекстам
    * GET /api/contexts/stats
    */
   async getContextStats(req, res, next) {
      try {
         const userId = req.user.id;

         const stats = await TrainingContextService.getContextStats(userId);

         return res.json({
            success: true,
            data: stats
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Получить доступные виды спорта для контекста с другом
    * GET /api/friends/:friendId/available-sports
    */
   async getAvailableSports(req, res, next) {
      try {
         const userId = req.user.id;
         const { friendId } = req.params;

         if (!friendId) {
            throw ApiError.badRequest('Не указан друг');
         }

         const sports = await TrainingContextService.getAvailableSports(
            userId,
            parseInt(friendId)
         );

         return res.json({
            success: true,
            data: sports
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Проверить доступ к контексту
    * GET /api/contexts/:contextId/check-access
    */
   async checkAccess(req, res, next) {
      try {
         const userId = req.user.id;
         const { contextId } = req.params;

         if (!contextId) {
            throw ApiError.badRequest('Не указан ID контекста');
         }

         const hasAccess = await TrainingContextService.canManageContext(
            parseInt(contextId),
            userId
         );

         return res.json({
            success: true,
            data: {
               has_access: hasAccess,
               context_id: parseInt(contextId)
            }
         });
      } catch (e) {
         next(e);
      }
   }

   // ============ МЕТОДЫ ДЛЯ КОНКРЕТНЫХ СПОРТОВ ============

   /**
    * Получить контексты по виду спорта
    * GET /api/contexts/sport/:sport
    */
   async getContextsBySport(req, res, next) {
      try {
         const userId = req.user.id;
         const { sport } = req.params;
         const { role } = req.query; // 'trainer', 'trainee', или undefined (оба)

         if (!sport) {
            throw ApiError.badRequest('Не указан вид спорта');
         }

         let contexts = [];

         if (role === 'trainer') {
            contexts = await TrainingContextService.getContextsAsTrainer(userId, { sport });
         } else if (role === 'trainee') {
            contexts = await TrainingContextService.getContextsAsTrainee(userId, { sport });
         } else {
            // Получаем все контексты и фильтруем по спорту
            const allContexts = await TrainingContextService.getAllUserContexts(userId);
            contexts = allContexts.filter(ctx => ctx.sport === sport);
         }

         return res.json({
            success: true,
            count: contexts.length,
            data: contexts
         });
      } catch (e) {
         next(e);
      }
   }
}

module.exports = new TrainingContextController();