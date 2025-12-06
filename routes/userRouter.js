const Router = require('express');
const { body, param } = require('express-validator');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/AuthMiddleware');
const upload = require('../middleware/FileMiddleware');

const router = Router();

// ✅ ONBOARDING ROUTE - ОБНОВЛЕННАЯ ВАЛИДАЦИЯ
router.put('/onboarding',
   authMiddleware,
   [
      // ✅ ДОБАВЛЯЕМ 'skipped' в допустимые значения
      body('role').optional().isIn(['trainee', 'trainer', 'skipped']).withMessage('Роль должна быть trainee, trainer или skipped'),
      body('training_level').optional().isIn(['beginner', 'amateur', 'advanced', 'professional']).withMessage('Некорректный уровень тренировок'),
      body('sport_specialization').optional().isString().isLength({ max: 100 }).withMessage('Специализация должна быть строкой до 100 символов'),
      body('skipped').optional().isBoolean().withMessage('Поле skipped должно быть булевым значением'),
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
      body('email').optional().isEmail().withMessage('Введите корректный email'),
      body('userName').optional().notEmpty().withMessage('Имя пользователя обязательно'),
      body('training_level').optional().isIn(['beginner', 'amateur', 'advanced', 'professional']),
      body('sport_specialization').optional().isString().isLength({ max: 100 })
   ],
   userController.updateUser
);

// Получить список всех пользователей
router.get('/', authMiddleware, userController.getUsers);

// Проверка аутентификации пользователя
router.get('/auth', authMiddleware, userController.check);

// Получение профиля пользователя
router.get('/profile', authMiddleware, userController.getProfile);

// Вход пользователя
router.post('/login',
   body('email').isEmail().withMessage('Введите корректный email'),
   body('password').notEmpty().withMessage('Пароль обязателен'),
   userController.login
);

// Регистрация пользователя
router.post('/registration',
   body('email').isEmail().withMessage('Введите корректный email'),
   body('password').isLength({ min: 6 }).withMessage('Пароль должен быть не менее 6 символов'),
   body('userName').notEmpty().withMessage('Имя пользователя обязательно'),
   userController.registration
);

// Удаление пользователя
router.delete('/:id',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   userController.deleteUser
);

// Обновление токенов
router.post('/refresh', userController.refresh);

// Выход пользователя
router.post('/logout', authMiddleware, userController.logout);

module.exports = router;