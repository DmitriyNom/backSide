const MediaRepository = require('../repository/mediaRepository');
const MinioService = require('./minioService');

class MediaService {
   constructor() {
      this.mediaRepo = MediaRepository;
      this.minio = MinioService;
      // Локальные переменные для бакетов (читаем из process.env)
      this.bucketName = process.env.MINIO_BUCKET_NAME || 'training-media';
      this.publicBucketName = process.env.MINIO_PUBLIC_BUCKET_NAME || 'training-media-public';
   }

   async createUploadRequest(userId, fileData) {
      const { filename, fileType, mimeType, size, isPublic = false } = fileData;

      // Валидация
      if (!['photo', 'video'].includes(fileType)) {
         throw new Error('Invalid file type. Must be photo or video');
      }

      if (size > 500 * 1024 * 1024) {
         throw new Error('File size exceeds 500MB limit');
      }

      // Генерация уникального пути в S3
      const objectName = this.minio.generateObjectName(userId, filename, fileType);

      // Генерация Presigned URL для загрузки
      const uploadUrl = await this.minio.generateUploadUrl(objectName, 900, isPublic);

      // Определяем бакет для storage_url
      const storageBucket = isPublic ? this.publicBucketName : this.bucketName;
      const storageUrl = `${storageBucket}/${objectName}`;

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
            bucket: storageBucket,
            is_public: isPublic
         }
      });

      return {
         uploadUrl,
         mediaId: media.id,
         expiresIn: 900,
         isPublic
      };
   }

   async confirmUpload(userId, mediaId) {
      const media = await this.mediaRepo.findByIdAndUser(mediaId, userId);

      if (!media) {
         throw new Error('Media not found or access denied');
      }

      // Извлекаем бакет и путь из storage_url
      const [bucket, ...pathParts] = media.storage_url.split('/');
      const objectName = pathParts.join('/');
      const usePublic = bucket === this.publicBucketName;

      // Проверяем, что файл действительно загружен в S3
      const exists = await this.minio.fileExists(objectName, usePublic);
      if (!exists) {
         throw new Error('File not found in storage');
      }

      // Получаем метаданные из S3
      const metadata = await this.minio.getFileMetadata(objectName, usePublic);

      // Обновляем запись в БД
      await this.mediaRepo.update(mediaId, {
         uploaded_at: new Date(),
         size: metadata.size,
         metadata: {
            ...(media.metadata || {}),
            last_validated: new Date().toISOString(),
            etag: metadata.etag
         }
      });

      return { success: true, mediaId };
   }

   async getUserMedia(userId, filters = {}) {
      const media = await this.mediaRepo.findByUser(userId, filters);

      // Добавляем временные ссылки для доступа
      const mediaWithUrls = await Promise.all(
         media.map(async (item) => {
            // Извлекаем бакет и путь из storage_url
            const [bucket, ...pathParts] = item.storage_url.split('/');
            const objectName = pathParts.join('/');
            const usePublic = bucket === this.publicBucketName;

            const downloadUrl = await this.minio.generateDownloadUrl(objectName, 3600, usePublic);
            const publicUrl = this.minio.getPublicUrl(objectName, usePublic);

            return {
               ...item.toJSON(),
               downloadUrl,
               publicUrl,
               isPublic: usePublic,
               bucket
            };
         })
      );

      return mediaWithUrls;
   }

   async shareMedia(userId, mediaId) {
      const originalMedia = await this.mediaRepo.findById(mediaId);

      if (!originalMedia) {
         throw new Error('Media not found');
      }

      // Проверяем права доступа
      if (originalMedia.privacy !== 'public' && originalMedia.user_id !== userId) {
         throw new Error('Media cannot be shared');
      }

      if (!originalMedia.allow_reshare) {
         throw new Error('Media sharing is not allowed');
      }

      // Создаем запись о репосте
      const sharedMedia = await this.mediaRepo.create({
         user_id: userId,
         original_filename: originalMedia.original_filename,
         storage_url: originalMedia.storage_url,
         file_type: originalMedia.file_type,
         mime_type: originalMedia.mime_type,
         size: originalMedia.size,
         source_type: 'shared',
         original_media_id: originalMedia.id,
         privacy: 'private',
         uploaded_at: new Date(),
         metadata: {
            ...(originalMedia.metadata || {}),
            shared_from: originalMedia.id
         }
      });

      // Увеличиваем счетчик репостов
      await this.mediaRepo.incrementShareCount(originalMedia.id);

      return sharedMedia;
   }

   async deleteMedia(userId, mediaId) {
      const media = await this.mediaRepo.findByIdAndUser(mediaId, userId);

      if (!media) {
         throw new Error('Media not found or access denied');
      }

      // Извлекаем бакет и путь из storage_url
      const [bucket, ...pathParts] = media.storage_url.split('/');
      const objectName = pathParts.join('/');
      const usePublic = bucket === this.publicBucketName;

      // Проверяем, используется ли файл другими репостами
      const sharesCount = await this.mediaRepo.countByStorageUrl(media.storage_url);

      // Если это последняя ссылка на файл - удаляем из S3
      if (sharesCount === 1) {
         await this.minio.deleteFile(objectName, usePublic);
      }

      // Удаляем запись из БД
      await this.mediaRepo.delete(mediaId);

      return { success: true };
   }

   async setMediaPrivacy(userId, mediaId, privacy) {
      const media = await this.mediaRepo.findByIdAndUser(mediaId, userId);

      if (!media) {
         throw new Error('Media not found or access denied');
      }

      if (!['private', 'public'].includes(privacy)) {
         throw new Error('Invalid privacy setting');
      }

      await this.mediaRepo.update(mediaId, { privacy });

      return { success: true, mediaId, privacy };
   }
}

module.exports = new MediaService();