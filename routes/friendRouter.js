// routes/friendRouter.js
const Router = require('express');
const router = Router();
const authMiddleware = require('../middleware/authMiddleware');
const FriendController = require('../controllers/friendController');

// Логируем, что роутер загружен
console.log('✅ friendRouter загружен');

// Все маршруты требуют аутентификации
router.use(authMiddleware);

// Логируем все запросы к /api/friends
router.use((req, res, next) => {
   console.log(`👥 FriendRouter: ${req.method} ${req.originalUrl}`);
   next();
});

// ============ УПРАВЛЕНИЕ ЗАПРОСАМИ ============
router.post('/request', FriendController.sendRequest);
router.put('/request/:requestId', FriendController.respondToRequest);
router.delete('/request/:requestId', FriendController.cancelRequest);
router.get('/requests', FriendController.getRequests);
router.get('/requests/count', FriendController.getPendingRequestsCount);

// ============ УПРАВЛЕНИЕ ДРУЗЬЯМИ ============
router.get('/', FriendController.getFriends);
router.delete('/:friendId', FriendController.removeFriend);
router.get('/status/:targetUserId', FriendController.getFriendStatus);
router.get('/check/:targetUserId', FriendController.checkIsFriend);
router.get('/stats', FriendController.getFriendStats);

// ============ ПОИСК И РЕКОМЕНДАЦИИ ============
router.get('/search', FriendController.searchFriends);
router.get('/mutual/:targetUserId', FriendController.getMutualFriends);
router.get('/recommendations', FriendController.getRecommendations);

// ============ БЛОКИРОВКИ ============
router.post('/:userId/block', FriendController.blockUser);
router.delete('/:userId/block', FriendController.unblockUser);
router.get('/blocked', FriendController.getBlockedUsers);

// ============ ДРУЗЬЯ ПОЛЬЗОВАТЕЛЯ (для просмотра) ============
router.get('/user/:userId', FriendController.getUserFriends);

module.exports = router;