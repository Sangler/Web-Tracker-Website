const express = require("express");
const router = express.Router();
const Sha256 = require("sha256");

const User = require('../models/emails.js');

const catchAsync = require('../utils/catchAsync.js');
const isValidEmail = require('../utils/emailRegister.js');

const keys = require('../utils/process-env.js');
const path = require('path');

//Set up Nodemailer
const nodemailer = require("nodemailer");

async function SendVerifiedCode(otpcode, email) {
  const transporter = nodemailer.createTransport({
    host: 'mail.gmx.com',
    port: 465,
    secure: true,
    auth: {
      user: keys.email.user,
      pass: keys.email.pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  try {
    const info = await transporter.sendMail({
      from: '"TRACKING SERVICE FROM" <webtracking@gmx.com>',
      to: email,
      subject: 'Your Verification Code',
      text: `Your verification code is: ${otpcode}`,
      html: `<div style="font-family: Arial, sans-serif;">
              <h2>Account Verification</h2>
              <p>Use this code to verify your account:</p>
              <div style="font-size: 24px; font-weight: bold; margin: 20px 0;">
                ${otpcode}
              </div>
              <p style="color: #666;">This code expires in 1 minute</p>
            </div>`
    });
    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error("Failed to send verification email");
  }
}

//HTTP GET requests
router.get('/', (req,res)=>{
    if (!req.session.email) {
      res.render('./mainpage.ejs');
  }

  if (req.session.email && req.session.username) {
      return res.redirect(`/trackery/${req.session.email.split("@")[0]}`);
  }
  });

router.get('/login', (req,res)=>{
  if (!req.session.email) {
      return res.render('./auth/login.ejs');
  }
  if (req.session.email && req.session.username) {
      return res.redirect(`/trackery/${req.session.email.split("@")[0]}`);
  }
  res.render('./auth/login.ejs');  
});

router.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).send("Failed to log out");
      }
      return res.redirect('/login'); 
    });
  } else {
    return res.redirect('/login'); 
  }


});

router.get('/register', (req,res)=>{ 
  if (!req.session.email) {
    return res.render('./auth/register.ejs');
  }
  if (req.session.email && req.session.username) {
      return res.redirect(`/trackery/${req.session.email.split("@")[0]}`);
  }
  res.render('./auth/register.ejs');

});

router.get('/register/otp',isValidEmail, async(req,res)=>{ 
  if (!req.session.email ) {
    return res.redirect('/register');
  }
  if(req.session.emailStatus==true){
    return res.redirect(`/trackery/${req.session.email.split("@")[0]}`);
  }
  //For unregistered user
  if (req.session.email && req.session.username && req.session.user_id) {
    return res.render('./auth/otp.ejs');
  }
  res.render('./auth/otp.ejs');
});


//Others Sub-routers
router.get('/webs-tracking-logo-ulz93js8cvk48avh',(req,res)=>{
  //using path, be careful with relatives path !!!
  res.sendFile(path.join(__dirname,'../static/imgs/webs-tracking-logo.jpg'))
})

router.get('/donation',(req,res)=>{ 
  return res.render('./subpages/donate.ejs');
});


router.get('/HowToTrack',(req,res)=>{
  return res.render('./subpages/instruction.ejs')
})


router.get('/test',(req,res)=>{
  return res.render('./mainpage-test.ejs')
})


//HTTP POST requests
router.post('/register', catchAsync(async (req, res) => {
  const { email, password, username, userpwd } = req.body;

  // Check if the email is already registered
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const data = { message: "User Account Already Created!" };
    return res.render('./layout/error.ejs', { data });
  }

  // Ensure passwords match
  if (userpwd != password) {
    const data = { message: "Password is not matched!" };
    return res.render('./layout/error.ejs', { data });
  }

  // Generate a 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000);
  // Hash the password
  const hashedPassword = await Sha256(password);

  // Create a new user object
  const newUser = new User({
    password: hashedPassword,
    username: username,
    email: email,
    otp: otpCode,
    otpExpiration:Date.now() + 60000 
  });

  // Send OTP email
  SendVerifiedCode(otpCode, email);
  // Save user to database
  await newUser.save();
  // Store email in session for OTP verification
  req.session.email = email;
  res.redirect('/register/otp');
}));

router.post('/register/otp',catchAsync(async (req,res)=>{ 
  const { otp, action } = req.body;   
  const email=req.session.email;
  const IsUserEmail = await User.findOne({ email });

  // User "Verify Email"
  if (action === "verify") {
    const currentTime = Date.now();
    const otpExpiration = IsUserEmail.otpExpiration.getTime()
    if(currentTime>otpExpiration){ //Check expiration
      const otpMsg = { message: "Your OTP Code Is Expired" };
      return res.render('./layout/error.ejs', { otpMsg });
    }
    if (String(otp) === String(IsUserEmail.otp)) { //Check otp code
      IsUserEmail.verified = true;
      await IsUserEmail.save();

      req.session.user_id = IsUserEmail._id;
      req.session.username = IsUserEmail.username;
      req.session.email = IsUserEmail.email;  
      req.session.emailStatus=IsUserEmail.verified;

      return res.redirect(`/trackery/${IsUserEmail.email.split("@")[0]}`); // Redirect on success
    } else {
      const otpMsg = { message: "Invalid OTP Code" };
      return res.render('./layout/error.ejs', { otpMsg });
    }
  } 
  // User "Resend Email"
  if (action === "resend") {
    const currentTime = Date.now();
    const otpExpiration = IsUserEmail.otpExpiration.getTime()
    if(currentTime<otpExpiration){
      const otpMsg = { message: "Unexpected error occurred" };
      return res.render('./layout/error.ejs', { otpMsg });
    } else{
      const otpCode = Math.floor(100000 + Math.random() * 900000);
      IsUserEmail.otpExpiration =Date.now() + 60000
      IsUserEmail.otp =otpCode
      await IsUserEmail.save();
      await SendVerifiedCode(otpCode, email); 
    }
  }

}));

router.post('/login',catchAsync(async (req,res)=>{ 
  const { password, email } = req.body;
  const IsUserEmail = await User.findOne({ email });

  if (!IsUserEmail) {
    const data = { message: "Your email or Password is incorrect!" };
    return res.render('./layout/error.ejs', { data });
  }

  if (Sha256(password) != IsUserEmail.password) {
    const data = { message: "Your email or Password is incorrect!" };
    return res.render('./layout/error.ejs', { data });
  }

  if (IsUserEmail.verified==false) {
    req.session.email = IsUserEmail.email;
    return res.redirect("/register/otp");
  }

  req.session.user_id = IsUserEmail._id;
  req.session.username = IsUserEmail.username;
  req.session.email = IsUserEmail.email;  
  req.session.emailStatus=IsUserEmail.verified;
  console.log(Sha256(IsUserEmail.username));
  res.redirect(`/trackery/${IsUserEmail.email.split("@")[0]}`);
}));

router.post('/', (req,res)=>{

  res.redirect('/login');
});


module.exports = router;
