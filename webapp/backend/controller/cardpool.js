const card_group_user = require('../models/cardGroupUser')
const card_group =  require('../models/cardGroups');
const User= require("../models/User")
const card = require("../models/card");
const cardGroupUser = require('../models/cardGroupUser')

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
            .populate('user_id', 'name email') // Populate user details (adjust fields as needed)
            .lean();

        const groupIds = docs.map(doc => doc.group_id);

        // Get users for each group and populate user_id and card_list
        const usersByGroup = {};
        for (const groupId of groupIds) {
            usersByGroup[groupId] = await card_group_user
                .find({ group_id: groupId })
                .populate('user_id', 'name email') // Populate user details
                .populate('card_list') // Populate credit card details
                .lean();
        }

        // Get group details and populate admin
        const groups = await card_group
            .find({ _id: { $in: groupIds } })
            .populate('admin', 'name email') // Populate admin details
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
        const { searchContact,groupId } = req.body;
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

        // Create new group member
        const newMember = await card_group_user.create({
            name: user.firstName,
            user_id: user._id,
            group_id: groupId,
            card_list: user.CardAdded
            // profile_picture: user.profile_picture || 'default_user.jpg',
            // created_at: Datw()e.no
        });

        return res.status(200).json({
            status: true,
            message: 'Added successfully',
            data: newMember
        });
    } catch (error) {
        console.error('Error adding user to group:', error);
        return res.status(500).json({
            status: false,
            message: 'Network error'
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