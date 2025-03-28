const Router = require('express');
const router = Router();
const userNoteController = require('../controllers/userNoteController')
// const roleMiddleware = require('../middleware/CheckRoleMiddleware')


router.get('/', userNoteController.getAllNotesForUser);

router.post('/', userNoteController.addOneNoteForUser)


module.exports = router;