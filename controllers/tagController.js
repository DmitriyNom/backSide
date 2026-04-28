// backend/controllers/tagController.js
const ApiError = require('../error/ApiError');
const TagService = require('../service/tagService');

class TagController {
   /**
    * Получить популярные теги
    * GET /api/tags/popular?limit=20
    */
   async getPopularTags(req, res, next) {
      try {
         const { limit = 20 } = req.query;
         const tags = await TagService.getPopularTags(parseInt(limit));

         return res.json({
            success: true,
            data: tags
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   /**
    * Получить все теги
    * GET /api/tags
    */
   async getAllTags(req, res, next) {
      try {
         const tags = await TagService.getAllTags();

         return res.json({
            success: true,
            data: tags
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   /**
    * Поиск тегов
    * GET /api/tags/search?q=хоккей&limit=20
    */
   async searchTags(req, res, next) {
      try {
         const { q, limit = 20 } = req.query;
         const tags = await TagService.searchTags(q, parseInt(limit));

         return res.json({
            success: true,
            data: tags
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   /**
    * Получить тег по ID
    * GET /api/tags/:id
    */
   async getTagById(req, res, next) {
      try {
         const { id } = req.params;
         const tag = await TagService.getTagById(parseInt(id));

         return res.json({
            success: true,
            data: tag
         });
      } catch (e) {
         if (e.message === 'Тег не найден') {
            return next(ApiError.notFound(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }

   /**
    * Получить тег по имени
    * GET /api/tags/name/:name
    */
   async getTagByName(req, res, next) {
      try {
         const { name } = req.params;
         const tag = await TagService.getTagByName(decodeURIComponent(name));

         return res.json({
            success: true,
            data: tag
         });
      } catch (e) {
         if (e.message === 'Тег не найден') {
            return next(ApiError.notFound(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }

   /**
    * Создать новый тег
    * POST /api/tags
    */
   async createTag(req, res, next) {
      try {
         const { name } = req.body;

         if (!name) {
            return next(ApiError.badRequest('Название тега обязательно'));
         }

         const { tag, created } = await TagService.findOrCreateTag(name);

         if (!created) {
            return res.status(200).json({
               success: true,
               message: 'Тег уже существует',
               data: tag
            });
         }

         return res.status(201).json({
            success: true,
            message: 'Тег успешно создан',
            data: tag
         });
      } catch (e) {
         if (e.message.includes('не может быть пустым') ||
            e.message.includes('превышает') ||
            e.message.includes('недопустимые символы')) {
            return next(ApiError.badRequest(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }

   /**
    * Удалить тег (только если не используется)
    * DELETE /api/tags/:id
    */
   async deleteTag(req, res, next) {
      try {
         const { id } = req.params;
         const result = await TagService.deleteTagIfUnused(parseInt(id));

         return res.json({
            success: true,
            message: result.message
         });
      } catch (e) {
         if (e.message === 'Тег не найден') {
            return next(ApiError.notFound(e.message));
         }
         if (e.message.includes('невозможно удалить')) {
            return next(ApiError.badRequest(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }

   /**
    * Очистить неиспользуемые теги
    * DELETE /api/tags/cleanup
    */
   async cleanupUnusedTags(req, res, next) {
      try {
         const result = await TagService.cleanupUnusedTags();

         return res.json({
            success: true,
            message: result.message,
            deletedCount: result.deletedCount
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   /**
    * Получить теги упражнения (прокси в exerciseController)
    * GET /api/tags/exercise/:exerciseId
    */
   async getTagsByExerciseId(req, res, next) {
      try {
         const { exerciseId } = req.params;
         const userId = req.user.id;

         // Проверка доступа к упражнению через ExerciseService
         const ExerciseService = require('../service/exerciseService');
         const hasAccess = await ExerciseService.checkExerciseAccess(exerciseId, userId);

         if (!hasAccess) {
            return next(ApiError.forbidden('Нет доступа к этому упражнению'));
         }

         const tags = await TagService.getTagsByExerciseId(parseInt(exerciseId));

         return res.json({
            success: true,
            data: tags
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }
}

module.exports = new TagController();