$(document).ready(function(){
    $('#username').on('blur',function(e){
        var letters = /^[0-9a-zA-Z]+$/;
        if(!this.value.match(letters)){
            $(this).addClass("bad");
            $(this).parent().find("#ee").addClass("warning");
            $(this).focus();
        }else{
            $(this).removeClass("bad");
            $(this).parent().find("#ee").removeClass("warning");
            return false;
        }
    })
    $('#password').on('blur', function(){
        var letters = /^[0-9a-zA-Z]+$/;
        if((this.value.length < 6) || !this.value.match(letters)){ // checks the password value length
           $(this).addClass("bad");
           $(this).parent().find("#ee").addClass("warning");
           $(this).focus(); // focuses the current field.
            // stops the execution.
        }
        else{
            $(this).removeClass("bad");
            $(this).parent().find("#ee").removeClass("warning");
            return false;
        }
        
    });
})
$(document).ready(function(){
    $('#confirmPassword').on('blur', function(){
        if(this.value != $("#password").val()){ // checks the password value length
           $(this).addClass("bad");
           $("#password").addClass("baddy");
           $(this).focus(); // focuses the current field.
            // stops the execution.
        }
        if(this.value==$("#password").val()){
            $(this).removeClass("bad");
            $("#password").removeClass("baddy");
            return false;
        }
        
    });
})


