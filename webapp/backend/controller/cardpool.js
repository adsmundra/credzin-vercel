const card_group_user = require('../models/cardGroupUser')
const card_group =  require('../models/cardGroups');
const User= require("../models/User")
const card = require("../models/card");
const cardGroupUser = require('../models/cardGroupUser')
const notificationService = require('../services/notificationService');

 exports.createCardGroup=async(req, res)=>{
    try{
        const adminId =  req.id
        const {groupName} = req.body
        
        const user = await User.find({_id:adminId})
        const newGroup= await card_group.create({
            name:groupName,
            admin:adminId,
            created_at:new Date()
        });
        
        const newCardGroupUser= await card_group_user.create({
            name:newGroup.name,
            user_id:adminId,
            group_id:newGroup._id,
            card_list:user.CardAdded
        })
        
        return res.status(200).json({
            data:newGroup
        })
    }catch(error){
        return res.status(400).json({
            status: "fail",
            message: err.message
        });
    }
 }
 
exports.getAllCard = async (req, res) => {
    try {
        const userId = req.id;

        // Find all group memberships for the user and populate user_id
        const docs = await card_group_user
            .find({ user_id: userId })
            .populate('user_id', 'name email profilePic') // Populate user details (adjust fields as needed)
            .lean();

        const groupIds = docs.map(doc => doc.group_id);

        // Get users for each group and populate user_id and card_list
        const usersByGroup = {};
        for (const groupId of groupIds) {
            usersByGroup[groupId] = await card_group_user
                .find({ group_id: groupId })
                .populate('user_id', 'name email profilePic') // Populate user details
                .populate('card_list') // Populate credit card details
                .lean();
        }

        // Get group details and populate admin
        const groups = await card_group
            .find({ _id: { $in: groupIds } })
            .populate('admin', 'name email profilePic') // Populate admin details
            .lean();

        // Combine all the data
        const response = groups.map(group => ({
            groupId: group._id,
            groupName: group.name,
            admin: group.admin,
            created_at: group.created_at,
            members: usersByGroup[group._id] || []
        }));

        return res.status(200).json({
            status: true,
            data: response
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: err.message || "Network error"
        });
    }
};

exports.getGroupWithMembersAndCards=async(req, res) => {
  try {
    const { groupId } = req.params;
    // console.log('AASHIRWAD ',groupId)

    const groupMembers = await card_group_user.find({ group_id:groupId })
      .populate({
        path: 'user_id',
        select: 'firstName lastName email CardAdded',
        populate: {
          path: 'CardAdded',
          model: 'credit_cards'
        }
      })
      .populate({
        path: 'card_list',
        model: 'credit_cards'
      });

    return res.status(200).json({
      success: true,
      groupMembers
    });
  } catch (error) {
    console.error("Error fetching group details:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};
// exports.removeTheUserFromGroup=async(req,res)=>{
//     try{
//         const userId= req.body;
//         const groupId= req.params

//         await card_group_user.findOneAndDelete({
//             user_id:userId,
//             group_id:groupId
//         })
//         return res.status(200).json({
//             status:true,
//             message:'user deleted',

//         })
//     }catch(error){
//         return res.status(500).json({
//             status:false,
//             message:'Network Error'
//         })

//     }
// }
exports.getDistinctGroupsForUser = async (req, res) => {
    try {
        const userId = req.id;

        const cardGroups = await card_group_user.find({ user_id: userId }).distinct('group_id');

        // Fetch details of each group
        const groups = await card_group.find({ _id: { $in: cardGroups } })
        return res.status(200).json({
            status: true,
            data: groups
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: err.message || "Network error"
        });
    }
}
exports.addUserToGroup = async (req, res) => {
    try {
        const { searchContact, groupId } = req.body;
        const userId = req.id; // Authenticated user ID

        // Validate input
        if (!searchContact || !groupId) {
            return res.status(400).json({
                status: false,
                message: 'Missing required fields: searchContact or groupId'
            });
        }

        // Find the user by contact
        const user = await User.findOne({ contact: searchContact });
        if (!user) {
            return res.status(404).json({
                status: false,
                message: 'User not found',
                whatsappInvite: `https://wa.me/${searchContact}?text=Join our card group`
            });
        }

        // Check if user is already in the group
        const existingMember = await card_group_user.findOne({
            user_id: user._id,
            group_id: groupId
        });
        if (existingMember) {
            return res.status(400).json({
                status: false,
                message: 'User is already a member of this group'
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
        const inviter = await User.findById(userId);
        if (!inviter) {
            return res.status(404).json({
                status: false,
                message: 'Inviter not found'
            });
        }

        // Import the GroupInvitation model
        const GroupInvitation = require('../models/groupInvitation');

        // Check if invitation already exists
        const existingInvitation = await GroupInvitation.findOne({
            groupId,
            invitedUser: user._id,
            status: 'pending'
        });
        if (existingInvitation) {
            return res.status(400).json({
                status: false,
                message: 'Invitation already sent to this user'
            });
        }

        // Create invitation record
        const invitation = await GroupInvitation.create({
            groupId,
            invitedBy: userId,
            invitedUser: user._id
        });

        // Send notification to invited user with action buttons
        const notification = await notificationService.sendNotification(
            user._id,
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
                    id: user._id,
                    name: `${user.firstName} ${user.lastName}`,
                    contact: user.contact
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



exports.deleteGroup = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.id; // From verifyToken middleware

  try {
    const group = await card_group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only admin can delete group" });
    }

    group.deleted = true;
    await group.save();
    await card_group_user.deleteMany({ group_id: groupId });

    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error in deleteGroup:", error);
    res.status(500).json({ message: error.message || "Network error" });
  }
};
// added all the feature

exports.deleteMember = async (req, res) => {
    const { groupId, userId } = req.body;
    const requesterId = req.id; 

    try {
        const group = await card_group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        if (userId === requesterId) {
            if (group.admin.toString() === userId) {
                return res.status(403).json({ message: "Admin cannot leave group" });
            }
            await card_group_user.deleteOne({ group_id: groupId, user_id: userId });
            return res.json({ message: "Left group successfully" });
        }

        if (group.admin.toString() !== requesterId.toString()) {
            console.log("THIS IS THE GROUP",group.admin,requesterId)
            return res.status(403).json({ message: "Only admin can delete members" });
        }

        await card_group_user.deleteOne({ group_id: groupId, user_id: userId });
        res.json({ message: "Member removed successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.leaveGroup = async (req, res) => {
    const { groupId} = req.body;
    const userId= req.id
    
    try {
        const group = await card_group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });
        
        if (group.admin.toString() === userId.toString()) {
            return res.status(403).json({ message: "Admin cannot leave group" });
        }
        
        await card_group_user.deleteOne({ group_id: groupId, user_id: userId });
        res.json({ message: "Left group successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const toggleCardVisibility = async (req, res) => {
    const { groupId, cardId, userId } = req.body;
    
    try {
        const member = await CardGroupUser.findOne({ group_id: groupId, user_id: userId });
        if (!member) return res.status(404).json({ message: "Member not found" });
        
        const card = member.card_list.find(c => c.card_id.toString() === cardId);
        if (!card) return res.status(404).json({ message: "Card not found" });
        
        card.show_after_notification = !card.show_after_notification;
        await member.save();
        
        res.json({ message: "Card visibility toggled" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getGroupDetails = async (req, res) => {
    const { groupId } = req.params;
    
    try {
        const group = await CardGroup.findById(groupId).populate('admin');
        if (!group || group.deleted) return res.status(404).json({ message: "Group not found" });
        
        const members = await CardGroupUser.find({ group_id: groupId })
            .populate('user_id')
            .populate('card_list.card_id');
            
        const sortedMembers = members.sort((a, b) => {
            if (a.user_id._id.toString() === group.admin._id.toString()) return -1;
            if (b.user_id._id.toString() === group.admin._id.toString()) return 1;
            return 0;
        });
        
        res.json({ group, members: sortedMembers });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addUserToGroup = async (req, res) => {
    try {
        const { searchContact, groupId } = req.body;
        const userId = req.id; // Authenticated user ID

        // Validate input
        if (!searchContact || !groupId) {
            return res.status(400).json({
                status: false,
                message: 'Missing required fields: searchContact or groupId'
            });
        }

        // Find the user by contact
        const user = await User.findOne({ contact: searchContact });
        if (!user) {
            return res.status(404).json({
                status: false,
                message: 'User not found',
                whatsappInvite: `https://wa.me/${searchContact}?text=Join our card group`
            });
        }

        // Check if user is already in the group or has a pending invitation
        const existingMember = await card_group_user.findOne({
            user_id: user._id,
            group_id: groupId
        });
        if (existingMember) {
            return res.status(400).json({
                status: false,
                message: `User is already ${existingMember.status} for this group`
            });
        }

        // Create pending group invitation
        const newMember = await card_group_user.create({
            name: user.firstName,
            user_id: user._id,
            group_id: groupId,
            status: 'pending',
            card_list: []
        });

        // Send notification with accept/reject options
        try {
            const group = await card_group.findById(groupId);
            const inviter = await User.findById(userId);
            
            if (group && inviter) {
                const acceptLink = `${process.env.APP_URL}/api/group/invitation/accept/${newMember._id}`;
                const rejectLink = `${process.env.APP_URL}/api/group/invitation/reject/${newMember._id}`;

                await notificationService.sendNotification(
                    user._id,
                    'group_invite',
                    'You\'ve been invited to a Card Pool!',
                    `${inviter.firstName} ${inviter.lastName} has invited you to join the card pool "${group.name}".\n
                    Accept: ${acceptLink}\n
                    Reject: ${rejectLink}`,
                    { inApp: true, email: true, whatsapp: true },
                    { 
                        groupId: groupId,
                        groupName: group.name,
                        inviterId: userId,
                        inviterName: `${inviter.firstName} ${inviter.lastName}`,
                        acceptLink,
                        rejectLink
                    }
                );
            }
        } catch (notificationError) {
            console.error('Error sending group invite notification:', notificationError);
        }

        return res.status(200).json({
            status: true,
            message: 'Invitation sent successfully',
            data: newMember
        });
    } catch (error) {
        console.error('Error sending group invitation:', error);
        return res.status(500).json({
            status: false,
            message: 'Network error'
        });
    }
};

// Accept group invitation
exports.acceptGroupInvitation = async (req, res) => {
    try {
        const { invitationId } = req.params;
        const userId = req.id;

        const invitation = await card_group_user.findOne({
            _id: invitationId,
            user_id: userId,
            status: 'pending'
        });

        if (!invitation) {
            return res.status(404).json({
                status: false,
                message: 'Invitation not found or already processed'
            });
        }

        // Update invitation status and add user's cards
        const user = await User.findById(userId);
        invitation.status = 'accepted';
        invitation.card_list = user.CardAdded || [];
        await invitation.save();

        // Send confirmation notification
        try {
            const group = await card_group.findById(invitation.group_id);
            await notificationService.sendNotification(
                userId,
                'group_invite',
                'Group Invitation Accepted',
                `You have successfully joined the card pool "${group.name}".`,
                { inApp: true, email: true, whatsapp: false },
                { 
                    groupId: invitation.group_id,
                    groupName: group.name
                }
            );
        } catch (notificationError) {
            console.error('Error sending acceptance notification:', notificationError);
        }

        return res.status(200).json({
            status: true,
            message: 'Group invitation accepted',
            data: invitation
        });
    } catch (error) {
        console.error('Error accepting group invitation:', error);
        return res.status(500).json({
            status: false,
            message: 'Network error'
        });
    }
};

// Reject group invitation
exports.rejectGroupInvitation = async (req, res) => {
    try {
        const { invitationId } = req.params;
        const userId = req.id;

        const invitation = await card_group_user.findOne({
            _id: invitationId,
            user_id: userId,
            status: 'pending'
        });

        if (!invitation) {
            return res.status(404).json({
                status: false,
                message: 'Invitation not found or already processed'
            });
        }

        // Update invitation status
        invitation.status = 'rejected';
        await invitation.save();

        // Send rejection notification
        try {
            const group = await card_group.findById(invitation.group_id);
            await notificationService.sendNotification(
                userId,
                'group_invite',
                'Group Invitation Rejected',
                `You have rejected the invitation to join "${group.name}".`,
                { inApp: true, email: true, whatsapp: false },
                { 
                    groupId: invitation.group_id,
                    groupName: group.name
                }
            );
        } catch (notificationError) {
            console.error('Error sending rejection notification:', notificationError);
        }

        return res.status(200).json({
            status: true,
            message: 'Group invitation rejected',
            data: invitation
        });
    } catch (error) {
        console.error('Error rejecting group invitation:', error);
        return res.status(500).json({
            status: false,
            message: 'Network error'
        });
    }
};
