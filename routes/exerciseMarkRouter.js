const Router = require('express');
const exerciseMarkController = require('../controllers/exerciseMarkController');
const router = Router();
// const roleMiddleware = require('../middleware/CheckRoleMiddleware')


router.get('/', exerciseMarkController.getAllMarks);
router.get('/:id', exerciseMarkController.getOneMark);


router.post('/', exerciseMarkController.createOneMark)

router.put('/:id', exerciseMarkController.updateOneMark)

router.delete('/:id', exerciseMarkController.deleteOneMark)

module.exports = router;