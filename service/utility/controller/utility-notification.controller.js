const moment = require('moment');
const util = require('../../../utils/response');
const message = require('../../../utils/messages.json');
const CONSTANTS = require("../../../config/constant");
const NotificationModel = require("../../user/model/notification.model");
const { ObjectId } = require('mongodb');

class UtilityNotificationHandler {

  async deleteNotification() {
    try {

      let prevDate = moment(new Date()).subtract(5, 'w').toDate();
      console.log("----- Notification Delete Init", prevDate);
      const listNotification = await NotificationModel.findNotificationByKeys({
        createdAt: {$lte:prevDate}
      });

      if(listNotification && listNotification.length > 0){
        console.log("listNotification", listNotification.length);
        const delNotification = await NotificationModel.hardDeleteMany({
          createdAt: {$lte:prevDate}
        });
        console.log(delNotification, "delNotification")
      }else{
        console.log("listNotification", listNotification);
      }

      return true;
      // return response.status(200).json(util.success(posts, message.list_all_post_success));
    } catch (error) {
      console.log(error, "error")
      return 0;
      // return response.status(400).json(util.error({}, error.message || message.post_fetch_error));
    }
  }

  
}

module.exports = new UtilityNotificationHandler();