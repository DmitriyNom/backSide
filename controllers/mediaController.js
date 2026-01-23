// controllers/mediaController.js
const MediaService = require('../service/MediaService'); // Единый сервис
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

         // Используем единый MediaService
         const result = await MediaService.createUploadRequest(userId, {
            filename,
            fileType,
            mimeType,
            size: parseInt(size),
            isPublic: finalIsPublic
         });

         return res.json(result);
      } catch (error) {
         console.error('❌ Error in generateUploadRequest:', error);
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

         // Используем единый MediaService
         const result = await MediaService.confirmUpload(userId, mediaId);
         return res.json(result);
      } catch (error) {
         console.error('❌ Error in confirmUpload:', error);
         next(ApiError.badRequest(error.message));
      }
   }

   async getMyMedia(req, res, next) {
      try {
         const userId = req.user.id;
         const { fileType, limit = 50, offset = 0 } = req.query;

         // Используем единый MediaService
         const result = await MediaService.getUserMedia(userId, {
            fileType,
            limit: parseInt(limit),
            offset: parseInt(offset)
         });

         return res.json(result);
      } catch (error) {
         console.error('❌ Error in getMyMedia:', error);
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

         // Используем MediaService для логики шаринга
         const result = await MediaService.shareMedia(userId, mediaId);
         return res.json(result);
      } catch (error) {
         console.error('❌ Error in shareMedia:', error);
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

         // Используем единый MediaService
         const result = await MediaService.deleteMedia(userId, id);
         return res.json(result);
      } catch (error) {
         console.error('❌ Error in deleteMedia:', error);
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

         // Используем единый MediaService
         const result = await MediaService.setMediaPrivacy(userId, id, privacy);
         return res.json(result);
      } catch (error) {
         console.error(`❌ Error changing privacy for media ${id}:`, error.message);
         next(ApiError.badRequest(`Failed to change privacy: ${error.message}`));
      }
   }
}

module.exports = new MediaController();