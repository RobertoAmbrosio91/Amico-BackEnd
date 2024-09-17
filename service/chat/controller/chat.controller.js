const { ObjectId } = require("mongodb");
const ChatModel = require("../model/chat.model");
const util = require("../../../utils/response");
const mongoose = require("mongoose");
const SubcategoryModel = require("../../master/model/subcategory.model");
const userModel = require("../../user/model/user.model");
const FirebaseTokenModel = require("../../user/model/firebase_token.model");
const NotificationModel = require("../../user/model/notification.model");
const pushNotification = require("../../../utils/push-notification");
const MessageReportModel = require("../model/message_report.model");
const ChatSchema = require("../model/chat.schema");
const UserSchema = require("../../user/model/user.schema");
const EventModel = require("../../event/model/event.model");
let io;
class ChatHandler {
  setIO(socketIOInstance) {
    io = socketIOInstance;
  }

  async sendMessage(req, res) {
    try {
      let messageData = {
        sender: new mongoose.Types.ObjectId(req.user._id),
        chat_room: new mongoose.Types.ObjectId(req.body.chat_room),
        content: req.body.content,
      };

      const message = await ChatModel.createMessage(messageData);
      const chatRoom = await ChatSchema.findById(req.body.chat_room);
      const event = await EventModel.getEvent(chatRoom.event_id);
      const user = await UserSchema.findOne(
        { _id: message.sender },
        "user_name"
      );

      if (event && event.participants) {
        let filteredParticipants = event.participants.filter(
          (participantId) =>
            participantId.toString() !== req.user._id.toString()
        );
        let participantTokens = await FirebaseTokenModel.findByKey({
          user_id: { $in: filteredParticipants },
          is_deleted: false,
        });
        if (participantTokens && participantTokens.length > 0) {
          const message_content =
            req.body.content.length > 80
              ? req.body.content.slice(0.8)
              : req.body.content;
          let notificationData = {
            tokens: participantTokens.map((tokenRecord) => tokenRecord.token),
            title: `${event.name}`,
            body: `${user.user_name}: ${message_content} `,
            data: {
              type: "New Message",
              event_id: event._id.toString(),
            },
          };
          let notificationResult = await pushNotification.sendMulticast(
            notificationData
          );
        }
      }

      io.to(message.chat_room.toString()).emit("new_message", message);
      return res.status(200).json(util.success(message));
    } catch (error) {
      res.status(500).json(util.error({}, error));
    }
  }

  async deleteMessage(req, res) {
    try {
      // const messageId = req.params.messageId;
      const messageIds = req.body.messageIds;
      const message = await ChatModel.findMessageById(messageIds[0]);
      const roomId = message.chat_room._id;

      const result = await ChatModel.deleteMessage(messageIds);

      io.to(roomId.toString()).emit("message_deleted", {
        messageIds: messageIds,
      });
      return res.status(200).json(util.success(result, "Message deleted"));
    } catch (error) {
      return res.status(400).json(util.error({}, error));
    }
  }

  async deleteAllChatMessages(req, res) {
    try {
      const roomId = new ObjectId(req.params.roomId);
      const result = await ChatModel.deleteAllChatMessages(roomId);

      return res.status(200).json(util.success(result, "All messages deleted"));
    } catch (error) {
      return res.status(400).json(util.error({}, error));
    }
  }

  async createChatRoom(req, res) {
    try {
      let roomData = {};
      if (!req.body.name || typeof req.body.name !== "string") {
        return res.status(400).json({ message: "Invalid room name" });
      }
      let subcategory = new ObjectId(req.body.subcategory);
      let related_fields_ids = [];
      if (req.body.related_fields && Array.isArray(req.body.related_fields)) {
        related_fields_ids = req.body.related_fields.map(
          (fieldId) => new ObjectId(fieldId)
        );
      }

      if (related_fields_ids.length === 0) {
        roomData = {
          created_by: new ObjectId(req.user._id),
          name: req.body.name.trim(),
          subcategory: subcategory,
        };
      } else {
        roomData = {
          created_by: new ObjectId(req.user._id),
          name: req.body.name.trim(),
          subcategory: subcategory,
          related_fields: related_fields_ids,
        };
      }
      const room = await ChatModel.createChatRoom(roomData);
      return res
        .status(200)
        .json(util.success(room, "Room Created Successfully"));
    } catch (error) {
      console.log(error);
      return res.status(400).json(util.error({}, error));
    }
  }

  async getChatRoomById(req, res) {
    try {
      const roomId = req.params.roomId;
      const room = await ChatModel.getChatRoomById(roomId);
      console.log(roomId);
      res
        .status(200)
        .json(util.success(room, "Chat room fetched successfully"));
    } catch (error) {
      res.status(400).json(util.error({}, error));
    }
  }
  // async getChatRoomBySubcategory(req, res) {
  //   try {
  //     const subcategory_ids = req.body.subcategory_ids;
  //     const chatRooms = await ChatModel.getChatRoomsBySubcategory(
  //       subcategory_ids
  //     );

  //     res
  //       .status(200)
  //       .json(util.success(chatRooms, "Chat room fetched successfully"));
  //   } catch (error) {
  //     res.status(400).json(util.error({}, error));
  //   }
  // }

  async getAllChatRooms(req, res) {
    try {
      const rooms = await ChatModel.getAllChatRooms();
      res
        .status(200)
        .json(util.success(rooms, "Chat room fetched successfully"));
    } catch (error) {
      res.status(400).json(util.error({}, error));
    }
  }

  async deleteChatRoom(req, res) {
    try {
      const roomId = new ObjectId(req.params.roomId);
      const deleteChat = await ChatModel.deleteChatRoom(roomId);
      if (deleteChat) {
        let deleteMessages = await ChatModel.deleteAllChatMessages(roomId);
        return res
          .status(200)
          .json(util.success(deleteMessages, "Chat room and messages deleted"));
      }
    } catch (error) {
      return res.status(400).json(util.error({}, error));
    }
  }

  async updateChatRoom(req, res) {
    try {
      const roomId = req.body._id;

      let updateData = {};
      if (req.body.name) {
        updateData.name = req.body.name;
      }
      if (req.body.participant) {
        const participantId = new ObjectId(req.body.participant);
        updateData.$addToSet = { participants: participantId };
      }

      const updatedRoom = await ChatModel.updateChatRoom(roomId, updateData);
      res
        .status(200)
        .json(util.success(updatedRoom, "Chat room updated successfully"));
    } catch (error) {
      res.status(400).json(util.error({}, error));
    }
  }

  async reportMessage(req, response) {
    try {
      if (
        typeof req.body.message_id == "undefined" ||
        (req.body.message_id && !ObjectId.isValid(req.body.message_id))
      ) {
        return response.status(400).json(util.error({}, "message_id is empty"));
      } else if (
        typeof req.body.report_reason == "undefined" ||
        req.body.report_reason.trim() == ""
      ) {
        return response
          .status(400)
          .json(util.error({}, "report_reason  is empty"));
      } else {
        const checkWhere = {
          reported_by: new ObjectId(req.user._id),
          message_id: new ObjectId(req.body.message_id),
        };
        let check = await MessageReportModel.countReport(checkWhere);
        if (check > 0) {
          return response
            .status(200)
            .json(util.error({}, "This message has already been reported"));
        } else {
          const insObj = {
            reported_by: new ObjectId(req.user._id),
            message_id: new ObjectId(req.body.message_id),
            report_reason: req.body.report_reason,
          };
          const result = await MessageReportModel.createReport(insObj);
          return response
            .status(200)
            .json(util.success(result, "Message reported successfully"));
        }
      }
    } catch (error) {
      return response
        .status(400)
        .json(
          util.error(
            {},
            error.message || "Something went wrong reporting the message"
          )
        );
    }
  }
}

module.exports = new ChatHandler();
