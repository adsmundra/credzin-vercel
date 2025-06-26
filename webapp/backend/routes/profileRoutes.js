const express = require('express');
const router = express.Router();
const {editProfileController} = require('../controller/profileController.js');
const uploadMiddleware = require('..//middlewares/uploadMiddleware.js');

router.put('/profileEdit', uploadMiddleware, editProfileController);

module.exports = router;
