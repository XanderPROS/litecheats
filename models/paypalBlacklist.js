var mongoose=require("mongoose");

var paypalbSchema = new mongoose.Schema({
    email:String
})

module.exports=mongoose.model("PaypalBlack",paypalbSchema);