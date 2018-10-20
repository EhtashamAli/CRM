const admin = require('firebase-admin');
let FirebaseAuthNode = require('firebase-auth-node');
 

//FireStore Setup

  const serviceAccount = require("./serviceAccountKey.json");
  var config = {
    apiKey: "AIzaSyAT66IQbLXFqkCwRhMGcV8RJGBYevc3vr0",
    authDomain: "cardapp-6477e.firebaseapp.com",
    databaseURL: "https://cardapp-6477e.firebaseio.com",
    projectId: "cardapp-6477e",
    storageBucket: "cardapp-6477e.appspot.com",
    messagingSenderId: "24973912320"
  };

  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://cardapp-6477e.firebaseio.com"
  });
  
  const DB = admin.firestore();
  const settings = {
      timestampsInSnapshots: true
  };
  DB.settings(settings);

  let firebaseAuth = new FirebaseAuthNode( config, serviceAccount);

  module.exports = {
    DB,
    firebaseAuth
  };