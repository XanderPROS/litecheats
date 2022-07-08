
var showResults = debounce(function(arg){
    var value = arg.trim();
    if(value==="" || value.length <= 0){
        $("#search-results").fadeOut();
    }else{
        $("#search-results").fadeIn();
    };
    var jqxhr = $.get("/searchPost?q="+value,function(data){
        $("#search-results").html("");
    })
    .done(function(data){
        console.log(data)
        if(data.length===0){
            $("#search-results").append('<p class="lead text-center llss mt-1 mb-1" style="font-weight:300;">No results</p>');
        }else{
            const uniqueAddresses = Array.from(new Set(data.map(a => ({title:a.title,slug:a.slug.current,category:a.categories.slug.current}))));
            uniqueAddresses.forEach(x => {
                $('#search-results').append(`<a class="gglink" style ="text-decoration: none;" href="/posts/${x.category}/${x.slug}`+'"><p class="nnb lead">'+'<span class="llrr">'+x.title.substring(0,1)+'</span><span class="llss">'+x.title.substring(1,x.title.length)+'</span></p></a>')
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