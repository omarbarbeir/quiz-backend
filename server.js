// server.js

// Before any other code
process.env.PORT = process.env.PORT || 3001;
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Then add this to your Express app
app.use((req, res, next) => {
  // Force plain text and disable Express formatting
  res.setHeader('Content-Type', 'text/plain');
  res.removeHeader('X-Powered-By');
  next();
});

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

// Create raw HTTP server
const server = http.createServer();

// 1. RAW HEALTH CHECK HANDLER - BEFORE ANYTHING ELSE
server.on('request', (req, res) => {
  if (req.url === '/health' || req.headers['x-koyeb-healthcheck']) {
    console.log('🔥 RAW HEALTH CHECK HANDLED');
    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = 200;
    return res.end('HEALTH_CHECK_OK');
  }
});

// Create Express app
const app = express();

// 2. Force plain text for all responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'text/plain');
  next();
});

// 3. EXPRESS HEALTH CHECK HANDLER (redundant but safe)
app.get('/health', (req, res) => {
  res.status(200).end('HEALTH_CHECK_OK');
});

// 4. KOYEB HEADER DETECTION
app.use((req, res, next) => {
  if (req.headers['x-koyeb-healthcheck']) {
    return res.status(200).end('HEALTH_CHECK_OK');
  }
  next();
});

// 5. Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 6. CORS middleware
app.use(cors());

// 7. Root endpoint
app.get('/', (req, res) => {
  res.send('Quiz Backend is Running');
});

// 8. Attach Express to HTTP server for non-health routes
server.on('request', (req, res) => {
  if (req.url !== '/health' && !req.headers['x-koyeb-healthcheck']) {
    app(req, res);
  }
});

// 9. Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://omarbarbeir.github.io"],
    methods: ["GET", "POST"]
  }
});

// 10. Game Logic
const rooms = {};
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Your game event handlers
  socket.on('joinRoom', (roomCode, username) => {
    if (!rooms[roomCode]) rooms[roomCode] = { players: [] };
    rooms[roomCode].players.push({ id: socket.id, username });
    socket.join(roomCode);
    io.to(roomCode).emit('playerJoined', username);
  });
  
  // Add your other event handlers here
});

// 11. Server startup
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const ENV = process.env.NODE_ENV || 'development';

server.listen(PORT, HOST, () => {
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
  console.log(`🩺 Health check: http://${HOST}:${PORT}/health`);
  console.log('Environment:', ENV);
  
  // Debug output
  console.log('Environment Variables:');
  console.log(`PORT: ${PORT} (${typeof PORT})`);
  console.log(`HOST: ${HOST}`);
  console.log(`NODE_ENV: ${ENV}`);
  console.log(`KOYEB_SERVICE_NAME: ${process.env.KOYEB_SERVICE_NAME || 'Not set'}`);
  console.log(`KOYEB_DEPLOYMENT: ${process.env.KOYEB_DEPLOYMENT || 'Not set'}`);
});

// Koyeb deployment verification
if (process.env.KOYEB_SERVICE_NAME) {
  console.log('🚀 Running on Koyeb infrastructure');
} else {
  console.log('💻 Running in local development mode');
}