var mongoose=require("mongoose");

var ordernumSchema = new mongoose.Schema({
    name:String,
    orderNumber:String
})

module.exports=mongoose.model("OrderNumber",ordernumSchema);