const io = require("socket.io")(process.env.PORT || 3000, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const users = {};

// This looks for a secret variable named 'MY_CHAT_PASS' on Render
// If it can't find it, it defaults to 'admin123'
const CHAT_PASSWORD = process.env.MY_CHAT_PASS || "admin123";

console.log("Chat server is running...");

io.on("connection", (socket) => {
  socket.on("new-user", (data) => {
    if (data.password === CHAT_PASSWORD) {
      users[socket.id] = data.name;
      socket.emit("auth-success"); 
      socket.broadcast.emit("user-connected", data.name);
    } else {
      socket.emit("auth-error", "Incorrect password!");
    }
  });

  socket.on("send-chat-message", (message) => {
    socket.broadcast.emit("chat-message", {
      message: message,
      name: users[socket.id]
    });
  });

  socket.on("typing", () => {
    socket.broadcast.emit("user-typing", users[socket.id]);
  });

  socket.on("stop-typing", () => {
    socket.broadcast.emit("user-stop-typing");
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit("user-disconnected", users[socket.id]);
    delete users[socket.id];
  });
});
