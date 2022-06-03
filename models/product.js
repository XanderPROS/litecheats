var mongoose=require("mongoose");

var productSchema = new mongoose.Schema({
    name:{
        type:String,
        required:"Product name cannot be blank"
    },
    game:String,
    typeOfProduct:String,
    device:String,
    image: String,
    status:{type: String, default:"green"},
    tutorial:String,
    downloads:[{
        name:String,
        link:String,
        version:String,
        changelog:String,
        updateTime:{type:Date,default:Date.now}
    }],
    keys:[{
        keyType:String,
        keyPrice:String,
        agentPrice:String,
        keyList:[]
    }],
    secret:String,
    numberOfKeysSold:{type: Number, default:0}
})

module.exports=mongoose.model("Product",productSchema);