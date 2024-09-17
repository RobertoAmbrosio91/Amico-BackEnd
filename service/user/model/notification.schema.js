const mongoose = require('mongoose');
const CC = require('../../../config/constant_collection');
const timestamp = require('mongoose-timestamp');
/**
 * Notification Schema
 */
const NotificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.U001_USERS,
  },
  receiver_id: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: CC.U001_USERS,
    },
  ],
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  data_message: {
    type: Object,
    required: true,
  },
  is_read: {
    type: Boolean,
    default: false,
  },
  is_deleted: {
    type: Boolean,
    default: false,
  },
});

NotificationSchema.plugin(timestamp);
const NotificationModelSchema = mongoose.model(CC.N001_NOTIFICATIONS,NotificationSchema);
module.exports = NotificationModelSchema;