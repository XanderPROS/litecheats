         var User = require("../models/user"),
    middlewareObj = {};
//Chack if user logged out
middlewareObj.isLoggedOut=function(req,res,next){
    if(!req.isAuthenticated()){
       
        return next();
    }
    req.flash("error","Please log out before sign up!!!")
    res.redirect("/dashboard");    
}
//Chack if user logged in
middlewareObj.isLoggedIn=function(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error","You need to be logged in");
    res.redirect("/");
}

middlewareObj.isLoggedInAdmin=function(req,res,next){
    if(req.isAuthenticated() && req.user.isAdmin){
        return next();
    }
    req.flash("error","You need to be logged in");
    res.redirect("/");
}

module.exports=middlewareObj;

