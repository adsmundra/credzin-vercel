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

    res.status(200).json({ user, token });
  } catch (err) {
    res.status(500).json({ message: err.message});
  }
};

// Form Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ message: 'Invalid credentials' });
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

exports.googleLoginSuccess = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Google login failed' });
  }

  const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
  req.user.token = token;
  await req.user.save();

  res.redirect(`${process.env.CLIENT_URL}/home?token=${token}`);
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

    const user = await User.findById(userId).select('-password'); // Exclude password from response

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
    const productIds = req.body.productIds;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: 'User ID missing.' });
    }
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Product IDs array missing or empty.',
        });
    }
    // console.log("hii we are here")

    // Validate product IDs

    const invalidIds = productIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid product IDs.', invalidIds });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });
    }

    // Find the products
    const products = await Cards.find({ _id: { $in: productIds } });
  //  console.log("this is the products",products)
    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p._id.toString());
      const missingIds = productIds.filter((id) => !foundIds.includes(id));
      return res
        .status(404)
        .json({
          success: false,
          message: 'One or more products not found.',
          missingIds,
        });
    }

    // Add products to the user's cart
    products.forEach((product) => {
      if (!user.CardAdded.includes(product._id)) {
        user.CardAdded.push(product._id);
      }
    });
    // console.log("we are here in add cards")

    // console.log(user.CardAdded)

    await user.save();
    
    // Send notification for card added
    try {
      const cardNames = products.map(card => card.card_name).join(', ');
      await notificationService.sendNotification(
        userId,
        'card_added',
        'Card Added Successfully!',
        `You have successfully added ${cardNames} to your collection.`,
        { inApp: true, email: false, whatsapp: false },
        { cardIds: productIds, cardNames: products.map(card => card.card_name) }
      );
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

    // const pythonProcess = spawn('wsl', [
    //     'bash', '-c', 
    //     `python pycode/src/agents/CardRecommendation.py ${userId}`
    // ]);

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


    res
      .status(200)
      .json({
        success: true,
        message: 'Products added to cart.',
        cart: user.CardAdded,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Internal server error.',
        error: error.message,
      });
  }
};
exports.getUserCards = async (req, res) => {
  try {
    const userId = req.id; // Extract user ID from request

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }
   

    // Fetch user and populate the CardAdded field 
      const user = await User.findById(userId)
      .populate({
        path: 'CardAdded', // Populate the CardAdded array
        select:
          'bank_name features joining_fee annual_fee know_more_link apply_now_link image_url rewards card_name', // Select all required fields
      })
      .select('-password');
   
     // Exclude password from response
     
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    

    // Send the populated cards
    res.status(200).json({
      success: true,
      cards: user.CardAdded, // Populated cards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
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

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { CardAdded: cardId } },
      { new: true }
    ).populate({
      path: 'CardAdded',
      model: 'credit_cards',
      select: 'bank_name features joining_fee annual_fee image_URL card_name',
    });

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });
    }

    // Send notification for card removed
    try {
      const removedCard = await Cards.findById(cardId);
      if (removedCard) {
        await notificationService.sendNotification(
          userId,
          'card_added',
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
        user: updatedUser,d 
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

    const { ageRange, salaryRange, expenseRange, profession, location } = req.body;
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

    // Update the user including setting isFirstLogin to false
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ageRange,
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
   const userId = req.id; // Ensure your verifyToken middleware attaches user info to req.user

    const user = await User.findById(userId)
      .select("-password -token -__v") // exclude sensitive fields
      .populate({
        path: "CardAdded",
        model: "credit_cards"
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      data: user,
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


