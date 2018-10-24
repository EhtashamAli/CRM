const router = require('express').Router();
const passport = require('passport');
const DB = require('../FireBase/Firebase').DB;
const ADMIN = require('../FireBase/Firebase').admin;
const AUTH = require('../FireBase/Firebase').firebaseAuth;
// const bcrypt = require('bcrypt');
// const USER = DB.collection("USER");
// const HISTORY = DB.collection("HISTORY");
// const validateRegisterInput = require('../utils/register');


router.post('/update' , (req, res) => {
    const DATA = req.body.data;
    const ref = DB.collection("LOGIN USERS").doc(req.body.uid).collection("History").doc(req.body.data.id);
    if(req.body.token){
        ADMIN.auth().verifyIdToken(req.body.token)
        .then((decodedToken) => {
            const uid = decodedToken.uid;
            if(req.body.uid == uid){
                ref.set(JSON.parse(JSON.stringify(DATA)) , {merge : true})
                .then(result => {
                    ref.get().then(doc => {
                    res.status(200).json({
                        ...doc.data(),
                        id : doc.id
                    });
                    })
                })
                .catch(err => {
                    res.status(500).json({
                        Error : err
                    });
                });
            }else {
                return res.status(404).json({
                    Error : "Invalid Token",
                    success : false
            })
            }  
        })
        .catch(Err => {
            res.status(500).json({
                Err
            });
        })
    } else {
        return res.status(404).json({
            Error : "Invalid Token",
            success : false
        })
    }
    
});
router.post('/getHistory' , (req,res) => {

    if(req.body.token){
        ADMIN.auth().verifyIdToken(req.body.token)
        .then((decodedToken) => {
            const uid = decodedToken.uid;
            if(req.body.uid == uid){
                const docRef = DB.collection("LOGIN USERS").doc(req.body.uid).collection("History");
                let data = []; //declare array for retrieving documents
                docRef.get()
                .then((docs) =>{
                        docs.forEach(doc=>{
                            //Pushing each doocument into array
                            data.push({
                                id: doc.id,
                                ...doc.data()
                            })
                        })
                        res.status(200).json({
                            data
                        });
                })
            }else {
                return res.status(404).json({
                    Error : "Invalid Token",
                    success : false
            })
            }  
        })
        .catch(Err => {
            res.status(500).json({
                Err
            });
        })
    } else {
        return res.status(404).json({
            Error : "Invalid Token",
            success : false
        })
    }
});



router.post('/signIn' , (req , res) => {
    AUTH.signIn(req.body.email, req.body.password).then(result => {
        res.status(200).json({
            result
        })
    })
    .catch(err => {
        res.status(500).json({
            err
        })
    })
});


module.exports = router;


// router.post('/update' , (req , res) => {
//     // TOKEN , UID , DATA OBJ
//   AUTH.authToken(req.body.token)
//   .then((decodedToken) => {
//     if(!decodedToken){
//         return res.status(404).json({
//             Error : "Invalid Token",
//             success : false
//         })
//     }
//     DB.collection('LOG').doc(req.body.uid).collection("History").doc()
//     .update({
//         name : "sdas"
//     },  { merge: true })
//     .then(result => {
//         res.status(200).json({
//             result
//         })
//     });
//   }).catch((error) =>{
//     // Handle error
//     res.status(500).json({
//         error
//     })
// });
//     // USER.doc(req.params.id).collection("HISTORY").doc()
//     // .set({
//     //     name : req.body.name
//     // },  { merge: true })
//     // .then(result => {
//     //      res.status(200).json({
//     //         result : result
//     //     });
//     // })
//     // .catch(err => {
//     //   res.status(500).json({
//     //      err
//     //   });    
//     // });
// });


// //   m5kOdvy00Hu2MEI1HoM3
// router.post('/login' , (req , res) => {

//     let user = [];
//     let Password = ''; //declare array for retrieving documents
//     USER.where('Email','==', req.body.email)
//     .get()
//     .then((querySnapshot) => {
//         querySnapshot.forEach((doc) => {
//             // console.log(doc.data());
//             user.push(doc.id);
//             Password = doc.data().Password;
//         });
//         if(user.length <= 0){
//             res.status(404).json({
//                 result: "1Email or password is incorrect"
//             }); 
//         } else {
//             bcrypt.compare(req.body.password, Password)
//             .then(isMatch => {
//               if (isMatch) {
//                 res.status(200).json({
//                             id: user[0]
//                         });
//               } else {
//                 res.status(404).json({
//                   status: 404,
//                   message: "Email or password is incorrect"
//                 })
//               }
//             })
//             .catch(err => {
//               res.status(500).json({
//                 status: "Something Went Wrong",
//                 Error: {
//                   Message: err
//                 }
//               });
//             });
//         }
//     })
//     .catch(err => {
//         res.status(500).json({
//             status: "Something Went Wrong",
//             Error: {
//               Message: err
//             }
//           });
//     })
// });
// router.post('/register' , (req , res) => {

//     const {
//         errors,
//         isValid
//       } = validateRegisterInput(req.body);

//       if (!isValid) {
//         return res.status(500).json(errors);
//       }

//     const userExist = [];
//     USER.where('Email','==', req.body.email)
//     .get()
//     .then(function(querySnapshot) {
//         querySnapshot.forEach(function(doc) {
//             userExist.push(doc.data().Email);
//         });
//         if(userExist.length > 0){
//             // console.log(userExist);
//              res.status(500).json({
//                 result: "Email Already Exists"
//             });  
//         } else {
//             // console.log('else');
//             const User = {
//                 UserName : req.body.name,
//                 Password : req.body.password,
//                 Email : req.body.email
//             }
//              bcrypt.genSalt(10, function (err, salt) {
//                 bcrypt.hash(User.Password, salt, function (err, hash) {
//                   // if (err) throw err;
//                   User.Password = hash

//                   USER.doc()
//                   .set(JSON.parse(JSON.stringify(User)))
//                   .then(result => {
//                        res.status(200).json({
//                           result : User
//                       });
//                   })
//                   .catch(err => {
//                     res.status(500).json({
//                        err
//                     });    
//                   });
//                 });
//               });
//         }
//     })
//     .catch(function(error) {
//         console.log("Error getting documents: ", error);
//     });

//     //  USER.where('Email','==', req.body.email)
//     // .onSnapshot(querySnapshot=> {
//     //     querySnapshot.forEach((doc) => {
//     //         userExist.push(doc.data().Email);
//     //     });
        
//     //     },(error)=>{
//     //         res.status(500).json({
//     //             error
//     //         });   
//     //     });             
// });

// router.post('/token' ,passport.authenticate('jwt', {
//     session: false
//   }), (req , res) => {
//     AUTH.authToken(req.body.idToken)
//   .then((decodedToken) => {
//     // var uid = decodedToken.uid;
//     // ...
//     res.status(200).json({
//         decodedToken
//     })
//   }).catch((error) =>{
//     // Handle error
//     res.status(500).json({
//         error
//     })
//   });

// });


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