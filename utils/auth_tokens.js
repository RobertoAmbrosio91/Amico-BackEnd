const jwt = require('jsonwebtoken');
const userModel = require('../service/user/model/user.model');
const { ObjectId } = require('mongodb');
const TokenModel = require("../service/user/model/jwt-tokens.schema");
module.exports.signJWT = async(data)=>{
  // await TokenModel.deleteMany({ user_id: new ObjectId(data._id) });
  const token = jwt.sign(data, process.env.JWT_SECRET, {
    expiresIn: "4d",
    issuer: process.env.JWT_ISSUER,
  });
  return token;
}

module.exports.verifyJWT = async(req, res, next) => {
    const token = req.headers['x-access-token'];
    
    if (!token) {
        res.status(401).json({
            message: 'No token provided!',
        });
        return;  
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            res.status(401).json({
                message: 'Unauthorized!',
            });
            return;
        }

        let userToken = await userModel.verifyToken({
            user_id: new ObjectId(decoded._id),
            token: token
        })

        const user = await userModel.getOne({_id: new ObjectId(decoded._id)});
        if (user && user._id && userToken && userToken._id) {            
            req.user = user;
            next();
            return;
        }

        return res.status(401).json({
            message: 'Unauthorized!',
        });
    });
    // auth_tokens.js
}