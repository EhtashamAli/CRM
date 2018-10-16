const router = require('express').Router();
const DB = require('../FireBase/Firebase');
const USER = DB.collection("USER");


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

//     USER.doc("m5kOdvy00Hu2MEI1HoM3").get()
//     .then(doc => {
//         if(!doc.exists){
//             // console.log('No such document');
//             res.status(404).json({
//               errorCode : 404,
//               error : "EMAIL OR PASSWORD IS INCORRECT"
//             })
//         }else
//         {
//             // Match if user is correct
//             console.log(doc.data().UserName)
//             console.log(req.body.UserName)
//             console.log(doc.data().Password)
//             console.log(req.body.Password)
//             if(req.body.UserName == doc.data().UserName) {
//                 if(req.body.Password == doc.data().Password) {
//                     res.status(200).json({
//                         result: doc.data()
//                     });
//                 } else {
//                     res.status(404).json({
//                         errorCode : 404,
//                         error : "EMAIL OR PASSWORD IS INCORRECT"
//                       })
//                 }
//             } else {
//                 res.status(404).json({
//                     errorCode : 404,
//                     error : "EMAIL OR PASSWORD IS INCORRECT"
//                   })
//             }
//         }
//     }).catch(err => {
//         res.status(500).json({
//                 err
//            })
//    });
});
router.post('/signUp' , (req , res) => {
    USER.doc()
    .set(JSON.parse(JSON.stringify(person)))
    .then(result => {
        res.status(200).json({
            result
        });
    })
    .catch(err => {
        res.status(500).json({
            err
        });
    });
});

router.post('/update' , (req , res) => {

});


module.exports = router;