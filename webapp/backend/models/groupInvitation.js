const mongoose = require("mongoose");

const groupInvitationSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'card_group',
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  notificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date,
    default: null
  }
});

// Index for efficient queries
groupInvitationSchema.index({ invitedUser: 1, status: 1 });
groupInvitationSchema.index({ groupId: 1, invitedUser: 1 }, { unique: true });

module.exports = mongoose.model("GroupInvitation", groupInvitationSchema); 