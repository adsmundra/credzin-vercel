const mongoose = require('mongoose');
const card = require('./card');

const recommendationSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  card_id: {
    type:String,
    required: true,
  },
  card_name: { 
    type: String,
    required: true,
  },
  suggestion: {
    type: String,
    required: true,
  },
},);
module.exports = mongoose.model('Recommendation', recommendationSchema);
