const Router = require('express');
const { body, param, query } = require('express-validator');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/AuthMiddleware');
const upload = require('../middleware/FileMiddleware');

const router = Router();

// ============ СПЕЦИФИЧНЫЕ РОУТЫ (ДОЛЖНЫ ИДТИ ПЕРВЫМИ) ============

// Проверка аутентификации пользователя
router.get('/auth', authMiddleware, userController.check);

// Получение профиля пользователя
router.get('/profile', authMiddleware, userController.getProfile);

// Поиск пользователей
router.get('/search',
   authMiddleware,
   [
      query('query').optional().isString().isLength({ min: 2 }),
      query('role').optional().isIn(['trainer', 'trainee', 'all']),
      query('limit').optional().isInt({ min: 1, max: 100 }),
      query('offset').optional().isInt({ min: 0 })
   ],
   userController.searchUsers
);

// Получить список всех пользователей
router.get('/', authMiddleware, userController.getUsers);

// ============ РОУТЫ С ПАРАМЕТРАМИ ============

// ✅ ONBOARDING ROUTE
router.put('/onboarding',
   authMiddleware,
   [
      body('role').optional().isIn(['trainee', 'trainer', 'skipped']),
      body('training_level').optional().isIn(['beginner', 'amateur', 'advanced', 'professional']),
      body('sport_specialization').optional().isString().isLength({ max: 100 }),
      body('skipped').optional().isBoolean(),
      body('userName').optional().isString().isLength({ min: 2, max: 50 }),
      body('birthDate').optional().isISO8601(),
      body('allow_connections').optional().isBoolean()
   ],
   userController.updateOnboarding
);

// PATCH route для обновления пользователя
router.patch('/:id',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   upload.single('userAvatar'),
   [
      body('email').optional().isEmail(),
      body('userName').optional().notEmpty(),
      body('training_level').optional().isIn(['beginner', 'amateur', 'advanced', 'professional']),
      body('sport_specialization').optional().isString().isLength({ max: 100 })
   ],
   userController.updateUser
);

// Получить пользователя по ID
router.get('/:id',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   userController.getUserById
);

// Удаление пользователя
router.delete('/:id',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   userController.deleteUser
);

// ============ РОУТЫ ДЛЯ МАССОВЫХ ОПЕРАЦИЙ ============

// Получить пользователей по списку ID
router.post('/batch',
   authMiddleware,
   body('userIds').isArray().withMessage('userIds должен быть массивом'),
   body('userIds.*').isInt().withMessage('Каждый ID должен быть числом'),
   userController.getUsersByIds
);

// ============ АУТЕНТИФИКАЦИЯ ============

// Вход пользователя
router.post('/login',
   body('email').isEmail(),
   body('password').notEmpty(),
   userController.login
);

// Регистрация пользователя
router.post('/registration',
   body('email').isEmail(),
   body('password').isLength({ min: 6 }),
   body('userName').notEmpty(),
   userController.registration
);

// Обновление токенов
router.post('/refresh', userController.refresh);

// Выход пользователя
router.post('/logout', authMiddleware, userController.logout);

module.exports = router;