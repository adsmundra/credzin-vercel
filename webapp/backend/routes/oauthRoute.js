const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/verifyToken");
const { getAuthUrl, oauthCallback, fetchGmailMessages } = require("../controller/useroauthcontroller");

// Protected route for getting auth URL
router.get("/get_auth_url", getAuthUrl);

// Public route for OAuth callback
router.get("/oauth2callback", oauthCallback);

// Protected route for fetching Gmail messages
router.get("/gmail/messages", fetchGmailMessages);

module.exports = router;