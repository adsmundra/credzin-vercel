const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const AmountSchema = new Schema({
  value: Number,
  currency: String
}, { _id: false });

const UserCardDetailsSchema = new Schema({
  _id: {
    type: String,
    default: () => uuidv4(),
  },
  user_card_id: {
    type: String,
    ref: 'user_cards',
    required: true,
  },
  name_on_card: {
    type: String,
    default: null,
  },
  card_number: {
    type: String,
    default: null, // Should be encrypted when set
  },
  card_expiry_date: {
    type: String,
    default: null,
  },
  amount: {
    type: AmountSchema,
    default: null,
  }
}, {
  timestamps: true,
});

// Add unique index to prevent duplicate user card details
UserCardDetailsSchema.index({ user_card_id: 1 }, { unique: true });

module.exports = mongoose.model('user_card_details', UserCardDetailsSchema); 