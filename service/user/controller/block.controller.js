const fs = require("fs");
const util = require('../../../utils/response');
const message = require('../../../utils/messages.json');
const userModel = require('../model/user.model');
const UserBlockModel = require('../model/user-block.model');
const { ObjectId } = require('mongodb');

class BlockHandler {

  

  async blockUser(request, response) {
    try{
      if(!request.body.block_to || (request.body.block_to && !ObjectId.isValid(request.body.block_to))){
        return response.status(400).json(util.error({}, message.block_to_is_empty));
      }else{
        
        let checkWhere = {
          block_by: request.user._id,
          block_to: new ObjectId(request.body.block_to),
          is_deleted: false
        }
        let checkRs = await UserBlockModel.getOneBlock(checkWhere);
        
        if(checkRs && checkRs._id){ 
          await checkRs.deleteOne();
          return response.status(200).json(util.success({}, message.block_delete_success));
        }else{
          let insObj = {
            block_by: request.user._id,
            block_to: new ObjectId(request.body.block_to),
          }
          let insRs = await UserBlockModel.createBlock(insObj);
          return response.status(200).json(util.success(insRs, message.block_save));
        }

        
      }
    } catch (error) {
      return response.status(400).json(util.error({}, error.message || message.error_message));
    }
  }

}

module.exports = new BlockHandler();