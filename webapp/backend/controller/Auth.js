const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Cards = require('../models/card');
require('dotenv').config();
const mongoose = require('mongoose');
const { PythonShell } = require('python-shell');
const { spawn } = require('child_process');
const path = require('path');
const notificationService = require('../services/notificationService');
const twilio = require("twilio");
const UserCard = require('../models/user_Card');
const UserCardDetails = require('../models/user_card_details');
const { Message } = require('twilio/lib/twiml/MessagingResponse');


exports.signup = async (req, res) => {
  // Validate request body
  const { firstName, lastName, email, password, contact } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }
    // console.log("hii we are inside the signup blockd")

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashed,
      contact,
    });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    user.token = token;
    await user.save();

    res.status(200).json({ 
      sucess:true,
      user,
      token 
    });
  } catch (err) {
    res.status(500).json({
      sucess:false,
      message:"something Went wrong"
    });
  }
};

// Form Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if(!user){
      return res.status(400)({
        success:false,
        message :"user Not Found"

      })
    }
    

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    user.token = token;
    await user.save();
    //  Convert to plain object and remove password
    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({ user: userObj, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

 

exports.getUserData = async (req, res) => {
  try {
    if (!req.id) {
      return res.status(400).json({
        success: false,
        message: 'User ID missing in request.',
      });
    }

    const userId = req.id;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      user: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
      error: error.message,
    });
  }
};
exports.addcards = async (req, res) => {
  try {
    const userId = req.id;
    const genericCardIds = req.body.generic_card_ids; // Now expecting an array of generic_card_id(s)

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID missing.' });
    }
    if (!Array.isArray(genericCardIds) || genericCardIds.length === 0) {
      return res.status(400).json({ success: false, message: 'generic_card_ids array missing or empty.' });
    }

    // Validate generic_card_ids
    const invalidIds = genericCardIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ success: false, message: 'Invalid generic_card_ids.', invalidIds });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Find the generic cards
    const products = await Cards.find({ _id: { $in: genericCardIds } });
    if (products.length !== genericCardIds.length) {
      const foundIds = products.map((p) => p._id.toString());
      const missingIds = genericCardIds.filter((id) => !foundIds.includes(id));
      return res.status(404).json({ success: false, message: 'One or more generic cards not found.', missingIds });
    }

    // Check for existing user cards (both active and inactive)
    const existingUserCards = await UserCard.find({
      user_id: userId,
      generic_card_id: { $in: genericCardIds }
    });

    // Separate active and inactive cards
    const activeCards = existingUserCards.filter(card => card.user_card_status === 'ACTIVE');
    const inactiveCards = existingUserCards.filter(card => card.user_card_status === 'INACTIVE');

    // If there are active cards, return error for duplicates
    if (activeCards.length > 0) {
      const activeGenericCardIds = activeCards.map(card => card.generic_card_id);
      const duplicateCardNames = products
        .filter(product => activeGenericCardIds.includes(product._id.toString()))
        .map(product => product.card_name);
      
      return res.status(400).json({ 
        success: false, 
        message: 'One or more cards are already added to your collection.',
        duplicateCards: duplicateCardNames
      });
    }

    // For each generic card, either reactivate existing inactive card or create new one
    const newUserCardIds = [];
    const reactivatedCardIds = [];
    
    for (const product of products) {
      // Check if there's an inactive card for this generic card
      const inactiveCard = inactiveCards.find(card => card.generic_card_id === product._id.toString());
      
      if (inactiveCard) {
        // Reactivate the existing inactive card
        const reactivatedCard = await UserCard.findByIdAndUpdate(
          inactiveCard._id,
          { 
            user_card_status: 'ACTIVE',
            card_added_date: new Date() // Update the added date
          },
          { new: true }
        );
        
        // Add to user's CardAdded if not already present
        if (!Array.isArray(user.CardAdded)) {
          user.CardAdded = [];
        }
        if (!user.CardAdded.includes(reactivatedCard._id)) {
          user.CardAdded.push(reactivatedCard._id);
        }
        reactivatedCardIds.push(reactivatedCard._id);
        
      } else {
        // Create new user_card with only required fields and defaults/nulls
        const userCard = await UserCard.create({
          user_id: userId,
          generic_card_id: product._id,
          card_nickname: null,
          card_type: null,
          user_card_status: 'ACTIVE',
          card_added_date: new Date(),
          card_recommended_for: null,
        });
        
        // Create user_card_details with nulls
        await UserCardDetails.create({
          user_card_id: userCard._id,
          name_on_card: null,
          card_number: null,
          card_expiry_date: null,
          amount: {}
        });
        
        // Add to user's CardAdded if not already present
        if (!Array.isArray(user.CardAdded)) {
          user.CardAdded = [];
        }
        if (!user.CardAdded.includes(userCard._id)) {
          user.CardAdded.push(userCard._id);
          newUserCardIds.push(userCard._id);
        }
      }
    }
    await user.save();

    // Send notification for card added
    try {
      const cardNames = products.map(card => card.card_name).join(', ');
      const action = reactivatedCardIds.length > 0 ? 'reactivated' : 'added';
      const message = reactivatedCardIds.length > 0 
        ? `You have successfully reactivated ${cardNames} in your collection.`
        : `You have successfully added ${cardNames} to your collection.`;
      
      await notificationService.sendNotification(
        userId,
        'card_added',
        `Card ${action.charAt(0).toUpperCase() + action.slice(1)} Successfully!`,
        message,
        { inApp: true, email: false, whatsapp: false },
        { 
          cardIds: [...newUserCardIds, ...reactivatedCardIds], 
          cardNames: products.map(card => card.card_name),
          reactivatedCount: reactivatedCardIds.length,
          newCount: newUserCardIds.length
        }
      );
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail the main request if notification fails
    }

    // (Python recommendation logic remains unchanged)
    const { spawn } = require('child_process');
    const pythonProcess = spawn('python', [
      '/home/cygwin/welzin/credzin/pycode/src/agents/CardRecommenderAgent.py',
      userId
    ]);
    pythonProcess.stdout.on('data', (data) => {
        console.log('Python output:', data.toString());
    });
    pythonProcess.stderr.on('data', (data) => {
        console.error('Python stderr:', data.toString());
    });
    pythonProcess.on('close', (code) => {
        console.log(`Python script finished with code: ${code}`);
    });

    const totalCardIds = [...newUserCardIds, ...reactivatedCardIds];
    const message = reactivatedCardIds.length > 0 
      ? `Cards processed successfully. ${newUserCardIds.length} new cards added, ${reactivatedCardIds.length} cards reactivated.`
      : 'Cards added to user.';
    
    res.status(200).json({
      success: true,
      message: message,
      cardIds: totalCardIds,
      newCardIds: newUserCardIds,
      reactivatedCardIds: reactivatedCardIds,
      stats: {
        new: newUserCardIds.length,
        reactivated: reactivatedCardIds.length,
        total: totalCardIds.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
      error: error.message,
    });
  }
};
exports.getUserCards = async (req, res) => {
  try {
    const userId = req.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID missing.' });
    }

    // Fetch user and get CardAdded (array of user_card_id)
    const user = await User.findById(userId).select('CardAdded');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const userCardIds = user.CardAdded || [];
    if (userCardIds.length === 0) {
      return res.status(200).json({ success: true, cards: [] });
    }

    // Fetch only active user_card documents
    const userCards = await UserCard.find({ 
      _id: { $in: userCardIds },
      user_card_status: 'ACTIVE'
    });
    // For each user_card, fetch the generic card
    const genericCardIds = userCards.map(card => card.generic_card_id);
    const genericCards = await Cards.find({ _id: { $in: genericCardIds } });
    // Map generic card id to card details
    const genericCardMap = {};
    genericCards.forEach(card => { genericCardMap[card._id] = card; });

    // Build response: for each user_card, include its info and the generic card details
    const result = userCards.map(userCard => ({
      ...userCard.toObject(),
      generic_card: {
        card_name: genericCardMap[userCard.generic_card_id]?.card_name,
        image_url: genericCardMap[userCard.generic_card_id]?.image_url
      }
    }));

    res.status(200).json({ success: true, cards: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

exports.removeCardFromCart = async (req, res) => {
  try {
    const userId = req.id;
    const { cardId } = req.body;

    if (!userId || !cardId) {
      return res
        .status(400)
        .json({ success: false, message: 'User ID and Card ID are required.' });
    }

    // Find the user card to get the generic card ID for notification
    const userCard = await UserCard.findById(cardId);
    if (!userCard) {
      return res
        .status(404)
        .json({ success: false, message: 'User card not found.' });
    }

    // Mark the user card as inactive instead of removing from user's CardAdded array
    const updatedUserCard = await UserCard.findByIdAndUpdate(
      cardId,
      { user_card_status: 'INACTIVE' },
      { new: true }
    );

    if (!updatedUserCard) {
      return res
        .status(404)
        .json({ success: false, message: 'Failed to update user card status.' });
    }

    // Send notification for card removed
    try {
      const removedCards = await Cards.find({ _id: userCard.generic_card_id });
      const removedCard = removedCards[0];
      if (removedCard) {
        await notificationService.sendNotification(
          userId,
          'card_removed',
          'Card Removed Successfully!',
          `You have removed ${removedCard.card_name} from your collection.`,
          { inApp: true, email: false, whatsapp: false },
          { cardId: cardId, cardName: removedCard.card_name }
        );
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail the main request if notification fails
    }

    console.log("Triggering python")
    console.log('UserId:', userId);
    
    // let options = {
    //     pythonPath: 'wsl',
    //     pythonOptions: ['-c'],
    //     args: [`cd /mnt/c/Users/MANISH/Downloads/credzin && source venv/bin/activate && python pycode/src/agents/CardRecommendation.py ${userId}`],
    // };

    // console.log('Python options:', options);
    // console.log('Script path:', 'C:/Users/MANISH/Downloads/credzin/pycode/src/agents/CardRecommendation.py');

    const { spawn } = require('child_process');

    const pythonProcess = spawn('wsl', [
        'bash', '-c', 
        //`cd /mnt/c/Users/MANISH/Downloads/credzin && source venv/bin/activate && python pycode/src/agents/CardRecommendation.py ${userId}`
        `python pycode/src/agents/CardRecommenderAgent.py ${userId}`
    ]);

    pythonProcess.stdout.on('data', (data) => {
        console.log('Python output:', data.toString());
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error('Python stderr:', data.toString());
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python script finished with code: ${code}`);
    });
    
    return res
      .status(200)
      .json({
        success: true,
        message: 'Card removed successfully.',
        cardId: cardId
      });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: `Internal server error:${error}` });
  }
};

// controllers/userController.js



exports.updateAdditionalDetails = async (req, res) => {
  try {
    const userId = req.id;
    if (!userId) {
      // console.log("User ID is not present");
      return res.status(400).json({ message: "User ID missing in request" });
    }

    const { dateOfBirth, salaryRange, expenseRange, profession, location } = req.body;
    // Basic validation
    // const validAgeRanges = ["18-24", "25-34", "35-44", "45-54", "55+"];
    const validSalaryRanges = ["0-10000", "10001-25000", "25001-50000", "50001-100000", "100001-150000","150001-200000","200001+"];
    const validExpenseRanges = ["0-5000", "5000-15000", "15000-30000", "30000+"];

    if (
      // !validAgeRanges.includes(ageRange) ||
      !validSalaryRanges.includes(salaryRange) ||
      !validExpenseRanges.includes(expenseRange)
    ) {
      return res.status(400).json({ message: 'Invalid range values provided' });
    }

    if (!dateOfBirth || isNaN(new Date(dateOfBirth).getTime())) {
      return res.status(400).json({ message: 'Invalid or missing date of birth' });
    }

    if (typeof profession !== 'string' || typeof location !== 'string') {
      return res.status(400).json({ message: 'Invalid profession or location' });
    }

    // Update the user including setting isFirstLogin to false
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        dateOfBirth,
        salaryRange,
        expenseRange,
        profession,
        location,
        isfirstLogin: false  // Set isFirstLogin to false
      },
      { new: true }
    );

    return res.status(200).json({
      message: 'User details updated successfully',
      user: updatedUser,
    });

  } catch (err) {
    // console.error('Error updating user additional details:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.googlgeLoginUpdateAdditionalDetails = async (req, res) => {
  try {
    const userId = req.id;
    if (!userId) {
      return res.status(400).json({ message: "User ID missing in request" });
    }

    const { ageRange, salaryRange, expenseRange, profession, location,contact } = req.body;
    if(!ageRange || !salaryRange ||!expenseRange || !profession || !location  || !contact){
      return res.status(400).json({
        message:'missing the data field',
        status:false
      })
    }
    // Basic validation
    const validAgeRanges = ["18-24", "25-34", "35-44", "45-54", "55+"];
    const validSalaryRanges = ["0-10000", "10000-25000", "25000-50000", "50000-100000", "100000+"];
    const validExpenseRanges = ["0-5000", "5000-15000", "15000-30000", "30000+"];

    if (
      !validAgeRanges.includes(ageRange) ||
      !validSalaryRanges.includes(salaryRange) ||
      !validExpenseRanges.includes(expenseRange)
    ) {
      return res.status(400).json({ message: 'Invalid range values provided' });
    }

    if (typeof profession !== 'string' || typeof location !== 'string') {
      return res.status(400).json({ message: 'Invalid profession or location' });
    }

    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ageRange,
        salaryRange,
        expenseRange,
        profession,
        location,
        contact,
        isfirstLogin: false  // Set isFirstLogin to false
      },
      { new: true }
    );

    return res.status(200).json({
      message: 'User details updated successfully',
      user: updatedUser,
    });

  } catch (err) {
    // console.error('Error updating user additional details:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};



// Fetch full user details including populated CardAdded
exports.getFullUserDetails  = async (req, res) => {
  try {
   const userId = req.id;
   console.log("userId",userId);
   console.log("req",req);

    const user = await User.findById(userId)
      .select("-password -token -__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Fetch user cards
    const userCardIds = user.CardAdded || [];
    const userCards = await UserCard.find({ 
      _id: { $in: userCardIds },
      user_card_status: 'ACTIVE'
    });
    // For each user_card, fetch the generic card
    const genericCardIds = userCards.map(card => card.generic_card_id);
    const genericCards = await Cards.find({ _id: { $in: genericCardIds } });
    // Map generic card id to card details (only card_name and image_url)
    const genericCardMap = {};
    genericCards.forEach(card => {
      genericCardMap[card._id] = {
        card_name: card.card_name,
        image_url: card.image_url
      };
    });

    // Build response: for each user_card, include its info and the generic card details
    const userCardsWithGeneric = userCards.map(userCard => ({
      ...userCard.toObject(),
      generic_card: genericCardMap[userCard.generic_card_id] || null
    }));

    // Attach to user object
    const userObj = user.toObject();
    userObj.CardAdded = userCardsWithGeneric;

    return res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      data: userObj,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.findIdByContact=async(req,res)=>{
  try{
    const {searchContact } =req.body
    console.log("searchContact",searchContact);
    const user = await User.findOne({contact:searchContact})

    if(!user){
      return res.status(404).json({
        status:false,
        message:"contact not found"
      })
    }
    return res.status(200).json({
        status:true,
        message:"Add to Pool",
        user:user
      })
  }catch(error){
    return res.status(500).json({
      status:false,
      message:`Network Error ${error}`
      })

  }
}


const accountSid = 'AC4bf3297130b4c50a7bc232149f7b99e6';
const authToken = 'b5e4a293c9d763481704341aaa9797bc';
const client = new twilio(accountSid, authToken);


