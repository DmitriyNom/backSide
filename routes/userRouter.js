const Router = require('express');
const router = Router();
const userController = require('../controllers/userController')
const authMIddleware = require('../middleware/AuthMiddleware')

router.post('/registration', userController.registration)
router.get('/', userController.getUsers)
router.post('/login', userController.login)
router.get('/auth', authMIddleware, userController.check)


module.exports = router;