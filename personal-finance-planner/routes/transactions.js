// routes/transactions.js
const express = require('express');
const router = express.Router();
const transactionsController = require('../controllers/transactionsController');

// GET all transactions with pagination and filters
router.get('/', transactionsController.getAllTransactions);

// GET recent transactions
router.get('/recent', transactionsController.getRecentTransactions);

// GET transaction statistics
router.get('/stats', transactionsController.getTransactionStats);

// POST add new transaction
router.post('/add', transactionsController.addTransaction);

// PUT update transaction
router.put('/update/:id', transactionsController.updateTransaction);

// DELETE transaction
router.delete('/delete/:id', transactionsController.deleteTransaction);

// GET transactions by category
router.get('/category/:category', transactionsController.getTransactionsByCategory);

// GET monthly summary
router.get('/monthly-summary', transactionsController.getMonthlySummary);

module.exports = router;