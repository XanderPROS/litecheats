var mongoose=require("mongoose");

var announceSchema = new mongoose.Schema({
    title:String,
    content:String,
    createTime:{type:Date,default:Date.now}
})

module.exports=mongoose.model("Announce",announceSchema);