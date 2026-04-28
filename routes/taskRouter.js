// routes/taskRouter.js
const Router = require('express');
const router = new Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/AuthMiddleware');

// Все роуты требуют аутентификации
router.use(authMiddleware);

// ========== ОСНОВНЫЕ CRUD ОПЕРАЦИИ ==========
router.post('/', taskController.createTask);                    // Создать задание
router.get('/', taskController.getMyTasks);                     // Мои задания (с фильтрацией)
router.get('/active', taskController.getActiveTasks);           // Активные задания (дашборд)
router.get('/stats', taskController.getTaskStats);              // Статистика по заданиям
router.get('/expiring', taskController.getExpiringTasks);       // Задания с истекающим сроком
router.get('/assignable-users', taskController.getAssignableUsers); // Список пользователей для создания заданий
router.get('/:id', taskController.getTaskById);                 // Детали задания
router.put('/:id/complete', taskController.completeTask);       // Отметить выполнение
router.put('/:id', taskController.updateTask);                  // Обновить задание
router.delete('/:id', taskController.deleteTask);               // Удалить задание

// ========== РАБОТА С БИБЛИОТЕКОЙ ==========
router.post('/:id/save-to-library', taskController.saveToLibrary); // Сохранить кастомное задание в библиотеку

// ========== РАБОТА С МЕДИА ==========
router.post('/:id/media', taskController.addMedia);             // Добавить медиа к заданию
router.get('/:id/media', taskController.getTaskMedia);          // Получить медиа задания
router.delete('/:id/media/:mediaId', taskController.removeMedia); // Удалить медиа из задания

// ========== БУДУЩИЕ РОУТЫ (ЗАКОММЕНТИРОВАНЫ) ==========
// Раскомментировать при реализации ЭТАПА 6 или ЭТАПА 7

// === ЭТАП 6: Массовые операции и контроль тренера ===
// router.post('/bulk', taskController.bulkCreateTasks);        // Массовое создание заданий для нескольких спортсменов
// router.get('/trainee/:userId', taskController.getTraineeTasks); // Задания конкретного спортсмена (для тренера)

// === ЭТАП 7: Статистика и аналитика ===
// router.get('/calendar', taskController.getTaskCalendar);     // Календарь выполнения (heatmap)
// router.get('/progress/:exerciseId', taskController.getExerciseProgress); // Прогресс по конкретному упражнению (график)

// === ЭТАП 7: Дополнительная аналитика ===
// router.get('/summary/weekly', taskController.getWeeklySummary);    // Недельная сводка
// router.get('/summary/monthly', taskController.getMonthlySummary);  // Месячная сводка
// router.get('/leaderboard', taskController.getLeaderboard);         // Таблица лидеров (по очкам/выполнениям)

module.exports = router;