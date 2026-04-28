// backend/routes/tagRouter.js
const Router = require('express');
const { body, param, query } = require('express-validator');
const tagController = require('../controllers/tagController');
const authMiddleware = require('../middleware/AuthMiddleware');
const validateRequest = require('../middleware/validateRequest');
const router = Router();

// Все маршруты требуют авторизации
router.use(authMiddleware);

// ========== ОСНОВНЫЕ МАРШРУТЫ ==========

// Получить все теги
router.get('/',
   validateRequest,
   tagController.getAllTags
);

// Получить популярные теги
router.get('/popular',
   query('limit').optional().isInt({ min: 1, max: 100 }),
   validateRequest,
   tagController.getPopularTags
);

// Поиск тегов
router.get('/search',
   query('q').optional().isString(),
   query('limit').optional().isInt({ min: 1, max: 50 }),
   validateRequest,
   tagController.searchTags
);

// Получить тег по ID
router.get('/:id',
   param('id').isInt().withMessage('ID должен быть числом'),
   validateRequest,
   tagController.getTagById
);

// Получить тег по имени
router.get('/name/:name',
   param('name').isString().withMessage('Имя тега обязательно'),
   validateRequest,
   tagController.getTagByName
);

// Получить теги упражнения
router.get('/exercise/:exerciseId',
   param('exerciseId').isInt().withMessage('ID упражнения должен быть числом'),
   validateRequest,
   tagController.getTagsByExerciseId
);

// Создать новый тег
router.post('/',
   body('name').notEmpty().withMessage('Название тега обязательно'),
   validateRequest,
   tagController.createTag
);

// Удалить тег (только если не используется)
router.delete('/:id',
   param('id').isInt().withMessage('ID должен быть числом'),
   validateRequest,
   tagController.deleteTag
);

// Очистить неиспользуемые теги
router.delete('/cleanup/all',
   validateRequest,
   tagController.cleanupUnusedTags
);

module.exports = router;