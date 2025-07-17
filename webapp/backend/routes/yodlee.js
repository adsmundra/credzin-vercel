const express = require('express');
const router = express.Router();



const { verifyToken } = require('../middlewares/verifyToken');
const { getYodleeAccessToken, registerYodleeUser,loginYodleeSandboxUser, getFastLinkToken} = require('../controller/Yodlee');
 
router.post('/AccessToken',getYodleeAccessToken)
router.post('/register', verifyToken,registerYodleeUser)
router.post('/login',loginYodleeSandboxUser);
router.get('/fastlink',getFastLinkToken)

module.exports = router;