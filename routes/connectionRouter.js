// routes/connectionRouter.js
const Router = require('express');
const connectionController = require('../controllers/connectionController');
const authMiddleware = require('../middleware/AuthMiddleware');

const router = Router();

// ===== ЗАПРОСЫ =====
router.post('/request', authMiddleware, connectionController.sendRequest);
router.post('/request/:requestId/respond', authMiddleware, connectionController.respondToRequest);
router.delete('/request/:requestId/cancel', authMiddleware, connectionController.cancelRequest);

// ===== ПОЛУЧЕНИЕ ЗАПРОСОВ =====
router.get('/requests/incoming', authMiddleware, connectionController.getIncomingRequests);
router.get('/requests/outgoing', authMiddleware, connectionController.getOutgoingRequests);
router.get('/requests/all', authMiddleware, connectionController.getAllRequests);
router.get('/requests/count', authMiddleware, connectionController.getPendingRequestsCount);

// ===== ПОДТВЕРЖДЕННЫЕ СВЯЗИ =====
router.get('/trainees', authMiddleware, connectionController.getMyTrainees);
router.get('/trainers', authMiddleware, connectionController.getMyTrainers);
router.get('/all', authMiddleware, connectionController.getAllConnections);
router.delete('/:userId', authMiddleware, connectionController.removeConnection);

// ===== ПОИСК И РЕКОМЕНДАЦИИ =====
router.get('/search/trainers', authMiddleware, connectionController.searchTrainers);
router.get('/search/trainees', authMiddleware, connectionController.searchTrainees);
router.get('/recommendations/trainers', authMiddleware, connectionController.getTrainerRecommendations);

// ===== СТАТУСЫ И СТАТИСТИКА =====
router.get('/status/:targetUserId', authMiddleware, connectionController.getConnectionStatus);
router.get('/stats', authMiddleware, connectionController.getConnectionStats);

module.exports = router;