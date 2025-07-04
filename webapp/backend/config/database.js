const mongoose = require('mongoose');
require('dotenv').config();

const { MONGODB_URL } = process.env;
exports.connect = () => {
  mongoose
    .connect(MONGODB_URL)
    .then(console.log(`DB Connection Success`))
    .catch((err) => {
      throw new Error('Error connecting to DB', err);
    });
};
