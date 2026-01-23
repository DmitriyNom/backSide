// service/MediaService.js
const MediaRepository = require('../repository/mediaRepository');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

class MediaService {
   constructor() {
      this.mediaRepo = MediaRepository;

      // НОВЫЕ ПУТИ согласно структуре
      this.mediaBaseDir = path.join(__dirname, '..', 'uploads', 'media');
      this.privateDir = path.join(this.mediaBaseDir, 'private');
      this.publicDir = path.join(this.mediaBaseDir, 'public');
      this.tempDir = path.join(this.mediaBaseDir, 'temp');
      this.baseUrl = process.env.BASE_URL || 'http://localhost:5000';

      // Настройка multer для временного сохранения в temp
      this.storage = multer.diskStorage({
         destination: async (req, file, cb) => {
            try {
               await fs.mkdir(this.tempDir, { recursive: true });
               cb(null, this.tempDir);
            } catch (error) {
               cb(error);
            }
         },
         filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = path.extname(file.originalname);
            const tempFileName = `temp_${uniqueSuffix}${extension}`;
            cb(null, tempFileName);
         }
      });

      this.upload = multer({
         storage: this.storage,
         limits: { fileSize: 500 * 1024 * 1024 }
      });

      this.ensureDirectories();
   }

   async ensureDirectories() {
      await fs.mkdir(this.privateDir, { recursive: true });
      await fs.mkdir(this.publicDir, { recursive: true });
      await fs.mkdir(this.tempDir, { recursive: true });
   }

   // ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =====

   // Определение категории файла по расширению
   getFileCategory(filename) {
      const ext = path.extname(filename).toLowerCase();

      const imageExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
      const videoExt = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv'];
      const audioExt = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];
      const documentExt = ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.pptx', '.zip'];

      if (imageExt.includes(ext)) return 'images';
      if (videoExt.includes(ext)) return 'videos';
      if (audioExt.includes(ext)) return 'audio';
      if (documentExt.includes(ext)) return 'documents';

      return 'other';
   }

   // Генерация пути с пользователем и категорией
   generateObjectName(userId, filename, isPublic = false) {
      const category = this.getFileCategory(filename);
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 10);
      const extension = path.extname(filename) || '.bin';

      // Формат: user_{userId}/{category}/timestamp_random.extension
      return `user_${userId}/${category}/${timestamp}_${random}${extension}`;
   }

   // Получение полного пути для файла
   getFullFilePath(objectName, isPublic = false) {
      const baseDir = isPublic ? this.publicDir : this.privateDir;
      return path.join(baseDir, objectName);
   }

   // Перемещение файла из temp в постоянное место
   async moveToPermanentLocation(tempFilePath, objectName, isPublic = false) {
      const targetPath = this.getFullFilePath(objectName, isPublic);
      const targetDir = path.dirname(targetPath);

      // Создаем целевую директорию
      await fs.mkdir(targetDir, { recursive: true });

      // Перемещаем файл
      await fs.rename(tempFilePath, targetPath);

      return targetPath;
   }

   // ===== МЕТОДЫ ДЛЯ КОНТРОЛЛЕРА =====

   async createUploadRequest(userId, fileData) {
      const { filename, fileType, mimeType, size, isPublic = false } = fileData;

      if (!['photo', 'video', 'document', 'audio', 'other'].includes(fileType)) {
         throw new Error('Invalid file type');
      }

      if (size > 500 * 1024 * 1024) {
         throw new Error('File size exceeds 500MB limit');
      }

      // Генерация уникального пути с новой структурой
      const objectName = this.generateObjectName(userId, filename, isPublic);
      const bucketName = isPublic ? 'media/public' : 'media/private';
      const storageUrl = `${bucketName}/${objectName}`;

      // Создание записи в БД
      const media = await this.mediaRepo.create({
         user_id: userId,
         original_filename: filename,
         storage_url: storageUrl,
         file_type: fileType,
         mime_type: mimeType,
         size: size,
         privacy: isPublic ? 'public' : 'private',
         uploaded_at: null,
         metadata: {
            bucket: bucketName,
            is_public: isPublic,
            object_name: objectName,
            category: this.getFileCategory(filename)
         }
      });

      // Генерация URL для загрузки
      const uploadUrl = this.generateUploadUrl(objectName, isPublic);

      return {
         uploadUrl,
         mediaId: media.id,
         expiresIn: 900,
         isPublic,
         objectName,
         storageUrl
      };
   }

   generateUploadUrl(objectName, isPublic) {
      const uploadId = uuidv4();
      return {
         method: 'POST',
         url: `${this.baseUrl}/api/media/upload-direct`,
         headers: {
            'X-Upload-ID': uploadId,
            'X-File-Name': encodeURIComponent(objectName),
            'X-Is-Public': isPublic.toString(),
            'X-Temp-File': 'true' // Флаг, что загружаем во временную папку
         },
         fields: { uploadId, fileName: objectName, isPublic },
         expires: new Date(Date.now() + 900 * 1000)
      };
   }

   getUploadMiddleware() {
      return this.upload.single('file');
   }

   async handleUploadSuccess(req, res) {
      if (!req.file) {
         return res.status(400).json({ error: 'Файл не загружен' });
      }

      const isPublic = req.headers['x-is-public'] === 'true';
      const objectName = decodeURIComponent(req.headers['x-file-name'] || '');
      const isTempFile = req.headers['x-temp-file'] === 'true';

      let finalPath, fileUrl;

      if (isTempFile && objectName) {
         // Перемещаем из temp в постоянное место
         const tempPath = path.join(this.tempDir, req.file.filename);
         await this.moveToPermanentLocation(tempPath, objectName, isPublic);

         finalPath = `${isPublic ? 'media/public' : 'media/private'}/${objectName}`;
         fileUrl = isPublic
            ? `${this.baseUrl}/media/public/${objectName}`
            : `${this.baseUrl}/media/private/${objectName}`;
      } else {
         // Обратная совместимость (если нет объекта)
         const filename = req.file.filename;
         finalPath = isPublic ? `media/public/${filename}` : `media/private/${filename}`;
         fileUrl = isPublic
            ? `${this.baseUrl}/media/public/${filename}`
            : `${this.baseUrl}/media/private/${filename}`;
      }

      res.json({
         success: true,
         filename: req.file.filename,
         originalName: req.file.originalname,
         size: req.file.size,
         mimeType: req.file.mimetype,
         path: finalPath,
         url: fileUrl,
         isPublic
      });
   }

   async confirmUpload(userId, mediaId) {
      const media = await this.mediaRepo.findByIdAndUser(mediaId, userId);
      if (!media) throw new Error('Media not found or access denied');

      // Парсим storage_url
      const [bucketType, accessType, ...objectParts] = media.storage_url.split('/');
      const objectName = objectParts.join('/');
      const isPublic = bucketType === 'media' && accessType === 'public';

      // Проверяем существование файла
      const filePath = this.getFullFilePath(objectName, isPublic);
      try {
         await fs.access(filePath);
      } catch {
         throw new Error('File not found in storage');
      }

      // Получаем метаданные
      const stats = await fs.stat(filePath);

      await this.mediaRepo.update(mediaId, {
         uploaded_at: new Date(),
         size: stats.size,
         metadata: {
            ...(media.metadata || {}),
            last_validated: new Date().toISOString(),
            file_path: filePath,
            category: this.getFileCategory(media.original_filename),
            last_modified: stats.mtime
         }
      });

      return { success: true, mediaId };
   }

   async getUserMedia(userId, filters = {}) {
      const media = await this.mediaRepo.findByUser(userId, filters);

      const mediaWithUrls = await Promise.all(
         media.map(async (item) => {
            // Парсим storage_url
            const [bucketType, accessType, ...objectParts] = item.storage_url.split('/');
            const objectName = objectParts.join('/');
            const isPublic = bucketType === 'media' && accessType === 'public';

            const downloadUrl = await this.generateDownloadUrl(objectName, isPublic);
            const publicUrl = this.getPublicUrl(objectName, isPublic);

            return {
               ...item.toJSON(),
               downloadUrl,
               publicUrl,
               isPublic,
               bucket: `${bucketType}/${accessType}`,
               category: item.metadata?.category || this.getFileCategory(item.original_filename)
            };
         })
      );

      return mediaWithUrls;
   }

   async fileExists(objectName, isPublic = false) {
      try {
         const filePath = this.getFullFilePath(objectName, isPublic);
         await fs.access(filePath);
         return true;
      } catch {
         return false;
      }
   }

   async getFileMetadata(objectName, isPublic = false) {
      const filePath = this.getFullFilePath(objectName, isPublic);
      const stats = await fs.stat(filePath);
      return {
         size: stats.size,
         lastModified: stats.mtime,
         etag: stats.mtime.getTime().toString(36)
      };
   }

   async generateDownloadUrl(objectName, isPublic = false) {
      try {
         await this.fileExists(objectName, isPublic);
         const urlPath = isPublic
            ? `/media/public/${objectName}`
            : `/media/private/${objectName}`;
         return `${this.baseUrl}${urlPath}`;
      } catch {
         return null;
      }
   }

   getPublicUrl(objectName, isPublic = false) {
      const urlPath = isPublic
         ? `/media/public/${objectName}`
         : `/media/private/${objectName}`;
      return `${this.baseUrl}${urlPath}`;
   }

   async deleteFile(objectName, isPublic = false) {
      try {
         const filePath = this.getFullFilePath(objectName, isPublic);
         await fs.unlink(filePath);

         // Пытаемся удалить пустые родительские папки
         const userDir = path.dirname(path.dirname(filePath));
         try {
            await fs.rmdir(userDir); // Удаляем категорию папку если пуста
            await fs.rmdir(path.dirname(userDir)); // Удаляем user папку если пуста
         } catch {
            // Игнорируем ошибки если папки не пустые
         }

         return true;
      } catch {
         return false;
      }
   }

   async objectExists(bucket, objectName) {
      const isPublic = bucket.includes('public');
      return this.fileExists(objectName, isPublic);
   }

   async moveObject(sourceBucket, sourceObject, destBucket, destObject) {
      const sourceIsPublic = sourceBucket.includes('public');
      const destIsPublic = destBucket.includes('public');

      const sourcePath = this.getFullFilePath(sourceObject, sourceIsPublic);
      const destPath = this.getFullFilePath(destObject, destIsPublic);

      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.rename(sourcePath, destPath);
      return true;
   }

   // Метод для удаления медиа
   async deleteMedia(userId, mediaId) {
      const media = await this.mediaRepo.findByIdAndUser(mediaId, userId);
      if (!media) {
         throw new Error('Media not found or access denied');
      }

      // Парсим storage_url
      const [bucketType, accessType, ...objectParts] = media.storage_url.split('/');
      const objectName = objectParts.join('/');
      const isPublic = bucketType === 'media' && accessType === 'public';

      // Удаляем файл
      const fileDeleted = await this.deleteFile(objectName, isPublic);

      if (!fileDeleted) {
         console.warn(`File not found during deletion: ${objectName}`);
      }

      // Удаляем запись из БД
      await this.mediaRepo.delete(mediaId);

      return { success: true, mediaId };
   }

   // Метод для изменения приватности
   async setMediaPrivacy(userId, mediaId, privacy) {
      const media = await this.mediaRepo.findByIdAndUser(mediaId, userId);
      if (!media) {
         throw new Error('Media not found or access denied');
      }

      const newIsPublic = privacy === 'public';
      const currentIsPublic = media.privacy === 'public';

      if (newIsPublic === currentIsPublic) {
         return media; // Ничего не меняем
      }

      // Парсим текущий путь
      const [_, __, ...objectParts] = media.storage_url.split('/');
      const objectName = objectParts.join('/');

      // Генерируем новый путь
      const newBucketName = newIsPublic ? 'media/public' : 'media/private';
      const newStorageUrl = `${newBucketName}/${objectName}`;

      // Перемещаем файл
      const currentPath = this.getFullFilePath(objectName, currentIsPublic);
      const newPath = this.getFullFilePath(objectName, newIsPublic);

      await fs.mkdir(path.dirname(newPath), { recursive: true });
      await fs.rename(currentPath, newPath);

      // Обновляем запись в БД
      const updatedMedia = await this.mediaRepo.update(mediaId, {
         privacy: privacy,
         storage_url: newStorageUrl,
         metadata: {
            ...(media.metadata || {}),
            is_public: newIsPublic,
            bucket: newBucketName
         }
      });

      return updatedMedia;
   }

   // Метод для шаринга медиа
   async shareMedia(userId, mediaId, options = {}) {
      const media = await this.mediaRepo.findByIdAndUser(mediaId, userId);
      if (!media) {
         throw new Error('Media not found or access denied');
      }

      const {
         expiresIn = null, // Время жизни ссылки в часах
         password = null,  // Защита паролем
         allowDownload = true,
         maxViews = null
      } = options;

      // Если файл приватный, делаем его публичным для шаринга
      if (media.privacy === 'private') {
         await this.setMediaPrivacy(userId, mediaId, 'public');
      }

      // Парсим путь к файлу
      const [bucketType, accessType, ...objectParts] = media.storage_url.split('/');
      const objectName = objectParts.join('/');

      // Генерируем уникальный токен для шаринга
      const crypto = require('crypto');
      const shareToken = crypto.randomBytes(16).toString('hex');
      const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Вычисляем дату истечения
      let expiresAt = null;
      if (expiresIn) {
         expiresAt = new Date(Date.now() + (expiresIn * 60 * 60 * 1000));
      }

      // Генерируем публичную ссылку
      const shareUrl = `${this.baseUrl}/api/media/shared/${shareToken}`;
      const directUrl = this.getPublicUrl(objectName, true);

      // Обновляем запись в БД
      await this.mediaRepo.update(mediaId, {
         metadata: {
            ...(media.metadata || {}),
            shared: true,
            share_token: shareToken,
            share_code: shareCode,
            share_url: shareUrl,
            direct_url: directUrl,
            shared_at: new Date().toISOString(),
            share_options: {
               expires_at: expiresAt,
               password_protected: !!password,
               allow_download: allowDownload,
               max_views: maxViews,
               current_views: 0
            }
         }
      });

      return {
         success: true,
         mediaId,
         shareUrl,
         directUrl,
         shareCode,
         expiresAt,
         settings: {
            allowDownload,
            maxViews,
            passwordProtected: !!password
         }
      };
   }

   // Метод для проверки файла
   async validateMediaFile(filePath) {
      try {
         const stats = await fs.stat(filePath);
         return {
            isValid: true,
            size: stats.size,
            lastModified: stats.mtime,
            isDirectory: stats.isDirectory()
         };
      } catch (error) {
         return {
            isValid: false,
            error: error.message
         };
      }
   }

   // Метод для очистки временных файлов (можно запускать по cron)
   async cleanupTempFiles(maxAgeHours = 24) {
      try {
         const files = await fs.readdir(this.tempDir);
         const now = Date.now();
         const maxAge = maxAgeHours * 60 * 60 * 1000;

         for (const file of files) {
            if (file.startsWith('temp_')) {
               const filePath = path.join(this.tempDir, file);
               const stats = await fs.stat(filePath);

               if (now - stats.mtime.getTime() > maxAge) {
                  await fs.unlink(filePath);
                  console.log(`Deleted temp file: ${file}`);
               }
            }
         }
      } catch (error) {
         console.error('Error cleaning temp files:', error);
      }
   }

   // Метод для получения общей статистики по медиа пользователя
   async getUserMediaStats(userId) {
      const media = await this.mediaRepo.findByUser(userId, {});

      let totalSize = 0;
      const byCategory = {
         images: { count: 0, size: 0 },
         videos: { count: 0, size: 0 },
         audio: { count: 0, size: 0 },
         documents: { count: 0, size: 0 },
         other: { count: 0, size: 0 }
      };

      const byPrivacy = {
         public: 0,
         private: 0
      };

      media.forEach(item => {
         totalSize += item.size || 0;

         const category = item.metadata?.category || this.getFileCategory(item.original_filename);
         if (byCategory[category]) {
            byCategory[category].count++;
            byCategory[category].size += item.size || 0;
         } else {
            byCategory.other.count++;
            byCategory.other.size += item.size || 0;
         }

         byPrivacy[item.privacy] = (byPrivacy[item.privacy] || 0) + 1;
      });

      return {
         totalCount: media.length,
         totalSize,
         byCategory,
         byPrivacy,
         averageSize: media.length > 0 ? totalSize / media.length : 0
      };
   }
}

module.exports = new MediaService();