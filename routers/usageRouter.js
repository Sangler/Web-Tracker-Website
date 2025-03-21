const express = require("express");
const router = express.Router();

const User = require('../models/emails.js');
const catchAsync = require('../utils/catchAsync.js');
const isValidUser = require('../utils/middleware.js');
const {configureBrowser,escapeCssSelector,checkPrice,DoubleCheckPrice} = require('../utils/scrape.js');

const keys = require('../utils/process-env.js');
const nodemailer = require('nodemailer');

const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const CronJob = require('cron').CronJob;

//HTTP GET requests
router.get('/trackery/:Email/:UserName', isValidUser,(req,res)=>{ 
  const  {UserName}  = req.params;
  const items = req.session.items; 
  const itemprices = req.session.itemprices;
  const currentEmail = req.session.email;

  console.log(`Items: ${items, typeof(items)} | Item Prices: ${itemprices, typeof(itemprices)}\n`);

  if (!UserName) {
    return res.redirect('/login');
  }

  if(UserName!=req.session.username){
    const data = { message: "Unauthenticated Page" };
    return res.render('./layout/error.ejs', { data });
  }else{
    return res.render('./userChoice.ejs', { currentUser: UserName, itemprices, items,currentEmail });
  }
});

router.get('/trackery/:Email', isValidUser,(req,res)=>{ 
  const currentUser = req.params;
  const currentEmail = req.session.email;
  const itemprices="";
  const items="";

  if(!currentUser){
    return res.redirect('/login');
  };

  if(currentUser.Email.split("@")[0]!=req.session.email.split("@")[0]){
    const data = { message: "Unauthenticated Page" };
    return res.render('./layout/error.ejs', { data });
  }

  res.render('./index.ejs', {currentUser,itemprices, items, currentEmail});
});


router.get('/trackery',(req,res)=>{ 
  res.render('./index.ejs');
});


router.get('/logout/:Email', (req, res) => {
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



//HTTP POST requests

router.post('/trackery/:Email', catchAsync(async (req, res) => {
  const { url, name, price, optionName, optionPrice, rise, drop, userDropOutput, userRiseOutput } = req.body;
  const { UserName } = req.params;
  const io = req.app.get("io"); // Get WebSocket instance
  
  let output;
  let changeStatus;
  if (rise) {
    output = userRiseOutput;
    changeStatus=rise;
  } else if (drop) {
    output = userDropOutput;
    changeStatus=drop;
  } else{output =null}


  // 1) Perform an INITIAL scrape to set up session data
  const page = await configureBrowser(url);

  let itemprices = await checkPrice(page, price, optionPrice);
  let items = await checkPrice(page, name, optionName);

  if ((items && items.length > 0) || (itemprices && itemprices.length > 0)) {
    req.session.items = items;
    req.session.itemprices = itemprices;

  } else {
    req.session.items = "undefined";
    req.session.itemprices = "undefined";
  }

  // 2) Immediately redirect ONCE so the user sees the page
  res.redirect(`/trackery/${req.session.email.split("@")[0]}/${req.session.username}`);

  // 3) Start the CronJob in the background
  let job = new CronJob('*/1 * * * *', async function () { // Runs every 1 min
    try {
      let updatedItemPrices = await checkPrice(page, price, optionPrice);
      let updatedItems = await checkPrice(page, name, optionName);

      console.log("\nTracking Job Running...");

      // Update session and emit real-time updates
      if ((updatedItems && updatedItems.length > 0) || (updatedItemPrices && updatedItemPrices.length > 0)) {
        req.session.items = updatedItems;
        req.session.itemprices = updatedItemPrices;
        console.log(`Updated Items: ${updatedItems}, ${typeof(updatedItems)} | Updated Prices: ${updatedItemPrices},${typeof(updatedItemPrices)}\n`);
        // Emit real-time updates via WebSockets
        io.emit(`priceUpdate-${req.session.username}`, { 
          items: updatedItems, 
          itemprices: updatedItemPrices,
          changeStatus:changeStatus,
          changePrice:output
        });
      } else {
        req.session.items = "undefined";
        req.session.itemprices = "undefined";

        // Emit "not found" update
        io.emit(`priceUpdate-${UserName}`, { 
          items: "undefined", 
          itemprices: "undefined" ,
          changeStatus:changeStatus,
          changePrice:output
        });
      }
    } catch (err) {
      console.error("Error in Cron job:", err);
    }
  });

  job.start();
}));


router.post('/trackery',(req,res)=>{ 
  res.redirect('/login');
});

/*
router.post('/trackery/:UserName', catchAsync(async (req, res) => {
  const { url, name, price, optionName, optionPrice } = req.body;

  async function startTracking() {
    const page = await configureBrowser(url);

    let job = new CronJob('*//*1 * * * *', async function() { // runs every 1 min
/*  let itemprices = await checkPrice(page, price, optionPrice);
    let items = await checkPrice(page, name, optionName);
    
    console.log("\nTracking Job Running...");
    console.log(typeof(itemprices), typeof(items));

    if ((items && items.length>0) || (itemprices && itemprices.length>0)) {
      req.session.items = items;
      req.session.itemprices = itemprices;
      console.log(`Items: ${items} | Item Prices: ${itemprices}\n`);
      return res.redirect(`/trackery/${req.session.username}/${req.session.user_id}`);
    } else {
      req.session.items = "undefined";
      req.session.itemprices = "undefined";
      return res.redirect(`/trackery/${req.session.username}/${req.session.user_id}`);
    }
  });

  job.start();
}

startTracking();

}));
*/
module.exports = router;