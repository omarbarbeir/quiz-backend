// server.js - BULLETPROOF KOYEB SOLUTION
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// 1. Environment configuration
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// 2. Create app and server
const app = express();
const server = http.createServer(app);

// 3. CRITICAL KOYEB FIXES - FIRST MIDDLEWARE
app.use((req, res, next) => {
  // Force all responses to plain text
  res.setHeader('Content-Type', 'text/plain');
  
  // Override Express methods to prevent HTML formatting
  res.send = (body) => res.end(body);
  res.json = (obj) => res.end(JSON.stringify(obj));
  
  // Handle Koyeb health checks immediately
  if (req.headers['x-koyeb-healthcheck'] || req.path === '/health') {
    console.log('✅ Koyeb health check received');
    return res.status(200).end('HEALTHY');
  }
  next();
});

// 4. Core middleware
app.use(express.json());
app.use(cors());

// 5. Health endpoint (redundant but safe)
app.get('/health', (req, res) => {
  res.status(200).end('OK');
});

// 6. Root endpoint
app.get('/', (req, res) => {
  res.end('BACKEND_OPERATIONAL');
});

// 7. Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://omarbarbeir.github.io"],
    methods: ["GET", "POST"]
  }
});

// 8. Socket.IO health bypass
io.engine.on("request", (req, res) => {
  if (req.url === '/health' || req.headers['x-koyeb-healthcheck']) {
    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = 200;
    return res.end('BYPASS_HEALTHY');
  }
});

// 9. Game logic - ADD YOUR CUSTOM CODE HERE
const rooms = {};
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('joinRoom', (roomCode, username) => {
    if (!rooms[roomCode]) rooms[roomCode] = { players: [] };
    rooms[roomCode].players.push({ id: socket.id, username });
    socket.join(roomCode);
    io.to(roomCode).emit('playerJoined', username);
  });
  
  // Add your other event handlers:
  // - buzz
  // - startGame
  // - nextQuestion
  // - scoreUpdate
  // - disconnect
  // - adds
});

// 10. Start server with error handling
server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`🩺 Health check: http://${HOST}:${PORT}/health`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  
  // Koyeb deployment verification
  console.log('Koyeb deployment ready');
}).on('error', (err) => {
  console.error('🔥 Server error:', err);
  process.exit(1);
});

// 11. Error handling
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ UNHANDLED REJECTION:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('🚨 UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

// 12. Koyeb startup signal
setTimeout(() => {
  console.log('❤️ Koyeb initialization complete');
}, 3000);