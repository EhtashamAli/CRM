const router = require('express').Router();
const DB = require('../FireBase/Firebase');
const bcrypt = require('bcrypt');
const USER = DB.collection("USER");
const validateRegisterInput = require('../utils/register');

//   m5kOdvy00Hu2MEI1HoM3
router.post('/login' , (req , res) => {

    let user = [];
    let Password = []; //declare array for retrieving documents
    USER.where('UserName','==', req.body.UserName)
    .onSnapshot(querySnapshot=> {
        querySnapshot.forEach((doc) => {
            // binded to the UI
            user.push(doc.id);
            Password.push(doc.data().Password);
        });
        if(user.length <= 0){
            res.status(404).json({
                result: "NOT FOUND"
            });  
        } else {
            if(req.body.Password == Password) {
                res.status(200).json({
                    id: user
                });  
            } else {
                res.status(404).json({
                    result: "NOT FOUND"
                });  
            }
        }

    },(error)=>{
            res.status(500).json({
                error: error
            })
    });
});
router.post('/register' , (req , res) => {

    const {
        errors,
        isValid
      } = validateRegisterInput(req.body);

      if (!isValid) {
        return res.status(500).json(errors);
      }

    const userExist = [];
    USER.where('Email','==', req.body.email)
    .get()
    .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            userExist.push(doc.data().Email);
        });
        if(userExist.length > 0){
            console.log(userExist);
             res.status(500).json({
                result: "Email Already Exists"
            });  
        } else {
            console.log('else');
            const User = {
                UserName : req.body.name,
                Password : req.body.password,
                Email : req.body.email
            }
             bcrypt.genSalt(10, function (err, salt) {
                bcrypt.hash(User.Password, salt, function (err, hash) {
                  // if (err) throw err;
                  User.Password = hash

                  USER.doc()
                  .set(JSON.parse(JSON.stringify(User)))
                  .then(result => {
                       res.status(200).json({
                          result : User
                      });
                  });
                });
              });
        }
    })
    .catch(function(error) {
        console.log("Error getting documents: ", error);
    });

    //  USER.where('Email','==', req.body.email)
    // .onSnapshot(querySnapshot=> {
    //     querySnapshot.forEach((doc) => {
    //         userExist.push(doc.data().Email);
    //     });
        
    //     },(error)=>{
    //         res.status(500).json({
    //             error
    //         });   
    //     });             
});

router.post('/update' , (req , res) => {

});

module.exports = router;