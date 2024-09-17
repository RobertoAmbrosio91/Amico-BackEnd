const EventController = require("../service/event/controller/event.controller");
const schedule = require("node-schedule");
//check for expired events
function checkEventExpiration() {
  // schedule.scheduleJob("0 0 4,8,12,16,20 * * *", async function () {
  schedule.scheduleJob("0 * * * *", async function () {
    try {
      await EventController.checkAndUpdateExpiredEvents();
      console.log("Event expiration check completed");
    } catch (error) {
      console.error("Error checking event expiration:", error);
    }
  });
}

module.exports = checkEventExpiration;
