const User = require('../models/User');
const path = require('path');

// exports.updateProfile = async (req, res) => {
//   try {
//     const userId = req.id;
//     //     // console.log("userID" ,userId)

//     let userData;
//     try {
//       userData = JSON.parse(req.body.userData);
//       console.log('userData', userData);
//     } catch (error) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid user data format.',
//       });
//     }

//     const { firstName, lastName, contact, location } = userData;
//     if (!firstName || !lastName) {
//       return res.status(400).json({
//         success: false,
//         message: 'First name and last name are required.',
//       });
//     }

//     if (contact && !/^\+?\d{10,15}$/.test(contact)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid contact number.',
//       });
//     }

//     const updateData = {
//       firstName: firstName.trim(),
//       lastName: lastName.trim(),
//       contact: contact?.trim(),
//       location: location?.trim(),
//     };

//     if (req.file) {
//       try {
//         updateData.profilePic = `images/${req.file.filename}`;
//       } catch (error) {
//         console.error('Error processing profile picture:', error);
//         return res.status(500).json({
//           success: false,
//           message: 'Failed to process profile picture.',
//         });
//       }
//     }

//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { $set: updateData },
//       { new: true, runValidators: true }
//     ).select('-password');

//     if (!updatedUser) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found.',
//       });
//     }

//     const responseUser = updatedUser.toObject();
//     if (responseUser.profilePic) {
//       responseUser.profilePic = `${req.protocol}://${req.get('host')}/${responseUser.profilePic}`;
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Profile updated successfully.',
//       data: responseUser,
//     });
//   } catch (error) {
//     console.error('Error updating profile:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error. Please try again.',
//     });
//   }
// };

// // exports.updateProfile=async(req ,res)=>{
// //   try{
// //     const  userId= req.id

// //     const user =await User.find({_id:userId})

// //     if(!user ){
// //       return res.status(404).json({
// //         succes:false,
// //         message:'login again'
// //       })
// //     }
// //     user.profilePic = {
// //       data: req.file.buffer,
// //       contentType: req.file.mimetype,
// //     };
// //     await user.save();

// //   }catch(error){
// //     console.error('Error updating profile picture:', error);
// //     return res.status(500).json({
// //       success: false,
// //       message: 'Failed to update profile picture.',
// //     });
// //   }
// // }



exports.uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.id;
    const { profilePic, ...otherData } = req.body;

    const updateData = { ...otherData };

    if (profilePic) {
      // Validate Base64 format
      if (!profilePic.startsWith('data:image/')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid image format. Please provide a valid Base64 image.'
        });
      }

      const contentTypeMatch = profilePic.match(/data:([^;]+);base64,/);
      if (!contentTypeMatch) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Base64 format'
        });
      }

      const contentType = contentTypeMatch[1];
      const base64Data = profilePic.replace(/^data:image\/[a-z]+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Check file size (limit to 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (imageBuffer.length > maxSize) {
        return res.status(400).json({
          success: false,
          message: 'Image size too large. Maximum size is 5MB.'
        });
      }

      updateData.profilePic = {
        data: imageBuffer,
        contentType: contentType
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password -token' }
    ).lean();

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Convert buffer to Base64 for response
    if (updatedUser.profilePic?.data) {
      updatedUser.profilePic = {
        data: updatedUser.profilePic.data.toString('base64'),
        contentType: updatedUser.profilePic.contentType
      };
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get Profile Picture
exports.getProfilePicture = async (req, res) => {
  try {
    const userId = req.params.userId || req.id; // Allow getting other user's profile pic or own

    const user = await User.findById(userId).select('profilePic firstName lastName');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.profilePic || !user.profilePic.data) {
      return res.status(404).json({
        success: false,
        message: 'Profile picture not found'
      });
    }

    // Set appropriate headers
    res.set({
      'Content-Type': user.profilePic.contentType,
      'Content-Length': user.profilePic.data.length,
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    });

    // Send the image buffer
    res.send(user.profilePic.data);

  } catch (error) {
    console.error('Get profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get Profile Picture as Base64
exports.getProfilePictureBase64 = async (req, res) => {
  try {
    const userId = req.params.userId || req.id;

    const user = await User.findById(userId).select('profilePic firstName lastName');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.profilePic || !user.profilePic.data) {
      return res.status(404).json({
        success: false,
        message: 'Profile picture not found'
      });
    }

    // Convert buffer to Base64
    const base64Image = `data:${user.profilePic.contentType};base64,${user.profilePic.data.toString('base64')}`;

    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        userName: `${user.firstName} ${user.lastName}`,
        profilePicture: base64Image
      }
    });

  } catch (error) {
    console.error('Get profile picture Base64 error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update Profile Picture
exports.updateProfilePicture = async (req, res) => {
  try {
    const userId = req.id;
    const { profilePic } = req.body;

    if (!profilePic) {
      return res.status(400).json({
        success: false,
        message: 'Profile picture data is required'
      });
    }

    // Validate Base64 format
    if (!profilePic.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Please provide a valid Base64 image.'
      });
    }

    // Extract content type
    const contentTypeMatch = profilePic.match(/data:([^;]+);base64,/);
    if (!contentTypeMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Base64 format'
      });
    }

    const contentType = contentTypeMatch[1];
    const base64Data = profilePic.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Check file size
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageBuffer.length > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Image size too large. Maximum size is 5MB.'
      });
    }

    // Update profile picture
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        profilePic: {
          data: imageBuffer,
          contentType: contentType
        }
      },
      { new: true, select: '-password -token' }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        userId: updatedUser._id,
        profilePicUpdated: true
      }
    });

  } catch (error) {
    console.error('Profile picture update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete Profile Picture
exports.deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $unset: { profilePic: 1 }
      },
      { new: true, select: '-password -token' }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile picture deleted successfully',
      data: {
        userId: updatedUser._id,
        profilePicDeleted: true
      }
    });

  } catch (error) {
    console.error('Delete profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get User Profile with Profile Picture
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.id;

    const user = await User.findById(userId).select('-password -token');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Convert profile picture to Base64 if exists
    let profilePictureBase64 = null;
    if (user.profilePic && user.profilePic.data) {
      profilePictureBase64 = `data:${user.profilePic.contentType};base64,${user.profilePic.data.toString('base64')}`;
    }

    // Remove the buffer data from response and add Base64
    const userResponse = user.toObject();
    delete userResponse.profilePic;
    userResponse.profilePicture = profilePictureBase64;

    res.status(200).json({
      success: true,
      data: userResponse
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};