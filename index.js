const DotEnv = require('dotenv');
DotEnv.config();

const Server = require("./server");
const chatHandler = require("./service/chat/controller/chat.controller");
const notificationHandler = require("./service/user/controller/notification.controller");
const postHandler = require("./service/post/controller/post.controller");
const eventHandler = require("./service/event/controller/event.controller");
const userHandler = require("./service/user/controller/user.controller");
Server.startTheServer((serverInstance) => {
  const io = serverInstance.getIO();
  chatHandler.setIO(io);
  notificationHandler.setIO(io);
  postHandler.setIo(io);
  eventHandler.setIO(io);
  userHandler.setIO(io);
});