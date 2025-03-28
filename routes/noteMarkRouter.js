const Router = require('express');
const router = Router();
const noteMarkController = require('../controllers/noteMarkController')
// const roleMiddleware = require('../middleware/CheckRoleMiddleware')


router.get('/', noteMarkController.getAllMarksForNote)
router.get('/:id', noteMarkController.getOneMarkForNote)

router.post('/', noteMarkController.createOneMarkForNote)

router.put('/:id', noteMarkController.updateOneMarkForNote)

router.delete("/:id", noteMarkController.deleteOneMarkForNote)

module.exports = router;