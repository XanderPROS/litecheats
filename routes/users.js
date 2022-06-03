var app = require("express");
var User = require("../models/user");
var Joi = require("joi");
var passport = require("passport");
var randomstring = require("randomstring");
var crypto=require("crypto");
var router=app.Router();
var async=require("async");
var middleware = require("../middleware");
var passwordValidator = require('password-validator');
const mailer=require("../misc/mailer");
const {userJoin,getCurrentUser,userLeave,getUsers}=require('../utils/users');
const userSchema = Joi.object().keys({
    email: Joi.string().email().required(),
    username: Joi.string().regex(/^[a-zA-Z0-9]+$/).required(),
    password: Joi.string().regex(/^[a-zA-Z0-9]{6,30}$/).required(),
    country:Joi.string().required(),
    confirmationPassword: Joi.any().valid(Joi.ref('password')).required()
})
var schema = new passwordValidator();

schema
.is().min(6)                                    // Minimum length 8
.is().max(100)                                  // Maximum length 100
.has().not().spaces()                           // Should not have spaces
//Register get
router.get("/register",middleware.isLoggedOut,function(req,res){
    res.render("authentication/register");
});
//Register post
router.post("/register",middleware.isLoggedOut,async function(req,res,next){
    try{
        var banUse=await User.find({creationTime:{$lt:Date.now()},active:false}).deleteMany();
        const result = Joi.validate(req.body,userSchema);
        if(result.error){
            req.flash("error","Check your details and please try again.");
            res.redirect("/register");
            return;
        }
        //Checking if email is already taken
        var user = await User.findOne({'email':result.value.email});
        if(user){
            req.flash('error','Email Already Exists.');
            return res.redirect("/register");
        }
        //Checking if username already exists
        var userN = await User.findOne({username:result.value.username});
        if(userN){
            req.flash('error','Username Already Exists.');
            return res.redirect("/register");
        }
        //Hash the password
        const hash = await User.hashPassword(result.value.password);

        //Generate token
        const secretToken = randomstring.generate();
        result.value.secretToken=secretToken;

        //flag the account as inactive
        result.value.active=false;

        delete result.value.confirmationPassword;
        result.value.password=hash;
        result.value.creationTime=Date.now()+300000;
        var x = randomstring.generate();
        result.value.verifySlug= await slugGenerate(x);
        result.value.lcbalance=0;
        result.value.registerMail=true;
        result.value.active=true;
        result.value.secretToken='';
        result.value.verifySlug='';
        const newUser = new User(result.value);
        await newUser.save();
        res.redirect("/login");
    }catch(err){
        //delete users who didnt get email on register
        var banUser=await User.find({registerMail:false}).deleteMany();
        req.flash("error","Please try again.");
        return res.redirect("back");
    }
})
router.get("/login",middleware.isLoggedOut,function(req,res){
    res.render("authentication/login");
})

router.post("/login",middleware.isLoggedOut,passport.authenticate("local",{
    successRedirect:"/dashboard",
    failureRedirect:"/login",
    failureFlash:true
}));

router.get("/verify/:verifySlug",middleware.isLoggedOut,async function(req,res){
    res.redirect("/login");
})
router.post("/verify/:verifySlug",middleware.isLoggedOut,async function(req,res,next){
    res.redirect("/login");
})
router.get("/forgot",middleware.isLoggedOut,function(req,res){
    res.render("authentication/forgot");
});

router.post("/forgot",middleware.isLoggedOut,function(req,res){
    async.waterfall([
        function(done){
            crypto.randomBytes(20,function(err,buff){
                var token=buff.toString('hex');
                done(err,token)
            })
        },
        function(token,done){
            User.findOne({email:req.body.email},function(err,user){
                if(!user || user.active ===false){
                    req.flash("error","We're sorry. We weren't able to identify you given the information provided.");
                    return res.redirect("back");
                }
                user.resetPasswordToken=token;
                console.log(Date.now());
                user.resetPasswordExpires=Date.now()+300000;
                console.log(user.resetPasswordExpires)
                console.log(Date.now());
                user.save(function(err){
                    done(err,token,user);
                });
            });
        },function(token,user,done){
            const head='<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"></head><body>';
            const html = '<div style="background-color:white;border: red solid 1px;border-radius:3px;width:400px;margin-left:auto;margin-right:auto;padding:2rem;"><div style="width:100px"><img src="https://i.ibb.co/BzbdtJm/output-onlinepngtools-1.png"></div><div><h3>Click the following link to reset your password:</h3><h5><a href="http://'+req.headers.host+'/reset/'+token+'">http://'+req.headers.host+'/reset/'+token+'</a></h5></div></div>';
            const foot='</body></html>';
        
            //Send the email
            mailer.sendEmail('admin@litecheats.net',user.email,'Litecheats password assistance',head+html+foot);
            req.flash('success','We have sent a link to your email '+ user.email+ ' to reset password.\nLink valid for 5 minutes.');
            res.redirect("/login");
        }
    ],function(err){
        if(err) return next(err)
            res.redirect("/forgot");
    })
})

router.get("/reset/:email",middleware.isLoggedInAdmin,function(req,res){
    User.findOne({email:req.params.email},function(err,user){
        if(!user){
            req.flash("error","Reset link is invalid or has expired.");
            return res.redirect("/login");
        }
        res.render("authentication/reset",{email:req.params.email});
    })
})

router.post("/reset",middleware.isLoggedInAdmin,async function(req,res,next){
    try{
       
            const x= schema.validate(req.body.password, { list: true })
            if(x.length>0){
                if(x.includes('max')){
                    req.flash("error","Password must be less that 100 characters.")
                    return res.redirect("back");
                }
                if(x.includes('min')){
                    req.flash("error","Password must be at least 6 characters.")
                    return res.redirect("back");
                }
                if(x.includes('spaces')){
                    req.flash("error","Password must not contain spaces.")
                    return res.redirect("back");
                }
            }
            //Checking if reset link valid
            var user = await User.findOne({email:req.body.email});
            console.log(user);
            if(!user){
                req.flash("error","Reset link is invalid or has expired.");
                return res.redirect("/forgot");
            }
            //Hash the password
            const hash = await User.hashPassword(req.body.password);
            //Assign has to password
            user.password=hash;
            user.resetPasswordToken=undefined;
            user.resetPasswordExpires=undefined;
            await user.save();
            req.flash('success','Password has been changed.');
            return res.redirect("back");
      
    }catch(err){
        req.flash("error",err.message);
        return res.redirect("back");
    }
})

router.get("/logout",middleware.isLoggedIn,function(req,res){
    const user=userLeave(req.user.mysocket);
    req.logout();
    req.flash("success","You have been logged out.");
    res.redirect("/login");
    
})
router.post("/saveSettings",middleware.isLoggedIn,async function(req,res){
    try{
        if(req.body.newPass === req.body.confirmPass){
            const x= schema.validate(req.body.newPass, { list: true })
            if(x.length>0){
                if(x.includes('max')){
                    req.flash("error","Password must be less that 100 characters.")
                    return res.redirect("back");
                }
                if(x.includes('min')){
                    req.flash("error","Password must be at least 6 characters.")
                    return res.redirect("back");
                }
                if(x.includes('spaces')){
                    req.flash("error","Password must not contain spaces.")
                    return res.redirect("back");
                }
            }
            var user = await User.findById(req.user._id);
            var c= await User.comparePasswords(req.body.currentPass,user.password);
            if(c){
                const hashnewPass=await User.hashPassword(req.body.newPass);
                user.password=hashnewPass;
                await user.save();
                req.flash('success','All settings saved.');
                return res.redirect("back");
            }else{
                req.flash("error","Current password mismatch")
                return res.redirect("back");
            }

        }else{
            req.flash("error","Confirm password mismatch");
            return res.redirect("back");
        }

    }catch(err){
        req.flash("error",err.message);
        return res.redirect("back");
    }
})
async function slugGenerate(slug){
    try{
        var user=await User.findOne({verifySlug:slug});
        if(!user){
            return slug;
        }
        var newSlug = randomstring.generate();
        return await slugGenerate(newSlug);
    }catch(err){
        throw new Error(err);
    }
}

module.exports = router;
