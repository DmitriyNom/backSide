const Router = require('express');
const { body, param } = require('express-validator');
const exerciseController = require('../controllers/exerciseController');
const roleMiddleware = require('../middleware/CheckRoleMiddleware');
const authMiddleware = require('../middleware/AuthMiddleware')
const router = Router();

// Получить все упражнения
router.get('/', authMiddleware, exerciseController.getAllExercises);

// Получить упражнение по ID
router.get('/:id',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'), // Валидация ID
   exerciseController.getOneExercise
);

// Создать новое упражнение
router.post('/',
   authMiddleware,
   body('name').notEmpty().withMessage('Name is required'), // Валидация имени упражнения
   body('description').optional().isString().withMessage('Description must be a string'), // Валидация описания
   // roleMiddleware('Admin'), // Проверка роли
   exerciseController.createExercise
);

// Обновить упражнение по ID
router.patch('/:id',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'), // Валидация ID
   body('name').optional().notEmpty().withMessage('Name is required'), // Валидация имени упражнения
   body('description').optional().isString().withMessage('Description must be a string'), // Валидация описания
   exerciseController.updateOneExercise
);

// Удалить упражнение по ID
router.delete('/:id',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'), // Валидация ID
   // roleMiddleware('Admin'), // Проверка роли
   exerciseController.deleteOneExercise
);

module.exports = router;
