// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); // allow requests from your frontend
app.use(express.static('public')); // serve static frontend files if needed

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' } // allow any origin
});

let users = [];

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // New user joins
    socket.on('new-user', (data) => {
        const name = data.name || 'Anonymous';
        users.push({ id: socket.id, name });
        socket.emit('auth-success');
        io.emit('update-user-list', users.map(u => u.name));
        socket.broadcast.emit('user-connected', name);
    });

    // Chat message
    socket.on('send-chat-message', (message) => {
        const user = users.find(u => u.id === socket.id);
        if (user) {
            io.emit('chat-message', { name: user.name, message });
        }
    });

    // Typing indicators
    socket.on('typing', () => {
        const user = users.find(u => u.id === socket.id);
        if (user) socket.broadcast.emit('user-typing', user.name);
    });

    socket.on('stop-typing', () => {
        socket.broadcast.emit('user-stop-typing');
    });

    // Disconnect
    socket.on('disconnect', () => {
        const index = users.findIndex(u => u.id === socket.id);
        if (index !== -1) {
            const [user] = users.splice(index, 1);
            io.emit('update-user-list', users.map(u => u.name));
            socket.broadcast.emit('user-disconnected', user.name);
        }
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
