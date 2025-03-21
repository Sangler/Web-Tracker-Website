const express = require('express');
const app = express();
const path = require('path'); 
const session  = require('express-session');
const ejsMate = require('ejs-mate');

const methodOverride = require('method-override');
const http = require('http'); // Required for socket.io
const socketIo = require('socket.io'); // Import socket.io


const keys = require('./utils/process-env.js');

const PORT = 7000;

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'template'));

// Sessions
const sessionConfig = {
  secret: keys.sessions.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly:true,
    expires: Date.now() + 1000 * 60* 60 * 24,
    maxAge: 1000 * 60 * 60*  24
  },
};
app.use(session(sessionConfig));

app.use(methodOverride('_method'));
app.use(express.static('static')); // Serve static files
app.use(express.urlencoded({extended:true}));

// Create HTTP server & attach socket.io
const server = http.createServer(app);
const io = socketIo(server); // Attach Socket.io

// Store `io` in app for access in routes
app.set("io", io);

// Mongoose connection
const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
mongoose.connect('mongodb://127.0.0.1:27017/UserEmailStorage')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error(err));

// Import routes
const auth_router = require('./routers/authRouter.js');
const user_router = require('./routers/usageRouter.js');

app.use('/', auth_router);
app.use('/', user_router);

// Catch-all route for 404
app.get("*", (req,res) => {
    res.status(404).send("404 PAGE NOT FOUND!") 
});

// Run server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
