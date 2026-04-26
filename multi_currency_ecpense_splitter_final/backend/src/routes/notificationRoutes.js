const express = require('express');
const auth = require('../middleware/authMiddleware');
const { listNotifications, markNotificationRead } = require('../controllers/notificationController');

const router = express.Router();
router.use(auth);
router.get('/', listNotifications);
router.patch('/:notificationId/read', markNotificationRead);

module.exports = router;
