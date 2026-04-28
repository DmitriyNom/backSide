// backend/service/exerciseService.js
const ApiError = require('../error/ApiError');
const ExerciseRepository = require('../repository/exerciseRepository');
const TagService = require('./tagService'); // ← Используем сервис тегов
const ExerciseAccessRepository = require('../repository/exerciseAccessRepository');
const { sequelize } = require('../models');

// ========== ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ БЕЗОПАСНОГО ROLLBACK ==========
const safeRollback = async (transaction) => {
   if (transaction && transaction.finished && transaction.finished !== 'commit') {
      try {
         await transaction.rollback();
      } catch (err) {
         console.error('Ошибка при rollback:', err.message);
      }
   }
};

class ExerciseService {
   // ========== СТАРЫЕ МЕТОДЫ (с улучшенной валидацией) ==========

   async createExercise(exercise) {
      if (!exercise.title || exercise.title.trim() === '') {
         throw ApiError.badRequest('Название упражнения обязательно');
      }
      if (!exercise.user_id) {
         throw ApiError.badRequest('ID пользователя обязателен');
      }
      return await ExerciseRepository.createExercise(exercise);
   }

   /**
    * Создание упражнения с тегами и медиа
    */
   /**
   * Создание упражнения с тегами и медиа
   */
   /**
    * Создание упражнения с тегами и медиа
    */
   async createExerciseWithDetails(data, tags = [], mediaIds = []) {
      if (!data.title || data.title.trim() === '') {
         throw ApiError.badRequest('Название упражнения обязательно');
      }
      if (!data.user_id) {
         throw ApiError.badRequest('ID пользователя обязателен');
      }

      const cleanedTags = tags
         .filter(tag => tag && tag.trim())
         .map(tag => tag.trim().toLowerCase());
      const uniqueTags = [...new Set(cleanedTags)];

      const transaction = await sequelize.transaction();

      try {
         const exercise = await ExerciseRepository.createExerciseWithDetails(
            data, [], mediaIds, transaction
         );

         if (uniqueTags.length > 0) {
            await TagService.updateExerciseTags(exercise.id, uniqueTags, transaction);
         }

         await transaction.commit();

         // ✅ Возвращаем упражнение с полными деталями (owner, tags, media)
         return await this.getExerciseDetails(exercise.id, data.user_id);

      } catch (error) {
         await safeRollback(transaction);
         throw ApiError.internal(`Ошибка при создании упражнения: ${error.message}`);
      }
   }

   async getAllExercises(userId, limit, offset) {
      if (!userId) {
         throw ApiError.badRequest('ID пользователя обязателен');
      }
      return await ExerciseRepository.getAllExercises(userId, limit, offset);
   }

   /**
    * Получить упражнения с учетом прав доступа
    */
   async getExercisesWithAccess(userId, options = {}) {
      if (!userId) {
         throw ApiError.badRequest('ID пользователя обязателен');
      }
      await ExerciseAccessRepository.updateExpiredAccess();
      return await ExerciseRepository.getExercisesWithAccess(userId, options);
   }

   async getOneExercise(id, userId) {
      if (!id) throw ApiError.badRequest('ID упражнения обязателен');
      if (!userId) throw ApiError.badRequest('ID пользователя обязателен');
      return await ExerciseRepository.getOneExercise(id, userId);
   }

   /**
    * Получить детали упражнения с проверкой прав доступа
    */
   async getExerciseDetails(id, userId) {
      if (!id) throw ApiError.badRequest('ID упражнения обязателен');
      if (!userId) throw ApiError.badRequest('ID пользователя обязателен');

      const hasAccess = await this.checkExerciseAccess(id, userId);
      if (!hasAccess) {
         throw ApiError.forbidden('Нет доступа к этому упражнению');
      }

      const exercise = await ExerciseRepository.findExerciseByIdWithDetails(id);
      if (!exercise) {
         throw ApiError.notFound('Упражнение не найдено');
      }

      const accessLevel = await ExerciseAccessRepository.getUserAccessLevel(id, userId);

      return {
         ...exercise.toJSON(),
         user_access_level: accessLevel || (exercise.user_id === userId ? 'owner' : null)
      };
   }

   async updateOneExercise(exercise, id, userId) {
      const existingExercise = await this.getOneExercise(id, userId);
      if (!existingExercise) {
         throw ApiError.badRequest('Упражнение не найдено или нет доступа');
      }

      const [updatedRowsCount, updatedRows] = await ExerciseRepository.updateOneExercise(exercise, id, userId);
      if (updatedRowsCount === 0) {
         throw ApiError.badRequest('Упражнение не найдено для обновления');
      }
      return updatedRows[0];
   }

   /**
    * Обновление упражнения с тегами и медиа
    */
   async updateExerciseWithDetails(id, userId, data, tags = null, mediaIds = null) {
      const canEdit = await ExerciseRepository.canEditExercise(id, userId);
      if (!canEdit) {
         throw ApiError.forbidden('Нет прав на редактирование этого упражнения');
      }

      const transaction = await sequelize.transaction();

      try {
         await ExerciseRepository.updateExerciseWithDetails(id, data, null, mediaIds, transaction);

         // Обновляем теги через TagService, если переданы
         if (tags !== null) {
            const cleanedTags = tags
               .filter(tag => tag && tag.trim())
               .map(tag => tag.trim().toLowerCase());
            const uniqueTags = [...new Set(cleanedTags)];
            await TagService.updateExerciseTags(id, uniqueTags, transaction);
         }

         await transaction.commit();
         return await this.getExerciseDetails(id, userId);
      } catch (error) {
         await safeRollback(transaction);
         throw ApiError.internal(`Ошибка при обновлении упражнения: ${error.message}`);
      }
   }

   async deleteOneExercise(id, userId) {
      const exercise = await this.getOneExercise(id, userId);
      if (!exercise) {
         throw ApiError.badRequest('Упражнение не найдено или нет доступа');
      }
      const deletedExercise = await ExerciseRepository.deleteOneExercise(id, userId);
      console.log('Запись удалена');
      return deletedExercise;
   }

   /**
    * Удаление упражнения с очисткой связей
    */
   async deleteExerciseWithRelations(id, userId) {
      const exercise = await ExerciseRepository.findExerciseByIdWithDetails(id);
      if (!exercise) {
         throw ApiError.notFound('Упражнение не найдено');
      }
      if (exercise.user_id !== userId) {
         throw ApiError.forbidden('Только владелец может удалить упражнение');
      }

      const transaction = await sequelize.transaction();

      try {
         await ExerciseRepository.deleteExerciseWithRelations(id, transaction);
         await transaction.commit();
         return { success: true, message: 'Упражнение удалено' };
      } catch (error) {
         await safeRollback(transaction);
         throw ApiError.internal(`Ошибка при удалении упражнения: ${error.message}`);
      }
   }

   /**
    * Копирование упражнения
    */
   async copyExercise(sourceId, userId) {
      const hasAccess = await this.checkExerciseAccess(sourceId, userId);
      if (!hasAccess) {
         throw ApiError.forbidden('Нет доступа к исходному упражнению');
      }

      const transaction = await sequelize.transaction();

      try {
         const newExercise = await ExerciseRepository.copyExerciseWithDetails(sourceId, userId, transaction);
         await transaction.commit();
         return newExercise;
      } catch (error) {
         await safeRollback(transaction);
         throw ApiError.internal(`Ошибка при копировании упражнения: ${error.message}`);
      }
   }

   // ========== МЕТОДЫ ДЛЯ РАБОТЫ С ТЕГАМИ (через TagService) ==========

   async getExerciseTags(exerciseId, userId) {
      const hasAccess = await this.checkExerciseAccess(exerciseId, userId);
      if (!hasAccess) {
         throw ApiError.forbidden('Нет доступа к упражнению');
      }
      return await TagService.getTagsByExerciseId(exerciseId);
   }

   async updateExerciseTags(exerciseId, userId, tags) {
      const canEdit = await ExerciseRepository.canEditExercise(exerciseId, userId);
      if (!canEdit) {
         throw ApiError.forbidden('Нет прав на редактирование тегов');
      }

      const cleanedTags = tags
         .filter(tag => tag && tag.trim())
         .map(tag => tag.trim().toLowerCase());
      const uniqueTags = [...new Set(cleanedTags)];

      const transaction = await sequelize.transaction();

      try {
         const updatedTags = await TagService.updateExerciseTags(exerciseId, uniqueTags, transaction);
         await transaction.commit();
         return updatedTags;
      } catch (error) {
         await safeRollback(transaction);
         throw ApiError.internal(`Ошибка при обновлении тегов: ${error.message}`);
      }
   }

   async getPopularTags(limit = 20) {
      return await TagService.getPopularTags(limit);
   }

   // ========== МЕТОДЫ ДЛЯ РАБОТЫ С ДОСТУПОМ ==========

   async checkExerciseAccess(exerciseId, userId) {
      const exercise = await ExerciseRepository.findExerciseByIdWithDetails(exerciseId);
      if (!exercise) return false;
      if (exercise.user_id === userId) return true;
      if (exercise.is_public) return true;
      const access = await ExerciseAccessRepository.checkAccess(exerciseId, userId);
      return !!access;
   }

   async shareExercise(exerciseId, ownerId, targetUserId, accessLevel = 'view', expiresAt = null) {
      const exercise = await ExerciseRepository.findExerciseByIdWithDetails(exerciseId);
      if (!exercise) {
         throw ApiError.notFound('Упражнение не найдено');
      }
      if (exercise.user_id !== ownerId) {
         throw ApiError.forbidden('Только владелец может делиться упражнением');
      }
      if (ownerId === targetUserId) {
         throw ApiError.badRequest('Нельзя поделиться упражнением с самим собой');
      }
      if (!['view', 'use', 'edit'].includes(accessLevel)) {
         throw ApiError.badRequest('Некорректный уровень доступа');
      }

      const transaction = await sequelize.transaction();

      try {
         const access = await ExerciseAccessRepository.grantAccess({
            exercise_id: exerciseId,
            user_id: targetUserId,
            granted_by: ownerId,
            access_level: accessLevel,
            expires_at: expiresAt
         }, transaction);
         await transaction.commit();
         return access;
      } catch (error) {
         await safeRollback(transaction);
         throw ApiError.internal(`Ошибка при выдаче доступа: ${error.message}`);
      }
   }

   async revokeAccess(exerciseId, ownerId, targetUserId) {
      const exercise = await ExerciseRepository.findExerciseByIdWithDetails(exerciseId);
      if (!exercise) {
         throw ApiError.notFound('Упражнение не найдено');
      }
      if (exercise.user_id !== ownerId) {
         throw ApiError.forbidden('Только владелец может отзывать доступ');
      }

      const transaction = await sequelize.transaction();

      try {
         const revoked = await ExerciseAccessRepository.revokeAccess(exerciseId, targetUserId, transaction);
         await transaction.commit();
         if (!revoked) {
            throw ApiError.notFound('Доступ не найден или уже отозван');
         }
         return { success: true, message: 'Доступ отозван' };
      } catch (error) {
         await safeRollback(transaction);
         throw ApiError.internal(`Ошибка при отзыве доступа: ${error.message}`);
      }
   }

   async getExerciseAccessList(exerciseId, userId, options = {}) {
      const exercise = await ExerciseRepository.findExerciseByIdWithDetails(exerciseId);
      if (!exercise) {
         throw ApiError.notFound('Упражнение не найдено');
      }
      if (exercise.user_id !== userId) {
         throw ApiError.forbidden('Только владелец может видеть список доступа');
      }
      return await ExerciseAccessRepository.getUsersWithAccess(exerciseId, options);
   }

   async getSharedWithMe(userId, options = {}) {
      if (!userId) {
         throw ApiError.badRequest('ID пользователя обязателен');
      }
      await ExerciseAccessRepository.updateExpiredAccess();
      const result = await ExerciseAccessRepository.getExercisesSharedWithUser(userId, options);
      const exercises = result.rows.map(item => ({
         ...item.exercise.toJSON(),
         shared_access_level: item.access_level,
         shared_expires_at: item.expires_at,
         shared_by: item.grantor
      }));
      return {
         rows: exercises,
         count: result.count
      };
   }

   async updateAccessLevel(exerciseId, ownerId, targetUserId, newAccessLevel) {
      const exercise = await ExerciseRepository.findExerciseByIdWithDetails(exerciseId);
      if (!exercise) {
         throw ApiError.notFound('Упражнение не найдено');
      }
      if (exercise.user_id !== ownerId) {
         throw ApiError.forbidden('Только владелец может изменять уровень доступа');
      }
      if (!['view', 'use', 'edit'].includes(newAccessLevel)) {
         throw ApiError.badRequest('Некорректный уровень доступа');
      }

      const transaction = await sequelize.transaction();

      try {
         const updated = await ExerciseAccessRepository.updateAccessLevel(
            exerciseId,
            targetUserId,
            newAccessLevel,
            transaction
         );
         await transaction.commit();
         if (!updated) {
            throw ApiError.notFound('Доступ не найден');
         }
         return { success: true, message: 'Уровень доступа обновлен' };
      } catch (error) {
         await safeRollback(transaction);
         throw ApiError.internal(`Ошибка при обновлении уровня доступа: ${error.message}`);
      }
   }

   // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========

   async searchExercises(userId, query, tagIds = [], options = {}) {
      if (!userId) {
         throw ApiError.badRequest('ID пользователя обязателен');
      }
      return await ExerciseRepository.searchExercises(userId, query, tagIds, options);
   }

   async incrementUsage(exerciseId) {
      await ExerciseRepository.incrementUsageCount(exerciseId);
   }
}

module.exports = new ExerciseService();