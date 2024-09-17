const mongoose = require("mongoose");
const CC = require("../../../config/constant_collection");
const timestamp = require("mongoose-timestamp");

const ChatRoomSchema = new mongoose.Schema({
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.U001_USERS,
    require: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  participants: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: CC.U001_USERS,
  },

  is_deleted: {
    type: mongoose.Schema.Types.Boolean,
    default: false,
    index: true,
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: CC.M002A_SUBCATEGORY,
  },
  related_fields: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: CC.M002A_SUBCATEGORY,
    },
  ],
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.E001_EVENT,
    required: false,
  },
});

ChatRoomSchema.plugin(timestamp);
const ChatRoomModel = mongoose.model(CC.C001_CHATROOM, ChatRoomSchema);
module.exports = ChatRoomModel;
