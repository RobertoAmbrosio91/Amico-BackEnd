const bodyParser = require("body-parser");
const cors = require("cors");

class AppConfig {
  constructor(app) {
    process.on("unhandledRejection", (reason, p) => {
      console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
      // application specific logging, throwing an error, or other logic here
    });
    this.app = app;
  }

  includeConfig() {
    this.loadAppLevelConfig();
    this.loadExpressConfig();
  }

  loadAppLevelConfig() {
    this.app.use(bodyParser.json());
    this.app.use(
      cors({
        origin: "*",
        allowedHeaders: "authorization,x-custom-header",
        preflightContinue: true,
        methods: "OPTION,GET,POST,PUT,DELETE",
      })
    );
  }

  loadExpressConfig() {
    // new ExpressConfigModule(this.app).setAppEngine();    
  }
}
module.exports = AppConfig;
