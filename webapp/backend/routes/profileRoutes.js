const express = require('express');
const router = express.Router();
const { updateProfile } = require('../controller/profileController');
const { verifyToken } = require('../middlewares/verifyToken');
const { uploadProfilePic } = require('../middlewares/uploadMiddleware');

// Profile update route
router.post('/profileEdit', verifyToken, uploadProfilePic, updateProfile);


module.exports= router
