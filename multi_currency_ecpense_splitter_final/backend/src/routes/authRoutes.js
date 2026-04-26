const express = require('express');
const auth = require('../middleware/authMiddleware');
const { register, login, getProfile, updateProfile, getPersonalSummary } = require('../controllers/authController');

const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getProfile);
router.put('/me', auth, updateProfile);
router.get('/me/summary', auth, getPersonalSummary);
module.exports = router;
