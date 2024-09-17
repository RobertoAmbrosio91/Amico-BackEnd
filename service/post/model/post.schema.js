const mongoose = require('mongoose');
const CC = require('../../../config/constant_collection');
const timestamp = require('mongoose-timestamp');
const bcrypt = require('bcrypt');

const PostSchema = new mongoose.Schema({
  post_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.U001_USERS,
    require: true,
    index: true,
  },
  title: {
    type: mongoose.Schema.Types.String,
  },
  description: {
    type: mongoose.Schema.Types.String,
  },
  images: {
    type: [mongoose.Schema.Types.String],
  },
  videos: {
    type: [mongoose.Schema.Types.String],
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.M002_CATEGORY,
    index: true,
  },
  subcategory_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.M002A_SUBCATEGORY,
    index: true,
  },
  type: {
    type: mongoose.Schema.Types.String,
    enum: ["event"],
    required: true,
    index: true,
  },
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.E001_EVENT,
    required: true,
    index: true,
  },

  is_deleted: {
    type: mongoose.Schema.Types.Boolean,
    default: false,
    index: true,
  },
  // type_of_post: {
  //   type: mongoose.Schema.Types.String,
  // },
  // post_source: {
  //   type: mongoose.Schema.Types.String,
  // },
});

PostSchema.plugin(timestamp);
const PostModel = mongoose.model(CC.U001C_POSTS,PostSchema);
module.exports = PostModel;