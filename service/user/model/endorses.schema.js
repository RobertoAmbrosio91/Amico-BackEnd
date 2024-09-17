const mongoose = require('mongoose');
const CC = require('../../../config/constant_collection');
const timestamp = require('mongoose-timestamp');

/**
 * User Endorses Schema
*/
const UserEndoresSchema = new mongoose.Schema({
  endorse_by:{
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.U001_USERS,
    require: true,
    index: true
  },
  endorse_to:{
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.U001_USERS,
    require: true,
    index: true
  },
  is_deleted: {
    type: Boolean,
    default: false,
    index: true
  }
});


UserEndoresSchema.plugin(timestamp);
const UserEndorsesModel = mongoose.model(CC.U001F_USER_ENDORSES,UserEndoresSchema);
module.exports = UserEndorsesModel;