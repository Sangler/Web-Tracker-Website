const express = require("express");
const router = express.Router();

// models
const User = require('../models/emails.js'); 
const Job = require('../models/jobs.js');

const catchAsync = require('../utils/catchAsync.js');
const isValidUser = require('../utils/middleware.js');
const isValidEmail = require('../utils/emailVerified.js');
// const isValidJob = require('../utils/jobVerified.js');

const {configureBrowser, checkPrice, 
  sendNotification, parseCurrency,
   generateJobID} = require('../utils/scrape.js');

const Sha256 = require("sha256");

// const nodemailer = require('nodemailer');

// const cheerio = require('cheerio');
// const puppeteer = require('puppeteer');

const CronJob = require('cron').CronJob;


//HTTP GET requests

router.get('/ontracking/:special_id',isValidEmail, isValidUser,(req,res)=>{ 
  const  {special_id }  = req.params;

  if (!special_id ) {
    return res.redirect('/login');
  }

  if(special_id !=`${(req.session.username + req.session.user_id.slice(7))}` && 
  (!req.session.items || ! req.session.itemprices)){

    const data = { message: "404 Page Error" };
    return res.render('./layout/error.ejs', { data });
  
  } else{
    const Expected={Status:req.session.changeStatus,Result:req.session.output};
    const itemIndex=req.session.itemIndex;
    const priceIndex=req.session.priceIndex;
    res.render('./tracking.ejs',{currentUser:req.session.currentUser,
      itemIndex,priceIndex, Expected});
  }

});

router.get('/trackery/:Email/:UserName',isValidEmail, isValidUser,(req,res)=>{ 
  const  {UserName}  = req.params;
  
  const items = req.session.items; 
  const itemprices = req.session.itemprices;
  const currentEmail = req.session.email;
  const user_url=req.session.url;

  if (!UserName) {
    return res.redirect('/login');
  }

  if(UserName!=req.session.username){
    const data = { message: "Unauthenticated Page" };
    return res.render('./layout/error.ejs', { data });
  } else{
    req.session.currentUser=UserName
    return res.render('./userChoice.ejs', { currentUser: UserName, itemprices, items,currentEmail, user_url });
  }
});

router.get('/trackery/:Email', isValidUser,catchAsync( async(req,res)=>{ 
  const currentUser = req.params;
  const currentEmail = req.session.email;

  const isRunningJob=await Job.findOne({email:req.session.email, isFinish:false})

  if(isRunningJob){
    console.log('this code run!')
    return res.redirect(`/tracker-manager/${Sha256(req.session.username)}`);
  }

  if(!currentUser){
    return res.redirect('/login');
  };

  if(currentUser.Email.split("@")[0]!=req.session.email.split("@")[0]){
    const data = { message: "Unauthenticated Page" };
    return res.render('./layout/error.ejs', { data });
  }

  res.render('./mainpage.ejs', {currentUser, currentEmail});

}));


router.get('/trackery',(req,res)=>{ 
  res.render('./mainpage.ejs');
});

router.get('/tracker-manager/:job',isValidEmail, isValidUser, catchAsync( async(req, res)=>{
  const {currentUser} = req.params;

 /* if(Sha256(currentUser)!=Sha256(req.session.username)){
      const data = { message: "Unauthenticated Page" };
      return res.render('./layout/error.ejs', { data });
  }

    if(!currentUser){
      console.log("this code run!")
      return res.redirect('/login');
  };*/

  const finishedJobs= await Job.find({email:req.session.email, isFinish:true})
  const isRunningJob=await Job.findOne({email:req.session.email, isFinish:false})
  console.log(`Job is running: ${isRunningJob}\n${req.app.locals.activeJobs[req.session.userKey]}`);
  
  res.render('./user-job-management.ejs',{finishedJobs, isRunningJob});

}))


//HTTP POST requests
router.post('/tracker-manager/:job',isValidEmail, isValidUser,catchAsync(async(req,res)=>{ 
    const currentEmail = req.session.email;
    const result = await Job.deleteOne({ email: currentEmail, isFinish: false });
    console.log("Deleted current running job in Db!", result);
    //Stop current running Job
    if(req.session.userKey && req.app.locals.activeJobs){
      req.app.locals.activeJobs[req.session.userKey].stop();
        delete req.app.locals.activeJobs[req.session.userKey];
        console.log("Stopped existing job, finished!",req.session.userKey);
      }

    return res.redirect(`/trackery/${req.session.email.split("@")[0]}`);

}))

router.post('/ontracking/:special_id',isValidEmail, isValidUser,catchAsync(async(req,res)=>{ 
  const {item, price}  = req.body;
  const finalRes = item
  console.log(finalRes);
  const email = req.session.email;
  
    console.log("Name is:"+finalRes);
    sendNotification(email, req.session.url, item, req.session.output, req.session.changeStatus)
    
    //finish job, saved in database
    const isJob = await Job.findOne({ JobID: req.session.userKey });
    isJob.isFinish = true;
    await isJob.save();
    console.log("Current Job fully finish!")

    //To check how many times user've used the service
    const UserCompletedTask = await User.findOne({ email });
    UserCompletedTask.usedTime++;
    await UserCompletedTask.save();


  //Stop current running Job
  if(req.session.userKey && req.app.locals.activeJobs){
      req.app.locals.activeJobs[req.session.userKey].stop();
      delete req.app.locals.activeJobs[req.session.userKey];
      console.log("Stopped existing job, finished!",req.session.userKey);
    }
    
    res.redirect(`/tracker-manager/${Sha256(req.session.username)}`);

}));

router.post('/trackery/:Email/:UserName', catchAsync(async (req, res) => {
  const { userNoteToMail, itemIndex, priceIndex, url, change, priceChange,productName } = req.body;
  const { UserName: paramUser } = req.params;
  const currentEmail = req.session.email;
  // 1) Security: ensure route‑param matches session
  if (paramUser !== req.session.username) {
    return res.status(403).render('./layout/error.ejs', { data: { message: 'Unauthorized' } });
  }

  // 2) Validate change + numeric target
  if (!['rise','drop'].includes(change)) {
    return res.status(400).render('./layout/error.ejs', { data: { message: 'Invalid change type' } });
  }
  const target = parseFloat(priceChange);
  if (isNaN(target)) {
    return res.status(400).render('./layout/error.ejs', { data: { message: 'Please enter a valid number' } });
  }
  
  // 3) Fetch the exact job
  const jobDoc = await Job.findOne({ email: currentEmail, JobID: req.session.userKey });
  console.log(jobDoc)
  if (!jobDoc) {
    return res.status(404).render('./layout/error.ejs', { data: { message: 'No active job found' } });
  }

  // 4) Update in‑memory session state
  req.session.output = target;
  req.session.changeStatus = change;
  req.session.itemIndex = itemIndex;
  req.session.priceIndex = priceIndex;
  req.session.EmailContent = userNoteToMail;

  console.log(req.session.items,typeof(req.session.items));
  // 5) Fill all fields in MongoDB
  jobDoc.Product = productName;
  jobDoc.changeStatus = change;
  jobDoc.ExpectedTarget = target;
  jobDoc.URL_Page = url;
  await jobDoc.save();

  console.log('Job fully updated:', jobDoc);

  // 6) Redirect
  return res.redirect(`/ontracking/${req.session.username + req.session.user_id.slice(7)}`);
}));

router.post('/trackery/:Email', catchAsync(async (req, res) => {
    const { url, name, price, optionName, optionPrice, 
      listOfNames, listOfPrices } = req.body;
    req.session.url =url;
    const currentEmail = req.session.email;
    const io = req.app.get("io"); // Get WebSocket instance

    //Check for current false jobs in database
    const result = await Job.deleteMany({ email: currentEmail, isFinish: false });
    if (result.deletedCount > 0) {
      console.log("Deleted all jobs in Db!", result);

      //Stop current running Job
      if(req.session.userKey && req.app.locals.activeJobs){
            req.app.locals.activeJobs[req.session.userKey].stop();
            delete req.app.locals.activeJobs[currentjob.JobID]; // clean data on server-side
            res.redirect(`/tracker-manager/${Sha256(req.session.username).toString()}`);
            console.log("Stop current job and start a new one!", req.session.username)
        }
    } else {
      console.log("No running jobs found to delete.",result);
    }

    // 1) Perform an INITIAL scrape to set up session data
    const resultPage = await configureBrowser(url);
    if (resultPage.error) {
        const errorMessage = resultPage.details.includes('ERR_NAME_NOT_RESOLVED') 
            ? 'Invalid URL or domain not found' 
            : resultPage.details.includes('timeout') 
                ? 'Request timed out'
                : `URL Error: ${resultPage.details}`;

        return res.render('./layout/error.ejs', { 
            data: { message: errorMessage } 
        });
    }

    const page = resultPage;

    let itemprices = await checkPrice(page, price, optionPrice,  listOfPrices);
    let items = await checkPrice(page, name, optionName, listOfNames);

    if ((items && items.length > 0) || (itemprices && itemprices.length > 0)) {
      req.session.items = items;
      req.session.itemprices = itemprices;

    } else {
      req.session.items = "undefined";
      req.session.itemprices = "undefined";
    }
    req.session.userKey =generateJobID(req.session.username);

    // 2) Redirect ONCE so the user sees the page
    res.redirect(`/trackery/${req.session.email.split("@")[0]}/${req.session.username}`);

    // 3) Start the CronJob in the background
    //check for current Job in database
    let currentjob = await Job.findOne({ email: req.session.email }); // assuming you're querying by jobID
    
    if (currentjob && currentjob.isFinish==false) {
      console.log("<> Check for current CronJob")
      // if current job found, stop it!
      req.app.locals.activeJobs[req.session.userKey].stop();
      delete req.app.locals.activeJobs[currentjob.JobID]; // clean data on server-side
      res.redirect(`/tr-mng/${Sha256(req.session.username).toString()}`);
    }


    let job = new CronJob('*/1 * * * *', async function () { // Runs every 1 min
      try {
        let updatedItemPrices = await checkPrice(page, price, optionPrice, listOfPrices);
        let updatedItems = await checkPrice(page, name, optionName, listOfNames);

        console.log("\nWeb Scraping Job Running...");
        console.log(updatedItemPrices,"\n",updatedItems);

        // Update session and emit real-time updates
        if ((updatedItems && updatedItems.length > 0) || (updatedItemPrices && updatedItemPrices.length > 0)) {
          // req.session.items = updatedItems;
          // req.session.itemprices = updatedItemPrices;

          
          // Emit real-time updates via WebSockets
          io.emit(`priceUpdate-${req.session.username}`, { 
            items: updatedItems, 
            itemprices: updatedItemPrices,
          });
        } else {
          // req.session.items = "undefined";
          // req.session.itemprices = "undefined";
          
          // Emit "not found" update
          io.emit(`priceUpdate-${req.session.username}`, { 
            items: "undefined", 
            itemprices: "undefined" ,

          });
        }
      } catch (err) {
        console.error("Error in Cron job:", err);
      }
    });

    job.start();
    const newJob = new Job({
      JobID:req.session.userKey,
      email:currentEmail
      
    })
    await newJob.save()
    req.app.locals.activeJobs[req.session.userKey] = job;
    console.log("<> job is saved to mongodb\n",newJob)

}));


router.post('/trackery',(req,res)=>{ 
  res.redirect('/login');
});

module.exports = router;
