const Router = require('express');
const router = Router();
const noteController = require('../controllers/noteController');
const roleMiddleware = require('../middleware/CheckRoleMiddleware')

// router.post('/', roleMiddleware('User'), noteController.createNote);
router.post("/", noteController.createNote)
router.get('/', noteController.getAllNotes);
router.get('/:id', noteController.getOneNote);
router.put('/:id', noteController.updateOneNote)
router.delete("/:id", noteController.deleteOneNote)

module.exports = router;