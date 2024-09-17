const CategoryModel = require("../model/category.model");
const SubCategoryModel = require("../model/subcategory.model");
const message = require("../../../utils/messages.json");
const util = require("../../../utils/response");
const { ObjectID } = require("../../../config/dbm");
const { ObjectId } = require("mongodb");

class CategoryHandler {
  async addCategory(request, response) {
    try {
      const { name } = request.body;
      if (!name) {
        return response
          .status(400)
          .json(util.error({}, message.category_name_required));
      }

      const category = await CategoryModel.createCategory({ name });
      if (!name) {
        return response.status(404).json(util.error({}, message.category_not_found));
      }

      const categoryData = {
        name: name,
      };
      
      return response.status(200).json(util.success(category, message.category_add_success));

    } catch (error) {
      return response
        .status(400)
        .json(util.error({}, error.message || message.category_add_error));
    }
  }
    

  async listCategories(request, response) {
    try {
      const categories = await CategoryModel.getAllCategories();
   
      return response.status(200).json(util.success(categories, message.list_all_category_success));

    } catch (error) {
      return response.status(400).json(
        util.error(
          {},
          error.message || message.category_fetch_error
        )
      );
    }
  }

  async addSubcategory(request, response) {
    try {
      const { category_id, name } = request.body;
      if (!category_id || !name) {
        return response
          .status(400)
          .json(util.error({}, message.subcategory_data_required));
      }

      const category = await CategoryModel.getOne({ _id: new ObjectId(category_id) });
      if (!category) {
        return response.status(404).json(util.error({}, message.category_not_found));
      }

      const subcategoryData = {
        name: name,
        category_id: category_id,
      };

      const subcategory = await SubCategoryModel.createSubcategory(subcategoryData);
      
      return response.status(200).json(util.success(subcategory, message.user_signup_success));

    } catch (error) {
      return response
        .status(400)
        .json(util.error({}, error.message || message.subcategory_add_error));
    }
  }

  async  listSubcategories(request, response) {
    try {

      const category_id = request.body.category_id;

      if (!ObjectId.isValid(category_id)) {
        return response.status(400).json(util.error([], message.invalid_category_id));
      }
      
      const where = {
        category_id : new ObjectId(category_id)
      }
      const subcategories = await SubCategoryModel.getAllSubcategoriesWithCategoryName(where); 
      
      if (subcategories.length === 0) {
        return response.status(404).json(util.error([], message.category_not_found));
      }
  
   
      return response.status(200).json(util.success(subcategories, message.record_is_available));
  
    } catch (error) {
      
      return response.status(400).json(
        util.error([], error.message || message.subcategory_fetch_error)
      );
    }
  }
  
  



}

module.exports = new CategoryHandler();
