const mongoose = require("mongoose");
const CC = require("../../../config/constant_collection");
const timestamp = require("mongoose-timestamp");

const FriendrequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.U001_USERS,
    required: true,
    index: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.U001_USERS,
    required: true,
    index: true,
  },
  status: {
    type: mongoose.Schema.Types.String,
    enum: ["pending", "accepted", "declined"],
    default: "pending",
    index: true,
  },
});

FriendrequestSchema.plugin(timestamp);
const FriendRequestModel = mongoose.model(
  CC.F001_FRIEND_REQUEST,
  FriendrequestSchema
);
module.exports = FriendRequestModel;
