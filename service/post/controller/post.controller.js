const moment = require('moment');
const util = require('../../../utils/response');
const message = require('../../../utils/messages.json');
const CONSTANTS = require("../../../config/constant");
const { ObjectId } = require('mongodb');
const PostModel = require("../../post/model/post.model");
const LikesModel = require("../../event/model/likes.model");
// const UpVoteModel = require("../../post/model/upvote.model");
const CategoryModel = require("../../master/model/category.model");
const SubcategoryModel = require("../../master/model/subcategory.model");
// const PostRequestsModel = require("../../post/model/post_requests.model");
const PostReportModel = require("../model/post_report.model");
// const PostRequestReportModel = require("../model/post_request_report.model");
const uploadHelper = require("../../../utils/upload");
const userModel = require("../../user/model/user.model");
const pushNotification = require("../../../utils/push-notification");
const FirebaseTokenModel = require("../../user/model/firebase_token.model");
const NotificationModel = require("../../user/model/notification.model");
const UserSchema = require("../../user/model/user.schema");
const UserBlockModel = require("../../user/model/user-block.model");
const BlockHelper = require("./../../../utils/block-users");
const mailer = require("../../../utils/mailer");
const EventModel = require("../../event/model/event.model");

let io;
class PostHandler {
  setIo(socketIOInstance) {
    io = socketIOInstance;
  }

  async createPost(request, response) {
    const types = ["event"];

    try {
      let insObj = {};
      insObj.post_by = new ObjectId(request.user._id);
      if (
        !request.body.title ||
        (request.body.title && !request.body.title.trim())
      ) {
        return response
          .status(400)
          .json(util.error({}, message.title_is_required));
      } else {
        insObj.title = request.body.title.trim();
      }
      if (!request.body.event_id || !ObjectId.isValid(request.body.event_id)) {
        return response
          .status(400)
          .json(util.error({}, "Event id is required"));
      } else {
        insObj.event_id = new ObjectId(request.body.event_id);
      }

      if (
        !request.body.description ||
        (request.body.description && !request.body.description.trim())
      ) {
        return response
          .status(400)
          .json(util.error({}, message.description_is_required));
      } else {
        insObj.description = request.body.description.trim();
      }
      if (
        request.body.category_id &&
        ObjectId.isValid(request.body.category_id)
      ) {
        insObj.category_id = new ObjectId(request.body.category_id);
      }

      if (!request.body.type || !types.includes(request.body.type.trim())) {
        return response.status(422).json(util.error({}, message.invalid_type));
      } else {
        insObj.type = request.body.type.trim();
      }

      if (request.body.images && Array.isArray(request.body.images)) {
        insObj.images = request.body.images;
      }

      if (request.body.videos && Array.isArray(request.body.videos)) {
        insObj.videos = request.body.videos;
      }

      const post = await PostModel.createPosts(insObj);
      const event = await EventModel.getEvent(post.event_id);
      const postByUserData = await userModel.getOne({ _id: post.post_by });
      console.log(postByUserData);
      if (event) {
        let filteredParticipants = event.participants.filter(
          (participantId) =>
            participantId.toString() !== request.user._id.toString()
        );
        let participantTokens = await FirebaseTokenModel.findByKey({
          user_id: { $in: filteredParticipants },
          is_deleted: false,
        });
        if (participantTokens && participantTokens.length > 0) {
          let notificationData = {
            tokens: participantTokens.map((tokenRecord) => tokenRecord.token),
            title: `Amico`,
            body: `${postByUserData.user_name} shared a new post`,
            data: {
              type: "Post Creation",
              event_id: event._id.toString(),
            },
          };
          let notificationResult = await pushNotification.sendMulticast(
            notificationData
          );
        }
      }
      const responseObject = {
        ...post.toObject(),
        liked_by_me: false,
        post_by_data: [
          {
            _id: postByUserData._id,
            email: postByUserData.email,
            first_name: postByUserData.first_name,
            last_name: postByUserData.last_name,
            profile: postByUserData.profile,
            user_name: postByUserData.user_name,
          },
        ],
        total_likes: 0,
      };
      io.to("feed").emit("new_post", responseObject);
      return response
        .status(200)
        .json(util.success(responseObject, message.post_created_success));
    } catch (error) {
      return response
        .status(400)
        .json(util.error({}, error.message || message.post_creation_failed));
    }
  }

  async listPosts(request, response) {
    try {
      const userId = request.body.user_id
        ? new ObjectId(request.body.user_id)
        : request.user._id;

      let blockIds = await BlockHelper.getBlockUser(userId);
      let categoryId =
        request.user.category_id.length > 0 ? request.user.category_id : [];

      let where = {
        // category_id:{$in:categoryId}
        is_deleted: false,
      };

      if (
        request.body.request_id &&
        ObjectId.isValid(request.body.request_id)
      ) {
        where.request_id = new ObjectId(request.body.request_id);
      }

      if (request.body.user_id && ObjectId.isValid(request.body.user_id)) {
        where.post_by = new ObjectId(request.body.user_id);
      }

      if (blockIds && blockIds.length > 0) {
        where["$and"] = [
          {
            post_by: {
              $nin: blockIds,
            },
          },
        ];
      }

      const pagination = {
        no_of_docs_each_page: request.body.no_of_docs_each_page
          ? Number(request.body.no_of_docs_each_page)
          : 2,
        current_page_number:
          typeof request.body.current_page != "undefined"
            ? Number(request.body.current_page)
            : 0,
      };
      const user_id = new ObjectId(request.user._id);
      let posts = await PostModel.getAllPost(where, pagination, user_id);
      const postCount = await PostModel.countPosts(where);
      let totalAppreciations = 0;
      // let requestHelped = 0;
      if (posts && posts.length > 0) {
        posts = posts.map((post) => {
          if (post.vote_data) {
            let post_data = CONSTANTS.VOTE_TYPES.map((typ) => {
              let vote = post.vote_data.filter((vdata) => {
                return vdata.type === typ;
              });
              totalAppreciations += vote.length;

              let isVoted = vote.filter(
                (vt) =>
                  vt.vote_by.toString() === request.user._id.toString() &&
                  vt.type === typ
              );

              return {
                type: typ,
                total_vote: vote.length,
                voted: isVoted && isVoted.length > 0 ? true : false,
              };
            });

            post.vote_data = post_data;
          }

          // if (post.request_id) {
          //   requestHelped++;
          // }

          return post;
        });
      }
      let responseData = {
        posts: posts,
        total_posts: postCount,
        total_appreciations: totalAppreciations,
        // request_helped: requestHelped,
      };

      return response
        .status(200)
        .json(util.success(responseData, message.list_all_post_success));
    } catch (error) {
      return response
        .status(400)
        .json(util.error({}, error.message || message.post_fetch_error));
    }
  }

  async listPostsNoToken(request, response) {
    try {
      const pagination = {
        no_of_docs_each_page: request.body.no_of_docs_each_page
          ? Number(request.body.no_of_docs_each_page)
          : 2,
        current_page_number:
          typeof request.body.current_page != "undefined"
            ? Number(request.body.current_page)
            : 0,
      };
      let where = {
        is_deleted: false,
      };
      let posts = await PostModel.getAllPost(where, pagination);
      let responseData = {
        posts: posts,
      };

      return response
        .status(200)
        .json(util.success(responseData, message.list_all_post_success));
    } catch (error) {
      return response
        .status(400)
        .json(util.error({}, error.message || message.post_fetch_error));
    }
  }

  async getPostDetails(request, response) {
    try {
      if (
        typeof request.params.post_id == "undefined" ||
        (request.params.post_id && !ObjectId.isValid(request.params.post_id))
      ) {
        return response
          .status(400)
          .json(util.error({}, message.post_id_is_empty));
      } else {
        let postWhere = {
          _id: new ObjectId(request.params.post_id),
        };

        const pagination = {
          no_of_docs_each_page: 1,
          current_page_number: 0,
        };

        let posts = await PostModel.getAllPost(postWhere, pagination);

        if (posts && posts.length > 0) {
          posts = posts.map((post) => {
            if (post.vote_data) {
              let post_data = CONSTANTS.VOTE_TYPES.map((typ) => {
                let vote = post.vote_data.filter((vdata) => {
                  return vdata.type === typ;
                });

                let isVoted = vote.filter(
                  (vt) =>
                    vt.vote_by.toString() === request.user._id.toString() &&
                    vt.type === typ
                );

                return {
                  type: typ,
                  total_vote: vote.length,
                  voted: isVoted && isVoted.length > 0 ? true : false,
                };
              });

              post.vote_data = post_data;
            }
            return post;
          });
        }

        if (posts && posts.length > 0) {
          return response
            .status(200)
            .json(util.success(posts[0], message.post_details_sucessfully));
        } else {
          return response
            .status(400)
            .json(util.error({}, message.post_id_is_not_valid));
        }
      }
    } catch (error) {
      return response
        .status(400)
        .json(util.error({}, error.message || message.post_id_is_not_valid));
    }
  }

  async listOwnedPosts(request, response) {
    if (!request.body.user_id || !ObjectId.isValid(request.body.user_id)) {
      return response
        .status(400)
        .json(util.error([], message.user_id_is_empty));
    } else {
      request.body.user_id = request.body.user_id;
      return this.listPosts(request, response);
    }
  }

  async searchPosts(request, response) {
    try {
      const userId = request.body.user_id
        ? new ObjectId(request.body.user_id)
        : request.user._id;

      let blockIds = await BlockHelper.getBlockUser(userId);
      let where = { $and: [{ is_deleted: false }] };

      if (
        Array.isArray(request.body.category_id) &&
        request.body.category_id.length > 0
      ) {
        where["$and"].push({
          category_id: {
            $in: request.body.category_id.map((cat) => new ObjectId(cat)),
          },
        });
      }

      if (
        Array.isArray(request.body.subcategory_id) &&
        request.body.subcategory_id.length > 0
      ) {
        where["$and"].push({
          subcategory_id: {
            $in: request.body.subcategory_id.map((scat) => new ObjectId(scat)),
          },
        });
      }

      if (
        typeof request.body.search != "undefined" &&
        String(request.body.search).trim()
      ) {
        where["$and"].push({
          $or: [
            {
              title: {
                $regex: request.body.search.toLowerCase(),
                $options: "i",
              },
            },
            {
              description: {
                $regex: request.body.search.toLowerCase(),
                $options: "i",
              },
            },
          ],
        });
      }

      if (blockIds && blockIds.length > 0) {
        where["$and"].push({
          post_by: {
            $nin: blockIds,
          },
        });
      }

      if (request.body.date) {
        let endDate = new Date(
          moment(request.body.date).endOf("day").toISOString()
        );
        let startDate = new Date(
          moment(request.body.date).startOf("day").toISOString()
        );
        where["$and"].push({
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        });
      }

      const pagination = {
        no_of_docs_each_page: request.body.no_of_docs_each_page
          ? Number(request.body.no_of_docs_each_page)
          : 2,
        current_page_number:
          typeof request.body.current_page != "undefined"
            ? Number(request.body.current_page)
            : 0,
      };

      let posts = await PostModel.getAllPost(where, pagination);
      const postCount = await PostModel.countPosts(where);
      if (posts && posts.length > 0) {
        posts = posts.map((post) => {
          if (post.vote_data) {
            let post_data = CONSTANTS.VOTE_TYPES.map((typ) => {
              let vote = post.vote_data.filter((vdata) => {
                return vdata.type === typ;
              });

              let isVoted = vote.filter(
                (vt) =>
                  vt.vote_by.toString() === request.user._id.toString() &&
                  vt.type === typ
              );

              return {
                type: typ,
                total_vote: vote.length,
                voted: isVoted && isVoted.length > 0 ? true : false,
              };
            });

            post.vote_data = post_data;
          }
          return post;
        });
      }
      let responseData = {
        posts: posts,
        total_posts: postCount,
      };

      return response
        .status(200)
        .json(util.success(responseData, message.list_all_post_success));
    } catch (error) {
      return response
        .status(400)
        .json(util.error({}, error.message || message.post_fetch_error));
    }
  }
  //-------------------------------//

  async listPersonalizedPosts(request, response) {
    try {
      const userId = request.body.user_id
        ? new ObjectId(request.body.user_id)
        : request.user._id;

      let blockIds = await BlockHelper.getBlockUser(userId);

      let filter = {
        is_deleted: false,
      };

      const { subcategory_id: subcategory_ids, interest_id: interest_ids } =
        request.body;

      if (
        (subcategory_ids && !Array.isArray(subcategory_ids)) ||
        (interest_ids && !Array.isArray(interest_ids))
      ) {
        return response.status(400).json({
          error:
            "Both subcategory_id and interest_id must be arrays if provided",
        });
      }

      let combined = [];

      if (Array.isArray(subcategory_ids)) {
        combined = [...combined, ...subcategory_ids];
      }

      if (Array.isArray(interest_ids)) {
        combined = [...combined, ...interest_ids];
      }

      combined = [...new Set(combined)];

      if (combined.length > 0) {
        filter.subcategory_id = { $in: combined.map((id) => new ObjectId(id)) };
      }

      if (blockIds && blockIds.length > 0) {
        filter["$and"] = [
          {
            post_by: {
              $nin: blockIds,
            },
          },
        ];
      }

      const pagination = {
        no_of_docs_each_page: request.body.no_of_docs_each_page
          ? Number(request.body.no_of_docs_each_page)
          : 2,
        current_page_number:
          typeof request.body.current_page != "undefined"
            ? Number(request.body.current_page)
            : 0,
      };

      let posts = await PostModel.getPostsBySubCategoryAndInterests(
        filter,
        pagination
      );
      const postCount = await PostModel.countPosts(filter);

      if (posts && posts.length > 0) {
        posts = posts.map((post) => {
          if (post.vote_data) {
            let post_data = CONSTANTS.VOTE_TYPES.map((typ) => {
              let vote = post.vote_data.filter((vdata) => {
                return vdata.type === typ;
              });

              let isVoted = vote.filter(
                (vt) =>
                  vt.vote_by.toString() === request.user._id.toString() &&
                  vt.type === typ
              );

              return {
                type: typ,
                total_vote: vote.length,
                voted: isVoted && isVoted.length > 0 ? true : false,
              };
            });

            post.vote_data = post_data;
          }
          return post;
        });
      }

      let responseData = {
        posts: posts,
        total_posts: postCount,
      };

      return response
        .status(200)
        .json(util.success(responseData, message.list_all_post_success));
    } catch (error) {
      return response
        .status(400)
        .json(util.error({}, error.message || message.post_fetch_error));
    }
  }

  //-------------------------------//

  async deletePost(request, response) {
    try {
      if (
        typeof request.params.post_id == "undefined" ||
        (request.params.post_id && !ObjectId.isValid(request.params.post_id))
      ) {
        return response
          .status(400)
          .json(util.error({}, message.post_id_is_empty));
      } else {
        let postWhere = {
          _id: new ObjectId(request.params.post_id),
        };
        let getPostData = await PostModel.getOne(postWhere);

        if (getPostData && getPostData._id) {
          let delRs = await PostModel.deletePostOne(postWhere);
          if (delRs && delRs.deletedCount > 0) {
            // let delVode = await UpVoteModel.hardDelete({
            //   post_id: new ObjectId(request.params.post_id),
            // });

            if (
              getPostData &&
              getPostData.images &&
              getPostData.images.length > 0
            ) {
              for (let file of getPostData.images) {
                if (file.indexOf(process.env.CLOUD_FRONT_URL) > -1) {
                  let AWSKey = file.replace(process.env.CLOUD_FRONT_URL, "");
                  let delFile = await uploadHelper.deleteFile(AWSKey);
                }
              }
            }

            if (
              getPostData &&
              getPostData.videos &&
              getPostData.videos.length > 0
            ) {
              for (let file of getPostData.videos) {
                if (file.indexOf(process.env.CLOUD_FRONT_URL) > -1) {
                  let AWSKey = file.replace(process.env.CLOUD_FRONT_URL, "");
                  let delFile = await uploadHelper.deleteFile(AWSKey);
                }
              }
            }
          }
          io.to("feed").emit("post_deleted", getPostData._id);
          return response
            .status(200)
            .json(util.success(delRs, message.post_deleted_success));
        } else {
          return response
            .status(400)
            .json(util.error({}, message.post_id_is_not_valid));
        }
      }
    } catch (error) {
      return response
        .status(400)
        .json(util.error({}, error.message || message.post_creation_failed));
    }
  }

  async likeUnlike(request, response) {
    try {
      if (
        !request.body.post_id ||
        typeof request.body.post_id == "undefined" ||
        (request.body.post_id && !ObjectId.isValid(request.body.post_id))
      ) {
        return response.status(400).json(util.error({}, "Post ID is required"));
      } else if (
        typeof request.body.type == "undefined" ||
        request.body.type == "" ||
        !CONSTANTS.LIKE_TYPES.includes(request.body.type)
      ) {
        return response
          .status(400)
          .json(util.error({}, "Vote type is required"));
      } else {
        let postWhere = {
          _id: new ObjectId(request.body.post_id),
          is_deleted: false,
        };
        const postCount = await PostModel.countPosts(postWhere);

        if (postCount > 0) {
          let checkVoteWhere = {
            liked_by: request.user._id,
            post_id: new ObjectId(request.body.post_id),
            is_deleted: false,
          };
          let voteCount = await LikesModel.countLikes(checkVoteWhere);

          // Toggle like/unlike based on existing like
          let resVote = {};
          if (voteCount > 0) {
            // Like exists, so remove it
            await LikesModel.hardDelete(checkVoteWhere);
            resVote.removed = true; // Indicate a like was removed
            io.to("feed").emit("like_removed", request.body.post_id);
          } else {
            // No like exists, add a new one
            let addVote = await LikesModel.createLike({
              liked_by: request.user._id,
              post_id: new ObjectId(request.body.post_id),
              type: request.body.type,
            });
            resVote.added = true;
            resVote.data = addVote;
            io.to("feed").emit("like_added", request.body.post_id);
          }

          let totalVoteCount = await LikesModel.countLikes({
            post_id: new ObjectId(request.body.post_id),
            type: request.body.type,
            is_deleted: false,
          });
          resVote.total_vote = totalVoteCount;
          let postData = await PostModel.getOne(postWhere);

          if (postData && postData._id && voteCount === 0) {
            const event = await EventModel.getEvent(postData.event_id);
            const user_curr = await UserSchema.findOne(
              { _id: request.user._id },
              "user_name"
            );
            let tokens = await FirebaseTokenModel.findByKey({
              user_id: postData.post_by,
              is_deleted: false,
            });
            if (event && event._id) {
              if (event) {
                let participantTokens = await FirebaseTokenModel.findByKey({
                  user_id: { $in: event.participants, $ne: request.user._id },
                  is_deleted: false,
                });
                if (participantTokens && participantTokens.length > 0) {
                  let notificationData = {
                    tokens: participantTokens.map(
                      (tokenRecord) => tokenRecord.token
                    ),
                    title: `${event.name}`,
                    body: `${user_curr.user_name} liked your post`,
                    data: {
                      type: "Post_Reaction",
                      post_id: postData._id.toString(),
                    },
                  };
                  let notificationResult = await pushNotification.sendMulticast(
                    notificationData
                  );
                  // if (
                  //   notificationResult &&
                  //   notificationResult.results &&
                  //   notificationResult.successCount &&
                  //   notificationResult.successCount > 0
                  // ) {
                  let insObject = [];
                  insObject.push({
                    user_id: request.user._id,
                    receiver_id: postData.post_by,
                    title: notificationData.title,
                    message: notificationData.body,
                    data_message: notificationData.data,
                    is_read: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  });

                 const user = postData.post_by.toString();
                  if (user !== request.user._id.toString()) {
                    let addNotification =
                      await NotificationModel.createManyNotifications(
                        insObject
                      );
                  
                    io.to(user).emit("new_notification", {});
                  }
                }
                // }
              }
            }
          }

          return response
            .status(200)
            .json(util.success(resVote, "Vote updated successfully"));
        } else {
          return response
            .status(400)
            .json(util.error({}, "Post does not exist"));
        }
      }
    } catch (error) {
      console.log(error, "error");
      return response
        .status(400)
        .json(util.error({}, error.message || "Failed to fetch post"));
    }
  }

  // async reportPost(request, response) {
  //   try {
  //     if (
  //       typeof request.body.post_id == "undefined" ||
  //       (request.body.post_id && !ObjectId.isValid(request.body.post_id))
  //     ) {
  //       return response
  //         .status(400)
  //         .json(util.error({}, message.post_id_is_empty));
  //     } else if (
  //       typeof request.body.report_message == "undefined" ||
  //       (request.body.report_message &&
  //         request.body.report_message.trim() == "")
  //     ) {
  //       return response
  //         .status(400)
  //         .json(util.error({}, message.post_report_message_is_empty));
  //     } else {
  //       const checkWhere = {
  //         report_by: new ObjectId(request.user._id),
  //         post_id: new ObjectId(request.body.post_id),
  //       };

  //       let check = await PostReportModel.countReport(checkWhere);
  //       if (check > 0) {
  //         return response
  //           .status(200)
  //           .json(util.error({}, message.post_report_already_submitted));
  //       } else {
  //         const insObj = {
  //           report_by: new ObjectId(request.user._id),
  //           post_id: new ObjectId(request.body.post_id),
  //           report_message: request.body.report_message,
  //         };
  //         const insRs = await PostReportModel.createReport(insObj);
  //         return response
  //           .status(200)
  //           .json(util.success(insRs, message.post_report_submitted));
  //       }
  //     }
  //   } catch (error) {
  //     return response
  //       .status(400)
  //       .json(util.error({}, error.message || message.post_creation_failed));
  //   }
  // }
  async reportPost(request, response) {
    try {
      // Validate report_message
      if (
        typeof request.body.report_message === "undefined" ||
        (request.body.report_message &&
          request.body.report_message.trim() === "")
      ) {
        return response
          .status(400)
          .json(util.error({}, message.post_report_message_is_empty));
      }

      // Validate report_type and corresponding ID
      if (
        typeof request.body.report_type === "undefined" ||
        (request.body.report_type !== "post" &&
          request.body.report_type !== "memory")
      ) {
        return response
          .status(400)
          .json(util.error({}, message.report_type_is_invalid));
      }

      const reportIdField =
        request.body.report_type === "post" ? "post_id" : "memory_id";
      if (
        typeof request.body[reportIdField] === "undefined" ||
        !ObjectId.isValid(request.body[reportIdField])
      ) {
        return response
          .status(400)
          .json(util.error({}, message[`${reportIdField}_is_empty`]));
      }

      // Check for existing report
      const checkWhere = {
        report_by: new ObjectId(request.user._id),
        [reportIdField]: new ObjectId(request.body[reportIdField]),
      };

      let check = await PostReportModel.countReport(checkWhere);
      if (check > 0) {
        return response
          .status(200)
          .json(util.error({}, message.post_report_already_submitted));
      } else {
        // Prepare insert object
        const insObj = {
          report_by: new ObjectId(request.user._id),
          report_message: request.body.report_message,
          report_type: request.body.report_type,
          [reportIdField]: new ObjectId(request.body[reportIdField]),
        };

        const insRs = await PostReportModel.createReport(insObj);
        return response
          .status(200)
          .json(util.success(insRs, message.post_report_submitted));
      }
    } catch (error) {
      return response
        .status(400)
        .json(util.error({}, error.message || message.post_creation_failed));
    }
  }

  async reportPostList(request, response) {
    try {
      let where = {};
      console.log(moment(request.body.from_date).startOf("D").toDate());
      if (typeof request.body.from_date != "undefined") {
        where.createdAt = {};
        where.createdAt["$gte"] = moment(request.body.from_date)
          .startOf("D")
          .toDate();
      }

      if (typeof request.body.to_date != "undefined") {
        if (typeof where.createdAt == "undefined") {
          where.createdAt = {};
        }
        where.createdAt["$lte"] = moment(request.body.to_date)
          .endOf("D")
          .toDate();
      }

      console.log(where, "where");

      let postReportList = await PostReportModel.getAllPostReport(where);
      console.log(postReportList, "postReportList");

      return response
        .status(200)
        .json(
          util.success(postReportList, message.post_request_report_submitted)
        );
    } catch (error) {
      console.log(error, "error");
      return response
        .status(400)
        .json(util.error({}, error.message || message.post_creation_failed));
    }
  }

  async testNotification(request, response) {
    try {
      let tokens = await FirebaseTokenModel.findByKey({
        user_id: new ObjectId(request.user._id),
        is_deleted: false,
      });

      let sendRs = await pushNotification.sendMulticast({
        tokens: tokens.map((rs) => rs.token),
        title: "Test by yk 11",
        body: "---",
      });

      console.log(sendRs, "sendRs");

      return response
        .status(200)
        .json(util.success(sendRs, message.post_request_report_submitted));
    } catch (error) {
      console.log(error, "error");
      return response
        .status(400)
        .json(util.error({}, error.message || message.post_creation_failed));
    }
  }
}

module.exports = new PostHandler();