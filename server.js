// server.js
// 1. Configure environment first
process.env.PORT = process.env.PORT || 3001;
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// 2. Memory optimization
const v8 = require('v8');
v8.setFlagsFromString('--max-old-space-size=256');

// 3. Error handling
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

// Server state
let serverReady = false;
const app = express();

// 4. Koyeb-specific middleware
app.set('trust proxy', true);
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'text/plain');
  res.removeHeader('X-Powered-By');
  next();
});

// 5. Health checks
app.get('/health', (req, res) => {
  if (!serverReady) return res.status(503).send('STARTING');
  res.status(200).send('OK');
});

app.use((req, res, next) => {
  if (req.headers['x-koyeb-healthcheck']) {
    return res.status(serverReady ? 200 : 503).send('KOYEB_HEALTH');
  }
  next();
});

// 6. Core middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 7. Main endpoint
app.get('/', (req, res) => {
  res.send('BACKEND_OPERATIONAL');
});

// 8. Server setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://omarbarbeir.github.io"],
    methods: ["GET", "POST"]
  }
});

// 9. Socket.IO health bypass
io.engine.on("request", (req, res) => {
  if (req.url === '/health' || req.headers['x-koyeb-healthcheck']) {
    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = serverReady ? 200 : 503;
    return res.end('SOCKETIO_HEALTH');
  }
});

// 10. Game logic
const rooms = {};
io.on('connection', (socket) => {
  socket.on('joinRoom', (roomCode, username) => {
    if (!rooms[roomCode]) rooms[roomCode] = { players: [] };
    rooms[roomCode].players.push({ id: socket.id, username });
    socket.join(roomCode);
    io.to(roomCode).emit('playerJoined', username);
  });
});

// 11. Start server
const PORT = process.env.PORT;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🩺 Health: http://0.0.0.0:${PORT}/health`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  
  // Mark ready after 2s buffer
  setTimeout(() => {
    serverReady = true;
    console.log('🚀 Server ready for connections');
  }, 2000);
});