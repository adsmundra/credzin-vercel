const express = require("express");
const passport = require("passport");
const router = express.Router();
const { googleLoginSuccess } = require("../controller/Auth");

// Google login init
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  googleLoginSuccess
);

module.exports = router;