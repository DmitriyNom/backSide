const Router = require('express');
const { body, param } = require('express-validator');
const noteGroupController = require('../controllers/noteGroupController');
const roleMiddleware = require('../middleware/CheckRoleMiddleware');
const authMiddleware = require('../middleware/AuthMiddleware');

const router = Router();

// Создать новую группу заметок
router.post('/',
   // roleMiddleware('User'), // Раскомментируйте при необходимости проверки роли
   authMiddleware,
   body('group_name').notEmpty().withMessage('group_name is required'),
   body('group_description').optional().isString(),
   body('label_color').optional().isString().isLength({ min: 4, max: 7 }).withMessage('label_color должен быть строкой в формате цвета, например "#FFFFFF"'),
   noteGroupController.createNoteGroup
);

// Получить все группы заметок
router.get('/', authMiddleware, noteGroupController.getAllNoteGroups);

// Получить группу заметок по ID
router.get('/:id', authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   noteGroupController.getOneNoteGroup
);

// Обновить группу заметок по ID
router.patch('/:id', authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   body('group_name').optional().notEmpty().withMessage('group_name cannot be empty'),
   body('group_description').optional().isString(),
   body('label_color').optional().isString().isLength({ min: 4, max: 7 }).withMessage('label_color должен быть строкой в формате цвета, например "#FFFFFF"'),
   noteGroupController.updateOneNoteGroup
);

// Удалить группу заметок по ID
router.delete('/:id', authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   noteGroupController.deleteOneNoteGroup
);

module.exports = router;
