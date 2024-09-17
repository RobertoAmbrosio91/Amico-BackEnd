"use strict";
const LikesSchema = require("./likes.schema");
const mongoose = require("mongoose");
const CC = require("../../../config/constant_collection");

class LikesModel {
  constructio() {
    this.DB = require("../../../config/dbm");
    this.projectedKeys = {
      crtd_dt: true,
    };
  }

  async createLike(postData) {
    try {
      let like = new LikesSchema(postData);
      const result = await like.save();
      return result;
    } catch (error) {
      return error;
    }
  }

  async findOne(where) {
    try {
      let like = await LikesSchema.findOne(where);
      return like;
    } catch (error) {
      return error;
    }
  }

  async updateOne(where, updateData) {
    try {
      let result = await LikesSchema.findOneAndUpdate(where, updateData, {
        new: true,
      });
      return result;
    } catch (error) {
      return error;
    }
  }

  async countLikes(where) {
    try {
      let result = await LikesSchema.find(where).count();
      return result;
    } catch (error) {
      console.log("Error counting votes", error);
      return error;
    }
  }

  async hardDelete(where) {
    try {
      let result = await LikesSchema.deleteMany(where);
      return result;
    } catch (error) {
      console.log("Error deleting", error);
      return error;
    }
  }
}

module.exports = new LikesModel();
