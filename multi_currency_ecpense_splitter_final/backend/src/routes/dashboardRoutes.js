const express = require('express');
const auth = require('../middleware/authMiddleware');
const { getGroupDashboard } = require('../controllers/dashboardController');

const router = express.Router();
router.use(auth);
router.get('/:groupId', getGroupDashboard);
module.exports = router;
