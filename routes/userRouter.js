const Router = require('express');
const router = Router();
const userController = require('../controllers/userController')
const authMiddleware = require('../middleware/AuthMiddleware')

//GET

router.get('/', userController.getUsers) //Смотрим, сохраняет ли
router.get('/auth', authMiddleware, userController.check)
// router.get('/profile', userController.getUserProfile)

//POST

router.post('/login', userController.login)
router.post('/regist', userController.registration)
// router.post('/profile', userController.setUserProfile)


module.exports = router;