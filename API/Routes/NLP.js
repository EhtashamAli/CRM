const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const  {
    removeDomains,
    removePhonenumbers,
    removePostcodes,
    removeEmails,
    validateEmail,
    validateDomain,
    validatePhoneNumber,
    validatePostCode
   } = require ('../utils/functions.js');

   // Require `PhoneNumberFormat`.
const PNF = require('google-libphonenumber').PhoneNumberFormat;
// Get an instance of `PhoneNumberUtil`.
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();


   // Imports the Google Cloud client library
const vision = require('@google-cloud/vision');
const language = require ('@google-cloud/language');
const GOOGLE_CLOUD_KEYFILE =  require('../../credentials/leadcarrot.json');
// DB instance 
const DB = require('../FireBase/Firebase').DB;
const AUTH = require('../FireBase/Firebase').firebaseAuth;
const STORAGE = require('../FireBase/Firebase').Storage;
// var storageRef = STORAGE.ref();
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
    return cb(null,true);
  } else {
    cb('Error: Images Only!');
  }
}
// Creates a client
const visionClient = new vision.ImageAnnotatorClient({
    keyFilename: './credentials/leadcarrot.json',
  });

router.post('/NLP', (req, res) => {
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
              // console.log("text" , text)
              // Take a copy of the original text to reference later
              const originalText = _.cloneDeep(text);
              //console.log("originalText" , originalText)
              const cleanedText = _.replace(_.cloneDeep(originalText), /\r?\n|\r/g, ' ');
              // console.log(cleanedText)
              const languageClient = new language.LanguageServiceClient({
                keyFilename: './credentials/leadcarrot.json',
              });
              const document = {
                content: cleanedText,
                type: 'PLAIN_TEXT',
              };
              // /^\+?([0-9]{2})\)?[-. ]?([0-9]{4})[-. ]?([0-9]{4})$/
              // const testNum = cleanedText.match(/[(]?(\b\d{3}\b)?[)-. ]?(\b\d{3}\b)?[-. ]?(\b\d{4}\b)/g)
              // console.log("testNum" , testNum);
              // /\b\d{5}\b/g
                // const testNum = cleanedText.match(/\d/g);
                // console.log("testNum" , testNum)
                const arr = originalText.split("\n")
                // ['' , 'xyz.com' , '' , '']
                // console.log(arr);
    
                const reqEmail =  arr.map(str => {
                   if(validateEmail(str))
                      return str
                });
                const reqDomain =  arr.map(str => {
                  if(validateDomain(str))
                     return str
               });
               const testNum = cleanedText.match(/[(]?(\b\d{3}\b)?[)-. ]?(\b\d{3}\b)?[-. ]?(\b\d{4}\b)/g)
              //  console.log("testNum" , testNum);
               const reqNumber =  testNum.map(str => {
                const number = phoneUtil.parseAndKeepRawInput( str, 'US');
                const nationalNUm = number.getNationalNumber()
                // console.log(nationalNUm);
                if(phoneUtil.isValidNumber(number))
                  return str
                });
             const reqPostcode =  arr.map(str => {
              if(validatePostCode(str))
                 return str
              });
  
              Objnumber = reqNumber.map(num => {
                if (!_.isEmpty(num)) 
                  return {
                    phone : num ? num : '',
                    type : 'Mobile'
                  }
              });
             
                const email = reqEmail.filter((e) => e !== undefined);
                const domain = reqDomain.filter((e) => e !== undefined);
                // const number = Objnumber.filter((e) => e !== null);
                const postCode = reqPostcode.filter((e) => e !== undefined);
                // console.log("email" , email);
                // console.log("domain" , domain);
                // console.log("number" , number);
                // console.log("postCode" , postCode);
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
              // console.log('address' ,requiredEntities.LOCATION);
              // console.log('company' , requiredEntities.ORGANIZATION);
             // console.log(phoneUtil.isPossibleNumber('03159155590'));
              // data fetched from NLP //
              const DATA = {
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
                position : requiredEntities.ORGANIZATION,
                description : requiredEntities.OTHER + ' ' + requiredEntities.UNKNOWN,
                domain,
                zipCode : postCode,
                other : requiredEntities.OTHER,
                UNKNOWN : requiredEntities.UNKNOWN
              }
              //////////////////////////////////////////////////

              // CHECKS IF USER IS SIGNED IN
              if(req.body.token){
                AUTH.authToken(req.body.token)
                .then((decodedToken) => {
                  if(!decodedToken){
                      return res.status(404).json({
                          Error : "Invalid Token",
                          success : false
                      })
                  }
                  const ref = DB.collection("OCR").doc(req.body.uid).collection("History").doc()
                  ref.set(JSON.parse(JSON.stringify(DATA)))
                    .then(result => {
                        ref.get().then(doc => {
                          res.status(200).json({
                              ...doc.data(),
                              id : doc.id
                          });
                        })
                      })
                  })
                  .catch(err => {
                    res.status(500).json({
                        err
                    });
                  }); 
              } else { // IF NOT SIGNED IN
                // return your data
                 res.status(200).json({
                    ...DATA,
                    id : null
                });
              }
            }
            catch(Err) {
                res.status(404).json({
                  err : Err,
                  message : "No Text In Image"
                })
            }
           }
        }
      }
    });
  });

  module.exports = router ;