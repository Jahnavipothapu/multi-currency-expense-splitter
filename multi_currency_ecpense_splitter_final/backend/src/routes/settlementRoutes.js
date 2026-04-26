const express = require('express');
const auth = require('../middleware/authMiddleware');
const { completeSettlement, getSettlementHistory } = require('../controllers/settlementController');

const router = express.Router();
router.use(auth);
router.post('/complete', completeSettlement);
router.get('/history/:groupId', getSettlementHistory);

module.exports = router;
