const mongoose = require('mongoose');
const CC = require('../../../config/constant_collection');
const timestamp = require('mongoose-timestamp');
const CONSTANTS = require("../../../config/constant");

const PostReportSchema = new mongoose.Schema({
  report_by: {
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
  report_type: {
    type: String,
    required: true,
    enum: ["post", "memory"],
  },
  report_message: {
    type: mongoose.Schema.Types.String,
    require: true,
  },
  is_deleted: {
    type: mongoose.Schema.Types.Boolean,
    default: false,
    index: true,
  },
});

PostReportSchema.plugin(timestamp);
const PostReportModel = mongoose.model(CC.U001CB_POST_REPORTS,PostReportSchema);
module.exports = PostReportModel;