// routes/index.js
const Router = require('express');
const router = Router();
const ApiError = require('../error/ApiError');

// Загрузка маршрутизаторов
const routes = [
   { path: '/user', router: require('./userRouter') },
   { path: '/exercise', router: require('./exerciseRouter') },
   { path: '/tags', router: require('./tagRouter') },
   { path: '/notes', router: require('./noteRouter') },
   { path: '/noteGroup', router: require('./noteGroupRouter') },
   { path: '/exerciseGroup', router: require('./exerciseGroupRouter') },
   { path: '/media', router: require('./mediaRouter') },
   { path: '/connections', router: require('./connectionRouter') },
   { path: '/groups', router: require('./groupRouter') },
   { path: '/friends', router: require('./friendRouter') },
   { path: '/contexts', router: require('./trainingContextRouter') },
   { path: '/tasks', router: require('./taskRouter') },


   // УДАЛЕНО: { path: '/files', router: require('./fileUploadRouter') },

   // { path: '/userNote', router: require('./userNoteRouter') },
   // { path: '/userExercise', router: require('./userExerciseRouter') },
   // { path: '/noteMark', router: require('./noteMarkRouter') },
   // { path: '/exerciseMark', router: require('./exerciseMarkRouter') },
   // { path: '/diaryEntries', router: require('./diaryEntriesRouter') },
   // { path: '/sleep', router: require('./sleepRouter') },
   // { path: '/sleep', router: require('./sleepRouter') },
   // { path: '/nutrition', router: require('./nutritionRouter') },
   // { path: '/workout', router: require('./workoutRouter') },
   // { path: '/workoutExercise', router: require('./workoutExerciseRouter') },
   // { path: '/mood', router: require('./moodRouter') },
   // { path: '/hydration', router: require('./hydrationRouter') },
];

console.log('\n=== ЗАРЕГИСТРИРОВАННЫЕ РОУТЫ ===');
routes.forEach(route => {
   console.log(`✅ /api${route.path} -> ${route.path}Router`);
});
console.log('================================\n');

// Маршрутизаторы
routes.forEach(route => {
   router.use(route.path, route.router);
});

// Логируем все входящие запросы
router.use((req, res, next) => {
   console.log(`📡 Incoming request: ${req.method} ${req.originalUrl}`);
   next();
});

// Обработка несуществующих маршрутов
router.use((req, res, next) => {
   console.log(`❌ 404 NOT FOUND: ${req.method} ${req.originalUrl}`);
   return next(ApiError.notFound("Ресурс не найден"));
});

// Обработка несуществующих маршрутов
router.use((req, res, next) => {
   return next(ApiError.notFound("Ресурс не найден"));
});

module.exports = router;