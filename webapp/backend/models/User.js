const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: false,
  },
  contact: {
    type: String,
    required: false,
  },
  token: {
    type: String,
  },
  CardAdded: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'credit_cards',
    },
  ],
  googleId: {
    type: String,
  },
  dateOfBirth: {
    type: Date,
  },
  salaryRange: {
    type: String,
    enum: [
      '0-10000',
      '10001-25000',
      '25001-50000',
      '50001-100000',
      '100001-150000',
      '150001-200000',
      '200001+',
    ],
  },
  expenseRange: {
    type: String,
    enum: ['0-5000', '5000-15000', '15000-30000', '30000+'],
  },
  profession: {
    type: String,
  },
  location: {
    type: String,
  },
  isfirstLogin: {
    type: Boolean,
    default: true,
  },
  profilePic: {
    data: String,
    contentType: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
