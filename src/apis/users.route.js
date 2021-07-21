import { Router } from "express";
import { User } from "../database/models";
import { RegisterValidations ,AuthenticateValidations, ResetPassword } from "../validators";
import Validator from "../middlewares/validator.middleware";
import { randomBytes } from 'crypto';
import sendMail from "../functions/email-sender";
import { DOMAIN } from "../constants";
import {join} from "path";
import { userAuth } from "../middlewares/auth-guard.middleware";

const router = Router();

//#region Registeration && Login

/**
 * @description To Create new User Account
 * @access Public
 * @api /users/api/register
 * @type Post
 */
router.post('/api/register',RegisterValidations,Validator,async(req,res)=>{
    try {
        let {username , email} = req.body;
        // check if the username is taken or not
        let user = await User.findOne({username});
        if(user) {
            return res.status(400).json({
                sucess: false,
                message : "Username is already taken."
            });
        }
        // check if the user exist that email
        user = await User.findOne({email});
        if(user) {
            return res.status(400).json({
                sucess: false,
                message : "Email is already register. Did you forget the password. Try resetting it."
            });
        }
        user = new User({
            ...req.body,
            verificationCode: randomBytes(20).toString("hex"),
        });
        await user.save();
        // Send the email to the user with a verification link
        let html = `
        <div>
            <h1>Hello, ${user.username}</h1>
            <p>Please click the following link to verify your account</p>
            <a href="${DOMAIN}/users/verify-now/${user.verificationCode}"> Verify Now</a>
        </div>
        `;
        await sendMail(user.email,"Verify Account","Please verify your account.",html);
        res.status(201).send({
            success:true,
            message: "Harry! your account is created please verify your email address."
        });
    } catch (error) {
        res.status(500).send({
            success:false,
            message:error.message
        });
    }
});

/**
 * @description To Verify new User Account via email
 * @access Public <only Via email>
 * @api /users/verify-now/verificationCode
 * @type Get
 */
router.get('/verify-now/:verificationCode',async(req,res)=>{
    try {
        let {verificationCode} = req.params;
        let user = await User.findOne({verificationCode});
        if(!user){
            res.status(401).json({
                success:false,
                message:"Unauthorized Access. Invalid verificationCode"
            });
        }
        user.verified = true;
        user.verificationCode = undefined;
        await user.save();
        res.sendFile(join(__dirname,'../templates/verification-success.html'));
    } catch (error) {
        res.sendFile(join(__dirname,'../templates/errors.html'));
    }
});

/**
 * @description To Authenticate an user and get token
 * @access Public 
 * @api /users/api/authenticate
 * @type Post
 */
router.post('/api/authenticate',AuthenticateValidations,Validator,async(req,res)=>{
    try {
        let {username , password} = req.body;
        let user = await User.findOne({username});
        if(!user) {
            res.status(404).json({
                success:false,
                message:"Username not found"
            });
        }
        if(!await user.comparePassword(password)){
            res.status(401).json({
                success:false,
                message:"Incorrect Password"
            });
        }
        let token = await user.generateJWT();
        res.status(200).json({
            success:true,
            message:"Login Successfuly",
            user:user.getUserInfo(),
            token: `Bearer ${token}`
        });
    } catch (error) {
        res.status(500).send({
            success:false,
            message:error.message
        });
    }
});

/**
 * @description To get the Authenticated user's Profiles "Private" it needs access token to  access
 * @access Private 
 * @api /users/api/authenticate
 * @type Get
 */
router.get('/api/authenticate',userAuth,async(req,res)=>{
    res.status(200).json({
        user:req.user
    });
});

//#endregion

//#region Reset Password

/**
 * @description To initiate the password reset process
 * @access Public
 * @api /users/api/reset-password
 * @type Get
 */
router.put('/api/reset-password',ResetPassword,Validator,async(req,res)=>{
    try {
        let {email} = req.body;
        let user = await User.findOne({email});
        if(!user){
            res.status(404).send({
                success:false,
                message:"User with the email is not found"
            });
        }
        user.generatePasswordReset();
        await user.save();
        // Send the password reset link in the email
        let html = `
        <div>
            <h1>Hello, ${user.username}</h1>
            <p>Please click the following link to reset your password</p>
            <p>if this password reset request is not created by your thenyou can ignore this email.</p>
            <a href="${DOMAIN}/users/reset-password-now/${user.resetPasswordToken}"> Reset Password now</a>
        </div>
        `;
        await sendMail(user.email,"Reset Password","Please reset your password.",html);
        res.status(200).send({
            success:true,
            message:`Password Reset link is sent to your email:${email}`
        });
    } catch (error) {
        res.status(500).send({
            success:false,
            message:error.message
        });
    }
});

/**
 * @description To render rest password page
 * @access Restricted via Email
 * @api /users/reset-password/:resetPasswordToken
 * @type Get
 */
router.get('/reset-password-now/:resetPasswordToken',async(req,res)=>{
    try {
        let { resetPasswordToken } = req.params;
        let user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpiresIn:{$gt:Date.now()}
        });
        if(!user){
            res.status(401).json({
                message:"Password reset token is inValid or Expires",
                success:false
            });
        }
        res.sendFile(join(__dirname,'../templates/password-reset/password-reset.html'));
    } catch (error) {
        res.sendFile(join(__dirname,'../templates/errors.html'));
    }
});

/**
 * @description to save new password reseted in database
 * @access Restricted via Email
 * @api /users/api/reset-password-now
 * @type Post
 */
router.post('/api/reset-password-now',async(req,res)=>{
    try {
        let { resetPasswordToken ,password} = req.body;
        let user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpiresIn:{$gt:Date.now()}
        });
        if(!user) {
            res.status(401).json({
                message:"Password reset token is inValid or Expires",
                success:false
            });
        }        
        user.password=password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresIn = undefined;
        await user.save();
        // Send Verification email about the password reset successfull process
        let html = `
        <div>
            <h1>Hello, ${user.username}</h1>
            <p>Your Password is REset Successfully.</p>
            <p>if this password reset request is not done by you can contact our team.</p>
        </div>
        `;
        await sendMail(user.email,"Reset Password Successfull",
        "Your Password is Changed.",html);
        
        res.status(200).send({
            success:true,
            message:"Your password reset request is completed and your password is resetted successfully. login into your account now. "
        });
    } catch (error) {
        res.status(500).send({
            success:false,
            message:`Error : ${error}`
        });
    }
});

//#endregion

export default router;