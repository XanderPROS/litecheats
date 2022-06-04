


const username=currentUser.username;
var opposite=''
const socket=io();
var audio = new Audio();
audio.src = "../mp3/vv.mp3";
const userlist=document.getElementById("mmreet");
socket.emit('addsocketToUser',{username});
currentUserChats=[]
boxCount=0;
socket.on('announced',(post)=>{
    record(post);
})
socket.on("message",message=>{
    if ($('.boxx'+message.opposite).length || $('.boxx'+message.username).length){
        outputMessage(message);
        $(".my"+message.username).css("display","inline-block");
    }else{
        outputBox(message.username);
        $(".boxx"+message.username).css("display","none")
        outputMessage(message);
        $(".my"+message.username).css("display","inline-block");
    }
    
    
})
socket.on('onlineUser',({users})=>{
    outputUsers(users);
})
socket.on('refresh',(msg)=>{
    console.log(msg)
    window.location.reload();
})
function outputUsers(users){
    index = users.findIndex(x => x.username ===username);
    users.splice(index,1);
    var adminIndex=checkRoleIndex(users);
    array_move(users,adminIndex,0);
    users=users.filter(Boolean);
    userlist.innerHTML=`
    ${users.map(function(user){
        var ads;
        if(user.isAdmin && user.profilePic!==undefined && user.profilePic.length>0){
            var ads = `
            <div class="col-12 text-truncate trip noselect adminJob">
                                <svg width="40" height="32" viewBox="0 0 40 32">
                                    <foreignObject x="0" y="0" width="32" height="32">
                                        <img src="${user.profilePic}" class="imgg" width="32" height="32" alt=" " aria-hidden="true">
                                    </foreignObject>
                                    <circle cx="25" cy="27" r="5" fill="#66ff00">
                                    </circle>
                                </svg>
                                <div id="person-name">
                                    <span class="text-truncate" id="enemyName">${user.username}</span><div class="xzy my${user.username}"></div>
                                </div>
                            </div>
            `;
            return ads
        }else if(user.profilePic!==undefined && user.profilePic.length>0){
            var ads = `
            <div class="col-12 text-truncate trip noselect membersJob">
                                <svg width="40" height="32" viewBox="0 0 40 32">
                                    <foreignObject x="0" y="0" width="32" height="32">
                                        <img src="${user.profilePic}" class="imgg" width="32" height="32" alt=" " aria-hidden="true">
                                    </foreignObject>
                                    <circle cx="25" cy="27" r="5" fill="#66ff00">
                                    </circle>
                                </svg>
                                <div id="person-name">
                                    <span class="text-truncate" id="enemyName">${user.username}</span><div class="xzy my${user.username}"></div>
                                </div>
                            </div>
            `;
            return ads
        }
    }).join('')}
    `
}

$(document).ready(function(){
    $(document).on('click','.trip',function(){
        opposite=$(this).find("div span").text();
        $(".my"+opposite).css("display","none");
        $(".boxx"+opposite).css("display","block")
        if($('.boxx').length){
            $('.boxx').not('.boxx'+opposite).remove();
            currentUserChats=[];
        }
        
        
        if(!currentUserChats.includes(opposite) && !$('.boxx'+opposite).length){
            currentUserChats.push(opposite);
            outputBox(opposite);
        }
    })
    $(document).on('click','#closes',function(){
        var displayname=$(this).parents().eq(2).find(".usernameBox span").text().slice(0,-1);
            currentUserChats.splice(currentUserChats.indexOf(displayname),1)
        $(this).parents().eq(2).remove();
    })
    $(document).on('submit','#chat-form',function(event){
        event.preventDefault();
        const msg = event.target.elements.inputAre.value;
        opposite = $(this).parents().eq(2).find(".usernameBox span").text().slice(0,-1);
        
        socket.emit('chatMessage',{msg,opposite,username});
        event.target.elements.inputAre.value='';
        event.target.elements.inputAre.focus();
        
    })
    $(document).on("click",".buyButt",function(e){
        var userBalance=currentUser.lcbalance.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];
        var total=0;
        customerSelected=$(this).parent().parent().find('.nhy option:selected').text();//Day | 10$ | Month
        var amountperkey=+(customerSelected.substring(customerSelected.indexOf(' ',customerSelected.indexOf(' ')+1)+1, customerSelected.indexOf('$')));
        var stock=+(customerSelected.substring(customerSelected.indexOf(':')+1));
        var numberOfkeys=+($(this).parent().parent().find('.inputQuantity').val());
        total=amountperkey*numberOfkeys;
        if(currentUser.country==="INR"){
            
            total=total*totalRates.INR;
        }
        total=total.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]
        if(numberOfkeys>stock){
            e.preventDefault();
            $('#quantityStock').modal('show')
        }else if((userBalance-total)<0 || userBalance.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]==0){
            e.preventDefault();
            $('#insufficientBalance').modal('show')
        }else if(numberOfkeys<=0){
            e.preventDefault();
        }else if(customerSelected === "Choose..."){
            e.preventDefault();
        }
        // if(amountperkey.length>0){
            
        // }
    })
    $("#postAnn").on('submit',function(e){
       e.preventDefault()
        var title=$("#postTitle").val();
        var content=$("#postContent").val();
        if(title.length>0 && content.length>0){
        socket.emit('postAnnounce',{title:title,content:content});
        $("#postContent").val("");
        $("#postTitle").val("");
        }
    })

    $(document).on("click",".supportButtonB",function(){
        $('#tawk_629b0f62b0d10b6f3e75a543').show();
        $(this).removeClass('btn-outline-secondary supportButtonB').addClass('closeSupportB btn-outline-danger').html('<i class="fas fa-times fa-sm mr-2"></i>Close Support').css('background-color','red');
    })
    $(document).on("click",".closeSupportB",function(){
        $('#tawk_629b0f62b0d10b6f3e75a543').hide();
        $(this).removeClass('closeSupportB btn-outline-danger').addClass('btn-outline-secondary supportButtonB').html('<i class="fas fa-phone-alt fa-sm mr-2"></i>Contact Support').css('background-color','#ffc107');
       
    })
    
    
})


// const chatForm = document.getElementById("chat-form");
// chatForm.addEventListener('submit',(e)=>{
//     e.preventDefault();
//     const msg = e.target.elements.inputAre.value;
//     console.log(opposite);
//     socket.emit('chatMessage',{msg,opposite,username});
//     e.target.elements.inputAre.value='';
//     e.target.elements.inputAre.focus();
// })
function record(post){
    var totalPost=`
    <div class="col-12 announcemessage">
                        <div class="headingmessage">
                        <span class="badge badge-danger">New</span>
                            <span>${post.title}</span>
                        </div>
                        <div class="description">
                            <span class="dottedUnderline">
                            ${post.content}
                            </span>
                        </div>
                        <div class="time">
                            <span class="dottedUnderline">
                            
                            ${moment(post.createTime).format("dddd, MMMM Do YYYY, h:mm:ss a")}
                        </span>
                        </div>
                    </div>
    `
    $('#announcements').prepend(totalPost);
}
function outputMessage(message){
    const p = document.createElement('p');
    p.classList.add("myMessage");
    if(message.opposite===username){
        audio.play();
    }
    if(message.username === username){//my messages
        p.innerHTML=`${message.text}`;
    document.querySelector('.messageBox'+message.opposite).appendChild(p);
    const chatMessages=document.querySelector('.messageBox'+message.opposite);
    chatMessages.scrollTop=chatMessages.scrollHeight;
    }else{
        p.classList.remove("myMessage");
        p.classList.add("enemyMessage");
        p.innerHTML=`${message.text}`;
    document.querySelector('.messageBox'+message.username).appendChild(p);
    const chatMessages=document.querySelector('.messageBox'+message.username);
    chatMessages.scrollTop=chatMessages.scrollHeight;
    }
    
}
function outputBox(opposite){
    const div = document.createElement('div');
    div.classList.add("boxx","boxx"+opposite);
    div.innerHTML=`
    <div class="usernameBox text-truncate ">
                    <span class="x"><span class="dot"></span>${opposite}</span>
                    <button id="closeMessageBox" type="button" class="close" aria-label="Close">
                        <span id="closes" aria-hidden="true"">&times;</span>
                    </button>
                </div>
                <div class="messageBox messageBox${opposite}">
                    
                </div>
                <div class="messageArea">
                    <div class="form">
                        <form action="" id="chat-form">
                            <div id="inputSpace">
                                <textarea name="message" id="inputAre" class="inputAre${opposite}"></textarea>
                            </div>
                            <div id="sendSpace">
                                <button type="submit" class="btn btn-info" id="sendMessageButton"><i class="fab fa-telegram-plane fa-3x"></i></button>
                            </div>
                        </form>
                    </div>
                </div>
    `
    document.querySelector('.bottom').appendChild(div);
        
    
}
var showResults = debounce(function(arg){
    var value = arg.trim();
    if(value==="" || value.length <= 0){
        $("#search-results").fadeOut();
    }else{
        $("#search-results").fadeIn();
    };
    var jqxhr = $.get("/search?q="+value,function(data){
        $("#search-results").html("");
    })
    .done(function(data){
        if(data.length===0){
            $("#search-results").append('<p class="lead text-center llss mt-1 mb-1" style="font-weight:300;">No results</p>');
        }else{
            const uniqueAddresses = Array.from(new Set(data.map(a => a.name)));
            uniqueAddresses.forEach(x => {
                $('#search-results').append('<a class="gglink" style ="text-decoration: none;" href="/dashboard?search='+x+'"><p class="nnb lead">'+'<span class="llrr">'+x.substring(0,1)+'</span><span class="llss">'+x.substring(1,x.length)+'</span></p></a>')
            });
        }
    })
    .fail(function(err){
        console.log(err);
    })
},200)

function debounce(func,wait,immediate){
    var timeout;
    return function(){
        var context=this,
            args=arguments;
        var later=function(){
            timeout=null;
            if(!immediate) func.apply(context,args);
        };
        var callNow=immediate && !timeout;
        clearTimeout(timeout);
        timeout=setTimeout(later,wait);
        if(callNow) func.apply(context,args);
    }
}

function checkRoleIndex(listofUsers){
    var i=0;
    for(i=0;i<listofUsers.length;i++){
        if(listofUsers[i].isAdmin===true){
            return i;
        }
    }
}
function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
};

var tds=document.getElementsByClassName('timeOrder')
var tds=[].slice.apply(tds)
tds.forEach(function(f){
f.textContent=moment.utc(new Date(f.textContent)).local().format('YYYY-MM-DD HH:mm:ss');
})
var tdss=document.getElementsByClassName('timeH')
var tdss=[].slice.apply(tdss)
tdss.forEach(function(f){
f.textContent=moment.utc(new Date(f.textContent.trim())).local().format("dddd, MMMM Do YYYY, h:mm:ss a");
})

$( window ).on( "load", function() {
    if(currentUser.country==='INR'){
        setTimeout(function(){
            $.getJSON('/lcbalance').then(function(data){
                if( data && data !== undefined){
                    $('#balanceINR').text(data.lcbalance.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]);
                    currentUser.lcbalance=data.lcbalance;
                }
            })
        },2000);
    }
 })

 dragElement(document.getElementById('videoElem'))

 function dragElement(elmnt){
     var pos1=0,pos2=0,pos3=0,pos4=0;
     if(document.getElementById('liveHeading')){
         document.getElementById('liveHeading').onmousedown=dragMouseDown;

     }else{
         elmnt.onmousedown=dragMouseDown;
     }

     function dragMouseDown(e){
        e=e || window.event;
        e.preventDefault()
        pos3=e.clientX;
        pos4=e.clientY;
        document.onmouseup=closeDragElement;
        document.onmousemove=elementDrag;
        
    }
    function elementDrag(e){
        e=e||windows.event;
        e.preventDefault();
        pos1=pos3-e.clientX;
        pos2=pos4-e.clientY;
        pos3=e.clientX;
        pos4=e.clientY;
        elmnt.style.top=(elmnt.offsetTop-pos2)+"px";
        elmnt.style.left=(elmnt.offsetLeft-pos1)+"px";
    }
    function closeDragElement(){
        document.onmouseup=null;
        document.onmousemove=null;
       
    }
 }

 window.addEventListener('touchstart',function(){
    flickelement(document.getElementById('videoElem'))
    function flickelement(elmnt){
        var pos1=0,pos2=0,pos3=0,pos4=0;
        if(document.getElementById('liveHeading')){
            document.getElementById('liveHeading').ontouchstart=dragTouchDown;
        }else{
            elmnt.ontouchend=dragTouchDown;
        }
   
        function dragTouchDown(e){
           e=e || window.event;
           e.preventDefault()
           pos3=e.touches[0].clientX;
           pos4=e.touches[0].clientY;
           document.ontouchend=closeTouchElement;
           document.ontouchmove=touchDrag;
           
       }
       function touchDrag(e){
           e=e||windows.event;
           e.preventDefault();
           pos1=pos3-e.touches[0].clientX;
           pos2=pos4-e.touches[0].clientY;
           pos3=e.touches[0].clientX;
           pos4=e.touches[0].clientY;
           elmnt.style.top=(elmnt.offsetTop-pos2)+"px";
           elmnt.style.left=(elmnt.offsetLeft-pos1)+"px";
       }
       function closeTouchElement(){
           document.ontouchend=null;
           document.ontouchmove=null;
          
       }
    }
 })

 