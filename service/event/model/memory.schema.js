const mongoose = require("mongoose");
const CC = require("../../../config/constant_collection");
const timestamp = require("mongoose-timestamp");

const MemorySchema = new mongoose.Schema({
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.M001_MEMORY,
    required: true,
    index: true,
  },
  media_file: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.E001_EVENT,
    required: true,
    index: true,
  },
  type: {
    type: mongoose.Schema.Types.String,
    enum: ["image", "video"],
    required: true,
  },
  caption: {
    type: mongoose.Schema.Types.String,
  },
});

MemorySchema.plugin(timestamp);
const MemoryModel = mongoose.model(CC.M001_MEMORY, MemorySchema);
module.exports = MemoryModel;
