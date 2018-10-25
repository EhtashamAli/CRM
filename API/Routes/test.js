var express = require('express');
var router = express.Router();
const Multer = require('multer');
const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // no larger than 5mb, you can change as needed.
  }
});

const Storage = require('@google-cloud/storage');

const storage = Storage({
  keyFilename: 'server/firebase-service-account.json',
  projectId: process.env.FIREBASE_PROJECT_ID
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
const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);

// Process the file upload and upload to Google Cloud Storage.
router.post('/test' , (req , res) => {
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
              const img = `${req.file.filename}`;
            }
    }
    })
})
router.post('/test', multer.single('file'), (req, res, next) => {
  console.log('req.body', req.body);
  console.log('req.file', req.file);
  if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }

  // Create a new blob in the bucket and upload the file data.
  const blob = bucket.file(req.file.originalname);
  const blobStream = blob.createWriteStream();

  blobStream.on('error', (err) => {
    next(err);
    return;
  });

  blobStream.on('finish', () => {
    res.status(200).send('The image has been successfully uploaded to google cloud storage');
  });

  blobStream.end(req.file.buffer);
});

router.get('/:imageId', function (req, res, next) {
  var stream = bucket.file('Toast.jpg').createReadStream();

  res.writeHead(200, {'Content-Type': 'image/jpg' });

  stream.on('data', function (data) {
    res.write(data);
  });

  stream.on('error', function (err) {
    console.log('error reading stream', err);
  });

  stream.on('end', function () {
    res.end();
  });
});

module.exports = router;
