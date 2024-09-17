const ResetPassword = require('./reset.password.schema');
const moment = require('moment');
const userModel = require('./user.model');
const bcrypt = require('bcrypt');
const message = require('../../../utils/messages.json');

class ResetPasswordModel {
  async createLink(email) {
    try {
      

      const user = await userModel.getUserByEmail(email.trim().toLowerCase());

      const otp = Math.floor(100000 + Math.random() * 900000);
      const expiresAt = moment().add(10, 'minutes');

      const resetPasswordData = {
        user_id: user._id,
        email: user.email,
        otp: otp.toString(),
        expiresAt: expiresAt.toDate(),
        used: false
      };

      const otpData = await ResetPassword.create(resetPasswordData);

      return otpData;
    } catch (error) {
      throw error;
    }
  }

  async showResetPasswordForm(email, otp) {
    try {
    

      const otpData = await ResetPassword.findOne({ email, otp, used: false });
      let isExpired = "";

      if (!otpData || moment().isAfter(otpData.expiresAt)) {
        isExpired = message.reset_link_expired_or_invalid;
        return {
          email: "",
          otp: "",
          isExpired: isExpired
        };
      }

      return {
        email: otpData.email,
        otp: otpData.otp,
        isExpired: isExpired
      };
    } catch (error) {
      throw error;
    }
  }

  async updatePassword(email, otp, password) {
    try {
  

      const otpData = await ResetPassword.findOne({ email, otp, used: false });

      if (!otpData || moment().isAfter(otpData.expiresAt)) {
        throw new Error(message.reset_link_expired_or_invalid);
      }

      const user = await userModel.getUserByEmail(email);

      const salt = bcrypt.genSaltSync(Number(process.env.SALT_ROUND));
      const hash = bcrypt.hashSync(password, salt);
      user.password = hash;
      await user.save();

      otpData.used = true;
      await otpData.save();

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ResetPasswordModel();
