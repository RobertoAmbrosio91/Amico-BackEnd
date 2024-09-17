const eventApi = require("./controller/event.controller");
const { verifyJWT } = require("../../utils/auth_tokens");

class Routes {
  constructor(app) {
    this.app = app;
  }

  appRoutes() {
    this.app.post("/event/create-event", [verifyJWT], eventApi.createEvent);
    this.app.get(
      "/event/get-event/:event_id",
      [verifyJWT],
      eventApi.getEventById
    );
    this.app.get(
      "/event/get-memory/:memory_id",
      [verifyJWT],
      eventApi.getMemoryById
    );
    this.app.post("/event/create-memory", [verifyJWT], eventApi.createMemory);
    this.app.post("/event/delete-event", [verifyJWT], eventApi.deleteEvent);
    this.app.post("/event/delete-memories", [verifyJWT], eventApi.deleteMemory);
    this.app.post("/event/update-event", [verifyJWT], eventApi.updateEvent);
    this.app.get("/event/get-user-events", [verifyJWT], eventApi.getUserEvents);
    this.app.get("/event/get-all-events", [verifyJWT], eventApi.getAllEvents);
    this.app.post("/event/create-prompt", [verifyJWT], eventApi.createPrompt);
    this.app.post("/event/delete-prompt", [verifyJWT], eventApi.deletePrompt);
    this.app.post(
      "/event/add-participant",
      [verifyJWT],
      eventApi.addParticipant
    );
    this.app.get(
      "/event/get-public-events",
      [verifyJWT],
      eventApi.getPublicEvents
    );
    this.app.post(
      "/event/like-unlike-memory",
      [verifyJWT],
      eventApi.likeUnlikeMemory
    );
  }

  routesConfig() {
    this.appRoutes();
  }
}

module.exports = Routes;
