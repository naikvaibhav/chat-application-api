const mongoose = require('mongoose');
require('./../../app/models/User');
require('./../../app/models/Auth');
const shortid = require('shortid');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib');
const logger = require('./../libs/loggerLib');
const validateInput = require('./../libs/paramsValidation');
const check = require('./../libs/checkLib');
const passwordLib = require('./../libs/generatePassword');

const token = require('./../libs/tokenLib')
/*Models*/


const userModel = mongoose.model('User')

const AuthModel = mongoose.model('Auth')


//start signup function

let signUpFunction = (req,res)=>{
    
    


    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (req.body.email) {
                if (!validateInput.Email(req.body.email)) {
                    let apiResponse = response.generate(true, 'Email Does not met the requirement', 400, null)
                    reject(apiResponse)
                } else if (check.isEmpty(req.body.password)) {
                    let apiResponse = response.generate(true, '"password" parameter is missing"', 400, null)
                    reject(apiResponse)
                } else {
                    resolve(req)
                }
            } else {
                logger.error('Field Missing During User Creation', 'userController: createUser()', 5)
                let apiResponse = response.generate(true, 'One or More Parameter(s) is missing', 400, null)
                reject(apiResponse)
            }
        });
    }// end validate user input
    let createUser = () => {
        return new Promise((resolve, reject) => {
            userModel.findOne({ email: req.body.email })
                .exec((err, retrievedUserDetails) => {
                    if (err) {
                        logger.error(err.message, 'userController: createUser', 10)
                        let apiResponse = response.generate(true, 'Failed To Create User', 500, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(retrievedUserDetails)) {
                        console.log(req.body)
                        let newUser = new userModel({
                            userId: shortid.generate(),
                            firstName: req.body.firstName,
                            lastName: req.body.lastName || '',
                            email: req.body.email.toLowerCase(),
                            mobileNumber: req.body.mobileNumber,
                            password: passwordLib.hashpassword(req.body.password),
                            createdOn: time.now()
                        })
                        newUser.save((err, newUser) => {
                            if (err) {
                                console.log(err)
                                logger.error(err.message, 'userController: createUser', 10)
                                let apiResponse = response.generate(true, 'Failed to create new User', 500, null)
                                reject(apiResponse)
                            } else {
                                let newUserObj = newUser.toObject();
                                resolve(newUserObj)
                            }
                        })
                    } else {
                        logger.error('User Cannot Be Created.User Already Present', 'userController: createUser', 4)
                        let apiResponse = response.generate(true, 'User Already Present With this Email', 403, null)
                        reject(apiResponse)
                    }
                })
        })
    }// end create user function


    validateUserInput(req,res)
    .then(createUser)
    .then((resolve)=>{
        delete resolve.password
        let apiResponse = response.generate(false,'User created',200,resolve)
        res.send(apiResponse)
    })
    .catch((err)=>{
        console.log(err);
        res.send(err);
    })



}//end user signup function




//start login function
let loginFunction = (req,res)=>{

    let findUser=()=>{
        console.log("findUser");
        return new Promise((resolve,reject)=>{
            if(req.body.email){
                console.log("req body email is there");
                console.log(req.body);
                userModel.findOne({email : req.body.email},(err,userDetails)=>{
                    if(err){
                        console.log(err)
                        logger.error('Failed to Retrieve User Data','userController:findUSer()',10)
                        let apiResponse = response.generate(true,'Failed to find user details',500,null)
                        reject(apiResponse)
                    }else if(check.isEmpty(userDetails)){
                        logger.error('No user found','userController:findUser()',7)
                        let apiResponse = response.generate(true,'No user details found',404,null)
                        reject(apiResponse)
                    }else{
                        logger.info('User found','userController:findUSer()',10)
                        resolve(userDetails)
                    }
                });
            }else{
                let apiResponse = response.generate(true,'"email" parameter is missing ',404,null)
                reject(apiResponse)
            }
        })
    }



    let validatePassword = (retrievedUserDetails)=>{
        console.log("validatePassword");
        return new Promise((resolve,reject)=>{
            passwordLib.comparePassword(req.body.password,retrievedUserDetails.password,(err,isMatch)=>{
                if(err){
                    console.log(err);
                    logger.error(err.message,'userController:validatePassword()',10)
                    let apiResponse = response.generate(true,'Login Failed',500,null)
                    reject(apiResponse)
                }else if(isMatch){
                    let retrievedUserDetailsObj = retrievedUserDetails.toObject()
                    delete retrievedUserDetailsObj.password
                    delete retrievedUserDetailsObj._id
                    delete retrievedUserDetailsObj.__v
                    delete retrievedUserDetailsObj.createdOn
                    delete retrievedUserDetailsObj.modifiedOn
                    resolve(retrievedUserDetailsObj)
                }else{
                    logger.info('Login Failed due to invalid password','userController:validatePassword()',10)
                    let apiResponse = response.generate(true,'Wrong password. Login Failed',400,null)
                    reject(apiResponse)
                }
            })
        })
    }

    let generateToken = (userDetails)=>{
        console.log("generate token");
        return new Promise((resolve,reject)=>{
            token.generateToken(userDetails,(err, tokenDetails)=>{
                if(err){
                    console.log(err)
                    let apiResponse = response.generate(true,'Failed to generate token',500,null)
                    reject(apiResponse)
                }else{
                    tokenDetails.userId = userDetails.userId
                    tokenDetails.userDetails = userDetails
                    resolve(userDetails)
                }
            })
            
        })
    }

    let saveToken = (tokenDetails)=>{
        console.log("save token");
        return new Promise((resolve,reject)=>{
            AuthModel.findOne({userId : tokenDetails.userId}, (err,retrievedTokenDetails)=>{
                if(err){
                    console.log(err.message,'userController:saveToken',10)
                    let apiResponse = response.generate(true,'Failed to Generate Token',500,null)
                    reject(apiResponse);
                }else if(check.isEmpty(retrievedTokenDetails)){
                    let newAuthToken = new AuthModel({
                        userId : tokenDetails.userId,
                        authToken : tokenDetails.token,
                        tokenSecret : tokenDetails.tokenSecret,
                        tokenGenerationTime : time.now()
                    })
                    newAuthToken.save((err,newTokenDetails)=>{
                        if(err){
                            console.log(err);
                            logger.error(err.message,'userController:saveToken',10)
                            let apiResponse = response.generate(true,'Failed to Generate token',500,null)
                            reject(apiResponse)
                        }else{
                            let responseBody = {
                                authToken : newTokenDetails.authToken,
                                userDetails : tokenDetails.userDetails
                            }
                            resolve(responseBody)
                        }
                    })
                }else {
                    retrievedTokenDetails.authToken = tokenDetails.token
                    retrievedTokenDetails.tokenSecret = tokenDetails.tokenSecret
                    retrievedTokenDetails.tokenGenerationTime = time.now()
                    retrievedTokenDetails.save((err,newTokenDetails)=>{
                        if(err){
                            console.log(err);
                            logger.error(true,'userController:saveToken',10)
                            let apiResponse = response.generate(true,'Failed to generate token',500,null)
                            reject(apiResponse)
                        }else{
                            let responseBody = {
                                authToken : newTokenDetails.authToken,
                                userDetails : tokenDetails.userDetails
                            }
                            resolve(responseBody)
                        }
                    })
                }
            })
        })

    }


    findUser(req,res)
        .then(validatePassword)
        .then(generateToken)
        .then(saveToken)
        .then((resolve)=>{
            let apiResponse = response.generate(false, 'Login Successful', 200, resolve)
            res.status(200)
            res.send(apiResponse)
        })
        .catch((err)=>{
            console.log("errorhandler");
            console.log(err);
            res.status(err.status)
            res.send(err)
        })
}//end of login function



//logout function
let logout = (req, res) => {

} // end of the logout function.

module.exports={
    signupFunction : signUpFunction,
    loginFunction : loginFunction,
    logout : logout
}//end exports