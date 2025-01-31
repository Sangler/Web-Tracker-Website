const express = require('express');
const app = express();
const path = require('path'); 
const session  = require('express-session');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
//const flash = require('connect-flash');

const keys = require('./utils/process-env.js');

const PORT = 6969
app.engine('ejs', ejsMate)
// Set the view engine to EJS
app.set('view engine', 'ejs');
// Set the views directory to your "template" directory
app.set('views', path.join(__dirname, 'template'));



// Sessions
const sessionConfig = {
  secret: keys.sessions.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
      httpOnly: true,
      expires: Date.now() + 1000 * 60* 60 * 24, //  * 7
      maxAge: 1000 * 60 * 60*  24 // * 7
  }
}
app.use(session(sessionConfig));

//Use packages
app.use(methodOverride('_method'));
//set static directory (CSS apply)
app.use(express.static('static')); //middleware will listen for any requests
app.use(express.urlencoded({extended:true}));

//Mongoose connection & set-up
const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
mongoose.connect('mongodb://127.0.0.1:27017/User-Email_SMTP')
.then(data=>{
  console.log('Attach schemas')
})
.catch(err =>{
  console.log(err)
});

//Set up connection using mongoose
const db = mongoose.connection;
db.on('error', (error) => console.error('MongoDB connection error:', error));
db.once('open', () => console.log('Connected to MongoDB'));

const auth_router = require('./routers/authRouter.js');
const user_router = require('./routers/usageRouter.js');

app.use('/', auth_router);
app.use('/', user_router);


//Catch all not found pages
app.get("*", (req,res) => {
    res.status(404).send("404 PAGE NOT FOUND!") 
  });
  
  
  //RUN THE SERVER
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  