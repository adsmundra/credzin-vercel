const User = require('../models/User');
const path = require('path');

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.id;
    console.log("userID" ,userId)

    let userData;
    try {
      userData = JSON.parse(req.body.userData);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user data format.',
      });
    }

    const { firstName, lastName, contact, address } = userData;
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'First name and last name are required.',
      });
    }

    if (contact && !/^\+?\d{10,15}$/.test(contact)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact number.',
      });
    }

    const updateData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      contact: contact?.trim(),
      address: address?.trim(),
    };

    if (req.file) {
      try {
        updateData.profilePic = `images/${req.file.filename}`;
      } catch (error) {
        console.error('Error processing profile picture:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to process profile picture.',
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const responseUser = updatedUser.toObject();
    if (responseUser.profilePic) {
      responseUser.profilePic = `${req.protocol}://${req.get('host')}/${responseUser.profilePic}`;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: responseUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
    });
  }
};
