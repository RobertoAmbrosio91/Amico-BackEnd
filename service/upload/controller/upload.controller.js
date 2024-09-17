const CONSTANTS = require('../../../config/constant');
const util = require('../../../utils/response');
const message = require('../../../utils/messages.json');
const logger = require('./../../../config/winston');
const sanitizer = require("./../../../node_modules/sanitizer");
const upload = require('../../../utils/upload');
const helper = require('../../../utils/helper');
const fs = require('fs');
class uploadHandler {
  async uploadImage(request, response) {
    try {
      let fOrignalName = null;
      let file = "";

      if (request.files && request.files.file) {
        fOrignalName = request.files.file.name;
        const filePath = request.files.file.tempFilePath;
        file = fs.readFileSync(filePath).toString("base64");
      } else if (request.body.file && request.body.file !== "") {
        file = request.body.file;
        fOrignalName = request.body.name || "";
      } else {
        return response.json(
          util.error("", message.required_parameters_null_or_missing)
        );
      }

      const file_path = `uploads/${
        request.body.module_key
          ? `${request.body.module_key}/`
          : new Date().getTime()
      }`;

      if (file !== "") {
        const uploadData = await upload.uploadFile(
          file,
          file_path,
          fOrignalName
        );
        const resSend = util.success(
          uploadData,
          message.common_file_uploaded_success
        );
        return response.json(resSend);
      } else {
        return response.json(
          util.error({}, message.required_parameters_null_or_missing)
        );
      }
    } catch (error) {
      console.error(error, "error");
      return response
        .status(500)
        .json(util.error(error, message.error_message));
    }
  }
}


module.exports = new uploadHandler();