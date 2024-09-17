"use strict";
// const PostReportSchema = require("./post_report.schema");
const FirebaseTokenSchema = require('./firebase-tokens.schema');
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const CC = require("../../../config/constant_collection");



class FirebaseTokenModel {
  constructor() {
    this.DB = require("../../../config/dbm");
    this.projectedKeys = {
      crtd_dt: true,
    };
  }

  async createToken(postData) {
    try {
      let token = new FirebaseTokenSchema(postData);
      const result = await token.save();
      return result;
    } catch (error) {
      return error;
    }
  }

  async getOne(where){
    try {
      let result = await FirebaseTokenSchema.findOne(where);
      
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }

  async findByKey(where){
    try {
      let result = await FirebaseTokenSchema.find(where);
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }

  async countToken(where){
    try {
      let result = await FirebaseTokenSchema.find(where).count();
      
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }

  async hardDelete(where){
    try {
      let result = await FirebaseTokenSchema.deleteMany(where);      
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }
}

module.exports = new FirebaseTokenModel();
