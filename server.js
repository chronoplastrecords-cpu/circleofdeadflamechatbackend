// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('public')); // serve your frontend files

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let users = [];

io.on('connection', socket => {
  console.log('User connected', socket.id);

  socket.on('new-user', data => {
    const name = data.name || 'Anonymous';
    users.push({ id: socket.id, name });
    socket.emit('auth-success');
    io.emit('update-user-list', users.map(u => u.name));
    socket.broadcast.emit('user-connected', name);
  });

  socket.on('send-chat-message', msg => {
    const user = users.find(u => u.id === socket.id);
    if (user) io.emit('chat-message', { name: user.name, message: msg });
  });

  socket.on('typing', () => {
    const user = users.find(u => u.id === socket.id);
    if (user) socket.broadcast.emit('user-typing', user.name);
  });

  socket.on('stop-typing', () => socket.broadcast.emit('user-stop-typing'));

  socket.on('disconnect', () => {
    const index = users.findIndex(u => u.id === socket.id);
    if (index !== -1) {
      const [user] = users.splice(index, 1);
      io.emit('update-user-list', users.map(u => u.name));
      socket.broadcast.emit('user-disconnected', user.name);
    }
  });
});

server.listen(process.env.PORT || 3000, () => console.log('Server running'));
