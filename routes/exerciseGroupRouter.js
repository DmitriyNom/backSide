const Router = require('express');
const { body, param } = require('express-validator');
const exerciseGroupController = require('../controllers/exerciseGroupController');
const roleMiddleware = require('../middleware/CheckRoleMiddleware');
const authMiddleware = require('../middleware/AuthMiddleware');

const router = Router();

// Создать новую группу упражнений
router.post('/',
   // roleMiddleware('User'), // Раскомментируйте при необходимости проверки роли
   authMiddleware,
   body('group_name').notEmpty().withMessage('group_name is required'),
   body('group_description').optional().isString(),
   body('label_color').optional().isString().isLength({ min: 4, max: 7 }).withMessage('label_color должен быть строкой в формате цвета, например "#FFFFFF"'),
   exerciseGroupController.createExerciseGroup
);

// Получить все группы упражнений
router.get('/', authMiddleware, exerciseGroupController.getAllExerciseGroups);

// Получить группу упражнений по ID
router.get('/:id', authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   exerciseGroupController.getOneExerciseGroup
);

// Обновить группу упражнений по ID
router.patch('/:id', authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   body('group_name').optional().notEmpty().withMessage('group_name cannot be empty'),
   body('group_description').optional().isString(),
   body('label_color').optional().isString().isLength({ min: 4, max: 7 }).withMessage('label_color должен быть строкой в формате цвета, например "#FFFFFF"'),
   exerciseGroupController.updateOneExerciseGroup
);

// Удалить группу упражнений по ID
router.delete('/:id', authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   exerciseGroupController.deleteOneExerciseGroup
);

module.exports = router;
