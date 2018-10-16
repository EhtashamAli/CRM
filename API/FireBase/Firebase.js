const admin = require('firebase-admin');
//FireStore Setup

  const serviceAccount = require("./serviceAccountKey.json");
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://cardapp-6477e.firebaseio.com"
  });
  
  var DB = admin.firestore();
  const settings = {
      timestampsInSnapshots: true
  };
  DB.settings(settings);
  module.exports = DB;