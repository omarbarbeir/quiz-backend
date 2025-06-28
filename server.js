// server.js - COMPLETE SOLUTION
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');

// ===========================================================================
// 1. HEALTH CHECK SERVER (Runs on port 3002)
// ===========================================================================
const healthServer = http.createServer((req, res) => {
  // Handle all health checks separately
  if (req.url === '/health' || req.headers['x-koyeb-healthcheck']) {
    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = 200;
    return res.end('HEALTHY');
  }
  
  res.statusCode = 404;
  res.end('Not Found');
});

// Start health server
const HEALTH_PORT = process.env.HEALTH_PORT || 3002;
healthServer.listen(HEALTH_PORT, '0.0.0.0', () => {
  console.log(`🩺 Health server running on port ${HEALTH_PORT}`);
});

// ===========================================================================
// 2. MAIN APPLICATION SERVER (Runs on port 3001)
// ===========================================================================
const app = express();
const mainServer = http.createServer(app);

// Environment configuration
const PORT = process.env.PORT || 3001;
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Minimal middleware
app.use(cors({
  origin: ["http://localhost:3000", "https://omarbarbeir.github.io"]
}));

// Root endpoint
app.get('/', (req, res) => {
  res.send('BACKEND_OPERATIONAL');
});

// Socket.IO setup
const io = new Server(mainServer, {
  cors: {
    origin: ["http://localhost:3000", "https://omarbarbeir.github.io"],
    methods: ["GET", "POST"]
  }
});

// Game Logic - PASTE YOUR EXISTING GAME CODE HERE
const rooms = {};
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('joinRoom', (roomCode, username) => {
    if (!rooms[roomCode]) rooms[roomCode] = { players: [] };
    rooms[roomCode].players.push({ id: socket.id, username });
    socket.join(roomCode);
    io.to(roomCode).emit('playerJoined', username);
  });
  
  // ADD ALL YOUR OTHER GAME EVENT HANDLERS HERE
});

// Start main server
mainServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Main server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// ===========================================================================
// 3. ERROR HANDLING (Global)
// ===========================================================================
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ UNHANDLED REJECTION:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('🚨 UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});
