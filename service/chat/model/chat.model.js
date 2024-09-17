const ChatRoomSchema = require("./chat.schema");
const MessageSchema = require("./message.schema");
const mongoose = require("mongoose");
const CC = require("../../../config/constant_collection");

class ChatModel {
  //create a new chat room
  async createChatRoom(roomData) {
    try {
      let chatRoom = new ChatRoomSchema(roomData);
      const result = await chatRoom.save();
      return result;
    } catch (error) {
      console.error("Error in createChatRoom:", error);
      throw error;
    }
  }
  //find chat by id
  async getChatRoomById(roomId) {
    try {
      return await ChatRoomSchema.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(roomId) },
        },
        {
          $lookup: {
            from: CC.M001_MESSAGE,
            localField: "_id",
            foreignField: "chat_room",
            as: "messages",
          },
        },
        {
          $unwind: {
            path: "$messages",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: CC.U001_USERS,
            localField: "messages.sender",
            foreignField: "_id",
            as: "messages.senderDetails",
          },
        },
        {
          $unwind: {
            path: "$messages.senderDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$_id",
            name: { $first: "$name" },
            subcategory: { $first: "$subcategory" },
            participants: { $first: "$participants" },
            is_deleted: { $first: "$is_deleted" },
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
            messages: {
              $push: {
                $cond: [
                  { $eq: ["$messages", {}] },
                  "$$REMOVE",
                  {
                    _id: "$messages._id",
                    content: "$messages.content",
                    sender: {
                      _id: "$messages.senderDetails._id",
                      user_name: "$messages.senderDetails.user_name",
                      profile: "$messages.senderDetails.profile",
                      first_name: "$messages.senderDetails.first_name",
                      last_name: "$messages.senderDetails.last_name",
                    },
                    is_deleted: "$messages.is_deleted",
                    createdAt: "$messages.createdAt",
                    updatedAt: "$messages.updatedAt",
                  },
                ],
              },
            },
          },
        },
        {
          $project: {
            name: 1,
            participants: 1,
            is_deleted: 1,
            createdAt: 1,
            updatedAt: 1,
            messages: 1,
            subcategory: 1,
          },
        },
      ]);
    } catch (error) {
      console.log("Error fetching chat room with messages: ", error);
      throw error;
    }
  }
  //find chat room by subcategory
  // async getChatRoomsBySubcategory(subcategory_ids) {
  //   try {
  //     return await ChatRoomSchema.aggregate([
  //       {
  //         $match: {
  //           $or: [
  //             // { subcategory: new mongoose.Types.ObjectId(subcategory_id) },
  //             {
  //               subcategory: {
  //                 $in: subcategory_ids.map(
  //                   (id) => new mongoose.Types.ObjectId(id)
  //                 ),
  //               },
  //             },
  //             // { related_fields: new mongoose.Types.ObjectId(subcategory_id) },
  //             {
  //               related_fields: {
  //                 $in: subcategory_ids.map(
  //                   (id) => new mongoose.Types.ObjectId(id)
  //                 ),
  //               },
  //             },
  //           ],
  //         },
  //       },
  //       {
  //         $lookup: {
  //           from: CC.M001_MESSAGE,
  //           localField: "_id",
  //           foreignField: "chat_room",
  //           as: "messages",
  //         },
  //       },
  //       {
  //         $unwind: {
  //           path: "$messages",
  //           preserveNullAndEmptyArrays: true,
  //         },
  //       },
  //       //to include message sender details
  //       // {
  //       //   $lookup: {
  //       //     from: CC.U001_USERS,
  //       //     localField: "messages.sender",
  //       //     foreignField: "_id",
  //       //     as: "messages.senderDetails",
  //       //   },
  //       // },
  //       // {
  //       //   $unwind: {
  //       //     path: "$messages.senderDetails",
  //       //     preserveNullAndEmptyArrays: true,
  //       //   },
  //       // },
  //       //------------------------------------------------------//
  //       //return all messages
  //       // {
  //       //   $group: {
  //       //     _id: "$_id",
  //       //     name: { $first: "$name" },
  //       //     participants: { $first: "$participants" },
  //       //     is_deleted: { $first: "$is_deleted" },
  //       //     createdAt: { $first: "$createdAt" },
  //       //     updatedAt: { $first: "$updatedAt" },
  //       //     messages: {
  //       //       $push: {
  //       //         $cond: [
  //       //           { $eq: ["$messages", {}] },
  //       //           "$$REMOVE",
  //       //           {
  //       //             _id: "$messages._id",
  //       //             content: "$messages.content",
  //       //             sender: {
  //       //               _id: "$messages.senderDetails._id",
  //       //               user_name: "$messages.senderDetails.user_name",
  //       //               profile: "$messages.senderDetails.profile",
  //       //               first_name: "$messages.senderDetails.first_name",
  //       //               last_name: "$messages.senderDetails.last_name",
  //       //             },
  //       //             is_deleted: "$messages.is_deleted",
  //       //             createdAt: "$messages.createdAt",
  //       //             updatedAt: "$messages.updatedAt",
  //       //           },
  //       //         ],
  //       //       },
  //       //     },
  //       //   },
  //       // },
  //       // {
  //       //   $project: {
  //       //     name: 1,
  //       //     participants: 1,
  //       //     is_deleted: 1,
  //       //     createdAt: 1,
  //       //     updatedAt: 1,
  //       //     messages: 1,
  //       //   },
  //       // },

  //       //return last message only
  //       {
  //         $group: {
  //           _id: "$_id",
  //           created_by: { $first: "$created_by" },
  //           name: { $first: "$name" },
  //           participants: { $first: "$participants" },
  //           is_deleted: { $first: "$is_deleted" },
  //           createdAt: { $first: "$createdAt" },
  //           updatedAt: { $first: "$updatedAt" },
  //           lastMessage: {
  //             $last: {
  //               _id: "$messages._id",
  //               content: "$messages.content",
  //               // sender: {
  //               //   _id: "$messages.senderDetails._id",
  //               //   user_name: "$messages.senderDetails.user_name",
  //               //   profile: "$messages.senderDetails.profile",
  //               //   first_name: "$messages.senderDetails.first_name",
  //               //   last_name: "$messages.senderDetails.last_name",
  //               // },
  //               is_deleted: "$messages.is_deleted",
  //               createdAt: "$messages.createdAt",
  //               updatedAt: "$messages.updatedAt",
  //             },
  //           },
  //         },
  //       },
  //       {
  //         $project: {
  //           name: 1,
  //           participants: 1,
  //           created_by: 1,
  //           is_deleted: 1,
  //           createdAt: 1,
  //           updatedAt: 1,
  //           lastMessage: 1,
  //         },
  //       },
  //       {
  //         $sort: {
  //           "lastMessage.updatedAt": -1,
  //         },
  //       },
  //     ]);
  //   } catch (error) {
  //     console.error("Error finding chat rooms:", error);
  //     throw error;
  //   }
  // }
  //find message by id
  async findMessageById(messageId) {
    try {
      return await MessageSchema.findById(messageId)
        .populate("chat_room")
        .exec();
    } catch (error) {
      console.error("Error finding message by ID:", error);
      throw error;
    }
  }

  //get all chat room
  async getAllChatRooms() {
    try {
      return await ChatRoomSchema.aggregate([
        {
          $lookup: {
            from: CC.M001_MESSAGE,
            localField: "_id",
            foreignField: "chat_room",
            as: "messages",
          },
        },
        {
          $unwind: {
            path: "$messages",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: {
            "messages.createdAt": -1,
          },
        },
        {
          $group: {
            _id: "$_id",
            created_by: { $first: "$created_by" },
            name: { $first: "$name" },
            participants: { $first: "$participants" },
            is_deleted: { $first: "$is_deleted" },
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
            lastMessage: {
              $first: {
                _id: "$messages._id",
                content: "$messages.content",
                is_deleted: "$messages.is_deleted",
                createdAt: "$messages.createdAt",
                updatedAt: "$messages.updatedAt",
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            participants: 1,
            created_by: 1,
            is_deleted: 1,
            createdAt: 1,
            updatedAt: 1,
            lastMessage: 1,
          },
        },
        {
          $sort: {
            "lastMessage.createdAt": -1,
          },
        },
      ]);
    } catch (error) {
      console.log("Error fetching chats: ", error);
    }
  }

  //update chat room
  async updateChatRoom(roomId, updateData) {
    try {
      return await ChatRoomSchema.findByIdAndUpdate(roomId, updateData, {
        new: true,
      });
    } catch (error) {
      console.log("Error updating chatroom: ", error);
    }
  }

  //delete chat room
  async deleteChatRoom(roomId, session) {
    try {
      return await ChatRoomSchema.findByIdAndDelete(roomId).session(session);
    } catch (error) {
      console.log("Error Deleting chatroom: ", error);
    }
  }

  //create message
  async createMessage(messageData) {
    try {
      let message = new MessageSchema(messageData);
      const savedMessage = await message.save();
      const result = await MessageSchema.findById(savedMessage._id).populate(
        "sender",
        "_id first_name last_name profile user_name"
      );
      return result;
    } catch (error) {
      console.log("error creating a message", error);
      throw error;
    }
  }

  //delete Message
  async deleteMessage(messageIds) {
    try {
      let result = await MessageSchema.deleteMany({ _id: { $in: messageIds } });
      return result;
    } catch (error) {
      console.log("Error deleting the messages", error);
    }
  }
  //delete all messages from a chat
  async deleteAllChatMessages(roomId, session) {
    try {
      let result = await MessageSchema.deleteMany(
        {
          chat_room: roomId,
        },
        { session: session }
      );
      return result;
    } catch (error) {
      console.log("Error deleting all chat messages", error);
      return error;
    }
  }
}

module.exports = new ChatModel();
