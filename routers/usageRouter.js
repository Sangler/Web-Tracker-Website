const express = require("express");
const router = express.Router();
const Sha256 = require("sha256");
const nodemailer = require("nodemailer");

const session  = require('express-session');
const User = require('../models/emails.js');

const catchAsync = require('../utils/catchAsync.js');
const isValidUser = require('../utils/middleware.js');
//HTTP GET requests

router.get('/index',(req,res)=>{ 
  res.render('./index.ejs');
});

//HTTP POST requests
router.post('/index', catchAsync(async (req, res) => {
  const {url, email , price, name} = req.body;
  
}));




module.exports = router;
