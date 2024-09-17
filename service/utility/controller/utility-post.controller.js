const moment = require('moment');
const util = require('../../../utils/response');
const message = require('../../../utils/messages.json');
const CONSTANTS = require("../../../config/constant");
const { ObjectId } = require('mongodb');
const PostModel = require("../../post/model/post.model");
// const UpVoteModel = require("../../post/model/upvote.model");
const CategoryModel = require('../../master/model/category.model');
const SubcategoryModel = require('../../master/model/subcategory.model');
const FirebaseTokenModel = require('../../user/model/firebase_token.model');
const pushNotification = require("../../../utils/push-notification");
const userModel = require('../../user/model/user.model');


class PostHandler {

  async listPosts() {
    try {

      let where = {
        subcategory_id:{$exists:true},
        is_deleted: false
      }
      
      let posts = await PostModel.mostLikedPost(where);
      let updateCount = 0;
      if(posts && posts.length > 0){
        for(let post of posts){
          if(post && post.records && post.records.length > 0 && post.maxValue > 0){
            let updRs = await userModel.updateUser({
              _id: post.records[0].post_by
            },{
              most_liked_weekly_post:{
                completed: true,
                count:1,
                post_ids:[post.records[0]._id]
              }
            });
          }
        }
        
      }

      return updateCount;
      
      // return response.status(200).json(util.success(posts, message.list_all_post_success));
    } catch (error) {
      console.log(error, "error")
      return 0;
      // return response.status(400).json(util.error({}, error.message || message.post_fetch_error));
    }
  }

  async mostLikePostInWeek(){
    try {

      let fromDate = moment(new Date()).subtract(14, 'w').startOf("D").toDate();
      let toDate = moment(new Date()).subtract(8, 'w').endOf("D").toDate();

      let where = {
        subcategory_id:{$exists:true},
        createdAt:{ $gte: fromDate, $lte: toDate },
        is_deleted: false
      }      
      let posts = await PostModel.mostLikedPost(where);
      if(posts && posts.length > 0){
        for(let p of posts){
          console.log(p.maxValue, "--");
          if(p.maxValue && p.maxValue > 0 && p.records && p.records.length > 0){

            /* if(p.records[0].post_by_data && p.records[0].post_by_data[0] && p.records[0].post_by_data[0].email){
              await mailer.sendmailUsingOptions({
                to:p.records[0].post_by_data[0].email,
                subject:`Your post is most voted in Week`,
                html:`Bravo! Your post has been voted as the most popular in ${p.records.subcategory_data && p.records.subcategory_data[0] && p.records.subcategory_data[0].name ? p.records.subcategory_data[0].name : ""} this week!`
              });
            } */

            let getTokens = await FirebaseTokenModel.findByKey({
              user_id:p.records[0].post_by,
              is_deleted:false
            });
    
            if(getTokens && getTokens.length > 0){
              let tokenArr = getTokens.map((tk)=>tk.token);
              if(tokenArr && tokenArr.length > 0){
                let notificationData = {
                  tokens:tokenArr,
                  "title":`Your post is most voted in Week`,
                  "body":`Bravo! Your post has been voted as the most popular in ${p.records.subcategory_data && p.records.subcategory_data[0] && p.records.subcategory_data[0].name ? p.records.subcategory_data[0].name : ""} this week!`,
                  data:{
                    type:'Post Like',
                    post_id:p.records[0]._id
                  }
                };
        
                let sendRs = await pushNotification.sendMulticast(notificationData);
              }
            }  
          }
        }
      }
      
      return true;
      // return response.status(200).json(util.success(posts, message.list_all_post_success));
    } catch (error) {
      console.log(error, "error")
      return 0;
      // return response.status(400).json(util.error({}, error.message || message.post_fetch_error));
    }
  }  
}

module.exports = new PostHandler();