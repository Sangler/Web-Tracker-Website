const puppeteer = require('puppeteer');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');
const cheerio = require('cheerio');
const Sha256 = require("sha256");

async function configureBrowser(url) {
  let browser;
  try {
      browser = await puppeteer.launch({ headless: false });
      const page = await browser.newPage();
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      if (response && response.status() >= 400 && response.status() <= 499) {
          await browser.close();
          return { 
              error: true,
              status: response.status(),
              details: `HTTP Error ${response.status()}`
          };
      }

      return page;
  } catch (error) {
      if (browser) await browser.close();
      return { 
          error: true,
          details: error.message,
          status: error.message.includes('ERR_NAME_NOT_RESOLVED') ? 400 : 500
      };
  }
}

function generateJobID(username){
  const rand = Math.floor(100000 + Math.random() * 900000);
  const randID= `${username}_${rand.toString()}`
  return Sha256(randID)
}


function escapeCssSelector(selector) {
// This regex to escape special characters in selectors.
	//return (`${selector.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^{|}~])/g, '\\$1').split(' ').join('.')}`); OLD CODE
	return selector.trim()// Remove any leading or trailing spaces
    .replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^{|}~])/g, '\\$1')
    .split(/\s+/)// Split on one or more whitespace characters
    .join('.');
}

async function checkPrice(page, UserSelector, userEleTypeChoice, listOfElements) {
    try {
    await page.reload({ waitUntil: 'domcontentloaded' });
      const html = await page.evaluate(() => document.body.innerHTML);
      //limit elements on infinite scrolling page
      const $ = cheerio.load(html);
    
      // Reload page and load its HTML into Cheerio
    let locationSelector;
    if(userEleTypeChoice=='class'){
      locationSelector='.'+escapeCssSelector(UserSelector);
    }
    if(userEleTypeChoice=='id'){
      locationSelector='#'+escapeCssSelector(UserSelector);
    }
    let suggestion=locationSelector;

    if(listOfElements && listOfElements.length>0){
      for(let i=0;i<listOfElements.length;i++){
        console.log(i, listOfElements[i])
        suggestion=suggestion+ " "+ listOfElements[i]
      }
    }
    console.log(suggestion);
  
    const elementsArray = $(suggestion).toArray();
    console.log("first array length: ",elementsArray.length)
    
    
    //This will display to User UI and let User make a choice for element!
    const elements = $(suggestion, html);
    const elementRes=[];
    // 2 returns condition
    if(elements.length ==1  ){
      elementRes.push(elements.text().trim());
      return elementRes

	}
	  
    if(elements.length >1  ){
      for (let index = 0; index < elements.length; index++) {
        let dollarPrice = elements.eq(index).text().trim();
        console.log(index, dollarPrice);
        elementRes.push(dollarPrice);
      }
	  return elementRes
    } else{return "undefined";}

    } catch (error) {
      console.error("Error checking price:", error);
    }
}

/*
async function DoubleCheckPrice(page, UserSelector, userEleTypeChoice, listOfElements, UserChoice) {
  try {
	await page.reload({ waitUntil: 'domcontentloaded' });
    const html = await page.evaluate(() => document.body.innerHTML);
	//Fixing infinite scrolling page
    const $ = cheerio.load(html);
	
    // Reload page and load its HTML into Cheerio
	let locationSelector;
	if(userEleTypeChoice=='class'){
		locationSelector='.'+escapeCssSelector(UserSelector);
	}
	if(userEleTypeChoice=='id'){
		locationSelector='#'+escapeCssSelector(UserSelector);
	}
	let suggestion=locationSelector;

  if(listOfElements.length>0){
    for(let i=0;i<listOfElements.length;i++){
      console.log(i, listOfElements[i])
      suggestion+ " "+ listOfElements[i]
    }
  }
  console.log(suggestion);

	const elementsArray = $(locationSelector).toArray();
	console.log("first array length: ",elementsArray.length)
	


	if(elementsArray.length>1){
		// Simulating user choice: selecting element at index 2 (adjust if needed)
		let selectedElement = $(elementsArray[UserChoice - 1]);
		for (let i = 1; i < 7; i++) {
			console.log("i= " + i);
			;
			//if (i > 1) {
				let parent = selectedElement.parent();
				//console.log("\n",$.html(parent),"\n")
				if (parent.attr('id')) {
				  suggestion = `#${escapeCssSelector(parent.attr('id'))} ` + suggestion;
				} else if (parent.attr('class')) {
				  suggestion = `.${escapeCssSelector(parent.attr('class'))}` +" " +suggestion;
				  console.log(suggestion)
				} else {
				// Fallback: if no id or class exists, use the tag name.
				  suggestion= parent[0].name.toLowerCase()+' ' + suggestion;
				}
				suggestion = suggestion.trim();
				selectedElement = parent;
				let userChoiceElement= $(suggestion).toArray();
				console.log("\n",$(($(suggestion).toArray())[UserChoice - 1]).text().trim(),"\n");
				console.log("parent element length: ",userChoiceElement.length);
				console.log("parent element: ",suggestion);
				
				if(i==6){
					return $(userChoiceElement[UserChoice - 1]).text().trim();
					break;
				}
				
				if($(suggestion).toArray().length==1){
					console.log(`CurrentUserSelector ="${suggestion}"\n`);
					console.log("Result: ",$(suggestion).text().trim())
					return $(suggestion).text().trim();
					break;
				}
			//}		
		}	

	} else if(elementsArray.length==1){
		console.log("Result: "+$(elementsArray[0]).text().trim());
		return $(elementsArray[0]).text().trim()
	} else if (elementsArray.length==0){
		console.log("No element found within your provided element!");
		return "Cannot Scrape due to Invalid Class or Id!";
	}	
 
  } catch (error) {
    console.error("Error checking price:", error);
  }
}
  */

async function sendNotification(email, url, name, changeOutput, changeStatus) {
  let transporter = nodemailer.createTransport({
    host: 'mail.gmx.com',
    port: 465,
    secure: true,
    auth: {
      user: 'webtracking@gmx.com',
      pass: 'webscraping2025'
    }
  });

  // Styled email template
  const emailStyle = `
    <style>
      .container { max-width: 600px; margin: 20px auto; padding: 20px; font-family: Arial, sans-serif; }
      .header { background: #f8f9fa; padding: 20px; border-radius: 10px 10px 0 0; }
      .content { padding: 30px 20px; background: #ffffff; }
      .price-change { color: #2c3e50; font-size: 18px; margin: 15px 0; }
      .cta-button { 
        display: inline-block; 
        padding: 12px 25px;
        background-color: #3498db; 
        color: white !important; 
        text-decoration: none; 
        border-radius: 5px; 
        margin: 20px 0;
      }
      .footer { 
        margin-top: 30px; 
        padding-top: 20px; 
        border-top: 1px solid #eeeeee; 
        color: #7f8c8d; 
        font-size: 12px;
      }
    </style>
  `;

  const emailTemplate = `
    <div class="container">
      <div class="header">
        <img src="https://example.com/logo.png" alt="Price Tracker Logo" width="150">
      </div>
      <div class="content">
        <h2 style="color: #2c3e50;">Hello there,</h2>
        <p class="price-change">
          The price of <strong>${name}</strong> has 
          <span style="color: ${changeStatus=='drop' ? '#e74c3c' : '#2ecc71'}; font-weight: bold;">
            ${changeStatus}
          </span> 
          to <strong>${changeOutput}</strong>
        </p>
        <p style="color: #7f8c8d;">Check out the latest price now:</p>
        <a href="${url}" class="cta-button">View Product</a>
        <p style="color: #7f8c8d; font-size: 14px;">
          This is an automated notification from Price Tracker service.
        </p>
      </div>
      <div class="footer">
        <p>🔔 The email you receive due to your subscription to price alerts</p>
        <p>© ${new Date().getFullYear()} Price Tracker. All rights reserved.</p>
      </div>
    </div>
  `;

  let info = await transporter.sendMail({
    from: `"App Tracker" <webtracking@gmx.com>`,
    to: email,
    subject: `Changes Alert! ${name} ${changeStatus} to ${changeOutput}`,
    text: `Hello, the price of ${name} just ${changeStatus} to ${changeOutput}. Check here: ${url}`,
    html: emailStyle + emailTemplate
  });

  console.log("Message sent: %s", info.messageId);
}


module.exports = {
	configureBrowser,
	escapeCssSelector,
	checkPrice,
  sendNotification,
  generateJobID
  };

