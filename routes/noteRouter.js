const Router = require('express');
const { body, param, validationResult } = require('express-validator');
const noteController = require('../controllers/noteController');
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

// ========== СУЩЕСТВУЮЩИЕ МАРШРУТЫ (не трогаем) ==========
router.post('/',
   authMiddleware,
   [
      body('note_name').notEmpty().withMessage('note_name is required'),
      body('note_description').optional().isString(),
      body('note_priority').optional().isIn([1, 2, 3]).withMessage('Invalid priority'),
      body('note_mark').optional().isString()
   ],
   handleValidationErrors,
   noteController.createNote
);

router.get('/', authMiddleware, noteController.getAllNotes);

router.get('/:id', authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   handleValidationErrors,
   noteController.getOneNote
);

router.patch('/:id', authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   [
      body('note_name').optional().notEmpty().withMessage('note_name is required'),
      body('note_description').optional().isString(),
      body('note_priority').optional().isIn([1, 2, 3]).withMessage('Invalid priority'),
      body('note_mark').optional().isString()
   ],
   handleValidationErrors,
   noteController.updateOneNote
);

router.delete('/:id', authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   handleValidationErrors,
   noteController.deleteOneNote
);

// Существующий маршрут для заданий
router.get('/assignments', authMiddleware, noteController.getUserAssignments);

// ========== НОВЫЕ МАРШРУТЫ ДЛЯ ЗАДАНИЙ ==========

// Получить задания, назначенные мне
router.get('/assignments/assigned-to-me',
   authMiddleware,
   noteController.getAssignedToMe
);

// Получить задания, созданные мной (для тренеров)
router.get('/assignments/assigned-by-me',
   authMiddleware,
   noteController.getAssignedByMe
);

// Получить просроченные задания
router.get('/assignments/overdue',
   authMiddleware,
   noteController.getOverdueAssignments
);

// Начать выполнение задания
router.patch('/:id/start',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   handleValidationErrors,
   noteController.startAssignment
);

// Отправить задание на проверку
router.patch('/:id/submit',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   [
      body('submissionComment').optional().isString(),
      body('mediaIds').optional().isArray()
   ],
   handleValidationErrors,
   noteController.submitAssignment
);

// Проверить задание (для тренеров)
router.patch('/:id/review',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   [
      body('reviewComment').optional().isString(),
      body('reviewRating').optional().isInt({ min: 1, max: 5 }),
      body('status').optional().isIn(['reviewed', 'completed'])
   ],
   handleValidationErrors,
   noteController.reviewAssignment
);

// Завершить задание (для личных заданий)
router.patch('/:id/complete',
   authMiddleware,
   param('id').isInt().withMessage('ID должен быть числом'),
   handleValidationErrors,
   noteController.completeAssignment
);

// Получить статистику по заданиям
router.get('/statistics/overview',
   authMiddleware,
   noteController.getAssignmentStatistics
);

module.exports = router;