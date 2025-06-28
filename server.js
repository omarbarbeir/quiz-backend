const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');

// ===========================================================================
// 1. HEALTH CHECK SERVER (Port 3002) - FOR KOYEB
// ===========================================================================
const healthServer = http.createServer((req, res) => {
  console.log(`[Health] ${req.method} ${req.url}`);
  
  if (req.url === '/health' || req.headers['x-koyeb-healthcheck']) {
    console.log('✅ Health check received');
    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = 200;
    return res.end('HEALTHY');
  }
  
  res.statusCode = 404;
  res.end('Not Found');
});

healthServer.listen(3002, '0.0.0.0', () => {
  console.log(`🩺 Health server running on port 3002`);
});

// ===========================================================================
// 2. MAIN APPLICATION SERVER (Port 3001) - FOR YOUR APP
// ===========================================================================
const app = express();
const mainServer = http.createServer(app);

// TEMPORARY HEALTH ENDPOINT (Remove after configuration fix)
app.get('/health', (req, res) => {
  console.log('⚠️ Temporary health check on main server');
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send('TEMPORARY_HEALTHY');
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('✅ Handling root request');
  res.send('BACKEND_OPERATIONAL');
});

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "https://omarbarbeir.github.io",
  "https://minimal-alison-omarelbarbeir-0fc063fa.koyeb.app"
];

app.use(cors({ origin: allowedOrigins }));

// Socket.IO setup
const io = new Server(mainServer, {
  cors: { origin: allowedOrigins }
});

// Game logic
const rooms = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Your game event handlers
  socket.on('joinRoom', (roomCode, username) => {
    console.log(`Player ${username} joining room ${roomCode}`);
    // Your implementation
  });
});

// Start main server
mainServer.listen(3001, '0.0.0.0', () => {
  console.log(`✅ Main server running on port 3001`);
});

// Error handling
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ UNHANDLED REJECTION:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('🚨 UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});