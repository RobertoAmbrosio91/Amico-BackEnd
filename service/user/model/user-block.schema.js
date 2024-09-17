const mongoose = require('mongoose');
const CC = require('../../../config/constant_collection');
const timestamp = require('mongoose-timestamp');

/**
 * User Block Schema
*/
const UserBlockSchema = new mongoose.Schema({
  block_by:{
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.U001_USERS,
    require: true,
    index: true
  },
  block_to:{
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


UserBlockSchema.plugin(timestamp);
const UserBlocksModel = mongoose.model(CC.U001G_USER_BLOCKS,UserBlockSchema);
module.exports = UserBlocksModel;