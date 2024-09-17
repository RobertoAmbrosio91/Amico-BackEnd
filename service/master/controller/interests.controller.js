const interestModelInstance = require("../model/interests.model");
const util = require("../../../utils/response");
const message = require("../../../utils/messages.json");
const SubCategoryModel = require("../model/subcategory.model");
class InterestController {
  async addInterest(req, res) {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json(util.error({}, message.name_required));
      }

      const interest = await interestModelInstance.createInterest({ name });

      return res
        .status(200)
        .json(util.success(interest, message.interest_added));
    } catch (error) {
      return res.status(400).json(util.error({}, error.message));
    }
  }

  async listInterests(req, res) {
    try {
      //fetching subcategories as interests
      const interests =
        await SubCategoryModel.getAllSubcategoriesWithCategoryName({});
      return res
        .status(200)
        .json(util.success(interests, message.interests_listed));
    } catch (error) {
      return res.status(400).json(util.error({}, error.message));
    }
  }
}

module.exports = new InterestController();
