const Router = require('express');
const { body, param, validationResult } = require('express-validator');  // Добавлен validationResult
const noteController = require('../controllers/noteController');
const roleMiddleware = require('../middleware/CheckRoleMiddleware');
const authMiddleware = require('../middleware/AuthMiddleware');

const router = Router();

// Middleware для обработки ошибок валидации
const handleValidationErrors = (req, res, next) => {
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
   }
   next();
};

// Создать новую заметку
router.post('/',
   authMiddleware,
   [
      body('note_name').notEmpty().withMessage('note_name is required'),  // Изменено с 'title' на 'note_name'
      body('note_description').optional().isString(),
      body('note_priority').optional().isIn([1, 2, 3]).withMessage('Invalid priority'),
      body('note_mark').optional().isString()
   ],
   handleValidationErrors,
   noteController.createNote
);

// Получить все заметки
router.get('/', authMiddleware, noteController.getAllNotes);

// Получить заметку по ID
router.get('/:id', authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   handleValidationErrors,
   noteController.getOneNote
);

// Обновить заметку по ID
router.patch('/:id', authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   [
      body('note_name').optional().notEmpty().withMessage('note_name is required'),  // Изменено
      body('note_description').optional().isString(),
      body('note_priority').optional().isIn([1, 2, 3]).withMessage('Invalid priority'),
      body('note_mark').optional().isString()
   ],
   handleValidationErrors,
   noteController.updateOneNote
);

// Удалить заметку по ID
router.delete('/:id', authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   handleValidationErrors,
   noteController.deleteOneNote
);

module.exports = router;
