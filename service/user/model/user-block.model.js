"use strict";
const UserBlockSchema = require('./user-block.schema');
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const CC = require("../../../config/constant_collection");



class UserBlockModel {
  constructor() {
    this.DB = require("../../../config/dbm");
    this.projectedKeys = {
      crtd_dt: true,
    };
  }

  async createBlock(postData) {
    try {
      let post = new UserBlockSchema(postData);
      const result = await post.save();
      return result;
    } catch (error) {
      return error;
    }
  }

  async getOneBlock(where){
    try {
      let result = await UserBlockSchema.findOne(where);      
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }
  
  async getBlockByKey(where){
    try {
      let result = await UserBlockSchema.aggregate([
        {
          $match:where
        }
      ]);
      
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }
  
  async countBlock(where){
    try {
      let result = await UserBlockSchema.find(where).count();
      
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }

  async hardDelete(where){
    try {
      let result = await UserBlockSchema.deleteMany(where);      
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }

  async getAllBlock(whereObj, pagination) {
    try {
      return await UserBlockSchema.aggregate([
        {
          $match:whereObj
        },
        {
          "$lookup": {
            "from": CC.U001_USERS,
            "localField": "vote_by",
            "foreignField": "_id",
            "as": "vote_by_data"
          }
        },
        
        {
          $project:{
            vote_by:1,
            createdAt:1,
            "vote_by_data.first_name":1,
            "vote_by_data.middle_name":1,
            "vote_by_data.last_name":1,
            "vote_by_data.email":1,
            "vote_by_data.user_name":1,
            "vote_by_data._id":1
          }
        },
        { $skip : pagination.no_of_docs_each_page * pagination.current_page_number }, 
        { $limit : pagination.no_of_docs_each_page }
      ]);
    } catch (error) {
      return error;
    }
  }
  
}

module.exports = new UserBlockModel();
