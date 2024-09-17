const chatApi = require("./controller/chat.controller");
const { verifyJWT } = require("../../utils/auth_tokens");

class Routes {
  constructor(app) {
    this.app = app;
  }
  /* creating app Routes starts */
  appRoutes() {
    this.app.get("/chat/get-all-chats", chatApi.getAllChatRooms);
    this.app.post("/chat/create-chat", [verifyJWT], chatApi.createChatRoom);
    this.app.post("/chat/send-message", [verifyJWT], chatApi.sendMessage);
    this.app.get(
      "/chat/get-chat-room/:roomId",
      [verifyJWT],
      chatApi.getChatRoomById
    );
    // this.app.post(
    //   "/chat/get-chat-room-by-subcategory/",
    //   [verifyJWT],
    //   chatApi.getChatRoomBySubcategory
    // );
    this.app.delete("/chat/delete-message", [verifyJWT], chatApi.deleteMessage);
    this.app.delete(
      "/chat/delete-all-messages/:roomId",
      [verifyJWT],
      chatApi.deleteAllChatMessages
    );
    this.app.delete(
      "/chat/delete-chat/:roomId",
      [verifyJWT],
      chatApi.deleteChatRoom
    );
    this.app.post("/chat/update-chat", [verifyJWT], chatApi.updateChatRoom);
    this.app.post("/chat/report-message", [verifyJWT], chatApi.reportMessage);
  }
  routesConfig() {
    this.appRoutes();
  }
}

module.exports = Routes;
