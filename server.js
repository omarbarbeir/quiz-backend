// server.js
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');

// ===========================================================================
// 1. HEALTH CHECK SERVER (Port 3002)
// ===========================================================================
const healthServer = http.createServer((req, res) => {
  // Handle all health checks
  if (req.url === '/health' || req.headers['x-koyeb-healthcheck']) {
    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = 200;
    return res.end('HEALTHY');
  }
  
  // Not found for other routes
  res.statusCode = 404;
  res.end('Not Found');
});

// Start health server
const HEALTH_PORT = 3002;
healthServer.listen(HEALTH_PORT, '0.0.0.0', () => {
  console.log(`🩺 Health server running on port ${HEALTH_PORT}`);
});

// ===========================================================================
// 2. MAIN APPLICATION SERVER (Port 3001)
// ===========================================================================
const app = express();
const mainServer = http.createServer(app);

// CORS configuration - ADD YOUR FRONTEND DOMAINS HERE
const allowedOrigins = [
  "http://localhost:3000",
  "https://omarbarbeir.github.io",
  "https://minimal-alison-omarelbarbeir-0fc063fa.koyeb.app" // Your Koyeb service
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Root endpoint
app.get('/', (req, res) => {
  res.send('BACKEND_OPERATIONAL');
});

// Socket.IO setup
const io = new Server(mainServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ===========================================================================
// 3. GAME LOGIC - ADD YOUR EXISTING GAME CODE HERE
// ===========================================================================
const rooms = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('joinRoom', (roomCode, username) => {
    if (!rooms[roomCode]) {
      rooms[roomCode] = { players: [], state: 'waiting' };
    }
    
    rooms[roomCode].players.push({
      id: socket.id,
      username,
      score: 0
    });
    
    socket.join(roomCode);
    io.to(roomCode).emit('playerJoined', username, rooms[roomCode].players);
  });

  socket.on('buzz', (roomCode, username) => {
    if (rooms[roomCode] && rooms[roomCode].state === 'question') {
      rooms[roomCode].state = 'buzzed';
      io.to(roomCode).emit('buzz', username);
    }
  });

  socket.on('startGame', (roomCode) => {
    if (rooms[roomCode]) {
      rooms[roomCode].state = 'question';
      io.to(roomCode).emit('gameStarted');
    }
  });

  socket.on('nextQuestion', (roomCode) => {
    if (rooms[roomCode]) {
      rooms[roomCode].state = 'question';
      io.to(roomCode).emit('nextQuestion');
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Add logic to remove player from rooms
  });
});

// Start main server
const PORT = 3001;
mainServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Main server running on port ${PORT}`);
});

// ===========================================================================
// 4. ERROR HANDLING
// ===========================================================================
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ UNHANDLED REJECTION:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('🚨 UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});