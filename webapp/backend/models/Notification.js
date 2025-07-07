const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['card_recommendation', 'group_invite', 'group_invite_response', 'card_added', 'card_removed', 'system_alert', 'reminder', 'group_join', 'group_reject'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'read', 'action_required'],
    default: 'pending'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Action buttons for interactive notifications
  actions: {
    type: [{
      label: String,
      action: String,
      url: String,
      method: String
    }],
    default: []
  },
  readAt: {
    type: Date,
    default: null
  },
  sentAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
NotificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Notification", NotificationSchema);