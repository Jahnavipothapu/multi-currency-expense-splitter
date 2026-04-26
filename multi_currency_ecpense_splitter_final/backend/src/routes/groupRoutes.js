const express = require('express');
const auth = require('../middleware/authMiddleware');
const {
  createGroup,
  joinGroup,
  listGroups,
  getGroupDetails,
  updateGroupSettings,
  removeMember,
  updateMemberRole,
  deleteGroup,
  addMemberManually,
} = require('../controllers/groupController');

const router = express.Router();
router.use(auth);
router.get('/', listGroups);
router.post('/', createGroup);
router.post('/join', joinGroup);
router.put('/:groupId', updateGroupSettings);
router.delete('/:groupId', deleteGroup);
router.delete('/:groupId/members/:memberId', removeMember);
router.put('/:groupId/members/:memberId/role', updateMemberRole);
// Add member manually (admin only)
router.post('/:groupId/members', addMemberManually);
router.get('/:groupId', getGroupDetails);
module.exports = router;
