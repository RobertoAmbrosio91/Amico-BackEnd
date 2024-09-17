
const notificationModel = require('../model/notification.model');
const util = require('../../../utils/response');
const message = require('../../../utils/messages.json');
const { ObjectId } = require('mongodb');

let io;

class NotificationHandler {
  setIO(socketIOInstance) {
    io = socketIOInstance;
  }

  async notificationList(request, response) {
    try {
      let par_page = request.body.par_page ? request.body.par_page : 15;
      let page = request.body.page ? request.body.page : 0;
      let notificationWhere = {};
      notificationWhere.receiver_id = request.user._id;
      notificationWhere.is_deleted = false;
      let notificationRs =
        await notificationModel.getNotificationListByUserIdPagination(
          notificationWhere,
          page,
          par_page
        );
      let totalNotification = await notificationModel.countNotification(
        notificationWhere
      );
      if (notificationRs && notificationRs.length > 0) {
        let resData = {
          data: notificationRs,
          total: totalNotification,
        };
        return response.send(
          util.success(resData, message.notification_list_successfully)
        );
      } else {
        return response.send(util.error({}, message.notification_list_no_data));
      }
    } catch (error) {
      return response
        .status(400)
        .json(util.error({}, error.message || message.error_message));
    }
  }

  async readNotificationUpdate(request, response) {
    try {
      if (
        typeof request.params.notification_id == "undefined" ||
        (request.params.notification_id &&
          !ObjectId.isValid(request.params.notification_id))
      ) {
        return response
          .status(400)
          .json(util.error({}, message.notification_id_is_empty));
      } else {
        let updObj = {
          is_read: true,
        };

        let updUser = await notificationModel.updateNotification(
          {
            _id: request.params.notification_id,
          },
          updObj
        );
        const userId = request.user._id.toString();
        io.to(userId).emit("notification_read", {
          notification_id: request.params.notification_id,
        });
        return response
          .status(200)
          .json(util.success({}, message.read_notification_update));
      }
    } catch (error) {
      console.log(error, "error");
      return response
        .status(400)
        .json(util.error({}, error.message || message.error_message));
    }
  }
}

module.exports = new NotificationHandler();
