const nodemailer = require('nodemailer');


const transport = nodemailer.createTransport({
    host: "send.one.com",
    port: 465,
    auth:{
        user: process.env.GMAILUSER,
        pass:process.env.GMAILPW
    }
});

module.exports = {
    sendEmail(from,to,subject,html){
        return new Promise((resolve,reject) =>{
            transport.sendMail({from,subject,to,html},(err,info)=>{
                if(err) reject(err);

                resolve(info);
            })
        })
    }
}