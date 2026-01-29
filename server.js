const io = require("socket.io")(process.env.PORT || 3000, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const users = {};
// Ensure this matches the Environment Variable name you set in Render
const CHAT_PASSWORD = process.env.MY_CHAT_PASS || "admin123";

console.log("Server is starting up...");

// Helper to broadcast the current list to everyone
function broadcastUserList() {
  const names = Object.values(users);
  io.emit('update-user-list', names);
}

io.on("connection", (socket) => {
  
  socket.on("new-user", (data) => {
    if (data.password === CHAT_PASSWORD) {
      users[socket.id] = data.name;
      socket.emit("auth-success");
      socket.broadcast.emit("user-connected", data.name);
      
      // Send the updated list of names
      broadcastUserList();
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
    if (users[socket.id]) {
      const name = users[socket.id];
      socket.broadcast.emit("user-disconnected", name);
      delete users[socket.id];
      
      // Update the list for everyone else
      broadcastUserList();
    }
  });
});
