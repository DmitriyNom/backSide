const Router = require('express');
const router = Router();
const userRouter = require('./userRouter')
const exerciseRouter = require('./exerciseRouter')
const noteRouter = require('./noteRouter')
const userNotesRouter = require('./userNotesRouter')
const userExerciseRouter = require('./userExerciseRouter')
const noteGroupsRouter = require('./noteGroupsRouter')
const groupOfNotesRouter = require('./groupOfNotesRouter')


router.use('/user', userRouter)
router.use('/exercise', exerciseRouter)
router.use('/note', noteRouter)

router.use('/userNotes', userNotesRouter)
router.use('/userExercise', userExerciseRouter)
router.use('/noteGroups', noteGroupsRouter)
router.use('/groupOfNotes', groupOfNotesRouter)


module.exports = router;