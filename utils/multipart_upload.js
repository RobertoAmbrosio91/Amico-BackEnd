const AWS = require("aws-sdk");
const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");

const CHUNK_SIZE = 5 * 1024 * 1024;

AWS.config.update({
  region: process.env.REGION_NAME,
  accessKeyId: process.env.ACCESS_KEY_2,
  secretAccessKey: process.env.SECRET_KEY_2,
});

const s3 = new AWS.S3();
const app = express();
app.use(bodyParser.json());

const createMultipartUpload = async (bucketName, fileName) => {
  const multipart = await s3
    .createMultipartUpload({
      Bucket: bucketName,
      Key: fileName,
    })
    .promise();

  return multipart.UploadId;
};

const uploadPart = async (
  bucketName,
  fileName,
  partNumber,
  uploadId,
  fileBuffer
) => {
  const part = await s3
    .uploadPart({
      Bucket: bucketName,
      Key: fileName,
      PartNumber: parseInt(partNumber),
      UploadId: uploadId,
      Body: fileBuffer,
    })
    .promise();
  return { ETag: part.ETag, PartNumber: parseInt(partNumber) };
};

const completeMultipartUpload = async (
  bucketName,
  fileName,
  uploadId,
  parts
) => {
  const result = await s3
    .completeMultipartUpload({
      Bucket: bucketName,
      Key: fileName,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    })
    .promise();
  return result.Location;
};

const getSignedUrl = async (bucketName, key, uploadId, partNumber) => {
  const params = {
    Bucket: bucketName,
    Key: key,
    PartNumber: partNumber,
    UploadId: uploadId,
  };

  // The presigned URL will expire in 60 minutes (3600 seconds)
  return await s3.getSignedUrlPromise("uploadPart", {
    ...params,
    Expires: 3600,
  });
};

module.exports = {
  createMultipartUpload,
  uploadPart,
  completeMultipartUpload,
  getSignedUrl,
};
