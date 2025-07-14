const express = require('express');
const router = express.Router();
const { cronHandler } = require('../controller/cronJobsLogic');

router.get('/cronjob', cronHandler);

module.exports = router;