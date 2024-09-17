const AWS = require('aws-sdk');
AWS.config.update({
    accessKeyId: this.ID,
    secretAccessKey: this.SECRET,
    region: this.REGION_NAME
  });
const logger = require("../config/winston");
class AWSConfig {
    constructor() {
        // Enter copied or downloaded access ID and secret key here
        this.ID = process.env.ACCESS_KEY;
        this.SECRET = process.env.SECRET_KEY;
        // The name of the bucket that you have created
        this.BUCKET_NAME = process.env.BUCKET_NAME; 
        this.REGION_NAME = process.env.REGION_NAME;
        AWS.config.update({
            accessKeyId: this.ID,
            secretAccessKey: this.SECRET,
            region: this.REGION_NAME
        });
        this.cloudfront = new AWS.CloudFront();
        this.s3 = new AWS.S3({
            accessKeyId: this.ID,
            secretAccessKey: this.SECRET,
            region: this.REGION_NAME
        });

        
    }

    createBucket() {
        return new Promise((resolve, reject) => {

            s3.createBucket(params, function (err, data) {
                if (err) reject(err);
                else
                    resolve(data.Location);
            });

        });
    }

    uploadFile(file, fileName, fOrignalName) {
        return new Promise((resolve, reject) => {
            let timestamp = new Date().getTime();

            var cont_ = file.split(";");
            if (cont_.length == 1) {
                var cont_type = "";
            } else {
                var cont_type = typeof cont_[0] != "undefined" && cont_[0] != "" ? cont_[0].replace('data:', "") : "image/png";
            }

            var buff = new Buffer.from(file.split("base64,").pop(), 'base64')
            var cont_type_ext = "";
            if (cont_type.split("/").pop() == "vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
                cont_type_ext = "xlsx";
            } else if (cont_type.split("/").pop() == "vnd.ms-excel") {
                cont_type_ext = "xls";
            } else if (cont_type.split("/").pop() == "vnd.openxmlformats-officedocument.presentationml.presentation") {
                cont_type_ext = "pptx";
            } else if (cont_type.split("/").pop() == "vnd.ms-powerpoint") {
                cont_type_ext = "ppt";
            } else if (cont_type.split("/").pop() == "vnd.openxmlformats-officedocument.wordprocessingml.document") {
                cont_type_ext = "docx";
            } else if (cont_type.split("/").pop() == "msword") {
                cont_type_ext = "doc";
            } else if (cont_type.split("/").pop() == "pdf") {
                cont_type_ext = "pdf";
            } else if (cont_type.split("/").pop() == "jpeg") {
                cont_type_ext = "jpeg";
            } else if (cont_type.split("/").pop() == "jpg") {
                cont_type_ext = "jpg";
            } else if (cont_type.split("/").pop() == "png") {
                cont_type_ext = "png";
            } else {
                cont_type_ext = "";
            }

            if (typeof fOrignalName != "undefined" && fOrignalName != "") {
                var key_val = (fileName + fOrignalName);
            } else {
                if (cont_type_ext) {
                    var key_val = typeof fileName != "undefined" ? fileName + timestamp + '.' + cont_type_ext : timestamp + '.' + cont_type_ext;
                } else {
                    var key_val = fileName + timestamp;
                }
            }

            // key_val_ = key_val.replaceAll(" ", "-").replaceAll(")", "-").replaceAll("(", "-").replaceAll("+", "-");
            key_val = key_val.replace("(", '-');
            key_val = key_val.replace(")", '-');
            key_val = key_val.replace("+", '-');
            key_val = key_val.replace(" ", '-');

            key_val = key_val.split(" ").join("-").trim();
            var params = {
                Bucket: this.BUCKET_NAME,
                Key: key_val,
                ACL: process.env.ACL_MODE,
                Body: buff,
                ContentEncoding: 'base64',
                ContentType: cont_type
            };

            this.s3.upload(params, function (err, data) {
                if (err) {
                    console.log("err", err, "err uploadFile")
                    reject(err);
                } else {
                    console.log(process.env.CLOUD_FRONT_URL + data.Key, "data.Location")
                    resolve(process.env.CLOUD_FRONT_URL + data.Key);
                }

            });
        });

    }

    bufferFile(Obj) {
        return new Promise((resolve, reject) => {
            var params = {
                Bucket: this.BUCKET_NAME,
                Key: Obj.file_name,
                ACL: process.env.ACL_MODE,
                Body: Obj.body,

                ContentType: Obj.cont_type
            };

            this.s3.upload(params, function (err, data) {
                if (err) {
                    console.log("err", err, "err from file upload utilis upload.js bufferFile")
                    reject(err);
                } else {

                    resolve(data.Location);
                }

            });
        });
    }

    downloadFile(fileName) {

        return new Promise((resolve, reject) => {
            var params = {
                Bucket: this.BUCKET_NAME,
                Key: fileName
            };

            this.s3.getObject(params, function (err, data) {
                if (err) {
                    console.log("err", err, "err from file upload utilis upload.js downloadFile", fileName)
                    reject(err);
                } else {

                    resolve(data);
                }

            });
        });
    }

    deleteFile(fileName) {
        return new Promise((resolve, reject) => {
            var params = {
                Bucket: this.BUCKET_NAME,
                Key: fileName
            };
            console.log(fileName, "fileName")
            const cloudfront = this.cloudfront;
            this.s3.deleteObject(params, function (err, data) {
                if (err) {
                    console.log("err", err, "err from file upload utilis upload.js deleteFile")
                    reject(err);
                } else {
                    console.log("Delete Data", data);

                    const distributionId = process.env.CLOUD_FRONT_DISTRIBUTION_ID;  // Replace with your CloudFront distribution ID
                    const pathsToInvalidate = Array.isArray(fileName) ? fileName.map((p)=>"/"+p) : ["/"+fileName];  // Replace with the path of the deleted file

                    const paramsCloudFront = {
                        DistributionId: distributionId,
                        InvalidationBatch: {
                            CallerReference: Date.now().toString(),  // Use a unique identifier for each invalidation
                            Paths: {
                                Quantity: pathsToInvalidate.length,
                                Items: pathsToInvalidate,
                            },
                        },
                    };

                    cloudfront.createInvalidation(paramsCloudFront, (err, data) => {
                        if (err) {
                            console.error('Error creating invalidation:', err);
                        } else {
                            console.log('Invalidation created:', data);
                        }
                    });

                    resolve(data);
                }
            });
        });
    }
}
module.exports = new AWSConfig();
