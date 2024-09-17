const mongoose = require('mongoose');
const CC = require('../../../config/constant_collection');
const timestamp = require('mongoose-timestamp');

/**
 * User  Schema
 */
const FirebaseTokenSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.U001_USERS,
    require: true,
    index: true
  },
  token:{
    type: mongoose.Schema.Types.String,
    require: true
  },
  is_deleted: {
    type: Boolean,
    default: false,
    index: true
  }
});


FirebaseTokenSchema.plugin(timestamp);
const FirebaseTokenModel = mongoose.model(CC.U001E_USER_FIREBASE_TOKENS,FirebaseTokenSchema);
module.exports = FirebaseTokenModel;