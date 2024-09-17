"use strict";
const PostSchema = require("./post.schema");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const CC = require("../../../config/constant_collection");



class PostModel {
  constructor() {
    this.DB = require("../../../config/dbm");
    this.projectedKeys = {
      crtd_dt: true,
    };
  }

  async createPosts(postData) {
    try {
      let post = new PostSchema(postData);
      const result = await post.save();
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }

  async countPosts(where) {
    try {
      let result = await PostSchema.find(where).count();
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }

  async getOne(where) {
    try {
      let result = await PostSchema.findOne(where);
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }

  async getAllPost(whereObj, pagination, user_id) {
    try {
      return await PostSchema.aggregate([
        {
          $match: whereObj,
        },
        {
          $lookup: {
            from: CC.U001_USERS,
            localField: "post_by",
            foreignField: "_id",
            as: "post_by_data",
          },
        },
        {
          $lookup: {
            from: CC.M002A_SUBCATEGORY,
            localField: "subcategory_id",
            foreignField: "_id",
            as: "subcategory_data",
          },
        },

        {
          $lookup: {
            from: CC.U001CA_POST_LIKES,
            localField: "_id",
            foreignField: "post_id",
            as: "likes_data",
          },
        },
        {
          $addFields: {
            total_likes: { $size: "$likes_data" },
            liked_by_me: {
              $in: [new ObjectId(user_id), "$likes_data.liked_by"],
            },
          },
        },
        /* {
          $unwind: {
            path: "$vote_data",
            preserveNullAndEmptyArrays: true
          }
        }, */
        /* {
          $lookup: {
            from: CC.U001_USERS,
            localField: "vote_data.vote_by",
            foreignField: "_id",
            as: "vote_data.user_data",
          }
        }, */

        {
          $project: {
            post_by: 1,
            title: 1,
            description: 1,
            images: 1,
            videos: 1,
            type: 1,
            background_color: 1,
            createdAt: 1,
            type_of_post: 1,
            post_source: 1,
            request_id: 1,
            total_likes: 1,
            liked_by_me: 1,
            // likes_data: 1,
            "post_by_data.profile": 1,
            "post_by_data.first_name": 1,
            "post_by_data.middle_name": 1,
            "post_by_data.last_name": 1,
            "post_by_data.email": 1,
            "post_by_data.user_name": 1,
            "post_by_data._id": 1,
            "post_by_data.user_type": 1,
            "category_data._id": 1,
            "category_data.name": 1,
            "subcategory_data._id": 1,
            "subcategory_data.name": 1,
            // "vote_data.vote_by": 1,
            // "vote_data.type": 1,
            // "vote_data._id": 1,

            // "vote_data.user_data.first_name":1,
            // "vote_data.user_data.middle_name":1,
            // "vote_data.user_data.last_name":1,
            // "vote_data.user_data.user_name":1,
            // "vote_data.total_vote":{"$size":"$vote_data.user_data"}
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $skip:
            pagination.no_of_docs_each_page * pagination.current_page_number,
        },
        { $limit: pagination.no_of_docs_each_page },
      ]);
    } catch (error) {
      return error;
    }
  }

  //----------------------------------------//

  async getPostsBySubCategoryAndInterests(filter, pagination) {
    try {
      return await PostSchema.aggregate([
        {
          $match: filter,
        },
        {
          $lookup: {
            from: CC.U001_USERS,
            localField: "post_by",
            foreignField: "_id",
            as: "post_by_data",
          },
        },
        {
          $lookup: {
            from: CC.M002_CATEGORY,
            localField: "category_id",
            foreignField: "_id",
            as: "category_data",
          },
        },
        {
          $lookup: {
            from: CC.M002A_SUBCATEGORY,
            localField: "subcategory_id",
            foreignField: "_id",
            as: "subcategory_data",
          },
        },
        {
          $lookup: {
            from: CC.U001CA_POST_VOTES,
            localField: "_id",
            foreignField: "post_id",
            as: "vote_data",
          },
        },
        {
          $project: {
            post_by: 1,
            title: 1,
            description: 1,
            images: 1,
            videos: 1,
            type: 1,
            background_color: 1,
            createdAt: 1,
            type_of_post: 1,
            post_source: 1,
            request_id: 1,
            "post_by_data.profile": 1,
            "post_by_data.first_name": 1,
            "post_by_data.middle_name": 1,
            "post_by_data.last_name": 1,
            "post_by_data.email": 1,
            "post_by_data.user_name": 1,
            "post_by_data._id": 1,
            "category_data._id": 1,
            "category_data.name": 1,
            "subcategory_data._id": 1,
            "subcategory_data.name": 1,
            "vote_data.vote_by": 1,
            "vote_data.type": 1,
            "vote_data._id": 1,

            // "vote_data.user_data.first_name":1,
            // "vote_data.user_data.middle_name":1,
            // "vote_data.user_data.last_name":1,
            // "vote_data.user_data.user_name":1,
            // "vote_data.total_vote":{"$size":"$vote_data.user_data"}
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $skip:
            pagination.no_of_docs_each_page * pagination.current_page_number,
        },
        { $limit: pagination.no_of_docs_each_page },
      ]);
    } catch (error) {
      return error;
    }
  }

  //----------------------------------------//

  async deletePostOne(where) {
    try {
      let result = await PostSchema.deleteOne(where);
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }

  async deletePostMany(where) {
    try {
      let result = await PostSchema.deleteMany(where);
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }

  async updatePostMany(where, updateObj) {
    try {
      let result = await PostSchema.updateMany(where, { $set: updateObj });
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }

  async checkStreak(where) {
    try {
      const result = await PostSchema.aggregate([
        {
          $match: where,
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
        },
      ]);
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }

  async mostLikedPost(whereObj) {
    try {
      return await PostSchema.aggregate([
        {
          $match: whereObj,
        },
        {
          $lookup: {
            from: CC.U001_USERS,
            localField: "post_by",
            foreignField: "_id",
            as: "post_by_data",
          },
        },
        {
          $lookup: {
            from: CC.M002_CATEGORY,
            localField: "category_id",
            foreignField: "_id",
            as: "category_data",
          },
        },
        {
          $lookup: {
            from: CC.M002A_SUBCATEGORY,
            localField: "subcategory_id",
            foreignField: "_id",
            as: "subcategory_data",
          },
        },
        {
          $lookup: {
            from: CC.U001CA_POST_VOTES,
            localField: "_id",
            foreignField: "post_id",
            as: "vote_data",
          },
        },
        /* {
          $unwind: {
            path: "$vote_data",
            preserveNullAndEmptyArrays: true
          }
        }, */
        /* {
          $lookup: {
            from: CC.U001_USERS,
            localField: "vote_data.vote_by",
            foreignField: "_id",
            as: "vote_data.user_data",
          }
        }, */
        // { $addFields: { totalLike: {$size:$vote_data} } },
        {
          $project: {
            post_by: 1,
            title: 1,
            description: 1,
            images: 1,
            videos: 1,
            background_color: 1,
            // type: 1,
            createdAt: 1,
            // request_id:1,
            subcategory_id: 1,
            totalLike: { $size: "$vote_data" },
            "post_by_data.first_name": 1,
            "post_by_data.middle_name": 1,
            "post_by_data.last_name": 1,
            "post_by_data.email": 1,
            "post_by_data.user_name": 1,
            "post_by_data._id": 1,
            // "category_data._id":1,
            // "category_data.name":1,
            "subcategory_data._id": 1,
            "subcategory_data.name": 1,
            // "vote_data.vote_by":1,
            // "vote_data.type":1,
            // "vote_data._id":1,
          },
        },
        { $sort: { totalLike: -1, createdAt: -1 } },
        {
          $group: {
            _id: "$subcategory_id",
            maxValue: { $max: "$totalLike" },
            records: {
              $push: "$$ROOT",
            },
          },
        },
      ]);
    } catch (error) {
      return error;
    }
  }
}

module.exports = new PostModel();
