// routes/mediaRouter.js
const Router = require('express');
const router = new Router();
const mediaController = require('../controllers/mediaController');
const authMiddleware = require('../middleware/AuthMiddleware');
const MediaService = require('../service/MediaService');

// ========== МИДЛВЭРЫ ЗАГРУЗКИ ИЗ СЕРВИСА ==========

// Получаем мидлвэр загрузки из MediaService
const uploadMiddleware = MediaService.getUploadMiddleware();

// Мидлвэр для логирования загрузки
const uploadLogger = (req, res, next) => {
   console.log('📍 Прямая загрузка файла:', {
      originalName: req.headers['x-file-name'] ? decodeURIComponent(req.headers['x-file-name']) : 'unknown',
      isPublic: req.headers['x-is-public'] === 'true',
      isTemp: req.headers['x-temp-file'] === 'true',
      uploadId: req.headers['x-upload-id'],
      size: req.headers['content-length']
   });
   next();
};

// Обработчик ошибок загрузки
const uploadErrorHandler = (err, req, res, next) => {
   if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
         return res.status(413).json({
            error: 'File too large',
            maxSize: '500MB'
         });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
   }
   next(err);
};

// ========== РОУТЫ ДЛЯ ЗАГРРУЗКИ ФАЙЛОВ ==========

// Прямая загрузка файла
router.post('/upload-direct',
   authMiddleware,
   uploadLogger,
   uploadMiddleware,
   MediaService.handleUploadSuccess.bind(MediaService),
   uploadErrorHandler
);

// ========== РОУТЫ ДЛЯ ОСНОВНЫХ ОПЕРАЦИЙ С МЕДИА ==========

// Все роуты требуют аутентификации
router.use(authMiddleware);

// Основные операции с медиа
router.post('/upload-request', mediaController.generateUploadRequest);
router.post('/confirm', mediaController.confirmUpload);
router.get('/my', mediaController.getMyMedia);
router.delete('/:id', mediaController.deleteMedia);
router.put('/:id/privacy', mediaController.setPrivacy);
router.post('/:mediaId/share', mediaController.shareMedia);


// ========== РОУТ ДЛЯ ДОСТУПА К ОБЩИМ ФАЙЛАМ ==========

// Этот роут можно добавить позже для shared файлов
// router.get('/shared/:token', mediaController.getSharedMedia);

module.exports = router;