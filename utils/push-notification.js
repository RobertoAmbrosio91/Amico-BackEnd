const admin = require('firebase-admin');
const serviceAccount = require('../config/firebase-service.json');
const { json } = require("express");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.sendMulticast = async (dataObj) => {
  const registrationTokens = Array.isArray(dataObj.tokens)
    ? dataObj.tokens
    : [dataObj.tokens];
  console.log(dataObj, registrationTokens);
  if (registrationTokens && registrationTokens.length > 0) {
    const message = {
      notification: {
        title: dataObj.title ? dataObj.title : "",
        body: dataObj.body ? dataObj.body : "",
      },
      data: {
        type: dataObj.type ? dataObj.type : "",
        post_id: dataObj.post_id ? dataObj.post_id : "",
        request_id: dataObj.request_id ? dataObj.request_id : "",
        event_id: dataObj.event_id ? dataObj.event_id : "",
        memory_id: dataObj.memory_id ? dataObj.memory_id : "",
        url: dataObj.url ? dataObj.url : "",
        memory_id: dataObj.memory_id ? dataObj.memory_id : "",
      },
    };

    let resData = await admin
      .messaging()
      .sendToDevice(registrationTokens, message);
    console.log(resData.results);
    return resData;
  }
  return false;
  const successfulTokens = [];
  const failedTokens = [];

  resData.responses.forEach((resp, idx) => {
    if (resp.success) {
      successfulTokens.push(registrationTokens[idx]);
    } else {
      failedTokens.push(registrationTokens[idx]);
    }
  });

  console.log("Successful tokens:", successfulTokens);
  console.log("Failed tokens:", failedTokens);
  console.log(message);
  return {
    successfulTokens,
    failedTokens,
  };
};


