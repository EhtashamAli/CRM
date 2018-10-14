const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const  {
  removeDomains,
  removePhonenumbers,
  removePostcodes,
  removeEmails,
 } = require ('./functions');

 const GOOGLE_CLOUD_KEYFILE =  require('./credentials/leadcarrot.json');
// Imports the Google Cloud client library
const vision = require('@google-cloud/vision');
const language = require ('@google-cloud/language');

// Creates a client
  const visionClient = new vision.ImageAnnotatorClient();

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
        const img = `./public/uploads/${req.file.filename}`;
        // fs.readFile(img, function(err, data){
        //   if(err) console.log(err);
        //   console.log("img" , data)
        // });
        
        getresult(img);
        async function getresult (file) {
          // Send image to Image API for OCR
          let visionResults;
          try {
            // const buf = Buffer.from(file, 'base64');
            // console.log('buf',buf)
            visionResults = await visionClient.textDetection(file);
            console.log('visionresult1',visionResults)

          } catch (err) {
            // Throw error
            console.log("Myerror",err);
          }
          // Text will be a string of all the text detected in the image.
          // E.g "John Smith\n Test Company\n 01234567890\n 1 Random Place\n P0S TC0DE\n www.johnsmith.com\n john.smith@testcompany.com\n" (Note the newlines)
          console.log('visionresult2',visionResults)
          let { text } = visionResults[0].fullTextAnnotation;
          console.log("text" , text)
          // Take a copy of the original text to reference later
          const originalText = _.cloneDeep(text);
          console.log("originalText" , originalText)
          // Remove postcodes
          const { stringWithoutPostcodes } = removePostcodes(text);
          console.log('stringWithoutPostcodes' , stringWithoutPostcodes);
          text = stringWithoutPostcodes;
          // Remove phonenumbers
          const { phonenumbers, stringWithoutPhonenumbers } = removePhonenumbers(text);
          console.log(phonenumbers);
          text = stringWithoutPhonenumbers;
          // Remove detected emails
          const { emails, stringWithoutEmails } = removeEmails(text);
          console.log("emails" , emails); 
          console.log("stringWithoutEmails" , stringWithoutEmails);

          text = stringWithoutEmails;
          // Remove detected domains
          const { domains ,stringWithoutDomains } = removeDomains(text);
          console.log("domains" , domains);
          text = stringWithoutDomains;
          // Clean text and send to natural language API
          const cleanedText = _.replace(_.cloneDeep(text), /\r?\n|\r/g, ' ');
          console.log('cleanedText' , cleanedText);
          const languageClient = new language.LanguageServiceClient();
          let languageResults;
          try {
            languageResults = await languageClient.analyzeEntities({
              document: {
                content: cleanedText,
                type: 'PLAIN_TEXT',
              },
            });
          } catch (err) {
            // Throw an error
          }
          // Go through detected entities
          const { entities } = languageResults[0];
          const requiredEntities = { ORGANIZATION: '', PERSON: '', LOCATION: '' };
          _.each(entities, entity => {
            const { type } = entity;
            if (_.has(requiredEntities, type)) {
              requiredEntities[type] += ` ${entity.name}`;
            }
          });
          // return your data
          res.status(200).json({
            data : languageResults,
            entities,
            requiredEntities
          })
         }
         
         








        // var visionResults;
      
        //   const buf = Buffer.from(`./public/uploads/${req.file.filename}`, 'base64');
        //   visionResults =  visionClient.textDetection(buf).then(() => {
        //         // Text will be a string of all the text detected in the image.
        //         // E.g "John Smith\n Test Company\n 01234567890\n 1 Random Place\n P0S TC0DE\n www.johnsmith.com\n john.smith@testcompany.com\n" (Note the newlines)
        //         let { text } = visionResults[0].fullTextAnnotation;
        //         // Take a copy of the original text to reference later
        //         const originalText = _.cloneDeep(text);
        //         // Remove postcodes
        //         const { stringWithoutPostcodes } = removePostcodes(text);
        //         text = stringWithoutPostcodes;
        //         // Remove phonenumbers
        //         const { phonenumbers, stringWithoutPhonenumbers } = removePhonenumbers(text);
        //         text = stringWithoutPhonenumbers;
        //         // Remove detected emails
        //         const { emails, stringWithoutEmails } = removeEmails(text);
        //         text = stringWithoutEmails;
        //         // Remove detected domains
        //         const { stringWithoutDomains } = removeDomains(text);
        //         text = stringWithoutDomains;
        //         // Clean text and send to natural language API
        //         const cleanedText = _.replace(_.cloneDeep(text), /\r?\n|\r/g, ' ');
        //         const languageClient = new language.LanguageServiceClient({
        //           keyFilename: GOOGLE_CLOUD_KEYFILE,
        //         });
        //         let languageResults;
        //           languageResults =  languageClient.analyzeEntities({
        //             document: {
        //               content: cleanedText,
        //               type: 'PLAIN_TEXT',
        //             },
        //           }).then(() => {
        //               // Go through detected entities
        //               const { entities } = languageResults[0];
        //               const requiredEntities = { ORGANIZATION: '', PERSON: '', LOCATION: '' };
        //               _.each(entities, entity => {
        //                 const { type } = entity;
        //                 if (_.has(requiredEntities, type)) {
        //                   requiredEntities[type] += ` ${entity.name}`;
        //                 }
        //               });
        //               // return your data
        //           }).catch((err) => {
        //             console.log('err2' + err);
        //           })
        //   })
        //   .catch((err) => {
        //     console.log(err);
        //   })
       
        
       
       
       
        // // Performs label detection on the image file
        // client
        // .labelDetection(`./public/uploads/${req.file.filename}`)
        // .then(results => {
        //   const labels = results[0].labelAnnotations;

        //   console.log('Labels:');
        //   labels.forEach(label => console.log(label.description));
        // })
        // .catch(err => {
        //   console.error('ERROR:', err);
        //});
        // res.status(500).json( {
        //   msg: 'File Uploaded!',
        //   file: `uploads/${req.file.filename}`
       // });
      }
    }
  });
});

module.exports = app;