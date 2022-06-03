const users = [];
function userJoin(id,username,isAdmin=false,profilePic){
    
    if(checkUser(username)){
        updateID(id,username)
        return id;
    }else{
        const user = {id,username,isAdmin,profilePic}; //Add user to list of users in room
        users.push(user);
        return user
    }
    
}
function checkUser(username){
    var i;
    for (i=0;i<users.length;i++){
        if(users[i].username===username){
            return true;
        }
        
    }
    return false
}
function updateID(id,username){
    var i;
    for(i=0;i<users.length;i++){
        if(users[i].username===username){
            users[i].id=id;
        }
    }
}
function getCurrentUser(id){
    return users.find(user=>user.id===id); //return user of give id
}
function userLeave(id){
    const index = users.findIndex(user => user.id === id);

    if(index !== -1){
        return users.splice(index,1)[0];
    }
}
function getUsers(){
    return users;
}
function changeUserPic(username,profilePic){
    var index=users.findIndex(x => x.username === username);
    if(index !== -1){
        users[index].profilePic=profilePic;
    }
}
module.exports = {userJoin,getCurrentUser,userLeave,getUsers,changeUserPic};