const mongoose = require("mongoose");

const amountSchema = new mongoose.Schema({
  value: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
    default: 'INR',
    trim: true,
    uppercase: true,
  }
}, { timestamps: true });

module.exports = amountSchema; 