const mongoose = require('mongoose');
const CC = require('../../../config/constant_collection');
const timestamp = require('mongoose-timestamp');

/**
 * User  Schema
 */
const JWTTokenSchema = new mongoose.Schema({
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
  is_active: {
    type: mongoose.Schema.Types.Boolean,
    default: true
  },
  is_deleted: {
    type: Boolean,
    default: false,
    index: true
  }
});


JWTTokenSchema.plugin(timestamp);
const JWTTokenModel = mongoose.model(CC.U001A_USER_TOKENS,JWTTokenSchema);
module.exports = JWTTokenModel;