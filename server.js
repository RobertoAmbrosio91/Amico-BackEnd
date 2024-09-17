express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const http = require("http");
const jwt = require("jsonwebtoken");
const fileUpload = require('express-fileupload');
const AppConfig = require("./config/app-config");
const path = require("path");
// const socketIO = require("socket.io");
const initializeSocketIO=require("./config/socketIO_config")
/* Routes Includes */
const UploadRoutes = require("./service/upload/route");
const UserRoutes = require("./service/user/route");
const CategoryRoutes = require("./service/master/route");
const PostRoutes = require("./service/post/route");
const UtilityRoutes = require("./service/utility/route");
const ChatRoutes = require("./service/chat/route");
const EventRoutes = require("./service/event/route");
/* End Routes Include */

const logger = require("./config/winston");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const schedule = require("node-schedule");
require("dotenv").config();

/* Unitility Controllers */
const utilityPostController = require("./service/utility/controller/utility-post.controller");
const utilityNotificationController = require("./service/utility/controller/utility-notification.controller");
const userController = require("./service/user/controller/user.controller");
/* Event Controllers */
const EventController = require("./service/event/controller/event.controller");
const checkEventExpiration = require("./utils/check_event_expiration");
class Server {
  constructor() {
    this.app = express();
    this.app.use(
      helmet({
        contentSecurityPolicy: false,
      })
    );
    this.app.use(cors());
    this.http = http.Server(this.app);
    this.app.use((req, res, next) => {
      req.__dirname = __dirname;
      next();
    });
    this.app.use(
      fileUpload({
        limits: { fileSize: 50 * 1024 * 1024 },
        useTempFiles: true,
        tempFileDir: "/tmp/",
      })
    );
    // notificationIo(this.io, this.app)
    this.app.set("view engine", "ejs");
    this.app.set("views", path.join(__dirname, "service", "user", "view"));

    this.app.use(express.static("assets"));
    this.app.use(bodyParser.json({ limit: "50mb" }));
    this.app.use(cookieParser());
    this.app.use(
      bodyParser.urlencoded({
        limit: "50mb",
        extended: true,
        parameterLimit: 200000,
      })
    );

    //initialize Socket.IO with HTTP Server
    this.io = initializeSocketIO(this.http);
    //initialize event expiration check
    this.checkEventExpiration();
  }
  //check for expired events
  checkEventExpiration() {
    checkEventExpiration();
  }

  appConfig() {
    new AppConfig(this.app).includeConfig();
    // cameraStream();
  }

  /* Including app Routes starts */
  includeRoutes() {
    new UploadRoutes(this.app).routesConfig();
    new UserRoutes(this.app).routesConfig();
    new CategoryRoutes(this.app).routesConfig();
    new PostRoutes(this.app).routesConfig();
    new UtilityRoutes(this.app).routesConfig();
    new ChatRoutes(this.app).routesConfig();
    new EventRoutes(this.app).routesConfig();
  }
  /* Including app Routes ends */
  /* initializing instance on socket.io*/
  getIO() {
    console.log("getIO called, io is:", this.io ? "initialized" : "undefined");
    return this.io;
  }

  startTheServer(callback) {
    this.appConfig();
    this.includeRoutes();

    this.http.listen(
      process.env.NODE_SERVER_PORT || 2001,
      process.env.NODE_SERVER_HOST || "localhost",
      () => {
        console.log(
          `Server listening on http://${
            process.env.NODE_SERVER_HOST || "localhost"
          }:${process.env.NODE_SERVER_PORT || 2001}`
        );

        // Check if callback is provided and is a function
        if (callback && typeof callback === "function") {
          callback(this); // Passing 'this' to provide the server instance to the callback
        }
      }
    );

    if (
      process.env.ENABLE_CRON_JOB == "true" ||
      process.env.ENABLE_CRON_JOB == true
    ) {
      const job = schedule.scheduleJob("0 0 22 * * 7", async function () {
        logger.info(`Bulk Utility is called ${new Date()}`);
        try {
          await utilityPostController.listPosts();
          await utilityNotificationController.deleteNotification();
        } catch (error) {
          console.log("Sesrver.JS Cron", error, "Sesrver.JS Cron");
        }
      });

      const inActiveUser = schedule.scheduleJob(
        "0 0 2 * * *",
        async function () {
          logger.info(`InActive User - Utility is called ${new Date()}`);
          try {
            await userController.lastActiveNotification();
          } catch (error) {
            console.log("Sesrver.JS Cron", error, "Sesrver.JS Cron");
          }
        }
      );

      const mostUpVoteInWeek = schedule.scheduleJob(
        "0 0 1 * * 1",
        async function () {
          logger.info(
            `mostUpVoteInWeek Post - Utility is called ${new Date()}`
          );
          try {
            await utilityPostController.mostLikePostInWeek();
          } catch (error) {
            console.log("Sesrver.JS Cron", error, "Sesrver.JS Cron");
          }
        }
      );
    }

    const port = process.env.NODE_SERVER_PORT || 2001;
    const host = process.env.NODE_SERVER_HOST || "localhost";

    this.http.listen(port, host, () => {
      //  logger.info(`Listening on http://${host}:${port}`);
      console.log(`Listening on http://${host}:${port}`);
    });
  }
}
module.exports = new Server();
