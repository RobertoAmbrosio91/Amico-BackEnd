const mongoose = require('mongoose');
const timestamp = require('mongoose-timestamp');
const CC = require('../../../config/constant_collection');

const CategorySchema = new mongoose.Schema({
  name: {
    type: mongoose.Schema.Types.String,
    required: true
  },
  is_deleted: {
    type: Boolean,
    default: false,
    index: true
  }
});

CategorySchema.plugin(timestamp);
const CategoryModel = mongoose.model(CC.M002_CATEGORY,CategorySchema);
module.exports = CategoryModel;