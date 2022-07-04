const express = require("express"),
    Razorpay = require('razorpay'),
    User = require("../models/user"),
    PaypalBlack = require("../models/paypalBlacklist"),
    PayPalOrder = require("../models/orderlist"),
    OrderNumber = require("../models/ordernumber"),
    router = express.Router(),
    paypal = require("paypal-rest-sdk"),
    middleware = require("../middleware"),
    coinbase = require('coinbase-commerce-node'),
    mailer = require("../misc/mailer"),
    Charge = coinbase.resources.Charge,
    Client = coinbase.Client,
    clientObj = Client.init(process.env.COINBASE_API),
    Webhook = require('coinbase-commerce-node').Webhook;
var webhookSecret = process.env.YOUR_WEBHOOK;
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');
const https = require('https');
var uniqid = require('uniqid');
const checksum_lib = require('../misc/checksum');
const { func } = require("joi");
paypal.configure({
    'mode': process.env.PAYPAL_MODE, //sandbox or live
    'client_id': process.env.PAYPAL_CLIENT_ID,
    'client_secret': process.env.PAYPAL_CLIENT_SECRET
});
var instance = new Razorpay({
    key_id: process.env.RAZOR_KEY,
    key_secret: process.env.RAZOR_SECRET
})
router.post("/recharge_paypal", middleware.isLoggedIn, function (req, res) {
    if (req.user.country === "INR") {
        return res.redirect('back');
    }
    if (!req.body.rechargeAmount) {
        return res.redirect("back");
    }
    var fee = req.body.rechargeAmount * process.env.PAYPAL_FEE + 0.3;
    var gst = fee * 0.18;
    var totalfee = Math.round(fee + gst);
    var totalPrice = +req.body.rechargeAmount + totalfee;
    console.log(totalPrice)
    res.render('dashboard/paypalMid', { totalPrice: totalPrice, normalPrice: req.body.rechargeAmount, email: process.env.PAYPAL_EMAIL, note: process.env.PAYPAL_NOTE });

})

router.post("/success/:id", function (req, res) {
    if (req.user.country === "INR") {
        return res.redirect('back');
    }
    OrderNumber.findOne({ name: "orders" }, function (err, order) {
        if (err) {
            res.redirect("/dashboard");
        }
        var newOrder = {
            orderNumber: order.orderNumber,
            email: req.user.email,
            paypalEmail: req.body.paypalEmail,
            amountRecharge: req.body.normalPrice,
            amountPaid: req.body.totalPrice,
            fee: req.body.totalPrice - req.body.normalPrice
        }
        PayPalOrder.create(newOrder, function (err, newItem) {
            if (err) {
                res.redirect("/dashboard");
            }
            order.orderNumber = +order.orderNumber + 1;
            order.save(function () {
                console.log(newItem);
                res.redirect('/myPaypalorders');
            })
        })
    })
})

router.get("/cancel", function (req, res) {
    res.redirect("/dashboard");
})
router.post("/create_charge", middleware.isLoggedIn, function (req, res) {
    if (!req.body.rechargeAmount) {
        return res.redirect("back");
    }
    var chargeObj = new Charge();

    chargeObj.name = "LC_RECHARGE";
    chargeObj.description = 'Software developer and server hosting services';
    chargeObj.local_price = {
        'amount': req.body.rechargeAmount,
        'currency': req.user.country
    };
    chargeObj.metadata = {
        "customer_id": req.user._id,
        "customer_name": req.user.username
    }
    chargeObj.pricing_type = 'fixed_price';
    chargeObj.redirect_url = "https://" + req.headers.host + "/dashboard";
    chargeObj.cancel_url = "https://" + req.headers.host + "/dashboard";
    chargeObj.save(function (error, response) {
        if (error) {
            return res.redirect("back")
        }
        User.findById(req.user._id, function (err, user) {
            if (err) {
                return res.redirect("back")
            }
            user.chargeCodes.push(response.code);
            user.save(function (err) {
                return res.redirect(response.hosted_url);
            })
        })
    });

})

router.post("/success_btc", function (req, res) {
    var incomingSig = req.headers['x-cc-webhook-signature'];
    let bodyData = JSON.stringify(req.body);
    var outgoingSig = require("crypto").createHmac("sha256", webhookSecret).update(bodyData).digest("hex");

    if (incomingSig === outgoingSig) {
        if (req.body.event.type === "charge:confirmed") {
            Charge.retrieve(req.body.event.data.id, function (error, response) {
                if (error) {
                    console.log(error);
                }
                User.findById(response.metadata.customer_id, function (err, user) {
                    if (err) {
                        console.log(err);
                        return
                    }
                    if (user.chargeCodes.includes(response.code)) {
                        user.chargeCodes.splice(user.chargeCodes.indexOf(response.code), 1);
                        user.lcbalance = +user.lcbalance + +response.pricing.local.amount;
                        user.save(function () {
                            res.sendStatus(200);
                        })
                    }
                })
            })
        }
        if (req.body.event.type === "charge:failed") {
            Charge.retrieve(req.body.event.data.id, function (error, response) {
                if (error) {
                    console.log(error);
                    return
                }
                User.findById(response.metadata.customer_id, function (err, user) {
                    if (err) {
                        console.log(err);
                        return
                    }
                    if (user.chargeCodes.includes(response.code)) {
                        user.chargeCodes.splice(user.chargeCodes.indexOf(response.code), 1);
                        user.save(function () {
                            res.sendStatus(200);
                        })
                    }
                })
            })
        }
    } else {
        return res.sendStatus(400);
    }
})
router.post("/recharge_paytm", middleware.isLoggedIn, function (req, res) {
    if (req.user.country === "INR") {
        if (!req.body.rechargeAmount) {
            return res.redirect("back");
        }
        var paytmParams = {

            /* Find your MID in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys */
            "MID": process.env.PAYTMMID,

            /* Find your WEBSITE in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys */
            "WEBSITE": process.env.PAYTMWEBSITE,

            /* Find your INDUSTRY_TYPE_ID in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys */
            "INDUSTRY_TYPE_ID": process.env.PAYTMINDUSTRY,

            /* WEB for website and WAP for Mobile-websites or App */
            "CHANNEL_ID": "WEB",

            /* Enter your unique order id */
            "ORDER_ID": uniqid(),

            /* unique id that belongs to your customer */
            "CUST_ID": req.user._id.toString(),

            /* customer's email */
            "EMAIL": req.user.email,

            /**
            * Amount in INR that is payble by customer
            * this should be numeric with optionally having two decimal points
            */
            "TXN_AMOUNT": req.body.rechargeAmount + ".00",

            /* on completion of transaction, we will send you the response on this URL */
            "CALLBACK_URL": "https://" + req.headers.host + "/success_paytm/" + req.user._id
        };

        /**
        * Generate checksum for parameters we have
        * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
        */
        checksum_lib.genchecksum(paytmParams, process.env.PAYTMKEY, function (err, checksum) {

            /* for Staging */
            var url = process.env.PAYTMURL;

            /* for Production */
            // var url = "https://securegw.paytm.in/order/process";

            /* Prepare HTML Form and Submit to Paytm */
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write('<html>');
            res.write('<head>');
            res.write('<title>Merchant Checkout Page</title>');
            res.write('</head>');
            res.write('<body>');
            res.write('<center><h1>Please do not refresh this page...</h1></center>');
            res.write('<form method="post" action="' + url + '" name="paytm_form">');
            for (var x in paytmParams) {
                res.write('<input type="hidden" name="' + x + '" value="' + paytmParams[x] + '">');
            }
            res.write('<input type="hidden" name="CHECKSUMHASH" value="' + checksum + '">');
            res.write('</form>');
            res.write('<script type="text/javascript">');
            res.write('document.paytm_form.submit();');
            res.write('</script>');
            res.write('</body>');
            res.write('</html>');
            res.end();
        });
    } else {
        return res.redirect("back");
    }

})
router.post("/razorpay_orderId", middleware.isLoggedIn, async (req, res) => {
    if (req.user.country === "INR") {
        if (!req.body.rechargeAmount) {
            return res.redirect("back");
        }
        var options = {
            amount: Math.round(req.body.rechargeAmount) * 100,
            currency: 'INR',
        }
        var order = await instance.orders.create(options);
        var orderId = order.id;
        const user = await User.findById(req.user._id);
        user.razor_orderId = orderId;
        await user.save();
        res.status(200).json({ order });
    } else {
        return res.redirect("back");
    }

})
router.post("/razorpay_recharge", async (req, res) => {
    if (validateWebhookSignature(JSON.stringify(req.body), req.headers['x-razorpay-signature'], process.env.RAZOR_WEBHOOK_SECRET)) {
        try {
            const event = req.body.event;
            if (event === 'payment.captured') {
               
                const orderId = req.body.payload.payment.entity.order_id;
                const amount = req.body.payload.payment.entity.amount/100;
                const user = await User.findOne({razor_orderId:orderId});
                user.lcbalance = +user.lcbalance + +amount;
                user.razor_orderId='';
                await user.save();
                res.status(200).json();
            }
        } catch (error) {
            console.log(error)
            res.status(500).json();
        }
    }


})
router.post("/success_paytm/:id", function (req, res) {
    var paytmChecksum = "";
    /**
    * Create an Object from the parameters received in POST
    * received_data should contains all data received in POST
    */
    var received_data = req.body;
    var paytmParams = {};
    for (var key in received_data) {
        if (key == "CHECKSUMHASH") {
            paytmChecksum = received_data[key];
        } else {
            paytmParams[key] = received_data[key];
        }
    }

    /**
    * Verify checksum
    * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
    */
    var isValidChecksum = checksum_lib.verifychecksum(paytmParams, process.env.PAYTMKEY, paytmChecksum);
    if (isValidChecksum) {
        /* initialize an object */
        var paytmParams = {};

        /* Find your MID in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys */
        paytmParams["MID"] = process.env.PAYTMMID;

        /* Enter your order id which needs to be check status for */
        paytmParams["ORDERID"] = received_data.ORDERID;

        /**
        * Generate checksum by parameters we have
        * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
        */
        checksum_lib.genchecksum(paytmParams, process.env.PAYTMKEY, function (err, checksum) {

            /* put generated checksum value here */
            paytmParams["CHECKSUMHASH"] = checksum;

            /* prepare JSON string for request */
            var post_data = JSON.stringify(paytmParams);

            var options = {

                /* for Staging */
                hostname: process.env.PAYTMTRANSURL,

                /* for Production */
                // hostname: 'securegw.paytm.in',

                port: 443,
                path: '/order/status',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': post_data.length
                }
            };

            // Set up the request
            var response = "";
            var post_req = https.request(options, function (post_res) {
                post_res.on('data', function (chunk) {
                    response += chunk;
                });

                post_res.on('end', function () {
                    var e = JSON.parse(response);
                    if (e.STATUS === 'TXN_SUCCESS') {

                        User.findById(req.params.id, function (err, foundHim) {
                            if (err || !foundHim) {
                                console.log(err);
                                return res.redirect("/dashboard");
                            }
                            if (foundHim.country === "INR") {
                                foundHim.lcbalance = +foundHim.lcbalance + +e.TXNAMOUNT;
                            }
                            foundHim.save();
                        })
                    }
                });
            });

            // post the data
            post_req.write(post_data);
            post_req.end();
        });
        return res.redirect("/dashboard");
    } else {
        return res.redirect("/dashboard");
    }

})
router.post("/rechargeEmail", middleware.isLoggedInAdmin, function (req, res) {
    User.findOne({ email: req.body.email, country: req.body.country }, function (err, found) {
        if (err || !found) {
            req.flash("error", "Please check details")
            return res.redirect("back");
        }
        found.lcbalance = +found.lcbalance + +req.body.amount;
        found.save(function (err) {
            if (err) {
                req.flash("error", "Failed at saving the user")
                return res.redirect("back");
            }
            req.flash("success", "Recharged " + req.body.email + " with " + req.body.amount + " " + req.body.country);
            return res.redirect("back")
        })

    })

})
module.exports = router;