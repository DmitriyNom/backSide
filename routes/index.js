const Router = require('express');
const router = Router();
const userRouter = require('./userRouter')
const exerciseRouter = require('./exerciseRouter')
const noteRouter = require('./noteRouter')


router.use('/user', userRouter)
router.use('/exercise', exerciseRouter)
router.use('/note', noteRouter)

module.exports = router;