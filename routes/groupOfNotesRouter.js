const Router = require('express');
const groupOfNotesController = require('../controllers/groupOfNotesController');
const router = Router();
// const roleMiddleware = require('../middleware/CheckRoleMiddleware')


router.get('/', groupOfNotesController.getAllGroupsOfNotes);


module.exports = router;