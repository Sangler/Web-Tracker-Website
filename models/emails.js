const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserEmailSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    unique: true,
  },
  password: {
    required: true,
    type: String,
  },
  otp: {
    type: String,
  },
  verified: {
    type: Boolean,
    default: false,
  },
});

//                                Collection        Schema
module.exports = mongoose.model('newUser', UserEmailSchema);