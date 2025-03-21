const puppeteer = require('puppeteer');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');
const cheerio = require('cheerio');

async function configureBrowser(url) {
    const browser = await puppeteer.launch({ headless: false }); // Set headless to false for debugging
    const page = await browser.newPage();
    await page.goto(url);
    return page;
}

function escapeCssSelector(selector) {
// This regex matches most characters that need escaping in a CSS selector.
	//return (`${selector.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^{|}~])/g, '\\$1').split(' ').join('.')}`); OLD CODE
	return selector
    .trim()// Remove any leading or trailing spaces
    .replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^{|}~])/g, '\\$1')
    .split(/\s+/)// Split on one or more whitespace characters
    .join('.');
}

async function checkPrice(page, UserSelector, userEleTypeChoice) {
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
      console.log(locationSelector);
  
    const elementsArray = $(locationSelector).toArray();
    console.log("first array length: ",elementsArray.length)
    
    
    //This will display to User UI and let User make a choice for element!
    const elements = $(locationSelector, html);
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
    } else{return ;}

    } catch (error) {
      console.error("Error checking price:", error);
    }
}


async function DoubleCheckPrice(page, UserSelector, userEleTypeChoice,UserChoice) {
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
    console.log(locationSelector);

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



module.exports = {
	configureBrowser,
	escapeCssSelector,
	checkPrice,
	DoubleCheckPrice
  };

async function sendNotificatioication(price) {

    let transporter = nodemailer.createTransport({
      host: 'mail.gmx.com',
      port: 587,
      secure: true,
      auth: {
          user: 'webtracking@gmx.com',
          pass: 'webscraping2025'
      }
    });
	/*let change;
	if(change=='drop'){
		
	} else if (change =='rise'){
		
	}*/
	
    let textToSend = 'Current price ' + price;
    let htmlText = `<a href=\"${url}\">Link</a>`;
  
    let info = await transporter.sendMail({
      from: '"Price Tracker" <*****@gmail.com>',
      to: "*****@gmail.com",    
      subject: 'Price dropped to ' + price, 
      text: textToSend,
      html: htmlText
    });
  
    console.log("Message sent: %s", info.messageId);
}
	/*
	//This will display to User UI and let User make a choice for element!
	const elements = $(locationSelector, html);
	if(elements.length >1 && ){
		for (let index = 0; index < elements.length; index++) {
			let dollarPrice = elements.eq(index).text();
			console.log(index, dollarPrice);
		}
	}
	*/ 	
	

// async function startTracking() {
//     const page = await configureBrowser(url1);
//     let job = new CronJob('*/1 * * * *', function() { //runs every 1 minute in this config
	
// 	async function getResults() {
// 		let price = await checkPrice(page, UserSelector1, 'class',1);
// 		let item = await checkPrice(page, Selector, 'class',1);
// 		console.log("\n")
// 		console.log(`${item} : ${price}`,"\n");

// 	}
// 	getResults();

//     }, null, true, null, null, true);
//     job.start();

// }


/*

<% let itemsArray = Array.isArray(items) ? items : [items]; %>
    	
  <% if (items && (Array.isArray(items) ? items.length > 0 : true)) { %>
    <% let itemsArray = Array.isArray(items) ? items : [items]; %>
    <% if (itemsArray.length === 1) { %>
      <button type="button" class="btnName" data-index="0">
        <span>Only 1 item: <%= itemsArray[0] %></span>
      </button>
    <% } else { %>
      <% itemsArray.forEach((item, i) => { %>
        <button type="button" class="btnName" data-index="<%= i %>">
          <span><%= i + 1 %>. <%= item %></span>
        </button>
      <% }); %>
    <% } %>
  <% } else { %>
    <h3>Cannot find element from your "ID" or Class"</h3>
  <% } %>
</div>

*/