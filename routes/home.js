var app = require("express");
var router=app.Router();
var middleware = require("../middleware");
const {client,urlFor} = require('../utils/client');
const {dateString} = require('../utils/dateString');
const sendgrid = require('@sendgrid/mail');
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

router.get("/home",async(req,res)=>{
    const query = '*[_type=="post"]{_createdAt,author->,body,categories[0]->,mainImage,slug,title}';
    let posts = await client.fetch(query);
    
    posts =  posts.map((post)=>({...post,
        mainImage:String(urlFor(post.mainImage)),
        author:{...post.author,image:String(urlFor(post.author.image))},
    }))
    
    res.render("main/home",{posts:posts,dateString:dateString});
})

router.get("/posts/:postCategorySlug/:postSlug",async(req,res)=>{
    const postCategorySlug = req.params.postCategorySlug;
    const postSlug = req.params.postSlug;
    console.log(postSlug)
    const query = `*[_type=="post" && slug.current=="${postSlug}"]{_createdAt,author->,body,categories[0]->,mainImage,slug,title}`;
    let posts = await client.fetch(query);
    
    posts =  posts.map((post)=>({...post,
        mainImage:String(urlFor(post.mainImage)),
        author:{...post.author,image:String(urlFor(post.author.image))},
    }))
    res.render('main/post',{post:posts[0],dateString:dateString});
})

router.get("/search/:postCategory",async(req,res)=>{
    const postCategory = req.params.postCategory;
    const query = `*[_type=="post" && categories[0]->title=="${postCategory}"]{_createdAt,author->,body,categories[0]->,mainImage,slug,title}`;
    let posts = await client.fetch(query);
    
    posts =  posts.map((post)=>({...post,
        mainImage:String(urlFor(post.mainImage)),
        author:{...post.author,image:String(urlFor(post.author.image))},
    }))
    console.log(posts)
    res.render("main/home",{posts:posts,dateString:dateString});
})

router.get("/disclaimer",async(req,res)=>{
    res.render('main/disclaimer')
})
router.get("/privacy-policy",async(req,res)=>{
    res.render('main/privacy-policy')
})
router.get("/contact-us",async(req,res)=>{
    res.render('main/contact-us')
})
router.get("/about-us",async(req,res)=>{
    res.render('main/about-us')
})
router.post('/send-message',async(req,res)=>{
    try{
        const email = {
            to: 'litecheatsofficial@gmail.com',
            from: 'contact@litecheats.org',
            subject: `${req.body.subject}`,
            html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html lang="en">
      <head>
        <meta charset="utf-8">
      
        <title>The HTML5 Herald</title>
        <meta name="description" content="The HTML5 Herald">
        <meta name="author" content="SitePoint">
      <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
      
        <link rel="stylesheet" href="css/styles.css?v=1.0">
      
      </head>
      
      <body>
        <div class="img-container" style="display: flex;justify-content: center;align-items: center;border-radius: 5px;overflow: hidden; font-family: 'helvetica', 'ui-sans';">              
              </div>
              <div class="container" style="margin-left: 20px;margin-right: 20px;">
              <h3>You've got a new mail from ${req.body.fullname}, their email is: ✉️${req.body.email} and their Phone Number is: <a href="tel:${req.body.phonenumber}">${req.body.phonenumber}</a></h3>
              <div style="font-size: 16px;">
              <p>Message:</p>
              <p>${req.body.message}</p>
              <br>
              </div>
              </div>
              </div>
      </body>
      </html>`
        }
        await sendgrid.send(email);
        req.flash("success","Message sent successfully");
        return res.redirect('/contact-us')
    }catch(error){
        console.log(error)
        req.flash("error","Server error.Try again later.");
        return res.redirect('back')
    }
})
router.get('/searchPost',async(req,res)=>{
    var q = req.query.q;
    console.log(q)
    const regex= new RegExp(escapeRegex(q),"gi");
    console.log(regex)
    const query = `*[_type=="post" && title match "${q}*"]{title,slug,categories[0]->}`;
    console.log(query)
    let posts = await client.fetch(query);
    console.log(posts)
    res.json(posts)
})

module.exports = router;

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};