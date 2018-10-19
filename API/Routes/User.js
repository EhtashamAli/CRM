const router = require('express').Router();
const DB = require('../FireBase/Firebase');
const bcrypt = require('bcrypt');
const USER = DB.collection("USER");
const HISTORY = DB.collection("HISTORY");
const validateRegisterInput = require('../utils/register');

router.post('/update:id' , (req , res) => {
    USER.doc(req.params.id).collection("HISTORY").doc()
    .set({
        name : req.body.name
    },  { merge: true })
    .then(result => {
         res.status(200).json({
            result : result
        });
    })
    .catch(err => {
      res.status(500).json({
         err
      });    
    });
});


//   m5kOdvy00Hu2MEI1HoM3
router.post('/login' , (req , res) => {

    let user = [];
    let Password = ''; //declare array for retrieving documents
    USER.where('Email','==', req.body.email)
    .get()
    .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            // console.log(doc.data());
            user.push(doc.id);
            Password = doc.data().Password;
        });
        if(user.length <= 0){
            res.status(404).json({
                result: "1Email or password is incorrect"
            }); 
        } else {
            bcrypt.compare(req.body.password, Password)
            .then(isMatch => {
              if (isMatch) {
                res.status(200).json({
                            id: user[0]
                        });
              } else {
                res.status(404).json({
                  status: 404,
                  message: "Email or password is incorrect"
                })
              }
            })
            .catch(err => {
              res.status(500).json({
                status: "Something Went Wrong",
                Error: {
                  Message: err
                }
              });
            });
        }
    })
    .catch(err => {
        res.status(500).json({
            status: "Something Went Wrong",
            Error: {
              Message: err
            }
          });
    })
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
            // console.log(userExist);
             res.status(500).json({
                result: "Email Already Exists"
            });  
        } else {
            // console.log('else');
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
                  })
                  .catch(err => {
                    res.status(500).json({
                       err
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


module.exports = router;

// USER.where('Email','==', req.body.email)
// .onSnapshot(querySnapshot=> {
//     querySnapshot.forEach((doc) => {
//         console.log(doc.id);
//         user.push(doc.id);
//         Password = doc.data().Password;
//     });
//     if(user.length <= 0){
//         res.status(404).json({
//             result: "1Email or password is incorrect"
//         });  
//     } else {
//         bcrypt.compare(req.body.password, Password)
//         .then(isMatch => {
//           if (isMatch) {
//             res.status(200).json({
//                         id: user[0]
//                     });
//           } else {
//             res.status(404).json({
//               status: 404,
//               message: "Email or password is incorrect"
//             })
//           }
//         })
//         .catch(err => {
//           res.status(500).json({
//             status: "Something Went Wrong",
//             Error: {
//               Message: err
//             }
//           });
//         });
//     }
// },(error)=>{
//         res.status(500).json({
//             error: error
//         })
// });