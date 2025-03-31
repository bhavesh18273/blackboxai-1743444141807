const express = require('express');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;
const httpServer = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static('public'));

// Socket.IO logic
io.on('connection', (socket) => {
  socket.on('joinRoom', (data) => {
    socket.username = data.username;
    socket.room = data.room;
    socket.join(data.room);
    io.to(data.room).emit('notification', {
      type: 'join',
      username: data.username,
      message: `${data.username} has joined the room`
    });
  });

  socket.on('sendMessage', (data) => {
    const messageData = {
      username: data.username,
      timestamp: new Date().toLocaleTimeString(),
      type: data.type || 'text'
    };

    if (data.type === 'audio') {
      messageData.audio = data.audio;
      messageData.message = "Voice message";
    } else {
      messageData.message = data.message;
    }

    console.log('Broadcasting message:', messageData);
    io.to(data.room).emit('receiveMessage', messageData);
  });

  socket.on('disconnect', () => {
    if (socket.room) {
      io.to(socket.room).emit('notification', {
        type: 'leave',
        username: socket.username,
        message: `${socket.username} has left the room`
      });
    }
  });
});

// Route for the chat page
app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});