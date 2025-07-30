const express = require('express');
const router = express.Router();



const { verifyToken } = require('../middlewares/verifyToken');
const { validateCards, generateUPI, getSupportedBanks } = require('../controller/BillPayController');
 
router.get("/validate-card",verifyToken, validateCards)
router.post('/generate-upi',verifyToken, generateUPI)
router.get('/banks',verifyToken, getSupportedBanks)
module.exports = router;
