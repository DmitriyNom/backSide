const Router = require('express');
const router = Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/AuthMiddleware')
const upload = require('../middleware/FileMiddleware')

//GET

router.get('/', userController.getUsers) //Смотрим, сохраняет ли
router.get('/auth', authMiddleware, userController.check)
// router.get('/profile', userController.getUserProfile)

//POST

router.post('/login', userController.login)
router.post('/regist', userController.registration)

//PUT
// router.put('/:id', userController.updateUser)
router.put('/:id', upload.single('userAvatar'), userController.updateUser)

// router.post('/profile', userController.setUserProfile)


//DELETE
router.delete('/:id', userController.deleteUser)


module.exports = router;