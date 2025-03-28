const Router = require('express');
const router = Router();
const userExerciseController = require('../controllers/userExerciseController')
// const roleMiddleware = require('../middleware/CheckRoleMiddleware')


router.get('/', userExerciseController.getAllExercisesForUser);

router.post('/', userExerciseController.addOneExerciseForUser)


module.exports = router;