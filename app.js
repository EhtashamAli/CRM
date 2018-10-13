const express = require('express');
const multer = require('multer');
const path = require('path');
// Imports the Google Cloud client library
const vision = require('@google-cloud/vision');

// Creates a client
const client = new vision.ImageAnnotatorClient();

// Set The Storage Engine
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb){
    cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Init Upload
const upload = multer({
  storage: storage,
  limits:{fileSize: 1000000},
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).single('myImage');

// Check File Typeconst port = 3000;

function checkFileType(file, cb){
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error: Images Only!');
  }
}

// Init app
const app = express();

// EJS
//app.set('view engine', 'ejs');

// Public Folder
app.use(express.static('./public'));

//app.get('/', (req, res) => res.render('index'));

app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if(err){
      res.status(500).json({
        error : err
      });
    } else {
      if(req.file == undefined){
        res.status(500).json({
          error : "no file selected"
        });
      } else {

        // Performs label detection on the image file
        client
        .labelDetection(`./public/uploads/${req.file.filename}`)
        .then(results => {
          const labels = results[0].labelAnnotations;

          console.log('Labels:');
          labels.forEach(label => console.log(label.description));
        })
        .catch(err => {
          console.error('ERROR:', err);
        });
        // res.status(500).json( {
        //   msg: 'File Uploaded!',
        //   file: `uploads/${req.file.filename}`
       // });
      }
    }
  });
});

module.exports = app;