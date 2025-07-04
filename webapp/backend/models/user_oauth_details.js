const mongoose = require("mongoose");

const userOauthSchema = new mongoose.Schema({
  user_email: {
    type: String,
    required: true,
    trim: true,
  },
  access_token: {
    type: String,
    required: true,
    trim: true,
  },
  refresh_token: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  created_at: {
    type: String,
    required: false,
  },
  expiry_date: {
    type: String,
    required: false,
  },
  refresh_token_expires_in: {
    type: String,
  },
});

module.exports = mongoose.model("user_oauth_details", userOauthSchema);
