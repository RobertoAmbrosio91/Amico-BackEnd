const mongoose = require("mongoose");
const timestamp = require("mongoose-timestamp");
const CC = require("../../../config/constant_collection");
const InterestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  is_deleted: {
    type: Boolean,
    default: false,
  },
});

InterestSchema.plugin(timestamp);
module.exports = InterestSchema;
