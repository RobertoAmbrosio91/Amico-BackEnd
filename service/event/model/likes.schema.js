const mongoose = require("mongoose");
const CC = require("../../../config/constant_collection");
const timestamp = require("mongoose-timestamp");
const CONSTANTS = require("../../../config/constant");

const LikesSchema = new mongoose.Schema({
  liked_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.U001_USERS,
    require: true,
    index: true,
  },
  reaction_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.U001_USERS,
    require: true,
    index: true,
  },
  post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.U001C_POSTS,
    index: true,
  },
  memory_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.M001_MEMORY,
    index: true,
  },
  type: {
    type: mongoose.Schema.Types.String,
    enum: CONSTANTS.LIKE_TYPES,
    require: true,
  },
  is_deleted: {
    type: mongoose.Schema.Types.Boolean,
    default: false,
    index: true,
  },
});

LikesSchema.plugin(timestamp);
const LikesModel = mongoose.model(CC.U001CA_POST_LIKES, LikesSchema);
module.exports = LikesModel;
