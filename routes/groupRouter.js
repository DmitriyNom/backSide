const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middleware/authMiddleware');

// Все роуты требуют аутентификации
router.use(authMiddleware);

// ===== Управление группами =====
router.post('/', groupController.createGroup);                    // POST /api/groups
router.get('/my', groupController.getMyGroups);                   // GET /api/groups/my
router.get('/:id', groupController.getGroupById);                 // GET /api/groups/:id
router.put('/:id', groupController.updateGroup);                  // PUT /api/groups/:id
router.delete('/:id', groupController.deleteGroup);               // DELETE /api/groups/:id

// ===== Управление участниками =====
router.get('/:id/members', groupController.getGroupMembers);      // GET /api/groups/:id/members
router.post('/:id/members', groupController.addMember);           // POST /api/groups/:id/members
router.put('/:id/members/:userId/role', groupController.updateMemberRole); // PUT /api/groups/:id/members/:userId/role
router.delete('/:id/members/:userId', groupController.removeMember); // DELETE /api/groups/:id/members/:userId

// ===== Задания группы =====
router.get('/:id/assignments', groupController.getGroupAssignments); // GET /api/groups/:id/assignments
router.post('/:id/assignments', groupController.createGroupAssignment); // POST /api/groups/:id/assignments

// ===== Статистика =====
router.get('/:id/stats', groupController.getGroupStats);          // GET /api/groups/:id/stats

module.exports = router;