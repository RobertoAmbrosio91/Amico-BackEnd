const fs = require("fs");
const util = require('../../../utils/response');
const message = require('../../../utils/messages.json');
const userModel = require('../model/user.model');
const EndorseModel = require('../model/endorse.model');
const { ObjectId } = require('mongodb');

class EndorseHandler {

  

  async endorseUser(request, response) {
    try{
      if(!request.body.endorse_to || (request.body.endorse_to && !ObjectId.isValid(request.body.endorse_to))){
        return response.status(400).json(util.error({}, message.endorse_to_is_empty));
      }else{
        
        let checkWhere = {
          endorse_by: request.user._id,
          endorse_to: new ObjectId(request.body.endorse_to),
          is_deleted: false
        }

        let tokenRs = await EndorseModel.getOneEndorse(checkWhere);

        if(tokenRs && tokenRs._id){ 
          await tokenRs.deleteOne()
          return response.status(200).json(util.success({}, message.endorse_delete_success));
        }else{

          let insObj = {
            endorse_by: request.user._id,
            endorse_to: new ObjectId(request.body.endorse_to),
          }
          let insRs = await EndorseModel.createEndorse(insObj);
          return response.status(200).json(util.success(insRs, message.endorse_save));
        }

        
      }
    } catch (error) {
      return response.status(400).json(util.error({}, error.message || message.error_message));
    }
  }

}

module.exports = new EndorseHandler();