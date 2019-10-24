const admin = require('firebase-admin');
let FirebaseAuthNode = require('firebase-auth-node');
 

//FireStore Setup

  const serviceAccount = require("./serviceAccountKey.json");
  var config = {
    // apiKey: "",
    // authDomain: "",
    // databaseURL: "",
    // projectId: "",
    // storageBucket: "",
    // messagingSenderId: ""
  };

  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "",
    storageBucket : ""
  });
  const Storage = admin.storage();
  const DB = admin.firestore();
  const settings = {
      timestampsInSnapshots: true
  };
  DB.settings(settings);

  let firebaseAuth = new FirebaseAuthNode( config, serviceAccount);

  module.exports = {
    admin,
    DB,
    firebaseAuth,
    Storage
  };