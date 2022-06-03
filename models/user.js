             var mongoose = require("mongoose"),
                   bcrypt = require('bcryptjs'),
    passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    username:{type:String,unique:true,required:true},
    password:{type:String,required:true},
    email:{type:String,unique:true,required:true},
    secretToken:String,
    creationTime:Date,
    country:{type:String,required:true},
    resetPasswordToken : String,
    resetPasswordExpires : Date,
    active:Boolean,//Keeps track if email is verified
    registerMail:Boolean,//Keeps track of email being sent on registration
    verifySlug:String,
    chargeCodes:[],
    mysocket:String,
    profilePic:String,
    tempRechargeAmount:String,
    lcbalance:String,
    paypalEmails:[],
    isAdmin : {type: Boolean, default:false},
    isAgent : {type: Boolean, default:false},
    isDelete : {type: Boolean, default:false},
    myOrders:[{
        productName:String,
        keytype:String,
        listOfkeys:[],
        orderTime:{type:Date,default:Date.now},
        secret:String
    }]
})

userSchema.plugin(passportLocalMongoose);
module.exports=mongoose.model("User",userSchema);
module.exports.hashPassword = async function(password){
    try{
        const salt =await bcrypt.genSalt(10);
        return await bcrypt.hash(password,salt);
    }catch(error){
        throw new Error('Hashing failed',error);
    }
};
module.exports.comparePasswords = async function(inputPassword,hashedPassword){
    try {
        return await bcrypt.compare(inputPassword, hashedPassword);
    } catch(error) {
        throw new Error('Comparing failed', error);
    }
}