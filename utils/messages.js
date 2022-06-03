const moment=require('moment');

function formatMessage(username,text,opposite){
    return {
        username,
        text,
        opposite,
        time:moment().format('h:mm a')
    }
}

module.exports=formatMessage;