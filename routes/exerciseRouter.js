// backend/routes/exerciseRouter.js
const Router = require('express');
const { body, param, query } = require('express-validator');
const exerciseController = require('../controllers/exerciseController');
const roleMiddleware = require('../middleware/CheckRoleMiddleware');
const authMiddleware = require('../middleware/AuthMiddleware');
const validateRequest = require('../middleware/validateRequest');
const router = Router();

// ========== БАЗОВЫЕ CRUD МАРШРУТЫ ==========

// Получить все упражнения (с учетом прав доступа)
router.get('/',
   authMiddleware,
   query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit должен быть от 1 до 100'),
   query('page').optional().isInt({ min: 1 }).withMessage('Page должен быть положительным числом'),
   query('sort').optional().isString(),
   query('order').optional().isIn(['ASC', 'DESC']),
   query('search').optional().isString(),
   validateRequest,
   exerciseController.getAllExercises
);

// Получить упражнения, которыми поделились со мной
router.get('/shared/with-me',
   authMiddleware,
   query('limit').optional().isInt({ min: 1, max: 100 }),
   query('page').optional().isInt({ min: 1 }),
   validateRequest,
   exerciseController.getSharedWithMe
);

// Поиск упражнений
router.get('/search',
   authMiddleware,
   query('q').optional().isString(),
   query('tags').optional().isString(),
   query('limit').optional().isInt({ min: 1, max: 100 }),
   query('page').optional().isInt({ min: 1 }),
   validateRequest,
   exerciseController.searchExercises
);

// Получить популярные теги
router.get('/tags/popular',
   authMiddleware,
   query('limit').optional().isInt({ min: 1, max: 50 }),
   validateRequest,
   exerciseController.getPopularTags
);

// Получить упражнение по ID (с деталями)
router.get('/:id',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   validateRequest,
   exerciseController.getOneExercise
);

// Создать новое упражнение (с тегами и медиа)
router.post('/',
   authMiddleware,
   body('title').notEmpty().withMessage('Название упражнения обязательно'),
   body('description').optional().isString(),
   body('tags').optional().isArray(),
   body('media_ids').optional().isArray(),
   body('is_public').optional().isBoolean(),
   validateRequest,
   exerciseController.createExercise
);

// Обновить упражнение (с тегами и медиа)
router.put('/:id',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   body('title').optional().notEmpty(),
   body('description').optional().isString(),
   body('is_public').optional().isBoolean(),
   body('tags').optional().isArray(),
   body('media_ids').optional().isArray(),
   validateRequest,
   exerciseController.updateOneExercise
);

// Удалить упражнение (каскадно)
router.delete('/:id',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   validateRequest,
   exerciseController.deleteOneExercise
);

// Копировать упражнение
router.post('/:id/copy',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   validateRequest,
   exerciseController.copyExercise
);

// Увеличить счетчик использования
router.post('/:id/usage',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   validateRequest,
   exerciseController.incrementUsage
);

// ========== МАРШРУТЫ ДЛЯ ТЕГОВ ==========

// Получить теги упражнения
router.get('/:id/tags',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   validateRequest,
   exerciseController.getExerciseTags
);

// Обновить теги упражнения
router.put('/:id/tags',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   body('tags').isArray().withMessage('Теги должны быть переданы массивом'),
   validateRequest,
   exerciseController.updateExerciseTags
);

// ========== МАРШРУТЫ ДЛЯ УПРАВЛЕНИЯ ДОСТУПОМ ==========

// Поделиться упражнением с пользователем
router.post('/:id/share',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   body('target_user_id').isInt().withMessage('ID пользователя должен быть числом'),
   body('access_level').optional().isIn(['view', 'use', 'edit']),
   body('expires_at').optional().isISO8601().withMessage('Неверный формат даты'),
   validateRequest,
   exerciseController.shareExercise
);

// Отозвать доступ у пользователя
router.delete('/:id/access',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   body('target_user_id').isInt().withMessage('ID пользователя должен быть числом'),
   validateRequest,
   exerciseController.revokeAccess
);

// Получить список пользователей с доступом
router.get('/:id/access',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   query('limit').optional().isInt({ min: 1, max: 100 }),
   query('offset').optional().isInt({ min: 0 }),
   query('status').optional().isIn(['active', 'revoked', 'expired']),
   validateRequest,
   exerciseController.getExerciseAccessList
);

// Обновить уровень доступа пользователя
router.put('/:id/access-level',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   body('target_user_id').isInt().withMessage('ID пользователя должен быть числом'),
   body('access_level').isIn(['view', 'use', 'edit']).withMessage('Некорректный уровень доступа'),
   validateRequest,
   exerciseController.updateAccessLevel
);

// ========== LEGACY МАРШРУТЫ (для обратной совместимости) ==========

// Старый метод создания (для обратной совместимости)
router.post('/legacy',
   authMiddleware,
   body('exercise_name').notEmpty().withMessage('Name is required'),
   body('exercise_description').optional().isString(),
   validateRequest,
   exerciseController.createExerciseLegacy
);

// Старый метод обновления PATCH
router.patch('/:id',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   body('exercise_name').optional().notEmpty(),
   body('exercise_description').optional().isString(),
   validateRequest,
   exerciseController.updateOneExercise
);

module.exports = router;