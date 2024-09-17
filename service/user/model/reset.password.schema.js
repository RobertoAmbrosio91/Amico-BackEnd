

const mongoose = require('mongoose');
const CC = require('../../../config/constant_collection');

const resetPasswordSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: CC.U001_USERS
  },
  email: String,
  otp: String,
  expiresAt: Date,
  used: { type: Boolean, default: false }, 

  is_deleted: {
    type: Boolean,
    default: false,
    index: true
  }
});


const ResetModel = mongoose.model(CC.U001B_RESET_PASSWORD,resetPasswordSchema);
module.exports = ResetModel;