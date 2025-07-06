const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.set('trust proxy', true);
app.use((req, res, next) => {
  if (req.headers['x-koyeb-healthcheck'] || req.path === '/health') {
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).end('HEALTHY');
  }
  next();
});

app.get('/health', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).end('OK');
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Quiz Backend Operational');
});

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000", 
      "https://omarbarbeir.github.io",
      "https://ancient-prawn-omarelbarbeir-9282bb8f.koyeb.app"
    ],
    methods: ["GET", "POST"]
  }
});

io.engine.on("request", (req, res) => {
  if (req.url === '/health' || req.headers['x-koyeb-healthcheck']) {
    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = 200;
    return res.end('SOCKETIO_HEALTHY');
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
      
      // Store roomCode and playerId for disconnect handling
      socket.data = {
        roomCode,
        playerId: player.id
      };
    } else {
      socket.emit('room_not_found');
    }
  });
  
  // Player buzzes in
  socket.on('buzz', ({ roomCode, playerId }) => {
    if (rooms[roomCode] && !rooms[roomCode].buzzerLocked) {
      rooms[roomCode].activePlayer = playerId;
      rooms[roomCode].buzzerLocked = true;
      io.to(roomCode).emit('pause_audio');
      io.to(roomCode).emit('pause_audio2');
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
  
  // Normal audio controls
  socket.on('play_audio2', (roomCode) => {
    io.to(roomCode).emit('play_audio2');
  });
  
  socket.on('continue_audio2', (roomCode, time) => {
    io.to(roomCode).emit('continue_audio2', time);
  });
  
  socket.on('pause_audio2', (roomCode) => {
    io.to(roomCode).emit('pause_audio2');
  });
  
  socket.on('stop_audio2', (roomCode) => {
    io.to(roomCode).emit('stop_audio2');
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
  
  // Handle disconnects
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    
    const roomCode = socket.data?.roomCode;
    const playerId = socket.data?.playerId;
    
    if (roomCode && rooms[roomCode] && playerId) {
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      if (player) {
        // Notify other players
        io.to(roomCode).emit('player_disconnected', {
          playerId,
          playerName: player.name
        });
        
        // Remove player from room
        rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== playerId);
        
        console.log(`Player ${player.name} disconnected from room ${roomCode}`);
        
        // Close room if empty
        if (rooms[roomCode].players.length === 0) {
          delete rooms[roomCode];
          console.log(`Room ${roomCode} closed`);
        }
      }
    }
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
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🩺 Health check available at: http://0.0.0.0:${PORT}/health`);
  
  if (process.env.KOYEB_SERVICE_NAME) {
    console.log('🚀 Running on Koyeb infrastructure');
  }
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ UNHANDLED REJECTION:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('🚨 UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});