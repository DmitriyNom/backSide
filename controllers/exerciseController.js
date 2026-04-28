// backend/controllers/exerciseController.js
const ApiError = require('../error/ApiError');
const ExerciseService = require('../service/exerciseService');
const countOffset = require('../utils/countOffset');

class ExerciseController {

   // ========== ОСНОВНЫЕ CRUD ОПЕРАЦИИ ==========

   async createExercise(req, res, next) {
      try {
         const user_id = req.user.id;
         const { title, description, tags = [], media_ids = [], is_public = false } = req.body;

         // Валидация
         if (!title || title.trim() === '') {
            return next(ApiError.badRequest('Название упражнения обязательно'));
         }

         const exercise = await ExerciseService.createExerciseWithDetails({
            user_id,
            title: title.trim(),
            description: description || null,
            is_public
         }, tags, media_ids);

         return res.status(201).json({
            success: true,
            message: 'Упражнение успешно создано',
            data: exercise
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   // Старый метод создания (для обратной совместимости)
   async createExerciseLegacy(req, res, next) {
      try {
         const user_id = req.user.id;
         const { exercise_name, exercise_description } = req.body;

         const exercise = await ExerciseService.createExercise({
            title: exercise_name,
            description: exercise_description,
            user_id
         });
         return res.status(201).json(exercise);
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   async getAllExercises(req, res, next) {
      try {
         const user_id = req.user.id;
         let { limit, page, sort, order, search } = req.query;
         page = parseInt(page) || 1;
         limit = parseInt(limit) || 50;
         const offset = countOffset(page, limit);

         // Новый метод с учетом прав доступа
         const exercises = await ExerciseService.getExercisesWithAccess(user_id, {
            limit,
            offset,
            sort: sort || 'created_at',
            order: order || 'DESC',
            search: search || ''
         });

         return res.json({
            success: true,
            data: exercises.rows,
            pagination: {
               page,
               limit,
               total: exercises.count,
               totalPages: Math.ceil(exercises.count / limit)
            }
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   async getOneExercise(req, res, next) {
      try {
         const user_id = req.user.id;
         const { id } = req.params;

         // Используем новый метод с деталями и проверкой прав
         const exercise = await ExerciseService.getExerciseDetails(id, user_id);

         return res.json({
            success: true,
            data: exercise
         });
      } catch (e) {
         if (e.message === 'Нет доступа к этому упражнению') {
            return next(ApiError.forbidden(e.message));
         }
         if (e.message === 'Упражнение не найдено') {
            return next(ApiError.notFound(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }

   async updateOneExercise(req, res, next) {
      try {
         const user_id = req.user.id;
         const { id } = req.params;
         const { title, description, is_public, tags, media_ids } = req.body;

         // Используем новый метод с поддержкой тегов и медиа
         const updatedExercise = await ExerciseService.updateExerciseWithDetails(
            id,
            user_id,
            { title, description, is_public },
            tags,
            media_ids
         );

         return res.json({
            success: true,
            message: 'Упражнение успешно обновлено',
            data: updatedExercise
         });
      } catch (e) {
         if (e.message === 'Нет прав на редактирование этого упражнения') {
            return next(ApiError.forbidden(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }

   async deleteOneExercise(req, res, next) {
      try {
         const user_id = req.user.id;
         const { id } = req.params;

         // Используем новый метод с каскадным удалением
         const result = await ExerciseService.deleteExerciseWithRelations(id, user_id);

         return res.json({
            success: true,
            message: result.message
         });
      } catch (e) {
         if (e.message === 'Только владелец может удалить упражнение') {
            return next(ApiError.forbidden(e.message));
         }
         if (e.message === 'Упражнение не найдено') {
            return next(ApiError.notFound(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }

   // ========== МЕТОДЫ ДЛЯ РАБОТЫ С ТЕГАМИ ==========

   async getExerciseTags(req, res, next) {
      try {
         const user_id = req.user.id;
         const { id } = req.params;

         const tags = await ExerciseService.getExerciseTags(id, user_id);

         return res.json({
            success: true,
            data: tags
         });
      } catch (e) {
         if (e.message === 'Нет доступа к упражнению') {
            return next(ApiError.forbidden(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }

   async updateExerciseTags(req, res, next) {
      try {
         const user_id = req.user.id;
         const { id } = req.params;
         const { tags } = req.body;

         if (!tags || !Array.isArray(tags)) {
            return next(ApiError.badRequest('Теги должны быть переданы массивом'));
         }

         const updatedTags = await ExerciseService.updateExerciseTags(id, user_id, tags);

         return res.json({
            success: true,
            message: 'Теги успешно обновлены',
            data: updatedTags
         });
      } catch (e) {
         if (e.message === 'Нет прав на редактирование тегов') {
            return next(ApiError.forbidden(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }

   async getPopularTags(req, res, next) {
      try {
         const { limit = 20 } = req.query;

         const tags = await ExerciseService.getPopularTags(parseInt(limit));

         return res.json({
            success: true,
            data: tags
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   // ========== МЕТОДЫ ДЛЯ РАБОТЫ С ДОСТУПОМ ==========

   async shareExercise(req, res, next) {
      try {
         const user_id = req.user.id;
         const { id } = req.params;
         const { target_user_id, access_level = 'view', expires_at = null } = req.body;

         if (!target_user_id) {
            return next(ApiError.badRequest('ID пользователя обязателен'));
         }

         const access = await ExerciseService.shareExercise(
            id,
            user_id,
            target_user_id,
            access_level,
            expires_at
         );

         return res.status(201).json({
            success: true,
            message: 'Доступ успешно предоставлен',
            data: access
         });
      } catch (e) {
         if (e.message === 'Только владелец может делиться упражнением') {
            return next(ApiError.forbidden(e.message));
         }
         if (e.message === 'Нельзя поделиться упражнением с самим собой') {
            return next(ApiError.badRequest(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }

   async revokeAccess(req, res, next) {
      try {
         const user_id = req.user.id;
         const { id } = req.params;
         const { target_user_id } = req.body;

         if (!target_user_id) {
            return next(ApiError.badRequest('ID пользователя обязателен'));
         }

         const result = await ExerciseService.revokeAccess(id, user_id, target_user_id);

         return res.json({
            success: true,
            message: result.message
         });
      } catch (e) {
         if (e.message === 'Только владелец может отзывать доступ') {
            return next(ApiError.forbidden(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }

   async getExerciseAccessList(req, res, next) {
      try {
         const user_id = req.user.id;
         const { id } = req.params;
         let { limit = 50, offset = 0, status = 'active' } = req.query;

         const accessList = await ExerciseService.getExerciseAccessList(id, user_id, {
            limit: parseInt(limit),
            offset: parseInt(offset),
            status
         });

         return res.json({
            success: true,
            data: accessList.rows,
            total: accessList.count,
            pagination: {
               limit: parseInt(limit),
               offset: parseInt(offset),
               total: accessList.count
            }
         });
      } catch (e) {
         if (e.message === 'Только владелец может видеть список доступа') {
            return next(ApiError.forbidden(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }

   async getSharedWithMe(req, res, next) {
      try {
         const user_id = req.user.id;
         let { limit, page, status = 'active' } = req.query;
         page = parseInt(page) || 1;
         limit = parseInt(limit) || 50;
         const offset = countOffset(page, limit);

         const exercises = await ExerciseService.getSharedWithMe(user_id, {
            limit,
            offset,
            access_level: null // Можно добавить фильтр по уровню доступа
         });

         return res.json({
            success: true,
            data: exercises.rows,
            pagination: {
               page,
               limit,
               total: exercises.count,
               totalPages: Math.ceil(exercises.count / limit)
            }
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   async updateAccessLevel(req, res, next) {
      try {
         const user_id = req.user.id;
         const { id } = req.params;
         const { target_user_id, access_level } = req.body;

         if (!target_user_id || !access_level) {
            return next(ApiError.badRequest('ID пользователя и уровень доступа обязательны'));
         }

         const result = await ExerciseService.updateAccessLevel(id, user_id, target_user_id, access_level);

         return res.json({
            success: true,
            message: result.message
         });
      } catch (e) {
         if (e.message === 'Только владелец может изменять уровень доступа') {
            return next(ApiError.forbidden(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }

   // ========== ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ==========

   async copyExercise(req, res, next) {
      try {
         const user_id = req.user.id;
         const { id } = req.params;

         const newExercise = await ExerciseService.copyExercise(id, user_id);

         return res.status(201).json({
            success: true,
            message: 'Упражнение успешно скопировано',
            data: newExercise
         });
      } catch (e) {
         if (e.message === 'Нет доступа к исходному упражнению') {
            return next(ApiError.forbidden(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }

   async searchExercises(req, res, next) {
      try {
         const user_id = req.user.id;
         let { q, tags, limit = 50, page = 1 } = req.query;

         if (!q && !tags) {
            return next(ApiError.badRequest('Укажите поисковый запрос или теги'));
         }

         const tagIds = tags ? tags.split(',').map(id => parseInt(id)) : [];
         const offset = countOffset(parseInt(page), parseInt(limit));

         const results = await ExerciseService.searchExercises(
            user_id,
            q || '',
            tagIds,
            { limit: parseInt(limit), offset }
         );

         return res.json({
            success: true,
            data: results.rows,
            pagination: {
               page: parseInt(page),
               limit: parseInt(limit),
               total: results.count,
               totalPages: Math.ceil(results.count / limit)
            }
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   async incrementUsage(req, res, next) {
      try {
         const user_id = req.user.id;
         const { id } = req.params;

         // Проверяем доступ перед увеличением счетчика
         const hasAccess = await ExerciseService.checkExerciseAccess(id, user_id);
         if (!hasAccess) {
            return next(ApiError.forbidden('Нет доступа к упражнению'));
         }

         await ExerciseService.incrementUsage(id);

         return res.json({
            success: true,
            message: 'Счетчик использования увеличен'
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }
}

module.exports = new ExerciseController();