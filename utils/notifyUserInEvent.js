const EventModel = require("../service/event/model/event.model");
const UserSchema = require("../service/user/model/user.schema");
const NotificationModel = require("../service/user/model/notification.model");
const FirebaseTokenModel = require("../service/user/model/firebase_token.model");
const pushNotification = require("./push-notification");

exports.notifyUsersInEvent = async (eventId, memoryId, userId, io) => {
  const event = await EventModel.getEvent(eventId);

  const user = await UserSchema.findOne({ _id: userId }, "user_name");

  if (event && event._id) {
    if (event) {
      let participantTokens = await FirebaseTokenModel.findByKey({
        user_id: { $in: event.participants, $ne: userId },
        is_deleted: false,
      });

      if (participantTokens && participantTokens.length > 0) {
        let notificationData = {
          tokens: participantTokens.map((tokenRecord) => tokenRecord.token),
          title: "One of your event's memories is being appreciated",
          body: `${user.user_name} reacted to your memory`,
          data: {
            type: "Memory_Reaction",
            event_id: event._id.toString(),
            memory_id: memoryId.toString(),
          },
        };
        let notificationResult = await pushNotification.sendMulticast(
          notificationData
        );

        const filteredParticipants = event.participants.filter(
          (participant) => {
            return participant.toString() !== userId.toString();
          }
        );
        let insObject = [];
        insObject.push({
          user_id: userId,
          receiver_id: filteredParticipants,
          title: notificationData.title,
          message: notificationData.body,
          data_message: notificationData.data,
          is_read: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        let addNotification = await NotificationModel.createManyNotifications(
          insObject
        );

        event.participants.forEach((participant) => {
          if (participant.toString() !== userId.toString()) {
            io.to(participant.toString()).emit("new_notification", {});
          }
        });
      }
    }
  }
};

exports.notifySingleUserInEvent = async (
  eventId,
  memoryId,
  receiver_id,
  userId,
  io
) => {
  const event = await EventModel.getEvent(eventId);

  const user = await UserSchema.findOne({ _id: receiver_id }, "user_name");
  const sender = await UserSchema.findOne({ _id: userId }, "user_name");
  console.log(user.user_name);
  console.log(sender.user_name);
  if (user && user._id && sender) {
    if (user._id) {
      let participantTokens = await FirebaseTokenModel.findByKey({
        user_id: user._id,
        is_deleted: false,
      });

      if (participantTokens && participantTokens.length > 0) {
        let notificationData = {
          tokens: participantTokens.map((tokenRecord) => tokenRecord.token),
          title: "One of your event's memories is being appreciated",
          body: `${sender.user_name} reacted to your memory`,
          data: {
            type: "Memory_Reaction",
            event_id: event._id.toString(),
            memory_id: memoryId.toString(),
          },
        };
        let notificationResult = await pushNotification.sendMulticast(
          notificationData
        );

        // const filteredParticipants = event.participants.filter(
        //   (participant) => {
        //     return participant.toString() !== userId.toString();
        //   }
        // );
        let insObject = [];
        insObject.push({
          user_id: userId,
          receiver_id: user._id,
          title: notificationData.title,
          message: notificationData.body,
          data_message: notificationData.data,
          is_read: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        let addNotification = await NotificationModel.createManyNotifications(
          insObject
        );

        event.participants.forEach((participant) => {
          if (participant.toString() !== userId.toString()) {
            io.to(participant.toString()).emit("new_notification", {});
          }
        });
      }
    }
  }
};
