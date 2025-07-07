const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/verifyToken');
const {
  sendGroupInvitation,
  acceptInvitation,
  rejectInvitation,
  getPendingInvitations
} = require('../controller/groupInvitationController');

// Send group invitation
router.post('/send', verifyToken, sendGroupInvitation);

// Accept group invitation
router.post('/:invitationId/accept', verifyToken, acceptInvitation);

// Reject group invitation
router.post('/:invitationId/reject', verifyToken, rejectInvitation);

// Get pending invitations for current user
router.get('/pending', verifyToken, getPendingInvitations);

module.exports = router; 