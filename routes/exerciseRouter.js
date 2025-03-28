const Router = require('express');
const router = Router();
const exerciseController = require('../controllers/exerciseController');
const roleMiddleware = require('../middleware/CheckRoleMiddleware')


//GET
router.get('/', exerciseController.getAllExercises);
router.get('/:id', exerciseController.getOneExercise);


//POST
router.post('/', exerciseController.createExercise);
// router.post('/', roleMiddleware('Admin'), exerciseController.createExercise);

//PUT
router.put('/:id', exerciseController.updateOneExercise)

//DELETE
router.delete('/:id', exerciseController.deleteOneExercise)


module.exports = router;