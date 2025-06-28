const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// 1. Environment Configuration
const PORT = process.env.PORT || 3001;
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// 2. Critical Middleware - FIRST
app.use((req, res, next) => {
  // Handle Koyeb health checks immediately
  if (req.path === '/health' || req.headers['x-koyeb-healthcheck']) {
    console.log('✅ Health check received');
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send('HEALTHY');
  }
  next();
});

// 3. Request Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 4. CORS Configuration
const allowedOrigins = [
  "http://localhost:3000",
  "https://omarbarbeir.github.io",
  "https://minimal-alison-omarelbarbeir-0fc063fa.koyeb.app"
];

app.use(cors({ origin: allowedOrigins }));

// 5. Root Endpoint
app.get('/', (req, res) => {
  res.send('BACKEND_OPERATIONAL');
});

// 6. Health Endpoint (redundant but safe)
app.get('/health', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send('HEALTHY');
});

// 7. Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// 8. Socket.IO Health Bypass
io.engine.on("request", (req, res) => {
  if (req.url === '/health' || req.headers['x-koyeb-healthcheck']) {
    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = 200;
    return res.end('HEALTHY');
  }
});

// 9. Game Logic
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

  // Add your other event handlers
});

// 10. Start Server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🩺 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  
  // Signal to Koyeb that app is ready
  console.log('🚀 Application ready');
});

// 11. Error Handling
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ UNHANDLED REJECTION:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('🚨 UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

// 12. Koyeb Deployment Signal
setTimeout(() => {
  console.log('❤️ Sending Koyeb ready signal');
}, 5000);