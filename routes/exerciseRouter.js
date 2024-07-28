const Router = require('express');
const router = Router();
const exerciseController = require('../controllers/exerciseController');
const roleMiddleware = require('../middleware/CheckRoleMiddleware')

router.post('/', roleMiddleware('Admin'), exerciseController.createExercise);
router.get('/', exerciseController.getAllExercises);
router.get('/:id', exerciseController.getOneExercise);

module.exports = router;