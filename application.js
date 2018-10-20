const express = require('express');
const cors = require('cors');
const bodyparser = require('body-parser');
const logger = require('morgan') ;
const passport = require('passport');
// Routes
const NLP = require('./API/Routes/NLP');
const USER = require('./API/Routes/User');

// Init app
const app = express();
app.use(cors());
app.use(logger('dev'));
app.use(bodyparser.json()) ;
app.use(bodyparser.urlencoded({extended: false})) ;
app.use(passport.initialize());
require('./API/Passport/Strategy')(passport);
// Public Folder
app.use(express.static('./public'));

app.use((req,res,next) => {
    res.header("Access-Control-Allow-Origin" , "*");
    res.header("Access-Control-Allow-Headers" ,
               "Origin , X-Requested-With , Content-Type , Accept , Authorization"
    );
    if(req.method === 'OPTIONS') {
      res.header("Access-Control-Allow-Methods" , 'PUT , POST , PATCH , DELETE , GET');
      return res.status(200).json({});
    }
    next();
  });

app.get('/', (req, res) => res.send('Hello'));
app.use('/' , NLP);
app.use('/user' , USER);


//Error Handlers
app.use((req , res , next) => {
  const error = new Error('not found');
  error.status = 404;
  next(error);
});

app.use((error , req , res , next) => {
    res.status(error.status || 500);
    res.json({
      Error: {
        message: error.message
      }
    });
});

module.exports = app;