var app = require("express");
var User = require("../models/user");
var Product=require("../models/product");
var PaypalBlack=require("../models/paypalBlacklist");
PayPalOrder=require("../models/orderlist");
    OrderNumber=require("../models/ordernumber");
const https = require('https');
var router=app.Router();
var middleware = require("../middleware");
var oxr = require('open-exchange-rates');
var fx = require('money');
var Announce=require("../models/announcement");
const { func } = require("joi");
const { all } = require("bluebird");
const {userJoin,getCurrentUser,userLeave,getUsers,changeUserPic}=require('../utils/users');
fx.base = "USD";
fx.rates = {
	"INR" : 78,
	"USD" : 1
}

oxr.set({ app_id: process.env.OPENEXCHANGEID })
oxr.latest(function(error) {

    if ( error ) {
        // `error` will contain debug info if something went wrong:
        console.log( 'ERROR loading data from Open Exchange Rates API! Error was:' )
        console.log( error.toString() );

        // Fall back to hard-coded rates if there was an error (see readme)
        return false;
    }
    fx.rates = oxr.rates;
    fx.base = oxr.base;
})
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, req.user._id.toString());
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var limits = {
    fileSize:3000000
}
var upload = multer({ storage: storage, fileFilter: imageFilter,limits:limits})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


router.post('/uploadPro',middleware.isLoggedIn,upload.single('image'), (req, res) => {
    cloudinary.v2.uploader.upload(req.file.path,{overwrite: true},function(err,result){
        if(err){
            req.flash('error', err.message);
            return res.redirect('back');
        }
        User.findByIdAndUpdate(req.user._id,{profilePic:result.secure_url},function(err,user){
            console.log(user.profilePic)
            if(err){
                req.flash('error', err.message);
                return res.redirect('back');
            }
            changeUserPic(user.username,result.secure_url);
            req.flash('success','Profile picture updated successfully.')
            res.redirect('back');
        })
    })
});
router.get('/imageLink/:username',middleware.isLoggedIn,function(req,res){
    User.findOne({username:req.params.username},function(err,fundUser){
        if(err){
            return 0;
        }
       res.send({profilePic:fundUser.profilePic});
    })
})
router.get('/search',middleware.isLoggedIn,function(req,res,next){
    var q = req.query.q;
    const regex= new RegExp(escapeRegex(q),"gi");
    Product.find({
        name:regex
    },{
        _id:0,
        __v:0,
        keys:0,
        status:0,
        game:0,
        typeOfProduct:0,
        device:0,
        image:0,
        tutorial:0,
        downloads:0
    },function(err,data){
        res.json(data);
    }).limit(5);
})
router.get("/dashboard",middleware.isLoggedIn,function(req,res){
    if(req.query.search){
        var perPage=8;
        var pageQuery=parseInt(req.query.page);
        var pageNumber=pageQuery ? pageQuery : 1;
        const regex= new RegExp(escapeRegex(req.query.search),"gi");
        Product.find({name:regex}).skip((perPage*pageNumber)-perPage).limit(perPage).exec(function(err,allProducts){
            Product.find({name:regex},function(err,allm){
                if(err){
                    console.log(err);
                    return res.redirect("back");
                }
                var noMatch='';
                if(allProducts.length<1){
                    noMatch="We cannot find the product you are searching for.Please try again."
                    Announce.find({}).sort('-createTime').limit(8).exec(function(err,allAnnounce){
                        if(err){
                            return res.redirect("back");
                        }
                        res.render("dashboard/dashboard",{allProducts:allProducts,noMatch:noMatch,current:pageNumber,pages:Math.ceil(allm.length/perPage),bSearch:req.query.search,allAnnounce:allAnnounce,totalRates:fx.rates});
                    })
                    
                }else{
                    Announce.find({}).sort('-createTime').limit(8).exec(function(err,allAnnounce){
                        if(err){
                            return res.redirect("back");
                        }
                        res.render("dashboard/dashboard",{allProducts:allProducts,noMatch:noMatch,current:pageNumber,pages:Math.ceil(allm.length/perPage),bSearch:req.query.search,allAnnounce:allAnnounce,totalRates:fx.rates});
                    })
                }
            })
            
            
        })
    }else{
        var noMatch=''
        var bSearch=''
        var perPage=8;
        var pageQuery=parseInt(req.query.page);
        var pageNumber=pageQuery ? pageQuery : 1;
        Product.find({}).sort('-numberOfKeysSold').skip((perPage*pageNumber)-perPage).limit(perPage).exec(function(err,allProducts){
            Product.count().exec(function(err,count){
                if(err){
                    console.log(err);
                    return res.redirect("back");
                }else{
                    Announce.find({}).sort('-createTime').limit(8).exec(function(err,allAnnounce){
                        if(err){
                            return res.redirect("back");
                        }
                        res.render("dashboard/dashboard",{allProducts:allProducts,noMatch:noMatch,current:pageNumber,pages:Math.ceil(count/perPage),bSearch:req.query.search,allAnnounce:allAnnounce,totalRates:fx.rates});
                    })
                    
                }
            })
            
            
        })
    }
    
    
})
router.get("/dashboard/new",middleware.isLoggedInAdmin,function(req,res){
    Announce.find({}).sort('-createTime').limit(8).exec(function(err,allAnnounce){
        if(err){
            return res.redirect("back");
        }
        res.render("dashboard/new",{allAnnounce:allAnnounce,totalRates:fx.rates});
    })
    
})
router.get("/dashboard/:id/edit",middleware.isLoggedInAdmin,function(req,res){
    Product.findById(req.params.id,function(err,prod){
        if(err){
            return res.redirect("back");
        }
        Announce.find({}).sort('-createTime').limit(8).exec(function(err,allAnnounce){
            if(err){
                return res.redirect("back");
            }
            res.render("dashboard/edit",{product:prod,allAnnounce:allAnnounce,totalRates:fx.rates});
        })
        
    })
})
router.put("/dashboard/:id",middleware.isLoggedInAdmin,function(req,res){
    var name=req.body.name;
    var game=req.body.game;
    var typeOfProduct=req.body.typeOfProduct;
    var device=req.body.device;
    var image=req.body.image;
    var secret=req.body.secret;
    var status=(req.body.customRadioInline1==="safe") ? "green":"red";
    var tutorial=req.body.tutorial;
    var k=Object.values(req.body.keys);
    var keys=[];
    var i=0
    for(i=0;i<k.length;i++){
        var y={}
        y.keyType=k[i].keyType;
        y.keyPrice=k[i].keyPrice;
        y.agentPrice=k[i].agentPrice;
        y.keyList = k[i].keyList.split("\r\n").map(item => item.trim());
        if(y.keyList.length===1 && y.keyList[0]===''){
            y.keyList=[];
        }
        
        keys.push(y);
    }
    var d=Object.values(req.body.downloads);
    var downloads=[];
    var x=0
    for(x=0;x<d.length;x++){
        var y={};
        y.name=d[x].name;
        y.link=d[x].file;
        y.version=d[x].version;
        if(d[x].time){
            y.updateTime=d[x].time;
        }
        y.changelog=d[x].changelog;
        downloads.push(y);
    }
    var newProduct={
        name:name,
        game:game,
        typeOfProduct:typeOfProduct,
        device:device,
        image:image,
        secret:secret,
        status:status,
        tutorial:tutorial,
        downloads:downloads,
        keys:keys
    }
    Product.findByIdAndUpdate(req.params.id,newProduct,function(err,prod){
        if(err){
            console.log(err);
            return res.redirect("/dashboard");
        }
        res.redirect("/dashboard");
    })
})
router.post("/dashboard",middleware.isLoggedInAdmin,function(req,res){
    if(req.user.isAdmin){
    var name=req.body.name;
    var game=req.body.game;
    var typeOfProduct=req.body.typeOfProduct;
    var device=req.body.device;
    var image=req.body.image;
    var secret=req.body.secret;
    var status=(req.body.customRadioInline1==="safe") ? "green":"red";
    var tutorial=req.body.tutorial;
    var k=Object.values(req.body.keys);
    var keys=[];
    var i=0
    for(i=0;i<k.length;i++){
        var y={}
        y.keyType=k[i].keyType;
        y.keyPrice=k[i].keyPrice;
        y.agentPrice=k[i].agentPrice;
        y.keyList = k[i].keyList.split("\r\n").map(item => item.trim());
        if(y.keyList.length===1 && y.keyList[0]===''){
            y.keyList=[];
        }
        keys.push(y);
    }
    var d=Object.values(req.body.downloads);
    var downloads=[];
    var x=0
    for(x=0;x<d.length;x++){
        var y={};
        y.name=d[x].name;
        y.link=d[x].file;
        y.version=d[x].version;
        y.changelog=d[x].changelog;
        downloads.push(y);
    }
    var newProduct={
        name:name,
        game:game,
        typeOfProduct:typeOfProduct,
        device:device,
        image:image,
        secret:secret,
        status:status,
        tutorial:tutorial,
        downloads:downloads,
        keys:keys
    }
    Product.create(newProduct,function(err,prod){
        if(err){
            console.log(err);
            return res.redirect("back");
        }
        res.redirect("/dashboard");
    })
    }else{
        res.redirect("back");
    }
})
router.post("/dashboard/:id/buy",middleware.isLoggedIn,async function(req,res){
    try{
        let product = await Product.findById(req.params.id);
        if(product.keys.some(key => key.keyType === req.body.keySelect)){
            let index = await product.keys.findIndex(p => p.keyType === req.body.keySelect);
            if((req.body.numberOfkeys>product.keys[index].keyList.length)||(req.body.numberOfkeys<=0)){
                                    return res.redirect("back");
                }else{
                    let totalPrice = req.body.numberOfkeys*product.keys[index].keyPrice;
                    if(req.user.isAgent){
                        totalPrice = req.body.numberOfkeys*product.keys[index].agentPrice;
                    }
                    let user=await User.findById(req.user._id);
                    if(user.country==="INR"){
                        totalPrice = +totalPrice;
                        totalPrice= fx(totalPrice).from('USD').to('INR');
                    }
                    totalPrice=totalPrice.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

                    user.lcbalance=user.lcbalance.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

                    if((user.lcbalance-totalPrice)<0 || isNaN(user.lcbalance-totalPrice) || user.lcbalance==0 || isNaN(user.lcbalance)){
                        console.log(user.username);
                        return res.redirect("back");
                        
                    }
                    let keysToSent=await product.keys[index].keyList.splice(0,req.body.numberOfkeys);
                    user.lcbalance=user.lcbalance-totalPrice;
                    user.lcbalance=user.lcbalance.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];
                    if(isNaN(user.lcbalance)){
                        console.log(user.username);
                        return res.redirect("back");

                    }
                    let y = {
                        productName:product.name,
                        keytype:product.keys[index].keyType,
                        listOfkeys:keysToSent,
                        secret:product.secret
                    }
                    product.numberOfKeysSold = product.numberOfKeysSold + keysToSent.length;
                    await user.myOrders.unshift(y);
                    await user.save()
                    await product.save()
                    return res.redirect("/orders");
                }
        }else{
            return res.redirect("back");
        }


    }catch(err){
        console.log(err);
        return res.redirect("back");
    }
    // Product.findById(req.params.id,function(err,product){
    //     if(product.keys.some(key => key.keyType === req.body.keySelect)){
    //         var i=0;
    //         var totalPrice=0;
    //         for(i=0;i<product.keys.length;++i){
    //             console.log(i)
    //             console.log(product.keys[i].keyType)
    //             console.log(req.body.keySelect)
    //             if(product.keys[i].keyType===req.body.keySelect){
    //                 if((req.body.numberOfkeys>product.keys[i].keyList.length)||(req.body.numberOfkeys<=0)){
    //                     console.log("1");
    //                     return res.redirect("back");
    //                 }
    //                 else{
    //                     totalPrice=req.body.numberOfkeys*product.keys[i].keyPrice;
    //                     User.findById(req.user._id,function(err,user){
    //                         if(user.lcbalance<totalPrice || err){
    //                             console.log("3");
    //                             return res.redirect("back");
    //                         }
    //                         console.log(product.keys);
    //                         console.log(i)
    //                         //var keysToSent=product.keys[i].keyList.splice(0,req.body.numberOfkeys);
    //                         product.save(function(err){
    //                             return res.redirect("back")
                        
    //                         });
                            

    //                     })
    //                 }
    //             }
    //         }
    //     }else{
    //         return res.redirect("back")
    //     }
        
    // })
})
router.get("/myStats",middleware.isLoggedInAdmin,function(req,res){
    var perPage=8;
        var pageQuery=parseInt(req.query.page);
        var pageNumber=pageQuery ? pageQuery : 1;
    User.find({},function(err,users){
        if(err){
            return res.redirect("back");
        }
        var myOrders=users.map(function(x){
            if(x.myOrders.length>0){
                return x.myOrders.map(function(order){
                    order.username=x.username;
                    order.email=x.email;
                    order.lcbalance=x.lcbalance;
                    order.country=x.country;
                    return order;
                })
            }
        })
        myOrders=myOrders.filter(x=>x!==undefined);
        myOrders = [].concat.apply([],myOrders);
        myOrders.sort(function(a,b){
            return b.orderTime-a.orderTime;
        })
        var allOrders=myOrders;//list of all order objects
var sortedArrayDates=[]
        allOrders.forEach(function(order){
            var newDate=new Date(order.orderTime.toJSON().split('T')[0]);
            var DateAlreadyExist=DateExist(sortedArrayDates,newDate);
            if(!DateAlreadyExist){
                sortedArrayDates.push({date:newDate});
            }
            var index=findIndexOfObjectInArray(sortedArrayDates,newDate);
            if(sortedArrayDates[index][order.productName]===undefined){
                sortedArrayDates[index][order.productName]={}
            }
                if(sortedArrayDates[index][order.productName][order.keytype]===undefined){
                    sortedArrayDates[index][order.productName][order.keytype]=0;
                }
                    sortedArrayDates[index][order.productName][order.keytype]+=order.listOfkeys.length;
            

        })
        var count=sortedArrayDates.length;
        sortedArrayDates=sortedArrayDates.splice((perPage*pageNumber)-perPage);
        sortedArrayDates=sortedArrayDates.slice(0,perPage);
        Announce.find({}).sort('-createTime').limit(8).exec(function(err,allAnnounce){
            if(err){
                return res.redirect("back");
            }
            res.render("dashboard/salestats",{sortedArrayDates:sortedArrayDates,current:pageNumber,pages:Math.ceil(count/perPage),allAnnounce:allAnnounce,totalRates:fx.rates});
        })
    })
})
router.get("/orders",middleware.isLoggedIn,function(req,res){
        var perPage=8;
        var pageQuery=parseInt(req.query.page);
        var pageNumber=pageQuery ? pageQuery : 1;
        if(req.user.isAdmin){
            User.find({},function(err,users){
                if(err){
                    return res.redirect("back");
                }
                var myOrders=users.map(function(x){
                    if(x.myOrders.length>0){
                        return x.myOrders.map(function(order){
                            order.username=x.username;
                            order.email=x.email;
                            order.lcbalance=x.lcbalance;
                            order.country=x.country;
                            return order;
                        })
                    }
                })
                myOrders=myOrders.filter(x=>x!==undefined);
                myOrders = [].concat.apply([],myOrders);
                myOrders.sort(function(a,b){
                    return b.orderTime-a.orderTime;
                })
                var count=myOrders.length
                var allOrders=myOrders;
                allOrders=allOrders.splice((perPage*pageNumber)-perPage);
                allOrders=allOrders.slice(0,perPage);
                Announce.find({}).sort('-createTime').limit(8).exec(function(err,allAnnounce){
                    if(err){
                        return res.redirect("back");
                    }
                    res.render("dashboard/orders",{allOrders:allOrders,current:pageNumber,pages:Math.ceil(count/perPage),allAnnounce:allAnnounce,totalRates:fx.rates});
                })
                
            })
        }else{
            User.findById(req.user._id,function(err,user){
                if(err || !user){
                    return res.redirect("back");
                }
                var count=user.myOrders.length
                var allOrders=user.myOrders;
                allOrders=allOrders.splice((perPage*pageNumber)-perPage);
                allOrders=allOrders.slice(0,perPage);
                Announce.find({}).sort('-createTime').limit(8).exec(function(err,allAnnounce){
                    if(err){
                        return res.redirect("back");
                    }
                    res.render("dashboard/orders",{allOrders:allOrders,current:pageNumber,pages:Math.ceil(count/perPage),allAnnounce:allAnnounce,totalRates:fx.rates});
                })
                
            })
        }
    
    
})
router.get('/myPaypalorders',middleware.isLoggedIn,function(req,res){
    if(req.user.country==="INR"){
        return res.redirect('back');
    }
    var perPage=16;
        var pageQuery=parseInt(req.query.page);
        var pageNumber=pageQuery ? pageQuery : 1;
    User.findById(req.user._id,function(err,user){
        if(err || !user){
            return res.redirect("back");
        }
        Announce.find({}).sort('-createTime').limit(8).exec(function(err,allAnnounce){
            if(err){
                return res.redirect("back");
            }
            if(req.user.isAdmin){
                PayPalOrder.find({}).sort('-createTime').exec(function(err,allOrders){
                    var count=allOrders.length;
                    allOrders=allOrders.splice((perPage*pageNumber)-perPage);
                allOrders=allOrders.slice(0,perPage);
                    if(err){
                        return res.redirect("back");
                    }
                    res.render("dashboard/paypalOrderStats",{allOrders:allOrders,current:pageNumber,pages:Math.ceil(count/perPage),allAnnounce:allAnnounce,totalRates:fx.rates});
                })
            }else{
                PayPalOrder.find({email:req.user.email}).sort('-createTime').exec(function(err,allOrders){
                    if(err){
                        return res.redirect("back");
                    }
                    var count=allOrders.length;
                    allOrders=allOrders.splice((perPage*pageNumber)-perPage);
                allOrders=allOrders.slice(0,perPage);
                    res.render("dashboard/paypalOrderStats",{allOrders:allOrders,current:pageNumber,pages:Math.ceil(count/perPage),allAnnounce:allAnnounce,totalRates:fx.rates});
                })
            }
            
            
        })
        
    })
})
router.put('/complete/:id',middleware.isLoggedInAdmin,function(req,res){
    PayPalOrder.findById(req.params.id,function(err,foundOrder){
        if(err || foundOrder.status){
            return res.redirect("back");
        }
        User.findOne({email:foundOrder.email},function(err,foundUser){
            if(err || foundUser.country==="INR"){
                return res.redirect("back");
            }
            foundUser.lcbalance = +foundUser.lcbalance + +foundOrder.amountRecharge;
            foundOrder.status=true;
            foundUser.save(function(err){
                if(err){
                    return res.redirect("back");
                }
                foundOrder.save(function(err){
                    if(err){
                        return res.redirect("back");
                    }
                    res.redirect('/myPaypalorders');
                })
            })
        })
        
    })
})
router.delete('/deleteOrder/:id',middleware.isLoggedInAdmin,function(req,res){
    PayPalOrder.findByIdAndRemove(req.params.id,function(err){
        if(err){
            console.log(err);
        }
        return res.redirect('/myPaypalorders');
    })
})
router.delete('/deleteAllOrders',middleware.isLoggedInAdmin,function(req,res){
    PayPalOrder.deleteMany({status:false},function(err){
        if(err){
            console.log(err);
            return res.redirect("back");
        }
        res.redirect("back")
    })
})
router.delete("/dashboard/:id",middleware.isLoggedInAdmin,function(req,res){
    Product.findByIdAndRemove(req.params.id,function(err){
        if(err){
            console.log(err);
        }
        return res.redirect("/dashboard");
    })
})

router.get("/adminPower",middleware.isLoggedInAdmin,function(req,res){
    Announce.find({}).sort('-createTime').limit(8).exec(function(err,allAnnounce){
        if(err){
            return res.redirect("back");
        }
        res.render("dashboard/adminPanel",{allAnnounce:allAnnounce,totalRates:fx.rates});
    })
    
})
router.get("/lcbalance",middleware.isLoggedIn,function(req,res){
    var v={
        lcbalance:req.user.lcbalance
    }
    res.send(v);
})
router.get("/searchEmailPayPal",middleware.isLoggedInAdmin,function(req,res){
    var q = req.query.q;
    User.find({email :q},function(err,foundUsers){
        if(err){
            return res.redirect("/adminPower");
        }
        allKeys=[];
        var i =0;
        for(i=0;i<foundUsers.length;i++){
            var x=0;
            for(x=0;x<foundUsers[i].myOrders.length;x++){
                allKeys.push(foundUsers[i].myOrders[x]);
            }
        }
        res.json(allKeys);
    })
})
router.post("/paypalBlack",middleware.isLoggedInAdmin,function(req,res){
if(req.body.email.length>0){
    var email=req.body.email;
    var black={
        email:email
    }
    PaypalBlack.find({email:email},function(err,found){
        if(err){
            console.log(err);
            return res.redirect("back");
        }
        if(found && found.length>0){
            req.flash("error",email+" already blacklisted");
            return res.redirect("/adminPower");
        }else{
            PaypalBlack.create(black,function(err,bla){
                if(err){
                    console.log(err);
                    return res.redirect("back");
                }
                req.flash("success","Banned "+email+" successfully.");
                return res.redirect("/adminPower");
            })
        }
    })
    
}else{
    res.redirect("back");
}
})
router.delete("/paypalBlack",middleware.isLoggedInAdmin,function(req,res){
    if(req.body.email.length>0){
        PaypalBlack.find({email:req.body.email},function(err,found){
            if(err){
                console.log(err);
                return res.redirect("back");
            }
            if(found && found.length>0){
                PaypalBlack.deleteMany({ email:req.body.email}, function(err) {
                    if(err){
                        console.log(err);
                        return res.redirect("back");
                    }
                    req.flash("success","Unbanned "+req.body.email+" successfully.");
                    res.redirect("/adminPower");
                })
            }else{
                req.flash("error",req.body.email+" not found in blacklist!!");
                return res.redirect("/adminPower");
            }
        })
    }else{
        res.redirect("back");
    }
})
router.get("/settings",middleware.isLoggedIn,function(req,res){
    Announce.find({}).sort('-createTime').limit(8).exec(function(err,allAnnounce){
        if(err){
            return res.redirect("back");
        }
        res.render("authentication/settings",{allAnnounce:allAnnounce,totalRates:fx.rates});
    })
    
})
router.get("/discord",function(req,res){
    res.redirect(process.env.DISCORDLINK)
})
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
function DateExist(arr,date){
    return arr.some(function(ar){
        return ar.date.toString()===date.toString();
    })
}
function findIndexOfObjectInArray(arr,date){
    var index=0;
    arr.forEach(function(ar,i){
        if(ar.date.toString()===date.toString()){
            index=i;
        }
    })
    return index;
}
function resetProductKeysSold() {
    Product.updateMany({},{$set:{numberOfKeysSold:0}},function(err,result){
        if(err){
            console.log(err)
        }
    })
  }
  
  setInterval(resetProductKeysSold, 86400000);
module.exports=router;