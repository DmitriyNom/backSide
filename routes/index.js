const Router = require('express');
const router = Router();
const userRouter = require('./userRouter')
const exerciseRouter = require('./exerciseRouter')
const noteRouter = require('./noteRouter')
const userNoteRouter = require('./userNoteRouter')
const userExerciseRouter = require('./userExerciseRouter')
// const noteGroupsRouter = require('./noteGroupsRouter')
// const groupOfNotesRouter = require('./groupOfNotesRouter')
const noteMarkRouter = require('./noteMarkRouter')
const exerciseMarkRouter = require('./exerciseMarkRouter');
const ApiError = require('../error/ApiError');


router.use('/user', userRouter)
router.use('/exercise', exerciseRouter)
router.use('/note', noteRouter)

router.use('/userNote', userNoteRouter)
router.use('/userExercise', userExerciseRouter)
router.use('/noteMark', noteMarkRouter)
router.use('/exerciseMark', exerciseMarkRouter)

router.use((req, res, next) => {
   return next(ApiError.notFound("Ресурс не найден"))
});



module.exports = router;