
const sanitizer = require("sanitizer");
const axios = require('axios');
const moment = require("moment");

var Helper = function () {};

Helper.prototype.xss_clean = function (vals) {
    
    if(typeof vals == "object" && typeof vals.length != "undefined" && vals.length > 0){
        for(x in vals){
            vals[x] = sanitizer.sanitize(vals[x]);
        }
    }else if(typeof vals == "object" && typeof vals.length == "undefined" && Object.keys(vals).length > 0){
        let keys = Object.keys(vals)
        for(x in keys){
            vals[keys[x]] = sanitizer.sanitize(vals[keys[x]]);
        }
    }else{
        vals = sanitizer.sanitize(vals);
    }
    return vals
}

Helper.prototype.random_number = function(otpLength) {
    var digits = '0123456789';
    var otp = '';
    for(let i=1; i<=otpLength; i++){
        var index = Math.floor(Math.random()*(digits.length));
        otp = otp + digits[index];
    }
    return otp;
}

Helper.prototype.notification = async function(notificationReq){
    const api_url = process.env.NOTIFICATION_CLIENT;

    var notificationObject = {}
    if(notificationReq.emailData){
        notificationObject.email = notificationReq.emailData
    }
    if(notificationReq.smsData){
        notificationObject.sms = notificationReq.smsData
    }

    if(notificationReq.push){
        notificationObject.push = notificationReq.push
    }
    
    const body = notificationObject;
    try {
        const response = await axios.post(api_url,body);
        return response.data;
    } catch (error) {
        console.log(error,"Notification error");
        return {
            data: {},
            message: 'Failed to send notification due to some technical issue.',
            status: false
        }
    }      
}

Helper.prototype.generateUID = function() {
    var firstPart = (Math.random() * 46656) | 0;
    var secondPart = (Math.random() * 46656) | 0;
    firstPart = ("000" + firstPart.toString(36)).slice(-3);
    secondPart = ("000" + secondPart.toString(36)).slice(-3);
    return firstPart + secondPart;
}

Helper.prototype.getOnlyDate = function(t = new Date(), timeZone=""){
    if(timeZone){
        let hh = timeZone.split(":")?.[0];
        hh = hh ? Number(hh) : 0;
        let mm = timeZone.split(":")?.[1];
        mm = mm ? Number(mm) : 0;
        t = (new Date(moment(t).add(hh, 'hours').add(mm,'minutes').format("YYYY-MM-DD")))
    }else{
        t = (new Date(moment(t).format("YYYY-MM-DD")))
    }
    
    const todayDateString = `${t.getFullYear()}-${('0'+(t.getMonth()+1)).slice(-2)}-${('0'+t.getDate()).slice(-2)}`;
    return new Date(t);
}

Helper.prototype.getEndOfDay = function(t = new Date(), timeZone=""){
    if(timeZone){
        let hh = timeZone.split(":")?.[0];
        hh = hh ? Number(hh) : 0;
        let mm = timeZone.split(":")?.[1];
        mm = mm ? Number(mm) : 0;
        t = (new Date(moment(t).add(hh, 'hours').add(mm,'minutes').format("YYYY-MM-DD")))
    }else{
        t = (new Date(moment(t).endOf('D').format("YYYY-MM-DD HH:mm:ss")))
    }
    
    const todayDateString = `${t.getFullYear()}-${('0'+(t.getMonth()+1)).slice(-2)}-${('0'+t.getDate()).slice(-2)}`;
    return new Date(t);
}

Helper.prototype.minutesToHoursConvert = (n) => {
    var num = n;
    var hours = (num / 60);
    var rhours = Math.floor(hours);
    var minutes = (hours - rhours) * 60;
    var rminutes = Math.round(minutes);

    return rhours + ":" + rminutes;
}

Helper.prototype.capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

Helper.prototype.getCurrentFinancialYear = (date)=> {
    var fiscalyear = "";
    var today = date ? new Date(date) : new Date();
    let lastYear = null;
    if ((today.getMonth() + 1) <= 3) {
        lastYear = today.getFullYear()+"".slice(2,4);
        fiscalyear = (today.getFullYear() - 1) + "-" + lastYear;
    } else {
        lastYear = ((today.getFullYear() + 1)+"").slice(2,4);
        fiscalyear = today.getFullYear() + "-" + lastYear;
    }
    return fiscalyear.slice()
}

module.exports =new Helper();