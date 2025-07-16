const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Enum for user card status
const UserCardStatus = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
});

const userCardSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  user_id: {
    type: String,
    required: true,
  },
  generic_card_id: {
    type: String,
    required: true,
  },
  card_nickname: {
    type: String,
    trim: true,
  },
  card_type: {
    type: String,
    required: false,
    trim: true,
  },
  user_card_status: {
    type: String,
    enum: Object.values(UserCardStatus),
    default: UserCardStatus.ACTIVE,
  },
  card_added_date: {
    type: Date,
    default: Date.now,
  },
  card_recommended_for: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
  versionKey: false,
});

// Expose enum
Object.assign(userCardSchema.statics, {
  UserCardStatus,
});

// Add compound unique index to prevent duplicate user cards
userCardSchema.index({ user_id: 1, generic_card_id: 1 }, { unique: true });

module.exports = mongoose.model('user_cards', userCardSchema);
