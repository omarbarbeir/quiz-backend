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

// Create Express app
const app = express();

// Critical Koyeb fixes
app.set('trust proxy', true);  // Trust Koyeb's reverse proxy

// 1. HEALTH CHECK HANDLER (FIRST MIDDLEWARE)
app.get('/health', (req, res) => {
  console.log('✅ Express Health Check');
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send('OK');
});

// Enhanced Koyeb detection
app.use((req, res, next) => {
  if (req.headers['x-koyeb-healthcheck']) {
    console.log('🛡️ KOYEB HEALTH CHECK INTERCEPTED');
    return res.set('Content-Type', 'text/plain').status(200).send('OK');
  }
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Add CORS middleware
app.use(cors());

// Root endpoint
app.get('/', (req, res) => {
  res.send('Quiz Backend is Running');
});

// Create HTTP server
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://omarbarbeir.github.io"],
    methods: ["GET", "POST"]
  }
});

// Prevent Socket.IO from handling health checks
io.engine.on("request", (req, res) => {
  if (req.url === '/health' || req.headers['x-koyeb-healthcheck']) {
    console.log('⚡ SOCKET.IO HEALTH CHECK BYPASS');
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("OK");
  }
});

// Your game logic remains unchanged
const rooms = {};

io.on('connection', (socket) => {
  console.log('New client connected');
  
  // [ALL YOUR EXISTING SOCKET.IO HANDLERS HERE]
  // Keep all your room, buzz, score, and audio logic
  // Example:
  socket.on('joinRoom', (roomCode, username) => {
    if (!rooms[roomCode]) {
      rooms[roomCode] = { players: [] };
    }
    rooms[roomCode].players.push({ id: socket.id, username });
    socket.join(roomCode);
    io.to(roomCode).emit('playerJoined', username);
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