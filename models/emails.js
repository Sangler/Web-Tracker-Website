const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserInfoSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  username:{
    type: String,
    unique: true
  },
  password: {
    required: true,
    type: String
  },
  otp: {
    type: String 
  },
  otpExpiration:{
    type: Date
  },
  verified: {
    type: Boolean,
    default: false
  },
  usedTime:{
    type:Number,
    default:0
  }

});

//                                Collection        Schema
module.exports = mongoose.model('newUser', UserInfoSchema);
