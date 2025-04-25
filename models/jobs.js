const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TrackerSchema = new Schema({
  JobID: {
    type: String,
    required: true,
    unique:true
  },
  email:{
    type: String,
    required:true
  },
  
  URL_Page:{
    type: String
  },
 
  Product:{
    type: String
  }, 
  changeStatus: {
    type: String,
    enum: ['rise', 'drop'],  // only these two
    default: null  
  },
  ExpectedTarget:{
    type: Number
  },
 isFinish: {
    type: Boolean,
    default: false
  }
});

//                                Collection        Schema
module.exports = mongoose.model('newJob', TrackerSchema);
