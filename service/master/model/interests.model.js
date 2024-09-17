const InterestSchema = require("./interests.schema");
const mongoose = require("mongoose");
const CC = require("../../../config/constant_collection");

class InterestModel {
  constructor() {
    this.model = mongoose.model(CC.I002_INTERESTS, InterestSchema);
  }

  async createInterest(interestData) {
    const interest = new this.model(interestData);
    return await interest.save();
  }

  async getInterestById(interestId) {
    return await this.model.findById(interestId);
  }

  async getInterests(filter) {
    return await this.model.find(filter);
  }
}

module.exports = new InterestModel();
