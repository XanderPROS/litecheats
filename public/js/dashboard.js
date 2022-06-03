var x=false;
function w3_open() {
  document.getElementById("navbarDropdown").classList.add("active")
    document.getElementById("mySidebar").classList.add("w3-animate-right")
  document.getElementById("mySidebar").style.display = "block";
  document.getElementsByClassName("bottom")[0].classList.remove("rightReduce");
  x=true;
}

function w3_close() {
  document.getElementById("navbarDropdown").classList.remove("active");
  document.getElementById("mySidebar").style.display = "none";
  document.getElementById("mySidebar").classList.remove("w3-animate-right")
  document.getElementsByClassName("bottom")[0].classList.add("rightReduce");
  
  
  x=false;
}
function showw(){
    x ? w3_close() : w3_open();
}

function closeMessageBox(){
  document.getElementsByClassName("bottom")[0].style.display="none";
  
}
$(document).ready(function(){
  $(document).on("mousedown",".trip",function(){
    $(this).toggleClass('blueC')
  })
  $(document).on("mouseup",".trip",function(){
    $(this).toggleClass('blueC')
  })
  $(document).on("mouseleave",".trip",function(){
    $(this).removeClass('blueC')
  })
  $(document).on("touchstart",".trip",function(){
    $(this).toggleClass('blueC')
  })
  $(document).on("touchend",".trip",function(){
    $(this).toggleClass('blueC')
  })
  $(document).on("click",".trip",function(){
    $(".bottom").css("display", "block");
  })
})
