const Router = require('express');
const router = new Router();
const mediaController = require('../controllers/mediaController');
const authMiddleware = require('../middleware/AuthMiddleware');

// Все роуты требуют аутентификации
router.use(authMiddleware);

// Основные операции с медиа
router.post('/upload-request', mediaController.generateUploadRequest);
router.post('/confirm', mediaController.confirmUpload);
router.get('/my', mediaController.getMyMedia);
router.post('/:mediaId/share', mediaController.shareMedia);
router.delete('/:id', mediaController.deleteMedia);
router.put('/:id/privacy', mediaController.setPrivacy);

module.exports = router;