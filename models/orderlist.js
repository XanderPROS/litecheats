var mongoose=require("mongoose");

var paypalOrderSchema = new mongoose.Schema({
    orderNumber:String,
    email:String,
    paypalEmail:String,
    amountRecharge:String,
    amountPaid:String,
    fee:String,
    status:{type:Boolean,default:false},
    createTime:{type:Date,default:Date.now}
})

module.exports=mongoose.model("PayPalOrder",paypalOrderSchema);