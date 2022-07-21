var app = require("express");
var User = require("../models/user");
var router=app.Router();
var middleware = require("../middleware");

router.get("/",function(req,res){
    res.redirect("/login");
})
router.get("*",function(req,res){
    res.redirect("/")
})

module.exports = router;