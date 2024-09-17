const mongodb = require('mongodb');
//const redis = require('redis');

class MongoDB {
   constructor() {
     this.mongoClient = mongodb.MongoClient;
     this.ObjectID = mongodb.ObjectId;
   
   }

  onConnect() {
    return new Promise((resolve, reject) => {
      this.mongoClient.connect(
        process.env.MONGODB_DB_URL, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        },
        (err, client) => {
          if (err) {
            console.log(err,"0000000000000===========++++")
            reject(err);
          } else {
            resolve([client.db(process.env.MONGODB_DB_NAME), this.ObjectID, client]);
          }
        },
      );
    });
  }

}
module.exports = new MongoDB();
//module.exports.redisClient = redis.createClient();
