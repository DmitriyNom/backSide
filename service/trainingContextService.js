// service/trainingContextService.js
const ApiError = require('../error/ApiError');
const { sequelize } = require('../models');
const TrainingContextRepository = require('../repository/trainingContextRepository');
const FriendRepository = require('../repository/friendsRepository');
const UserRepository = require('../repository/userRepository');
const { Op } = require('sequelize');

class TrainingContextService {
   // ============ ОСНОВНЫЕ МЕТОДЫ ============

   /**
    * Создать контекст тренировки
    * @param {number} userId - ID пользователя, создающего контекст
    * @param {number} friendId - ID друга
    * @param {Object} contextData - Данные контекста
    */
   async createContext(userId, friendId, contextData) {
      console.log(`🟡 TrainingContextService.createContext: user ${userId}, friend ${friendId}`, contextData);

      const { sport, trainer_id, trainee_id } = contextData;

      // 1. Проверяем существование пользователей
      const [user, friend] = await Promise.all([
         UserRepository.findUserById(userId),
         UserRepository.findUserById(friendId)
      ]);

      if (!user || !friend) {
         throw ApiError.notFound('Пользователь не найден');
      }

      // 2. Проверяем, что пользователи - друзья
      const friendship = await FriendRepository.findFriendship(userId, friendId, 'accepted');
      if (!friendship) {
         throw ApiError.forbidden('Контекст тренировки можно создать только с другом');
      }

      // 3. Валидация trainer_id и trainee_id
      if (!trainer_id || !trainee_id) {
         throw ApiError.badRequest('Необходимо указать trainer_id и trainee_id');
      }

      // 4. Проверяем, что trainer и trainee - это именно те пользователи
      if (![userId, friendId].includes(trainer_id) || ![userId, friendId].includes(trainee_id)) {
         throw ApiError.badRequest('Тренер и ученик должны быть участниками дружбы');
      }

      if (trainer_id === trainee_id) {
         throw ApiError.badRequest('Тренер и ученик не могут быть одним лицом');
      }

      // 5. Проверяем существование активного контекста для этого спорта
      const exists = await TrainingContextRepository.exists(friendship.id, sport);
      if (exists) {
         throw ApiError.badRequest(`Контекст тренировки для спорта "${sport}" уже существует`);
      }

      // 6. Создаем контекст
      const context = await TrainingContextRepository.create({
         friend_id: friendship.id,
         sport,
         trainer_id,
         trainee_id,
         status: 'active',
         start_date: new Date()
      });

      console.log(`✅ TrainingContextService.createContext: контекст создан, ID: ${context.id}`);

      // Возвращаем с полными данными
      return await TrainingContextRepository.findById(context.id);
   }

   /**
    * Получить контексты тренировки с другом
    * @param {number} userId - ID пользователя
    * @param {number} friendId - ID друга
    * @param {Object} options - Опции фильтрации
    */
   async getContextsWithFriend(userId, friendId, options = {}) {
      console.log(`🟡 TrainingContextService.getContextsWithFriend: ${userId} -> ${friendId}`);

      // Проверяем дружбу
      const friendship = await FriendRepository.findFriendship(userId, friendId, 'accepted');
      if (!friendship) {
         throw ApiError.forbidden('Контексты тренировок можно просматривать только с друзьями');
      }

      let contexts = [];

      if (options.status === 'active') {
         contexts = await TrainingContextRepository.getActiveByFriendId(friendship.id);
      } else {
         contexts = await TrainingContextRepository.getByFriendId(friendship.id);
      }

      // Фильтруем по статусу, если указан
      if (options.status && options.status !== 'active') {
         contexts = contexts.filter(ctx => ctx.status === options.status);
      }

      console.log(`✅ TrainingContextService.getContextsWithFriend: найдено ${contexts.length} контекстов`);
      return contexts;
   }

   /**
    * Получить контексты, где пользователь тренер
    * @param {number} userId - ID пользователя
    * @param {Object} options - Опции фильтрации
    */
   async getContextsAsTrainer(userId, options = {}) {
      console.log(`🟡 TrainingContextService.getContextsAsTrainer: user ${userId}`);

      const { status = 'active' } = options;

      const contexts = await TrainingContextRepository.getAsTrainer(userId, status);

      // Обогащаем данными о друзьях
      const enrichedContexts = await Promise.all(
         contexts.map(async (context) => {
            const contextData = context.toJSON ? context.toJSON() : context;

            // Получаем информацию о друге (ученике)
            const Friend = require('../models/Friend');
            const friendship = await Friend.findOne({
               where: { id: contextData.friend_id }
            });

            return {
               ...contextData,
               friend_info: friendship
            };
         })
      );

      console.log(`✅ TrainingContextService.getContextsAsTrainer: найдено ${enrichedContexts.length} контекстов`);
      return enrichedContexts;
   }

   /**
    * Получить контексты, где пользователь ученик
    * @param {number} userId - ID пользователя
    * @param {Object} options - Опции фильтрации
    */
   async getContextsAsTrainee(userId, options = {}) {
      console.log(`🟡 TrainingContextService.getContextsAsTrainee: user ${userId}`);

      const { status = 'active' } = options;

      const contexts = await TrainingContextRepository.getAsTrainee(userId, status);

      // Обогащаем данными о друзьях
      const enrichedContexts = await Promise.all(
         contexts.map(async (context) => {
            const contextData = context.toJSON ? context.toJSON() : context;

            // Получаем информацию о друге (тренере)
            const Friend = require('../models/Friend');
            const friendship = await Friend.findOne({
               where: { id: contextData.friend_id }
            });

            return {
               ...contextData,
               friend_info: friendship
            };
         })
      );

      console.log(`✅ TrainingContextService.getContextsAsTrainee: найдено ${enrichedContexts.length} контекстов`);
      return enrichedContexts;
   }

   /**
    * Получить все контексты пользователя
    * @param {number} userId - ID пользователя
    */
   async getAllUserContexts(userId) {
      console.log(`🟡 TrainingContextService.getAllUserContexts: user ${userId}`);

      const contexts = await TrainingContextRepository.getAllUserContexts(userId);

      console.log(`✅ TrainingContextService.getAllUserContexts: найдено ${contexts.length} контекстов`);
      return contexts;
   }

   /**
    * Получить контекст по ID
    * @param {number} contextId - ID контекста
    * @param {number} userId - ID пользователя (для проверки доступа)
    */
   async getContextById(contextId, userId) {
      console.log(`🟡 TrainingContextService.getContextById: context ${contextId}, user ${userId}`);

      const context = await TrainingContextRepository.findById(contextId);

      if (!context) {
         throw ApiError.notFound('Контекст тренировки не найден');
      }

      // Проверяем доступ (пользователь должен быть либо тренером, либо учеником)
      if (context.trainer_id !== userId && context.trainee_id !== userId) {
         throw ApiError.forbidden('У вас нет доступа к этому контексту');
      }

      return context;
   }

   /**
    * Обновить статус контекста
    * @param {number} contextId - ID контекста
    * @param {number} userId - ID пользователя
    * @param {string} status - Новый статус ('active', 'paused', 'ended')
    */
   async updateContextStatus(contextId, userId, status) {
      console.log(`🟡 TrainingContextService.updateContextStatus: context ${contextId}, user ${userId}, status ${status}`);

      // Проверяем существование контекста и доступ
      const context = await this.getContextById(contextId, userId);

      // Валидация статуса
      const validStatuses = ['active', 'paused', 'ended'];
      if (!validStatuses.includes(status)) {
         throw ApiError.badRequest(`Недопустимый статус. Допустимые значения: ${validStatuses.join(', ')}`);
      }

      // Если статус не меняется
      if (context.status === status) {
         return context;
      }

      // Обновляем статус
      let updatedContext;
      if (status === 'ended') {
         updatedContext = await TrainingContextRepository.endContext(contextId);
      } else {
         await TrainingContextRepository.updateStatus(contextId, status);
         updatedContext = await TrainingContextRepository.findById(contextId);
      }

      console.log(`✅ TrainingContextService.updateContextStatus: статус обновлен на ${status}`);
      return updatedContext;
   }

   /**
    * Завершить контекст тренировки
    * @param {number} contextId - ID контекста
    * @param {number} userId - ID пользователя
    */
   async endContext(contextId, userId) {
      console.log(`🟡 TrainingContextService.endContext: context ${contextId}, user ${userId}`);
      return await this.updateContextStatus(contextId, userId, 'ended');
   }

   /**
    * Приостановить контекст тренировки
    * @param {number} contextId - ID контекста
    * @param {number} userId - ID пользователя
    */
   async pauseContext(contextId, userId) {
      console.log(`🟡 TrainingContextService.pauseContext: context ${contextId}, user ${userId}`);
      return await this.updateContextStatus(contextId, userId, 'paused');
   }

   /**
    * Возобновить контекст тренировки
    * @param {number} contextId - ID контекста
    * @param {number} userId - ID пользователя
    */
   async resumeContext(contextId, userId) {
      console.log(`🟡 TrainingContextService.resumeContext: context ${contextId}, user ${userId}`);
      return await this.updateContextStatus(contextId, userId, 'active');
   }

   /**
    * Получить все активные контексты пользователя
    * @param {number} userId - ID пользователя
    */
   async getActiveContexts(userId) {
      console.log(`🟡 TrainingContextService.getActiveContexts: user ${userId}`);

      const [asTrainer, asTrainee] = await Promise.all([
         TrainingContextRepository.getAsTrainer(userId, 'active'),
         TrainingContextRepository.getAsTrainee(userId, 'active')
      ]);

      return {
         as_trainer: asTrainer,
         as_trainee: asTrainee,
         total: asTrainer.length + asTrainee.length
      };
   }

   /**
    * Получить статистику по контекстам
    * @param {number} userId - ID пользователя
    */
   async getContextStats(userId) {
      console.log(`🟡 TrainingContextService.getContextStats: user ${userId}`);

      const counts = await TrainingContextRepository.countByUser(userId);

      // Получаем все контексты для детальной статистики
      const allContexts = await TrainingContextRepository.getAllUserContexts(userId);

      const stats = {
         total: counts.total,
         as_trainer: {
            total: counts.as_trainer,
            active: 0,
            paused: 0,
            ended: 0,
            by_sport: {}
         },
         as_trainee: {
            total: counts.as_trainee,
            active: 0,
            paused: 0,
            ended: 0,
            by_sport: {}
         }
      };

      // Детальная статистика
      allContexts.forEach(context => {
         const role = context.trainer_id === userId ? 'as_trainer' : 'as_trainee';
         const roleStats = stats[role];

         // По статусам
         roleStats[context.status] = (roleStats[context.status] || 0) + 1;

         // По видам спорта
         if (!roleStats.by_sport[context.sport]) {
            roleStats.by_sport[context.sport] = {
               total: 0,
               active: 0,
               paused: 0,
               ended: 0
            };
         }
         roleStats.by_sport[context.sport].total++;
         roleStats.by_sport[context.sport][context.status]++;
      });

      console.log(`✅ TrainingContextService.getContextStats: статистика собрана`);
      return stats;
   }

   /**
    * Получить доступные виды спорта для контекста с другом
    * @param {number} userId - ID пользователя
    * @param {number} friendId - ID друга
    */
   async getAvailableSports(userId, friendId) {
      console.log(`🟡 TrainingContextService.getAvailableSports: ${userId} -> ${friendId}`);

      // Проверяем дружбу
      const friendship = await FriendRepository.findFriendship(userId, friendId, 'accepted');
      if (!friendship) {
         throw ApiError.forbidden('Можно создавать контексты только с друзьями');
      }

      // Получаем уже существующие контексты
      const existingContexts = await TrainingContextRepository.getByFriendId(friendship.id);
      const existingSports = new Set(existingContexts.map(ctx => ctx.sport));

      // Базовый список популярных видов спорта
      const commonSports = [
         'Футбол', 'Баскетбол', 'Волейбол', 'Теннис', 'Плавание',
         'Бег', 'Велоспорт', 'Йога', 'Фитнес', 'Бокс',
         'Хоккей', 'Фигурное катание', 'Лыжи', 'Сноуборд', 'Гимнастика'
      ];

      // Формируем список доступных (еще не созданных)
      const availableSports = commonSports
         .filter(sport => !existingSports.has(sport))
         .map(sport => ({
            name: sport,
            available: true,
            existing_context: false
         }));

      // Добавляем уже существующие
      const existingSportsList = Array.from(existingSports).map(sport => {
         const contexts = existingContexts.filter(ctx => ctx.sport === sport);
         return {
            name: sport,
            available: false,
            existing_context: true,
            contexts: contexts.map(ctx => ({
               id: ctx.id,
               status: ctx.status,
               start_date: ctx.start_date,
               end_date: ctx.end_date
            }))
         };
      });

      return {
         available: availableSports,
         existing: existingSportsList,
         total_available: availableSports.length,
         total_existing: existingSportsList.length
      };
   }

   /**
    * Проверить, может ли пользователь управлять контекстом
    * @param {number} contextId - ID контекста
    * @param {number} userId - ID пользователя
    */
   async canManageContext(contextId, userId) {
      try {
         const context = await TrainingContextRepository.findById(contextId);
         if (!context) return false;
         return context.trainer_id === userId || context.trainee_id === userId;
      } catch (error) {
         console.error('Error in canManageContext:', error);
         return false;
      }
   }
}

module.exports = new TrainingContextService();