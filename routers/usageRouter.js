const express = require("express");
const router = express.Router();

const User = require('../models/emails.js');

const catchAsync = require('../utils/catchAsync.js');
const isValidUser = require('../utils/middleware.js');
//HTTP GET requests

router.get('/tstrack/:UserName', isValidUser,(req,res)=>{ 
  const currentUser = req.params;
  res.render('./index.ejs', {currentUser});
});

//HTTP POST requests
router.post('//tstrack/:UserName', catchAsync(async (req, res) => {
  const {url, email , price, name} = req.body;
  
  
}));




module.exports = router;
