const Router = require('express');
const router = Router();
const noteController = require('../controllers/noteController');
const roleMiddleware = require('../middleware/CheckRoleMiddleware')

router.post('/', roleMiddleware('User'), noteController.createNote);
router.get('/', noteController.getAllNotes);
router.get('/:id', noteController.getOneNote);

module.exports = router;