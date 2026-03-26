// routes/trainingContextRouter.js
const Router = require('express');
const router = Router();
const authMiddleware = require('../middleware/authMiddleware');
const TrainingContextController = require('../controllers/trainingContextController');

// Все маршруты требуют аутентификации
router.use(authMiddleware);

// ============ КОНТЕКСТЫ С ДРУЗЬЯМИ ============

/**
 * @route   POST /api/friends/:friendId/contexts
 * @desc    Создать контекст тренировки с другом
 * @access  Private
 */
router.post('/friends/:friendId/contexts', TrainingContextController.createContext);

/**
 * @route   GET /api/friends/:friendId/contexts
 * @desc    Получить контексты тренировки с конкретным другом
 * @access  Private
 */
router.get('/friends/:friendId/contexts', TrainingContextController.getContextsWithFriend);

/**
 * @route   GET /api/friends/:friendId/available-sports
 * @desc    Получить доступные виды спорта для контекста с другом
 * @access  Private
 */
router.get('/friends/:friendId/available-sports', TrainingContextController.getAvailableSports);

// ============ ВСЕ КОНТЕКСТЫ ПОЛЬЗОВАТЕЛЯ ============

/**
 * @route   GET /api/contexts
 * @desc    Получить все мои контексты тренировок
 * @access  Private
 */
router.get('/', TrainingContextController.getAllMyContexts);

/**
 * @route   GET /api/contexts/trainer
 * @desc    Получить контексты, где я тренер
 * @access  Private
 */
router.get('/trainer', TrainingContextController.getContextsAsTrainer);

/**
 * @route   GET /api/contexts/trainee
 * @desc    Получить контексты, где я ученик
 * @access  Private
 */
router.get('/trainee', TrainingContextController.getContextsAsTrainee);

/**
 * @route   GET /api/contexts/active
 * @desc    Получить активные контексты
 * @access  Private
 */
router.get('/active', TrainingContextController.getActiveContexts);

/**
 * @route   GET /api/contexts/stats
 * @desc    Получить статистику по контекстам
 * @access  Private
 */
router.get('/stats', TrainingContextController.getContextStats);

/**
 * @route   GET /api/contexts/sport/:sport
 * @desc    Получить контексты по виду спорта
 * @access  Private
 */
router.get('/sport/:sport', TrainingContextController.getContextsBySport);

// ============ КОНКРЕТНЫЙ КОНТЕКСТ ============

/**
 * @route   GET /api/contexts/:contextId
 * @desc    Получить контекст по ID
 * @access  Private
 */
router.get('/:contextId', TrainingContextController.getContextById);

/**
 * @route   GET /api/contexts/:contextId/check-access
 * @desc    Проверить доступ к контексту
 * @access  Private
 */
router.get('/:contextId/check-access', TrainingContextController.checkAccess);

// ============ УПРАВЛЕНИЕ СТАТУСОМ ============

/**
 * @route   PUT /api/contexts/:contextId/status
 * @desc    Обновить статус контекста
 * @access  Private
 */
router.put('/:contextId/status', TrainingContextController.updateContextStatus);

/**
 * @route   POST /api/contexts/:contextId/end
 * @desc    Завершить контекст тренировки
 * @access  Private
 */
router.post('/:contextId/end', TrainingContextController.endContext);

/**
 * @route   POST /api/contexts/:contextId/pause
 * @desc    Приостановить контекст тренировки
 * @access  Private
 */
router.post('/:contextId/pause', TrainingContextController.pauseContext);

/**
 * @route   POST /api/contexts/:contextId/resume
 * @desc    Возобновить контекст тренировки
 * @access  Private
 */
router.post('/:contextId/resume', TrainingContextController.resumeContext);

module.exports = router;