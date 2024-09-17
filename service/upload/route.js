const multer = require("multer");
const uploadApi = require("./controller/upload.controller");
const {
  createMultipartUpload,
  completeMultipartUpload, // Removed uploadPart as it's not used
  getSignedUrl,
} = require("../../utils/multipart_upload"); // Adjust the path as necessary

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});
const CHUNK_SIZE = 10 * 1024 * 1024;
class Routes {
  constructor(app) {
    this.app = app;
  }
  appRoutes() {
    this.app.post("/upload", upload.single("file"), uploadApi.uploadImage);

    this.app.post("/start-upload", async (req, res) => {
      const { fileName, fileSize } = req.body;
      const bucketName = process.env.BUCKET_NAME;
      try {
        const key = `${fileName}`;
        const uploadId = await createMultipartUpload(bucketName, key);
        const totalParts = Math.ceil(fileSize / CHUNK_SIZE);
        const partUrls = [];

        for (let i = 1; i <= totalParts; i++) {
          const partUrl = await getSignedUrl(bucketName, key, uploadId, i);
          console.log(partUrl);
          partUrls.push(partUrl);
        }

        res.json({ uploadId, signedUrls: partUrls });
      } catch (error) {
        console.error("Error in start-upload:", error);
        res.status(500).send({
          error: "Failed to initiate upload",
          details: error.toString(),
        });
      }
    });

    // Route to complete the multipart upload
    this.app.post("/complete-upload", async (req, res) => {
      const { uploadId, parts } = req.body;
      const bucketName = process.env.BUCKET_NAME;
      console.log("completing");
      try {
        const location = await completeMultipartUpload(
          bucketName,
          req.body.key,
          uploadId,
          parts
        );
        res.json({ success: true, location });
      } catch (error) {
        console.error("Error completing upload:", error);
        res.status(500).send({
          error: "Failed to complete upload",
          details: error.toString(),
        });
      }
    });
  }

  routesConfig() {
    this.appRoutes();
  }
}

module.exports = Routes;
