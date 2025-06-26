// 1. Error handling
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ UNHANDLED REJECTION:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('🚨 UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Express setup
const app = express();

// CRITICAL: Koyeb Load Balancer Fix - MUST BE FIRST MIDDLEWARE
app.use((req, res, next) => {
  // Override host and protocol for Koyeb
  req.headers.host = req.headers['x-forwarded-host'] || req.headers.host;
  req.headers['x-forwarded-proto'] = req.headers['x-forwarded-proto'] || 'http';
  next();
});

app.use(cors());

// Health endpoint - PLAIN TEXT response
app.get('/health', (req, res) => {
  res.status(200).set('Content-Type', 'text/plain').send('OK');
});

// Create server
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://omarbarbeir.github.io"],
    methods: ["GET", "POST"]
  }
});

// Your game logic
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
      
      // Pause audio
      io.to(roomCode).emit('pause_audio');
      
      // Notify clients
      io.to(roomCode).emit('player_buzzed', playerId);
      
      console.log(`Player ${playerId} buzzed in room ${roomCode}`);
    }
  });
  
  // Update player score
  socket.on('update_score', ({ roomCode, playerId, change }) => {
    if (rooms[roomCode]) {
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      if (player) {
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
      
      // Close room if last player leaves
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

// Server startup
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`🩺 Health check: http://0.0.0.0:${PORT}/health`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
});