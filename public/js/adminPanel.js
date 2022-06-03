$(document).ready(function(){
    $("select.adminup").change(function(){
        var selectedup = $(this).children("option:selected").val();
        $('.adminOPT').hide();
        if(selectedup==="checkKeyPayPal"){
            $('#checkKeyPayPal').show();
        }
        if(selectedup==="addBPayPal"){
            $('#addBPayPal').show();
        }
        if(selectedup==="removeBPayPal"){
            $('#removeBPayPal').show();            
        }
        if(selectedup==="rechargeEmail"){
            $('#rechargeEmail').show();            
        }
        if(selectedup==="resetPassword"){
            $('#resetPassword').show();            
        }
    });
    $("#checkKeyPayPal"). on('submit',function (e) {
        e.preventDefault();
        var email=$(this).parent().parent().find('input').val().trim();
        $.get("/searchEmailPayPal?q="+email,function(data){
            $(".form-control").val("");
            $(".resultsOf").html("");
            $("#searchpaypalResult").html("");
            if(data.length===0){
                $("#searchpaypalResult").append('<p class="lead text-center llss mt-1 mb-1" style="font-weight:300;">No results</p>');
            }else{
                var i=0;
                data.forEach(function(order){
                    $("#searchpaypalResult").append(`
                        <div class="alert alert-primary" role="alert">
                                <h6>${order.productName}</h6>
                                <h6>${order.keytype}</h6>
                                <ul id="order${i}"></ul><span class="lastUpdated"><i>Purchased ${moment(order.orderTime).fromNow()}</i>.</span></div>`)
                                order.listOfkeys.forEach(function(key){
                                    $(`#order${i}`).append(`<li>${key}</li>`);
                                })
                    i=i+1;
                })
                
                
            }
        })
        
    })
})