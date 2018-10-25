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
    validatePostCode,
    ValidateAddress
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
const ADMIN = require('../FireBase/Firebase').admin;
const STORAGE = require('../FireBase/Firebase').Storage;

// DATE OBJECT
const DATE = new Date();

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
               const testNum = cleanedText.match(/[(]?(\b\d{3}\b)?[)-. ]?[ ]?(\b\d{3}\b)?[-. ]?(\b\d{4}\b)/g)
              //  console.log(testNum);
              const objPostCode = ValidateAddress(cleanedText , req.body.countryCode);
              // console.log("objPostCode" , objPostCode);
               ////////////////////////////////////////////////////////////////
               let reqNumber =  testNum.map(str => {
                  const number = phoneUtil.parseAndKeepRawInput( str, req.body.countryCode);
                  const nationalNUm = number.getNationalNumber();
                  // console.log("nationalNUm" , nationalNUm)
                  // console.log("number" , number)
                if(phoneUtil.isValidNumber(number))
                  return nationalNUm
                else 
                  console.log("Something went wrong during parsing the number" , str)
                });
                reqNumber = reqNumber.filter( el => {
                  return el != null;
                })
                // console.log("reqNumber" , reqNumber)
              Objnumber = reqNumber.map(num => {
                // console.log("numin map" , num)
                // if (!_.isEmpty(num)) 
                  return {
                    phone : num ? req.body.cCode + " " + num : '',
                    type : 'Mobile'
                  }
              });
              // console.log("objNumber" , Objnumber)
              
                const email = reqEmail.filter((e) => e !== undefined);
                const domain = reqDomain.filter((e) => e !== undefined);
                // const number = Objnumber.filter((e) => e !== null);
                // const postCode = reqPostcode.filter((e) => e !== undefined);
         
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
                  message : "Something Went Wrong with Language Client"
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
            //  console.log(phoneUtil.isPossibleNumber('03159155590'));
              // data fetched from NLP //
              const DATA = {
                firstName : requiredEntities.PERSON,
                lastName : requiredEntities.PERSON,
                phoneNumber : Objnumber,
                address : [
                  {
                    zip: objPostCode.zipCode[0] ? objPostCode.zipCode[0] : null,
                    address : objPostCode.PhysicalAddress +" " + objPostCode.Street +", " +  objPostCode.City +" " +  objPostCode.Province,
                    countryCodeError : objPostCode.countryCodeError ? true : false 
                  }
                 ],
                email,
                company : requiredEntities.ORGANIZATION,
                position : requiredEntities.ORGANIZATION,
                description : requiredEntities.OTHER + ' ' + requiredEntities.UNKNOWN,
                domain,
                //zipCode : postCode,
                other : requiredEntities.OTHER,
                UNKNOWN : requiredEntities.UNKNOWN,
                image : req.body.image ? req.body.image : null,
                addedAt : DATE.toLocaleString(),
                updatedAt : "",
              }
              // console.log(DATA);
              //////////////////////////////////////////////////

              // CHECKS IF USER IS SIGNED IN
              if((req.body.token )){
                //console.log("here")
                ADMIN.auth().verifyIdToken(req.body.token)
                .then(decodedToken => {
                  if(!(decodedToken.uid == req.body.uid)) {
                    return res.status(404).json({
                      Error : "Invalid Token",
                      success : false
                    });
                  }
                  const ref = DB.collection("LOGIN USERS").doc(req.body.uid).collection("History").doc()
                  ref.set(JSON.parse(JSON.stringify(DATA)))
                    .then(result => {
                        ref.get().then(doc => {
                          res.status(200).json({
                              ...doc.data(),
                              isUserAvailable : true,
                              id : doc.id
                          });
                        })
                        .catch(err => {
                          res.status(500).json({
                            ERROR : err,
                            message : "UNABLE TO fetch DATA from DB"
                          })
                        })
                      })
                      .catch(err => {
                        res.status(500).json({
                          ERROR : err,
                          message : "UNABLE TO SAVE DATA IN DB"
                        });
                      })
                })
                .catch( err => {
                  res.status(500).json({
                    ERROR : err,
                    message : "UNABLE TO DECODE TOKEN"
                  });
                })
              } else {
                // IF NOT SIGNED IN
                // return your data
                const ref = DB.collection("NOT LOGGED IN USERS").doc("OCRCRMUSERS").collection("History").doc()
                ref.set(JSON.parse(JSON.stringify(DATA)))
                  .then(result => {
                      ref.get().then(doc => {
                        res.status(200).json({
                            ...doc.data(),
                            isUserAvailable : false,
                            id : doc.id
                        });
                      })
                      .catch(err => {
                        res.status(500).json({
                          ERROR : err,
                          message : "UNABLE TO fetch DATA from DB"
                        })
                      })
                    })
                    .catch(err => {
                      res.status(500).json({
                        ERROR : err,
                        message : "UNABLE TO SAVE DATA IN DB"
                      });
                    });
              }
            }
            catch(Err) {
                res.status(404).json({
                  err : Err,
                  message : "No Text In Image or something went wrong"
                })
            }
           }
        }
      }
    });
  });

  module.exports = router ;