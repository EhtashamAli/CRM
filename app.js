const express = require('express');
const cors = require('cors');
// Routes
const NLP = require('./API/Routes/NLP');
const USER = require('./API/Routes/User');

// Init app
const app = express();
app.use(cors());
// Public Folder
app.use(express.static('./public'));

app.get('/', (req, res) => res.send('Hello'));
app.use('/' , NLP);
app.use('/user' , USER);



module.exports = app;