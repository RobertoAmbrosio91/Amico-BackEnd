const mongoose=require("mongoose")
const CC=require("../../../config/constant_collection");
const timestamp=require("mongoose-timestamp");

const EventSchema = new mongoose.Schema({
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.U001_USERS,
    required: true,
    index: true,
  },
  name: {
    type: mongoose.Schema.Types.String,
    required: true,
    index: true,
  },
  description: {
    type: mongoose.Schema.Types.String,
  },
  participants: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: CC.U001_USERS,
  },
  is_expired: {
    type: mongoose.Schema.Types.Boolean,
    default: false,
    index: true,
  },
  start_date: {
    type: mongoose.Schema.Types.Date,
    required: true,
  },
  end_date: {
    type: mongoose.Schema.Types.Date,
    required: true,
  },
  event_image: {
    type: mongoose.Schema.Types.String,
  },
  event_visibility: {
    type: mongoose.Schema.Types.String,
    enum: ["public", "private", "friends"],
    required: true,
    index: true,
  },
  event_type: {
    type: mongoose.Schema.Types.String,
    required: true,
    index: true,
  },
  location: {
    type: mongoose.Schema.Types.String,
    index: true,
  },
  prompts: {
    type: [
      {
        name: {
          type: String,
          required: true,
        },
        memories_id: [
          {
            type: mongoose.Schema.Types.String,
          },
        ],
        prompt_image: {
          type: String,
        },
      },
    ],
    default: [],
  },
});

EventSchema.plugin(timestamp);
const EventModel = mongoose.model(CC.E001_EVENT, EventSchema);
module.exports = EventModel;