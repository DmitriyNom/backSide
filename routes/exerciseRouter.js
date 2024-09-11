const Router = require('express');
const router = Router();
const exerciseController = require('../controllers/exerciseController');
const roleMiddleware = require('../middleware/CheckRoleMiddleware')

router.post('/', exerciseController.createExercise);
// router.post('/', roleMiddleware('Admin'), exerciseController.createExercise);

router.delete('/:id', exerciseController.deleteOneExercise)
router.get('/', exerciseController.getAllExercises);
router.get('/:id', exerciseController.getOneExercise);

module.exports = router;