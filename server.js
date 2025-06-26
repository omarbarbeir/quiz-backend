const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const rooms = {};

io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Create a new room
  socket.on('create_room', () => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      players: [],
      activePlayer: null,
      buzzerLocked: false,
      currentQuestion: null
    };
    socket.emit('room_created', roomCode);
    socket.join(roomCode);
    console.log(`Room created: ${roomCode}`);
  });
  
  // Join an existing room
  socket.on('join_room', ({ roomCode, player }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].players.push(player);
      socket.join(roomCode);
      socket.emit('player_joined', player);
      io.to(roomCode).emit('player_joined', player);
      console.log(`Player ${player.name} joined room ${roomCode}`);
    } else {
      socket.emit('room_not_found');
    }
  });
  
  // Player buzzes in
  socket.on('buzz', ({ roomCode, playerId }) => {
    if (rooms[roomCode] && !rooms[roomCode].buzzerLocked) {
      rooms[roomCode].activePlayer = playerId;
      rooms[roomCode].buzzerLocked = true;
      
      // Pause audio instead of stopping
      io.to(roomCode).emit('pause_audio');
      
      // Notify clients about the buzz
      io.to(roomCode).emit('player_buzzed', playerId);
      
      console.log(`Player ${playerId} buzzed in room ${roomCode}`);
    }
  });
  
  // FIXED: Update player score
  socket.on('update_score', ({ roomCode, playerId, change }) => {
    if (rooms[roomCode]) {
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      if (player) {
        // Apply the score change
        player.score = (player.score || 0) + change;
        io.to(roomCode).emit('update_score', player);
        console.log(`Updated score for player ${playerId} in room ${roomCode} to ${player.score}`);
      }
    }
  });
  
  // Reset buzzer
  socket.on('reset_buzzer', (roomCode) => {
    if (rooms[roomCode]) {
      rooms[roomCode].activePlayer = null;
      rooms[roomCode].buzzerLocked = false;
      io.to(roomCode).emit('reset_buzzer');
      console.log(`Buzzer reset in room ${roomCode}`);
    }
  });
  
  // Change question
  socket.on('change_question', ({ roomCode, question }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].currentQuestion = question;
      rooms[roomCode].activePlayer = null;
      rooms[roomCode].buzzerLocked = false;
      io.to(roomCode).emit('question_changed', question);
      console.log(`Question changed in room ${roomCode}`);
    }
  });
  
  // End game
  socket.on('end_game', (roomCode) => {
    if (rooms[roomCode]) {
      io.to(roomCode).emit('game_ended');
      console.log(`Game ended in room ${roomCode}`);
    }
  });
  
  // Audio controls
  socket.on('play_audio', (roomCode) => {
    io.to(roomCode).emit('play_audio');
  });
  
  socket.on('continue_audio', (roomCode, time) => {
    io.to(roomCode).emit('continue_audio', time);
  });
  
  socket.on('pause_audio', (roomCode) => {
    io.to(roomCode).emit('pause_audio');
  });
  
  socket.on('stop_audio', (roomCode) => {
    io.to(roomCode).emit('stop_audio');
  });
  
  // Player leaves room
  socket.on('leave_room', ({ roomCode, playerId }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== playerId);
      socket.leave(roomCode);
      io.to(roomCode).emit('player_left', playerId);
      console.log(`Player ${playerId} left room ${roomCode}`);
      
      // If last player leaves, close room
      if (rooms[roomCode].players.length === 0) {
        delete rooms[roomCode];
        console.log(`Room ${roomCode} closed`);
      }
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});