"use strict";
const UserSchema = require("./user.schema");
const FriendRequestSchema = require("./friend-request.schema");
const JWTTokenSchema = require("./jwt-tokens.schema");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
//const CONSTANTS = require('../../../config/constant');
const CC = require("./../../../config/constant_collection");
const logger = require("./../../../config/winston");
const jwt = require("jsonwebtoken");

class UserModel {
  constructor() {
    this.DB = require("../../../config/dbm");
    this.projectedKeys = {
      crtd_dt: true,
    };
  }

  async createToken(tokenData) {
    try {
      let token = new JWTTokenSchema(tokenData);
      const result = await token.save();
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }

  getUserByEmail(email) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await UserSchema.findOne({
          email: email,
          is_deleted: false,
        });
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  async createUser(user_data) {
    try {
      let user = new UserSchema(user_data);
      const result = await user.save();
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }

  async getOne(where) {
    try {
      return await UserSchema.findOne(where);
      // .populate({
      //   path: "close_friends",
      //   select: "first_name last_name user_name profile",
      // });
    } catch (error) {
      return error;
    }
  }

  async getByKeys(where) {
    try {
      return await UserSchema.find(where);
    } catch (error) {
      return error;
    }
  }

  async getForLastActive(where, keys = {}) {
    try {
      return await UserSchema.find(where, keys);
    } catch (error) {
      return error;
    }
  }

  async getProfileData(where) {
    try {
      const result = await UserSchema.aggregate([
        {
          $match: where,
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
            from: CC.M002A_SUBCATEGORY,
            localField: "interest_id",
            foreignField: "_id",
            as: "interest_data",
          },
        },
        {
          $project: {
            first_name: 1,
            middle_name: 1,
            last_name: 1,
            email: 1,
            bio: 1,
            user_name: 1,
            mobile: 1,
            profile: 1,
            social_id: 1,
            category_id: 1,
            subcategory_id: 1,
            interest_id: 1,
            is_verified: 1,
            nationalities: 1,
            languages_spoken: 1,
            pets: 1,
            gender: 1,
            status: 1,
            social_links: 1,
            friends: 1,
            close_friends: 1,
            "category_data._id": 1,
            "category_data.name": 1,
            "subcategory_data._id": 1,
            "subcategory_data.name": 1,
            "interest_data._id": 1,
            "interest_data.name": 1,
          },
        },
      ]);
      return result;
    } catch (error) {
      return error;
    }
  }

  /*
   * Name of the Method : updateUser
   * Description : update User details
   */
  async updateUser(where, updObj) {
    try {
      return await UserSchema.updateOne(where, { $set: updObj });
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async hardDeleteOne(where) {
    try {
      let result = await UserSchema.deleteOne(where);
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }

  async deleteAuthTokens(where) {
    try {
      let result = await JWTTokenSchema.deleteOne(where);
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }

  async verifyToken(where) {
    try {
      return await JWTTokenSchema.findOne(where);
    } catch (error) {
      return error;
    }
  }

  async getAllUsers(where) {
    try {
      return await UserSchema.find(where).select(
        "_id profile first_name last_name user_name"
      );
    } catch (error) {
      console.log("Error fetching the users", error);
      throw error;
    }
  }

  // friend request related
  async sendFriendRequest(data) {
    try {
      let request = new FriendRequestSchema(data);
      const result = await request.save();
      const whereObj = {
        _id: request._id,
      };
      const response = await this.fetchUserFriendRequests(whereObj);

      return response;
    } catch (error) {
      console.log("Error sending the request", error);
    }
  }

  async fetchUserFriendRequests(where) {
    try {
      return await FriendRequestSchema.aggregate([
        {
          $match: where,
        },
        {
          $lookup: {
            from: CC.U001_USERS,
            localField: "sender",
            foreignField: "_id",
            as: "sender_data",
          },
        },
        {
          $unwind: {
            path: "$sender_data",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            friend_request_id: "$_id",
            sender_data: {
              _id: "$sender_data._id",
              first_name: "$sender_data.first_name",
              last_name: "$sender_data.last_name",
              profile: "$sender_data.profile",
              user_name: "$sender_data.user_name",
            },
          },
        },
      ]);
    } catch (error) {
      console.log("error fetching friend requests", error);
      throw error;
    }
  }

  async friendRequestStatus(ids) {
    try {
      const [id1, id2] = ids;
      const friendRequest = await FriendRequestSchema.findOne({
        $or: [
          { sender: id1, receiver: id2 },
          { sender: id2, receiver: id1 },
        ],
      }).sort({ createdAt: -1 });
      if (friendRequest) {
        return friendRequest.status;
      } else {
        return "not_sent";
      }
    } catch (error) {
      console.log("error fetching friend requests", c);
      throw error;
    }
  }
}

module.exports = new UserModel();
