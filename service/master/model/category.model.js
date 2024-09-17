"use strict";
const CategorySchema = require("./category.schema");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

class CategoryModel {
  constructor() {
    this.DB = require("../../../config/dbm");
    this.projectedKeys = {
      crtd_dt: true,
    };
  }

  async createCategory(catData) {
    try {
      let category = new CategorySchema(catData);
      const result = await category.save();
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }

  async getAllCategories() {
    try {
      return await CategorySchema.find();
    } catch (error) {
      return error;
    }
  }

  async getCategoryByName(name) {
    try {
      return await CategorySchema.findOne({ name });
    } catch (error) {
      return error;
    }
  }

  async getCategoryById(categoryId) {
    try {
      return await CategorySchema.findById(categoryId);
    } catch (error) {
      return error;
    }
  }
  async getOne(where) {
    try {
      return await CategorySchema.findOne(where);
    } catch (error) {
      return error;
    }
  }

  
}

module.exports = new CategoryModel();
