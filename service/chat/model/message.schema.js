const mongoose = require("mongoose");
const CC = require("../../../config/constant_collection");
const timestamp = require("mongoose-timestamp");

const MessageSchema = new mongoose.Schema({
  chat_room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.C001_CHATROOM,
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.U001_USERS,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  is_deleted: {
    type: mongoose.Schema.Types.Boolean,
    default: false,
    index: true,
  },
});

MessageSchema.plugin(timestamp);
const MessageModel = mongoose.model(CC.M001_MESSAGE, MessageSchema);
module.exports = MessageModel;
