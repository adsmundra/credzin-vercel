const GroupInvitation = require('../models/groupInvitation');
const User = require('../models/User');
const card_group = require('../models/cardGroups');
const card_group_user = require('../models/cardGroupUser');
const notificationService = require('../services/notificationService');

// Send group invitation
exports.sendGroupInvitation = async (req, res) => {
  try {
    const { searchContact, groupId } = req.body;
    const invitedBy = req.id;

    // Validate input
    if (!searchContact || !groupId) {
      return res.status(400).json({
        status: false,
        message: 'Missing required fields: searchContact or groupId'
      });
    }

    // Find the user by contact
    const invitedUser = await User.findOne({ contact: searchContact });
    if (!invitedUser) {
      return res.status(404).json({
        status: false,
        message: 'User not found',
        whatsappInvite: `https://wa.me/${searchContact}?text=Join our card group`
      });
    }

    // Check if user is already in the group
    const existingMember = await card_group_user.findOne({
      user_id: invitedUser._id,
      group_id: groupId
    });
    if (existingMember) {
      return res.status(400).json({
        status: false,
        message: 'User is already a member of this group'
      });
    }

    // Check if invitation already exists
    const existingInvitation = await GroupInvitation.findOne({
      groupId,
      invitedUser: invitedUser._id,
      status: 'pending'
    });
    if (existingInvitation) {
      return res.status(400).json({
        status: false,
        message: 'Invitation already sent to this user'
      });
    }

    // Get group details
    const group = await card_group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        status: false,
        message: 'Group not found'
      });
    }

    // Get inviter details
    const inviter = await User.findById(invitedBy);
    if (!inviter) {
      return res.status(404).json({
        status: false,
        message: 'Inviter not found'
      });
    }

    // Create invitation record
    const invitation = await GroupInvitation.create({
      groupId,
      invitedBy,
      invitedUser: invitedUser._id
    });

    // Send notification to invited user
    const notification = await notificationService.sendNotification(
      invitedUser._id,
      'group_invite',
      'Group Invitation',
      `${inviter.firstName} ${inviter.lastName} has invited you to join the card group "${group.name}"`,
      { inApp: true, email: true, whatsapp: false },
      {
        groupId: groupId,
        groupName: group.name,
        inviterName: `${inviter.firstName} ${inviter.lastName}`,
        invitationId: invitation._id
      },
      [
        {
          label: 'Accept',
          action: 'accept_invitation',
          url: `/api/v1/group/invitation/${invitation._id}/accept`,
          method: 'POST'
        },
        {
          label: 'Reject',
          action: 'reject_invitation',
          url: `/api/v1/group/invitation/${invitation._id}/reject`,
          method: 'POST'
        }
      ]
    );

    // Update invitation with notification ID
    invitation.notificationId = notification.notificationId;
    await invitation.save();

    return res.status(200).json({
      status: true,
      message: 'Invitation sent successfully',
      data: {
        invitationId: invitation._id,
        invitedUser: {
          id: invitedUser._id,
          name: `${invitedUser.firstName} ${invitedUser.lastName}`,
          contact: invitedUser.contact
        }
      }
    });

  } catch (error) {
    console.error('Error sending group invitation:', error);
    return res.status(500).json({
      status: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Accept group invitation
exports.acceptInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.id;
    console.log("userId",userId);

    // Find the invitation
    const invitation = await GroupInvitation.findById(invitationId)
      .populate('groupId')
      .populate('invitedBy')
      .populate('invitedUser');

    console.log("invitation",invitation);

    if (!invitation) {
      return res.status(404).json({
        status: false,
        message: 'Invitation not found'
      });
    }

    // Verify the user is the one invited
    if (invitation.invitedUser._id.toString() !== userId.toString()) {
      return res.status(403).json({
        status: false,
        message: 'You are not authorized to accept this invitation'
      });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        status: false,
        message: 'Invitation has already been responded to'
      });
    }

    // Update invitation status
    invitation.status = 'accepted';
    invitation.respondedAt = new Date();
    await invitation.save();

    // Add user to the group
    const newMember = await card_group_user.create({
      name: invitation.invitedUser.firstName,
      user_id: invitation.invitedUser._id,
      group_id: invitation.groupId._id,
      card_list: invitation.invitedUser.CardAdded
    });

    // Get all group members to notify them
    const groupMembers = await card_group_user.find({ group_id: invitation.groupId._id })
      .populate('user_id', 'firstName lastName');

    // Send notification to all group members about new member
    for (const member of groupMembers) {
      if (member.user_id._id.toString() !== userId.toString()) { // Don't notify the new member
        try {
          await notificationService.sendNotification(
            member.user_id._id,
            'group_join',
            'New Group Member',
            `${invitation.invitedUser.firstName} ${invitation.invitedUser.lastName} has joined the group "${invitation.groupId.name}"`,
            { inApp: true, email: false, whatsapp: false },
            {
              groupId: invitation.groupId._id,
              groupName: invitation.groupId.name,
              newMemberName: `${invitation.invitedUser.firstName} ${invitation.invitedUser.lastName}`,
              newMemberId: invitation.invitedUser._id
            }
          );
        } catch (error) {
          console.error(`Error notifying group member ${member.user_id._id}:`, error);
        }
      }
    }

    // Mark the original invitation notification as read
    if (invitation.notificationId) {
      await notificationService.markAsRead(invitation.notificationId, userId);
    }

    return res.status(200).json({
      status: true,
      message: 'Invitation accepted successfully',
      data: {
        groupId: invitation.groupId._id,
        groupName: invitation.groupId.name,
        memberId: newMember._id
      }
    });

  } catch (error) {
    console.error('Error accepting invitation:', error);
    return res.status(500).json({
      status: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Reject group invitation
exports.rejectInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.id;
    console.log("userId",userId);

    // Find the invitation
    const invitation = await GroupInvitation.findById(invitationId)
      .populate('groupId')
      .populate('invitedBy')
      .populate('invitedUser');

    if (!invitation) {
      return res.status(404).json({
        status: false,
        message: 'Invitation not found'
      });
    }

    // Verify the user is the one invited
    if (invitation.invitedUser._id.toString() !== userId.toString()) {
      return res.status(403).json({
        status: false,
        message: 'You are not authorized to reject this invitation'
      });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        status: false,
        message: 'Invitation has already been responded to'
      });
    }

    // Update invitation status
    invitation.status = 'rejected';
    invitation.respondedAt = new Date();
    await invitation.save();

    // Send notification to the inviter about rejection
    await notificationService.sendNotification(
      invitation.invitedBy._id,
      'group_reject',
      'Invitation Rejected',
      `${invitation.invitedUser.firstName} ${invitation.invitedUser.lastName} has declined your invitation to join the group "${invitation.groupId.name}"`,
      { inApp: true, email: false, whatsapp: false },
      {
        groupId: invitation.groupId._id,
        groupName: invitation.groupId.name,
        rejectedUser: `${invitation.invitedUser.firstName} ${invitation.invitedUser.lastName}`,
        rejectedUserId: invitation.invitedUser._id
      }
    );

    // Mark the original invitation notification as read
    if (invitation.notificationId) {
      await notificationService.markAsRead(invitation.notificationId, userId);
    }

    return res.status(200).json({
      status: true,
      message: 'Invitation rejected successfully'
    });

  } catch (error) {
    console.error('Error rejecting invitation:', error);
    return res.status(500).json({
      status: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get pending invitations for a user
exports.getPendingInvitations = async (req, res) => {
  try {
    const userId = req.id;

    const invitations = await GroupInvitation.find({
      invitedUser: userId,
      status: 'pending'
    })
    .populate('groupId', 'name')
    .populate('invitedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

    return res.status(200).json({
      status: true,
      data: invitations
    });

  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    return res.status(500).json({
      status: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}; 