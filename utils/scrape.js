const puppeteer = require('puppeteer');
const $ = require('cheerio');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');

const url = 'https://www.amazon.com/Redragon-S101-Keyboard-Ergonomic-Programmable/dp/B00NLZUM36/ref=sr_1_1?_encoding=UTF8&content-id=amzn1.sym.12129333-2117-4490-9c17-6d31baf0582a&dib=eyJ2IjoiMSJ9.KSM1d0PsowFMtx0zqbVn0QuxQEurUUrpefohDcixF-6-9LygUyQMy3S4TgbS0ozcRj0TkT2ob-kVH33nr0eP4irq8o4VNU7KgElpnAPsYhPbPgCgkTKnwt43Z7oWXXYhLwHn0JFIZJFm25SkpeEqTfYK2dc3wBvtkVFr6JQiEv63T2l9JCRk4t-lsNkEQbk_b9foOMTjpT9HoxyotZal4Jqqdzj6NjDQX7_ii2OnmBk.PhLGl4fHQaDgHM5V_DZv0PO7ZvWvYvDy56-ooBpMAhk&dib_tag=se&keywords=gaming%2Bkeyboard&pd_rd_r=9e075b8a-1ed5-4558-a1c6-bad6d7b3b834&pd_rd_w=aRQIB&pd_rd_wg=FjA0t&qid=1738261122&sr=8-1&th=1';

async function configureBrowser() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    return page;
}

async function checkPrice(page) {
    await page.reload();
    let html = await page.evaluate(() => document.body.innerHTML);
    // console.log(html);

    $('#priceblock_dealprice', html).each(function() {
        let dollarPrice = $(this).text();
        // console.log(dollarPrice);
        let currentPrice = Number(dollarPrice.replace(/[^0-9.-]+/g,""));

        if (currentPrice < 300) {
            console.log("BUY!!!! " + currentPrice);
            sendNotificatioication(currentPrice);
        }
    });
}

async function startTracking() {
    const page = await configureBrowser();
  
    let job = new CronJob('* */30 * * * *', function() { //runs every 30 minutes in this config
      checkPrice(page);
    }, null, true, null, null, true);
    job.start();
}

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
  
    let textToSend = 'Price dropped to ' + price;
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

startTracking();