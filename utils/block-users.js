const UserBlockModel = require('./../service/user/model/user-block.model');

exports.getBlockUser = async(userId) => {
    let blockUsers = [];
    const blockRs = await UserBlockModel.getBlockByKey({
        "$or":[
          {
            block_by: userId
          },
          {
            block_to: userId
          }
        ]
    });

    if(blockRs && blockRs.length > 0){
        for(let u of blockRs){
            if(u.block_by.toString() !== userId.toString() && u.block_to.toString() === userId.toString()){
                blockUsers.push(u.block_by)
            }else if(u.block_by.toString() === userId.toString() && u.block_to.toString() !== userId.toString()){
                blockUsers.push(u.block_to)
            }
        }
    }
    return blockUsers;
}


