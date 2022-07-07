require('dotenv').config();
var express = require("express"),
    app = express(),
    bodyParser=require("body-parser"),
    helmet = require('helmet'),
    flash=require('connect-flash'),
    http=require("http"),
    methodOverride=require("method-override"),
    passport=require("passport"),
    mongoose = require("mongoose"),
    Product=require("./models/product"),
    Announce=require("./models/announcement"),
    User=require("./models/user"),
    PaypalBlack=require("./models/paypalBlacklist"),
    PayPalOrder=require("./models/orderlist"),
    OrderNumber=require("./models/ordernumber"),
    LocalStrategy         = require("passport-local").Strategy,
    seedDB=require('./seed'),
    passportLocalMongoose = require("passport-local-mongoose");
    const server = http.createServer(app);
    const socketio=require('socket.io');
    const io=socketio(server);
    const formatMessage=require("./utils/messages");
    const {userJoin,getCurrentUser,userLeave,getUsers,changeUserPic}=require('./utils/users');
    // OrderNumber.create({name:'orders',orderNumber:'0'},function(err,found){
    //     console.log(found);
    // })
    io.on('connection',socket=>{
        
        socket.on('addsocketToUser',(username)=>{
            
            User.findOneAndUpdate({username:username.username},{mysocket:socket.id},function(err,user){
                if(err || !user){
                    console.log(err);
                    return
                }
                const userr = userJoin(socket.id,user.username,user.isAdmin,user.profilePic);
                io.emit('onlineUser',{users:getUsers()});
                
            })
        })
        // socket.on('joinRoom',({username,room})=>{
            
        // })
        
        
        socket.on('chatMessage',({msg,opposite,username})=>{
            var enemyID=''
            var myID=''
            User.findOneAndUpdate({username:username},{mysocket:socket.id},function(err,user){
                if(err || !user){
                    console.log("Problem2");
                    return
                }
                io.to(socket.id).emit('message',formatMessage(username,msg,opposite));
                User.findOne({username:opposite},function(err,user){
                    if(err || !user){
                        console.log('problem2');
                        return
                    }
                    enemyID=user.mysocket;
                    io.to(`${enemyID}`).emit('message',formatMessage(username,msg,opposite));
                })
            })
        })
        
        socket.on('disconnect',()=>{
                io.emit('onlineUser',{users:getUsers()});
                
                
        })
        socket.on('postAnnounce',({title,content})=>{
            var newPost={
                title:title,
                content:content
            }
            Announce.create(newPost,function(err,post){
                if(err){
                    console.log(err);
                    return false;
                }
                io.emit('announced',post);
            })
        })
    });
    
var indexRoutes = require("./routes/index"),
    authRoutes=require("./routes/users"),
    payRoutes=require("./routes/payment"),
    dashRoutes=require("./routes/dashboard");
    homeRoutes=require("./routes/home");


mongoose.set('useUnifiedTopology',true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
var url=process.env.DATABASEURL || "mongodb://localhost/lite_cheats";
mongoose.connect(url,{useNewUrlParser:true});

app.set("view engine","ejs");
app.use(express.static(__dirname+"/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(flash());
app.use(helmet())
app.use(require("express-session")({
    secret:"never take risk in this",
    resave:false,
    saveUninitialized:false
}))
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: false
}, async (email, password, done) => {
    try {
        // 1) Check if the email already exists
        const user = await User.findOne({ 'email': email });
        if (!user) {
            return await done(null, false, { message: 'Unknown User' });
        }

        // 2) Check if the password is correct
        const isValid = await User.comparePasswords(password, user.password);
        if (!isValid) {
            return await done(null, false, { message: 'Unknown Password' });
        }

        // 3) Check if email has been verified
        if (!user.active) {
            return done(null, false, { message: 'Sorry, you must validate email first' });
        }

        return done(null, user);
    } catch(error) {
        return done(error, false);
    }
}));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.locals.moment = require('moment');
app.use(async function(req,res,next){
    res.locals.currentUser=req.user;
    res.locals.error=req.flash("error");
    res.locals.success=req.flash("success");
    next();
});
app.use(authRoutes);
app.use(dashRoutes);
app.use(payRoutes);
app.use(homeRoutes)
app.use(indexRoutes);

// app.use("/campgrounds",campgroundRoutes);
// app.use("/campgrounds/:slug/reviews", reviewRoutes);
const PORT = process.env.PORT || 8000;

server.listen(PORT,process.env.IP,function(){
    
})

