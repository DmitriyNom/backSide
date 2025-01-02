const Router = require('express');
const router = Router();
const noteGroupsController = require('../controllers/noteGroupsController')
// const roleMiddleware = require('../middleware/CheckRoleMiddleware')


router.get('/', noteGroupsController.getAllGroupsForNotes);
router.get('/:id', noteGroupsController.getOneGroupForNotes);
router.post('/', noteGroupsController.createOneGroupForNote)
router.put('/:id', noteGroupsController.updateOneGroupForNote)
router.delete("/:id", noteGroupsController.deleteOneGroupForNote)

module.exports = router;