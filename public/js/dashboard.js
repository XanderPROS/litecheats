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

document.getElementById('rzp-button1').onclick = async(e)=>{
  e.preventDefault();
  const res = await fetch('/razorpay_orderId', {
    body: JSON.stringify({
        rechargeAmount:document.getElementById("rechargeAmount").value
    }),
    headers: {
        "Content-Type": "application/json",
    },
    method: "POST",
})
const { order } = await res.json();
const rzrPay = await initializeRazorpay();
if (!rzrPay) {
    alert("Razorpay SDK Failed to load");
    return;
}
var options = {
  key: '', // Enter the Key ID generated from the Dashboard
  name: "litecheats",
  currency: order.currency,
  amount: order.amount,
  order_id: order.id,
  description: "Thank you for choosing Litecheats",
  image: "https://www.goldencreche.com/logo.png",
  handler: async (response) => {
    location.reload();
  },
};

const paymentObject = new window.Razorpay(options);
paymentObject.open();
}
const initializeRazorpay = () => {
  return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      // document.body.appendChild(script);

      script.onload = () => {
          resolve(true);
      };
      script.onerror = () => {
          resolve(false);
      };

      document.body.appendChild(script);
  });
};