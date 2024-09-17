"use strict";
const PostReportSchema = require("./post_report.schema");
const PostSchema = require("./post.schema");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const CC = require("../../../config/constant_collection");

class PostReportModel {
  constructor() {
    this.DB = require("../../../config/dbm");
    this.projectedKeys = {
      crtd_dt: true,
    };
  }

  async createReport(postData) {
    try {
      let post = new PostReportSchema(postData);
      const result = await post.save();
      return result;
    } catch (error) {
      return error;
    }
  }

  async getOne(where){
    try {
      let result = await PostReportSchema.findOne(where);
      
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }

  async countReport(where){
    try {
      let result = await PostReportSchema.find(where).count();
      
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }

  async hardDelete(where){
    try {
      let result = await PostReportSchema.deleteMany(where);      
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }

  async getAllPostReport(whereObj) {
    try {
      return await PostReportSchema.aggregate([
        {
          $match:whereObj
        },
        {
          "$lookup": {
            "from": CC.U001_USERS,
            "localField": "report_by",
            "foreignField": "_id",
            "as": "report_by_data"
          }
        },
        {
          "$lookup": {
            "from": CC.U001C_POSTS,
            "localField": "post_id",
            "foreignField": "_id",
            "as": "post_data"
          }
        },
        {
          $unwind: {
            path: "$post_data",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: CC.U001_USERS,
            localField: "post_data.post_by",
            foreignField: "_id",
            as: "post_data.post_by_data",
          }
        },
        {
          $project:{
            vote_by:1,
            createdAt:1,
            "post_data._id":1,
            "post_data.title":1,
            "post_data.request_id":1,
            "post_data.description":1,
            "post_data.images":1,
            "post_data.videos":1,
            "post_data.videos":1,
            "post_data.post_by_data.first_name":1,
            "post_data.post_by_data.middle_name":1,
            "post_data.post_by_data.last_name":1,
            "post_data.post_by_data.email":1,
            "post_data.post_by_data.user_name":1,
            "post_data.post_by_data._id":1,
            "report_by_data.first_name":1,
            "report_by_data.middle_name":1,
            "report_by_data.last_name":1,
            "report_by_data.email":1,
            "report_by_data.user_name":1,
            "report_by_data._id":1
          }
        },
        { $sort: { createdAt:-1 } },
      ]);
    } catch (error) {
      return error;
    }
  }
  
}

module.exports = new PostReportModel();
