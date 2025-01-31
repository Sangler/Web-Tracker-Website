const express = require("express");
const router = express.Router();
const Sha256 = require("sha256");
const nodemailer = require("nodemailer");

const session  = require('express-session');
const User = require('../models/emails.js');

const catchAsync = require('../utils/catchAsync.js');
const isValidUser = require('../utils/middleware.js');
//HTTP GET requests
router.get('/', (req,res)=>{
    res.render('./auth/login.ejs');
  });

router.get('/login', (req,res)=>{
      res.render('./auth/login.ejs');

  });

router.get('/register',(req,res)=>{ 
    res.render('./auth/register.ejs');
});

router.get('/register/otp',(req,res)=>{ 
  res.render('./auth/otp.ejs');
});



//HTTP POST requests
router.post('/register', catchAsync(async (req, res) => {
  const {email, password, username, userpwd} = req.body;
  const IsUserEmail = await User.findOne({email});
  if (IsUserName!==null){
    res.send(`<h1 style="color: linear-gradient(168deg, #ffffff 55%, #c8ff00 0);">User name already created!<h1>
              <div> 
              <a href="/register"><button>BACK</button></a> 
              <br>
              <a href="/login">Back to Sign In</a>
              </div>
            `);
  }

  const hashpwd = await Sha256(password);
  const user = new User({
    password:hashpwd,
    username :username,
    email:email
  });
  res.redirect('/register/otp');


}));

router.post('/register',(req,res)=>{ 


});


module.exports = router;
