const User = require('../models/User');

const editProfileController = async (req, res) => {
  try {
    const userData = JSON.parse(req.body.userData);

    const { _id, firstName, lastName, email, contact, address } = userData;

    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.contact = contact || user.contact;
    user.address = address || user.address;

    if (req.file) {
      user.profilePic = `/uploads/${req.file.filename}`;
    }

    await user.save();

    res.json({ message: 'Profile updated successfully.', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: { message: 'Internal Server Error' } }); // This is the error you're seeing
  }
};

module.exports = {
  editProfileController,
};
