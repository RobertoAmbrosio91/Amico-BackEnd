"use strict";
const MessageReportSchema = require("./message_report.schema");
const MessageSchema = require("./message.schema");
const mongoose = require("mongoose");
const CC = require("../../../config/constant_collection");

class MessageReportModel {
  constructor() {
    this.DB = require("../../../config/dbm");
    this.projectedKeys = {
      crtd_dt: true,
    };
  }

  async createReport(messageData) {
    try {
      let message = new MessageReportSchema(messageData);
      const result = await message.save();
      return result;
    } catch (error) {
      return error;
    }
  }

  async countReport(where) {
    try {
      let result = await MessageReportSchema.find(where).count();

      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }
}

module.exports = new MessageReportModel();
