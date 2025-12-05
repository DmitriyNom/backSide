const Router = require('express');
const router = Router();
const ApiError = require('../error/ApiError');

// Загрузка маршрутизаторов
const routes = [
   { path: '/user', router: require('./userRouter') },
   { path: '/exercise', router: require('./exerciseRouter') },
   { path: '/notes', router: require('./noteRouter') },
   { path: '/noteGroup', router: require('./noteGroupRouter') },
   { path: '/exerciseGroup', router: require('./exerciseGroupRouter') },

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

// Маршрутизаторы
routes.forEach(route => {
   router.use(route.path, route.router);
});

// Обработка несуществующих маршрутов
router.use((req, res, next) => {
   return next(ApiError.notFound("Ресурс не найден"));
});

module.exports = router;
