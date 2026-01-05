const MediaService = require('../service/mediaService');
const ApiError = require('../error/ApiError');

class MediaController {
   async generateUploadRequest(req, res, next) {
      try {
         const userId = req.user.id;
         const { filename, fileType, mimeType, size, isPublic = false, privacy } = req.body;

         // Валидация
         if (!filename || !fileType || !mimeType || !size) {
            return next(ApiError.badRequest('Missing required fields'));
         }

         // ПОДДЕРЖКА ОБОИХ ВАРИАНТОВ:
         // 1. Если пришло isPublic - используем его
         // 2. Если пришло privacy - преобразуем в isPublic
         // 3. По умолчанию false
         let finalIsPublic = Boolean(isPublic);

         if (privacy && !isPublic) {
            // Если пришло privacy, но не пришло isPublic
            finalIsPublic = privacy === 'public';
         }

         const result = await MediaService.createUploadRequest(userId, {
            filename,
            fileType,
            mimeType,
            size: parseInt(size),
            isPublic: finalIsPublic  // Передаем вычисленное значение
         });

         return res.json(result);
      } catch (error) {
         next(ApiError.badRequest(error.message));
      }
   }

   async confirmUpload(req, res, next) {
      try {
         const userId = req.user.id;
         const { mediaId } = req.body;

         if (!mediaId) {
            return next(ApiError.badRequest('Missing mediaId'));
         }

         const result = await MediaService.confirmUpload(userId, mediaId);
         return res.json(result);
      } catch (error) {
         next(ApiError.badRequest(error.message));
      }
   }

   async getMyMedia(req, res, next) {
      try {
         const userId = req.user.id;
         const { fileType, limit = 50, offset = 0 } = req.query;

         const result = await MediaService.getUserMedia(userId, {
            fileType,
            limit: parseInt(limit),
            offset: parseInt(offset)
         });

         return res.json(result);
      } catch (error) {
         next(ApiError.internal(error.message));
      }
   }

   async shareMedia(req, res, next) {
      try {
         const userId = req.user.id;
         const { mediaId } = req.params;

         if (!mediaId) {
            return next(ApiError.badRequest('Missing mediaId'));
         }

         const result = await MediaService.shareMedia(userId, mediaId);
         return res.json(result);
      } catch (error) {
         next(ApiError.badRequest(error.message));
      }
   }

   async deleteMedia(req, res, next) {
      try {
         const userId = req.user.id;
         const { id } = req.params;

         if (!id) {
            return next(ApiError.badRequest('Missing media id'));
         }

         const result = await MediaService.deleteMedia(userId, id);
         return res.json(result);
      } catch (error) {
         next(ApiError.badRequest(error.message));
      }
   }

   async setPrivacy(req, res, next) {
      try {
         const userId = req.user.id;
         const { id } = req.params;
         const { privacy } = req.body;

         if (!id) {
            return next(ApiError.badRequest('Missing media id'));
         }

         if (!privacy || !['private', 'public'].includes(privacy)) {
            return next(ApiError.badRequest('Invalid privacy value'));
         }

         const result = await MediaService.setMediaPrivacy(userId, id, privacy);
         return res.json(result);
      } catch (error) {
         next(ApiError.badRequest(error.message));
      }
   }
}

module.exports = new MediaController();