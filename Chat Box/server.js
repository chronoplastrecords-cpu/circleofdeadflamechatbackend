const io = require("socket.io")(3000, {
  cors: {
    origin: "*", // This allows your index.html to talk to the server
    methods: ["GET", "POST"]
  }
});

const users = {};

console.log("Chat server is running on port 3000...");

io.on("connection", (socket) => {
  // Triggered when a new person joins
  socket.on("new-user", (name) => {
    users[socket.id] = name;
    socket.broadcast.emit("user-connected", name); 
    console.log(`${name} joined the chat`);
    socket.on("typing", () => {
  socket.broadcast.emit("user-typing", users[socket.id]);
});

socket.on("stop-typing", () => {
  socket.broadcast.emit("user-stop-typing");
});
  });

  // Triggered when someone sends a message
  socket.on("send-chat-message", (message) => {
    socket.broadcast.emit("chat-message", {
      message: message,
      name: users[socket.id]
    });
  });

  // Triggered when someone closes the tab
  socket.on("disconnect", () => {
    socket.broadcast.emit("user-disconnected", users[socket.id]);
    delete users[socket.id];
  });
});