var app = require("express");
var User = require("../models/user");
var router=app.Router();
var middleware = require("../middleware");

router.get("/",middleware.isLoggedOut,function(req,res){
    res.render("authentication/login");
})
router.get("*",function(req,res){
    res.redirect("/login")
})

module.exports = router;