const express = require('express');
const router = express.Router();
const { uploadProfilePicture } = require('../controller/profileController');
const { verifyToken } = require('../middlewares/verifyToken');

// Profile update route
// router.post('/profileEdit', profileEdit, uploadProfilePic, updateProfile);
router.put("/update",verifyToken,uploadProfilePicture)



module.exports= router
