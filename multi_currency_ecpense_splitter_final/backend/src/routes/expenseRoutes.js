const express = require('express');
const auth = require('../middleware/authMiddleware');
const { addExpense, updateExpense, listGroupExpenses, deleteExpense } = require('../controllers/expenseController');

const router = express.Router();
router.use(auth);
router.post('/', addExpense);
router.put('/:expenseId', updateExpense);
router.delete('/:expenseId', deleteExpense);
router.get('/:groupId', listGroupExpenses);
module.exports = router;
