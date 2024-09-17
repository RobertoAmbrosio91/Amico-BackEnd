const socketIO = require("socket.io");

function initializeSocketIO(httpServer) {
  const io = socketIO(httpServer, {
    cors: {
      origin: [
        "https://socket.noosk.co",
        "https://noosk.netlify.app",
        "https://noosk.co",
      ],
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("join_notifications", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined notification room`);
    });
    //socket for single event
    socket.on("user_joined_events", (eventId) => {
      socket.join(`event/${eventId}`);
      console.log(`User joined event room ${eventId} `);
    });
    //friend request socket
    socket.on("friend_requests", (userId) => {
      socket.join(`friend_requests/${userId}`);
      console.log(`User joined friend requests  `);
    });
    //socket for chat room
    socket.on("join_room", (roomId) => {
      socket.join(roomId);
    });
    //socket for feed
    socket.on("join_feed", () => {
      socket.join(`feed`);
      // console.log(`User  joined feed`);
    });
    //socket for my events update
    socket.on("my_events", (userId) => {
      socket.join(`my_events/${userId}`);
      // console.log(`User ${userId} joined my events`);
    });
    //socket for friends request/friends updates
    socket.on("my_friends", (userId) => {
      socket.join(`my_friends/${userId}`);
      //   console.log(`User ${userId} joined my friends`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  return io; // Return the io instance to use elsewhere if needed
}

module.exports = initializeSocketIO;
