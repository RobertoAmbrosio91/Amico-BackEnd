const mongoose = require("mongoose");
const CC = require("../../../config/constant_collection");
const timestamp = require("mongoose-timestamp");

const MessageReportSchema = new mongoose.Schema({
  reported_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.U001_USERS,
    require: true,
    index: true,
  },
  message_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.M001_MESSAGE,
    index: true,
  },
  report_reason: {
    type: mongoose.Schema.Types.String,
    require: true,
  },
  is_deleted: {
    type: mongoose.Schema.Types.Boolean,
    default: false,
    index: true,
  },
});

MessageReportSchema.plugin(timestamp);
const MessageReportModel = mongoose.model(
  CC.R001_REPORT_MESSAGES,
  MessageReportSchema
);
module.exports = MessageReportModel;
