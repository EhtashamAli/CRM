const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const cors = require('cors');
const  {
  removeDomains,
  removePhonenumbers,
  removePostcodes,
  removeEmails,
  validateEmail,
  validateDomain,
  validatePhoneNumber,
  validatePostCode
 } = require ('./functions');

 const GOOGLE_CLOUD_KEYFILE =  require('./credentials/leadcarrot.json');
// Imports the Google Cloud client library
const vision = require('@google-cloud/vision');
const language = require ('@google-cloud/language');

// Creates a client
  const visionClient = new vision.ImageAnnotatorClient({
    keyFilename: './credentials/leadcarrot.json',
  });

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
  limits:{fileSize: 1000000000},
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
    console.log("tufail true" ,file);
    return cb(null,true);
  } else {
    console.log("tufail false" ,file);
    cb('Error: Images Only!');
  }
}

// Init app
const app = express();
app.use(cors());
// EJS
//app.set('view engine', 'ejs');

// Public Folder
app.use(express.static('./public'));

app.get('/', (req, res) => res.send('Hello'));

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
        getresult(img);
        async function getresult (file) {
          // Send image to Image API for OCR
          let visionResults;
          try {
            visionResults = await visionClient.textDetection(file);
          } catch (err) {
            // Throw error
            res.status(500).json({
              errorCode : 500,
              Error : err
            })
          }
          try {
            var { text } = visionResults[0].fullTextAnnotation;
          }
          catch(Err) {
              res.status(404).json({
                err : Err,
                message : "No Text In Image"
              })
          }
            // console.log("text" , text)
            // Take a copy of the original text to reference later
            const originalText = _.cloneDeep(text);
            console.log("originalText" , originalText)
            // // Remove postcodes
            // const { postcodes ,stringWithoutPostcodes } = removePostcodes(text);
            // // console.log('Postcodes' , postcodes);
            // text = stringWithoutPostcodes;
            // // Remove phonenumbers
            // const { phonenumbers, stringWithoutPhonenumbers } = removePhonenumbers(text);
            // // console.log('PhoneNumber' , phonenumbers);
            // text = stringWithoutPhonenumbers;
            // // Remove detected emails
            // const { emails, stringWithoutEmails } = removeEmails(text);
            // // console.log("emails" , emails); 
            // // console.log("stringWithoutEmails" , stringWithoutEmails);
            // text = stringWithoutEmails;
            // // Remove detected domains
            // const {  stringWithoutDomains } = removeDomains(text);
            // // console.log("domains" , domains);
            // text = stringWithoutDomains;
            // // Clean text and send to natural language API
            const cleanedText = _.replace(_.cloneDeep(originalText), /\r?\n|\r/g, ' ');
            // console.log('cleanedText' , cleanedText);
            const languageClient = new language.LanguageServiceClient({
              keyFilename: './credentials/leadcarrot.json',
            });
            const document = {
              content: cleanedText,
              type: 'PLAIN_TEXT',
            };
  
              const arr = originalText.split("\n")
              // ['' , 'xyz.com' , '' , '']
  
              const reqEmail =  arr.map(str => {
                 if(validateEmail(str))
                    return str
              });
              const reqDomain =  arr.map(str => {
                if(validateDomain(str))
                   return str
             });
             const reqNumber =  arr.map(str => {
              if(validatePhoneNumber(str))
                 return str
           });
           const reqPostcode =  arr.map(str => {
            if(validatePostCode(str))
               return str
            });

            Objnumber = reqNumber.map(num => {
              return {
                phone : num ? num : '',
                type : 'Mobile'
              }
            });
           
              const email = reqEmail.filter((e) => e !== undefined);
              const domain = reqDomain.filter((e) => e !== undefined);
              const number = Objnumber.filter((e) => e.number !== undefined);
              const postCode = reqPostcode.filter((e) => e !== undefined);
              console.log("email" , email);
              console.log("domain" , domain);
              console.log("number" , number);
              console.log("postCode" , postCode);
            let languageResults;
            try {
              languageResults = await languageClient.analyzeEntities({
                document: {
                  content: cleanedText,
                  type: 'PLAIN_TEXT',
                },
              });
            } catch (err) {
              res.status(500).json({
                err : err,
              })
            }
            // Go through detected entities
            const { entities } = languageResults[0];
            const requiredEntities = { ORGANIZATION: '', PERSON: '', LOCATION: '' , OTHER: '' , UNKNOWN: ''};
            _.each(entities, entity => {
              const { type } = entity;
              if (_.has(requiredEntities, type)) {
                requiredEntities[type] += ` ${entity.name}`;
              }
            });

            // return your data
            res.status(200).json({
              firstName : requiredEntities.PERSON,
              lastName : requiredEntities.PERSON,
              phonenumber : Objnumber,
              address : [
                {
                  zip: '',
                  address : requiredEntities.LOCATION
                }
               ],
              email,
              company : requiredEntities.ORGANIZATION,
              position : requiredEntities.PERSON,
              description : requiredEntities.OTHER + ' ' + requiredEntities.UNKNOWN,
              domain,
              zipCode : postCode,
              other : requiredEntities.OTHER,
              UNKNOWN : requiredEntities.UNKNOWN
            })
         }
      }
    }
  });
});

module.exports = app;