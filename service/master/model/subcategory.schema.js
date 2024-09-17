const mongoose = require('mongoose');
const timestamp = require('mongoose-timestamp');
const CC = require('../../../config/constant_collection');

const SubcategorySchema = new mongoose.Schema({
  name: {
    type: mongoose.Schema.Types.String,
    required: true
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.M002_CATEGORY,
    required: true,
    index: true
  },
  is_deleted: {
    type: Boolean,
    default: false,
    index: true
  }
});

SubcategorySchema.plugin(timestamp);
const SubcategoryModel = mongoose.model(CC.M002A_SUBCATEGORY, SubcategorySchema);
module.exports = SubcategoryModel;
