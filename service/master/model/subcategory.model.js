"use strict";
const SubcategorySchema = require("./subcategory.schema");
const mongoose = require("mongoose");
const CC = require("./../../../config/constant_collection");
  
class SubCategoryModel {
  async createSubcategory(subcategoryData) {
    try {
      let subcategory = new SubcategorySchema(subcategoryData);
      const result = await subcategory.save();
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }
  async getCategoryById(categoryId) {
    try {
      return await SubcategorySchema.findById(categoryId);
    } catch (error) {
      return error;
    }
  }

  async getOne(where) {
    try {
      return await SubcategorySchema.findOne(where);
    } catch (error) {
      return error;
    }
  }

  async getByKeys(where){
    try {
      return await SubcategorySchema.find(where);
    } catch (error) {
      return error;
    }
  }

  async getAllSubcategoriesWithCategoryName(where) {
    try {
      return await SubcategorySchema.aggregate([
        {
          $match:where
        },
        {
          $lookup: {
            from: CC.M002_CATEGORY,
            localField: "category_id",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $unwind: "$category",
        },
        {
          $project: {
            _id: 1,
            name: 1,
            "category.name": 1,
          },
        },
      ]);
    } catch (error) {
      return error;
    }
  }
}

const subCategoryModelInstance = new SubCategoryModel();
module.exports = subCategoryModelInstance;
