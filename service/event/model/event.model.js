const EventSchema = require("./event.schema");
const MemorySchema = require("./memory.schema");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const CC = require("../../../config/constant_collection");
const { getOne } = require("../../user/model/user.model");

class EventModel {
  //event related functions
  async createEvent(eventData) {
    try {
      let event = new EventSchema(eventData);
      const result = await event.save();
      return result;
    } catch (error) {
      console.log("error creating a event", error);
      throw error;
    }
  }

  async getEventById(eventId, userId) {
    try {
      return await EventSchema.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(eventId) } },
        {
          $lookup: {
            from: CC.U001_USERS,
            localField: "participants",
            foreignField: "_id",
            as: "participants_info",
          },
        },
        {
          $lookup: {
            from: CC.M001_MEMORY,
            localField: "_id",
            foreignField: "event_id",
            as: "memories",
          },
        },
        { $unwind: { path: "$memories", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: CC.U001_USERS,
            localField: "memories.created_by",
            foreignField: "_id",
            as: "memories.created_by_info",
          },
        },
        {
          $lookup: {
            from: CC.U001CA_POST_LIKES,
            let: { memoryId: "$memories._id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$memory_id", "$$memoryId"] },
                      { $eq: ["$is_deleted", false] },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: "$type",
                  count: { $sum: 1 },
                },
              },
            ],
            as: "memories.reactions_summary",
          },
        },
        {
          $addFields: {
            "memories.reactions_summary": {
              $arrayToObject: {
                $map: {
                  input: "$memories.reactions_summary",
                  as: "rs",
                  in: {
                    k: { $concat: ["total_", "$$rs._id", "_reaction"] },
                    v: "$$rs.count",
                  },
                },
              },
            },
          },
        },
        {
          $lookup: {
            from: CC.U001CA_POST_LIKES,
            localField: "memories._id",
            foreignField: "memory_id",
            as: "memories.likes_data",
          },
        },
        {
          $addFields: {
            "memories.my_reaction": {
              $reduce: {
                input: "$memories.likes_data",
                initialValue: null,
                in: {
                  $cond: {
                    if: {
                      $and: [
                        { $eq: ["$$this.reaction_by", userId] },
                        { $eq: ["$$this.is_deleted", false] },
                      ],
                    },
                    then: "$$this.type",
                    else: "$$value",
                  },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: "$_id",
            root: { $mergeObjects: "$$ROOT" },
            memories: {
              $push: {
                $cond: [
                  { $ifNull: ["$memories._id", false] }, // Check if the memory has an _id (indicating it's a valid memory)
                  "$memories", // If yes, include it
                  "$$REMOVE", // If not, exclude it from the array
                ],
              },
            },
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: ["$root", { memories: "$memories" }],
            },
          },
        },
        {
          $lookup: {
            from: CC.C001_CHATROOM,
            localField: "_id",
            foreignField: "event_id",
            as: "chat_room_info",
          },
        },
        {
          $project: {
            name: 1,
            description: 1,
            createdAt: 1,
            updatedAt: 1,
            event_image: 1,
            is_expired: 1,
            location: 1,
            start_date: 1,
            end_date: 1,
            event_visibility: 1,
            event_type: 1,
            prompts: 1,
            // memories: 1,
            memories: {
              $filter: {
                input: {
                  $map: {
                    input: "$memories",
                    as: "memory",
                    in: {
                      _id: "$$memory._id",
                      media_file: "$$memory.media_file",
                      event_id: "$$memory.event_id",
                      memory_type: "$$memory.type",
                      caption: "$$memory.caption",
                      updatedAt: "$$memory.updatedAt",
                      createdAt: "$$memory.createdAt",
                      __v: "$$memory.__v",
                      reactions_summary: "$$memory.reactions_summary",
                      my_reaction: "$$memory.my_reaction",
                      created_by: {
                        $cond: {
                          if: {
                            $gt: [{ $size: "$$memory.created_by_info" }, 0],
                          },
                          then: {
                            _id: {
                              $arrayElemAt: ["$$memory.created_by_info._id", 0],
                            },
                            user_name: {
                              $arrayElemAt: [
                                "$$memory.created_by_info.user_name",
                                0,
                              ],
                            },
                            first_name: {
                              $arrayElemAt: [
                                "$$memory.created_by_info.first_name",
                                0,
                              ],
                            },
                            last_name: {
                              $arrayElemAt: [
                                "$$memory.created_by_info.last_name",
                                0,
                              ],
                            },
                            profile: {
                              $arrayElemAt: [
                                "$$memory.created_by_info.profile",
                                0,
                              ],
                            },
                          },
                          else: "$$REMOVE",
                        },
                      },
                    },
                  },
                },
                as: "memory",
                cond: { $ne: ["$$memory", {}] },
              },
            },
            participants: {
              $map: {
                input: "$participants_info",
                as: "participant",
                in: {
                  _id: "$$participant._id",
                  user_name: "$$participant.user_name",
                  first_name: "$$participant.first_name",
                  last_name: "$$participant.last_name",
                  profile: "$$participant.profile",
                },
              },
            },
            chat_room_data: {
              _id: { $arrayElemAt: ["$chat_room_info._id", 0] },
            },
          },
        },
      ]);
    } catch (error) {
      console.error("Error fetching the event", error);
      throw error;
    }
  }

  async getEvent(where) {
    try {
      return await EventSchema.findOne(where);
    } catch (error) {
      return error;
    }
  }
  async getEventWithMemories(where, userId) {
    try {
      return await EventSchema.aggregate([
        { $match: where },
        {
          $lookup: {
            from: CC.M001_MEMORY,
            localField: "_id",
            foreignField: "event_id",
            as: "memories_info",
          },
        },
        {
          $unwind: { path: "$memories_info", preserveNullAndEmptyArrays: true },
        },
        // Lookup to bring in the user information
        {
          $lookup: {
            from: CC.U001_USERS,
            localField: "memories_info.created_by",
            foreignField: "_id",
            as: "memories_info.created_by_info",
          },
        },
        // Lookup to bring in the likes information for each memory
        {
          $lookup: {
            from: CC.U001CA_POST_LIKES,
            localField: "memories_info._id",
            foreignField: "memory_id",
            as: "memories_info.likes_data",
          },
        },
        // Add fields to calculate total_likes and liked_by_me
        {
          $addFields: {
            "memories_info.total_likes": { $size: "$memories_info.likes_data" },
            "memories_info.liked_by_me": {
              $in: [new ObjectId(userId), "$memories_info.likes_data.liked_by"],
            },
          },
        },
        // Sort the unwound memories by createdAt before grouping
        { $sort: { "memories_info.createdAt": -1 } },
        {
          $group: {
            _id: "$_id",
            root: { $first: "$$ROOT" },
            most_recent_memory_date: { $first: "$memories_info.createdAt" },
            memories_info: { $push: "$memories_info" },
          },
        },
        { $sort: { most_recent_memory_date: -1 } },
        {
          $project: {
            event_name: "$root.name",
            event_image: "$root.event_image",
            memories: {
              $filter: {
                input: {
                  $map: {
                    input: "$memories_info",
                    as: "memory",
                    in: {
                      memory_id: "$$memory._id",
                      media_file: "$$memory.media_file",
                      memory_type: "$$memory.type",
                      created_by: {
                        $cond: {
                          if: {
                            $gt: [{ $size: "$$memory.created_by_info" }, 0],
                          },
                          then: {
                            _id: {
                              $arrayElemAt: ["$$memory.created_by_info._id", 0],
                            },
                            first_name: {
                              $arrayElemAt: [
                                "$$memory.created_by_info.first_name",
                                0,
                              ],
                            },
                            last_name: {
                              $arrayElemAt: [
                                "$$memory.created_by_info.last_name",
                                0,
                              ],
                            },
                            user_name: {
                              $arrayElemAt: [
                                "$$memory.created_by_info.user_name",
                                0,
                              ],
                            },
                            profile: {
                              $arrayElemAt: [
                                "$$memory.created_by_info.profile",
                                0,
                              ],
                            },
                          },
                          else: "$$REMOVE",
                        },
                      },
                      total_likes: "$$memory.total_likes",
                      liked_by_me: "$$memory.liked_by_me",
                    },
                  },
                },
                as: "memory",
                cond: { $ne: ["$$memory", {}] },
              },
            },
          },
        },
      ]);
    } catch (error) {
      console.error("Failed to get public events:", error);
      throw error;
    }
  }

  async updateEvent(where, updateData) {
    try {
      const updatedEvent = await EventSchema.findOneAndUpdate(
        where,
        { $set: updateData },
        { new: true }
      );

      if (!updatedEvent) {
        throw new Error("Event not found");
      }

      return updatedEvent;
    } catch (error) {
      console.log("Error updating the event", error);
      return error;
    }
  }

  async deleteEvent(where) {
    try {
      let result = await EventSchema.deleteOne(where);
      return result;
    } catch (error) {
      console.log("Error deleting the event", error);
    }
  }

  async getUserEvents(where) {
    try {
      const eventsWithParticipantsAndMemories = await EventSchema.aggregate([
        { $match: where }, // Initial match to filter events
        { $sort: { end_date: -1 } }, // Sort by end_date
        {
          $lookup: {
            from: CC.U001_USERS, // Assuming participants are stored in a collection named "participants"
            localField: "participants", // Field in Event documents
            foreignField: "_id", // Field in Participant documents
            as: "participantDetails",
          },
        },
        {
          $lookup: {
            from: CC.M001_MEMORY, // Assuming memories are stored in a collection named "memories"
            localField: "_id",
            foreignField: "event_id", // Assuming each memory document has an 'event_id' field linking back to the Event
            as: "eventMemories",
          },
        },
        {
          $project: {
            _id: 1,
            created_by: 1,
            name: 1,
            is_expired: 1,
            start_date: 1,
            end_date: 1,
            event_image: 1,
            event_visibility: 1,
            event_type: 1,
            location: 1,
            description: 1,
            updatedAt: 1,
            createdAt: 1,
            __v: 1,
            participants: {
              $map: {
                input: "$participantDetails",
                as: "participant",
                in: {
                  _id: "$$participant._id",
                  user_name: "$$participant.user_name",
                  profile: "$$participant.profile",
                },
              },
            },
            // Including specific fields for memories:
            memories: {
              $map: {
                input: "$eventMemories",
                as: "memory",
                in: {
                  _id: "$$memory._id",
                  media_file: "$$memory.media_file",
                },
              },
            },
          },
        },
      ]);

      return eventsWithParticipantsAndMemories;
    } catch (error) {
      console.log("Error fetching the user events", error);
      throw error;
    }
  }

  async getAllEvents(where) {
    try {
      return await EventSchema.find(where);
    } catch (error) {
      console.log("Error fetching all events", error);
      throw error;
    }
  }

  async getPublicEvents(where, userId) {
    try {
      return await EventSchema.aggregate([
        {
          $match: {
            event_visibility: { $ne: "private" },
            is_expired: false,
            ...where,
          },
        },
        {
          $lookup: {
            from: CC.M001_MEMORY,
            localField: "_id",
            foreignField: "event_id",
            as: "memories_info",
          },
        },
        {
          $unwind: { path: "$memories_info", preserveNullAndEmptyArrays: true },
        },
        // Lookup to bring in the user information
        {
          $lookup: {
            from: CC.U001_USERS,
            localField: "memories_info.created_by",
            foreignField: "_id",
            as: "memories_info.created_by_info",
          },
        },
        // Lookup to bring in the likes information for each memory
        {
          $lookup: {
            from: CC.U001CA_POST_LIKES,
            localField: "memories_info._id",
            foreignField: "memory_id",
            as: "memories_info.likes_data",
          },
        },
        // Add fields to calculate total_likes and liked_by_me
        {
          $addFields: {
            "memories_info.total_likes": { $size: "$memories_info.likes_data" },
            "memories_info.liked_by_me": {
              $in: [new ObjectId(userId), "$memories_info.likes_data.liked_by"],
            },
          },
        },
        // Sort the unwound memories by createdAt before grouping
        { $sort: { "memories_info.createdAt": -1 } },
        {
          $group: {
            _id: "$_id",
            root: { $first: "$$ROOT" },
            most_recent_memory_date: { $first: "$memories_info.createdAt" },
            memories_info: { $push: "$memories_info" },
          },
        },
        { $sort: { most_recent_memory_date: -1 } },
        {
          $project: {
            event_name: "$root.name",
            event_image: "$root.event_image",
            participants: "$root.participants",
            memories: {
              $filter: {
                input: {
                  $map: {
                    input: "$memories_info",
                    as: "memory",
                    in: {
                      memory_id: "$$memory._id",
                      media_file: "$$memory.media_file",
                      memory_type: "$$memory.type",
                      created_by: {
                        $cond: {
                          if: {
                            $gt: [{ $size: "$$memory.created_by_info" }, 0],
                          },
                          then: {
                            _id: {
                              $arrayElemAt: ["$$memory.created_by_info._id", 0],
                            },
                            first_name: {
                              $arrayElemAt: [
                                "$$memory.created_by_info.first_name",
                                0,
                              ],
                            },
                            last_name: {
                              $arrayElemAt: [
                                "$$memory.created_by_info.last_name",
                                0,
                              ],
                            },
                            user_name: {
                              $arrayElemAt: [
                                "$$memory.created_by_info.user_name",
                                0,
                              ],
                            },
                            profile: {
                              $arrayElemAt: [
                                "$$memory.created_by_info.profile",
                                0,
                              ],
                            },
                          },
                          else: "$$REMOVE",
                        },
                      },
                      total_likes: "$$memory.total_likes",
                      liked_by_me: "$$memory.liked_by_me",
                    },
                  },
                },
                as: "memory",
                cond: { $ne: ["$$memory", {}] },
              },
            },
          },
        },
      ]);
    } catch (error) {
      console.error("Failed to get public events:", error);
      throw error;
    }
  }

  async createMemory(memoryData) {
    try {
      let memory = new MemorySchema(memoryData);
      const result = await memory.save();
      const userDetails = await getOne(result.created_by);
      const transformedResult = {
        _id: result._id,
        event_id: result.event_id,
        caption: result.caption,
        created_by: {
          _id: userDetails._id,
          first_name: userDetails.first_name,
          last_name: userDetails.last_name,
          profile: userDetails.profile,
          user_name: userDetails.user_name,
        },
        media_file: result.media_file,
        memory_type: result.type,
      };
      return transformedResult;
    } catch (error) {
      console.log("Error creating the Memory", error);
    }
  }

  async deleteMemories(where) {
    try {
      let result = await MemorySchema.deleteMany(where);
      return result;
    } catch (error) {
      console.log("Error deleting the memory", error);
    }
  }
  async countMemory(where) {
    try {
      let result = await MemorySchema.find(where).count();
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }

  async getMemoryById(memoryId, userId) {
    try {
      const result = await MemorySchema.aggregate([
        { $match: { _id: new ObjectId(memoryId) } },
        {
          $lookup: {
            from: CC.U001_USERS,
            localField: "created_by",
            foreignField: "_id",
            as: "creator_info",
          },
        },
        {
          $lookup: {
            from: CC.E001_EVENT,
            localField: "event_id",
            foreignField: "_id",
            as: "event_info",
          },
        },
        {
          $lookup: {
            from: CC.U001CA_POST_LIKES,
            let: { memoryId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$memory_id", "$$memoryId"] },
                      { $eq: ["$is_deleted", false] },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: "$type",
                  count: { $sum: 1 },
                },
              },
            ],
            as: "reactions_summary",
          },
        },
        {
          $addFields: {
            reactions_summary: {
              $arrayToObject: {
                $map: {
                  input: "$reactions_summary",
                  as: "rs",
                  in: {
                    k: { $concat: ["total_", "$$rs._id", "_reaction"] },
                    v: "$$rs.count",
                  },
                },
              },
            },
          },
        },
        {
          $lookup: {
            from: CC.U001CA_POST_LIKES,
            let: { memoryId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$memory_id", "$$memoryId"] },
                      { $eq: ["$is_deleted", false] },
                      { $eq: ["$reaction_by", userId] },
                    ],
                  },
                },
              },
            ],
            as: "user_reaction",
          },
        },
        {
          $addFields: {
            my_reaction: {
              $arrayElemAt: ["$user_reaction.type", 0],
            },
          },
        },
        {
          $project: {
            _id: 1,
            media_file: 1,
            caption: 1,
            created_at: 1,
            updated_at: 1,
            reactions_summary: 1,
            event_id: 1,
            my_reaction: 1,
            type: 1,
            created_by: {
              _id: { $arrayElemAt: ["$creator_info._id", 0] },
              user_name: { $arrayElemAt: ["$creator_info.user_name", 0] },
              first_name: { $arrayElemAt: ["$creator_info.first_name", 0] },
              profile: { $arrayElemAt: ["$creator_info.profile", 0] },
            },
            eventData: {
              name: { $arrayElemAt: ["$event_info.name", 0] },
              image: { $arrayElemAt: ["$event_info.event_image", 0] },
            },
          },
        },
      ]);

      return result;
    } catch (error) {
      console.error("Something went wrong fetching the memory", error);
      throw error;
    }
  }
}

module.exports = new EventModel();
