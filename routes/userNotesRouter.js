const Router = require('express');
const router = Router();
const userNotesController = require('../controllers/userNotesController')
// const roleMiddleware = require('../middleware/CheckRoleMiddleware')


router.get('/', userNotesController.getAllNotesForUser);


module.exports = router;