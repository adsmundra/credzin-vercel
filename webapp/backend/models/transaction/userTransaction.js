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
  }
}, { _id: false });

const userTransactionMetadataSchema = new mongoose.Schema({
  messageId: {
    type: String, // Can be from various sources, not necessarily a mongoose ID
  },
  categorySource: {
    type: String,
    trim: true,
  }
}, { _id: false });

const userTransactionSchema = new mongoose.Schema({
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'credit_cards', // Assuming this is your card model
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  dateTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  amount: {
    type: amountSchema,
    required: true,
  },
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant', // You may need to create a Merchant model
    default: null,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  metadata: {
    type: userTransactionMetadataSchema,
    default: {},
  },
}, {
  timestamps: true,
});

userTransactionSchema.index({ userId: 1, dateTime: -1 });

module.exports = mongoose.model("UserTransaction", userTransactionSchema); 