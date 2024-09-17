'use strict';
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const CC = require("../../../config/constant_collection");
const logger = require('../../../config/winston');
const NotificationSchema = require("./notification.schema");

class NotificationModel {
  constructor() {
    this.DB = require("../../../config/dbm");
    this.projectedKeys = {
      crtd_dt: true,
    };
  }

  /* Crate Notification */
  createNotification(insertData) {
    let notification = new NotificationSchema(insertData);
    return new Promise(async (resolve, reject) => {
      try {
        const result = await notification.save();
        resolve(result);
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  }

  /* Insert many notifications */
  // createManyNotifications(insertData) {

  // 	return new Promise(async (resolve, reject) => {
  // 		try {
  // 			const result = await NotificationSchema.insertMany(insertData);
  // 			resolve(result);
  // 		} catch (error) {
  // 			console.log(error);
  // 			reject(error)
  // 		}
  // 	});
  // }

  async createManyNotifications(insertData) {
    try {
      const result = await NotificationSchema.insertMany(insertData);
      return result;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /* Update notification */
  async updateNotification(where, updObj) {
    try {
      return await NotificationSchema.updateOne(where, { $set: updObj });
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  /*Get All Notification List By User ID */
  getNotificationListByUserId(whereObj) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await NotificationSchema.aggregate([
          {
            $match: whereObj,
          },
          {
            $lookup: {
              from: CC.U001_USERS,
              localField: "user_id",
              foreignField: "_id",
              as: "sender",
            },
          },
          {
            $project: {
              user_id: 1,
              project_id: 1,
              title: 1,
              message: 1,
              data_message: 1,
              is_read: 1,
              is_deleted: 1,
              createdAt: 1,
              "sender._id": 1,
              "sender.profile": 1,
              "sender.thumbnail": 1,
              "sender.first_name": 1,
              "sender.last_name": 1,
            },
          },
          { $sort: { _id: -1 } },
        ]);
        resolve(result);
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  }

  /*Get All Notification List By User ID */
  getNotificationListByUserIdPagination(whereObj, page, par_page) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await NotificationSchema.aggregate([
          {
            $match: whereObj,
          },
          {
            $lookup: {
              from: CC.U001_USERS,
              localField: "user_id",
              foreignField: "_id",
              as: "sender",
            },
          },
          {
            $project: {
              user_id: 1,
              title: 1,
              message: 1,
              data_message: 1,
              is_read: 1,
              is_deleted: 1,
              createdAt: 1,
              "sender._id": 1,
              "sender.user_name": 1,
              "sender.profile": 1,
              "sender.first_name": 1,
              "sender.middle_name": 1,
              "sender.last_name": 1,
            },
          },
          { $sort: { _id: -1 } },
          { $skip: page * par_page },
          { $limit: par_page },
        ]);
        resolve(result);
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  }

  /*Get All Notification List By User ID */
  countNotification(whereObj) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await NotificationSchema.find(whereObj).count();
        resolve(result);
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  }

  /* Find Notification */
  async findNotificationByKeys(whereObj) {
    try {
      const result = await NotificationSchema.find(whereObj);
      return result;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async hardDeleteMany(where) {
    try {
      let result = await NotificationSchema.deleteMany(where);
      return result;
    } catch (error) {
      console.log(error, "error ");
      return error;
    }
  }
}

module.exports = new NotificationModel();