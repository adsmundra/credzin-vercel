const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/verifyToken');
const { saveTransaction, getUserTransactions, saveActualReward, saveCalculatedReward } = require('../controller/transactionController');

// Save a new transaction
router.post('/', verifyToken, saveTransaction);

// Save actual reward for a transaction
router.post('/:transactionId/actual-reward', verifyToken, saveActualReward);

// Save calculated reward for a transaction
router.post('/:transactionId/calculated-reward', verifyToken, saveCalculatedReward);

// Fetch all transactions for the authenticated user
router.get('/', verifyToken, getUserTransactions);

module.exports = router; 