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

// Create app
const app = express();

// Critical Koyeb fix - must be first
app.use((req, res, next) => {
  // Capture original URL for debugging
  console.log(`Incoming: ${req.method} ${req.url}`);
  next();
});

// Health endpoint - MUST BE BEFORE CORS
app.get('/health', (req, res) => {
  console.log('Health check executed');
  res.status(200).set('Content-Type', 'text/plain').send('OK');
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

// Your game logic remains unchanged
const rooms = {};

io.on('connection', (socket) => {
  console.log('New client connected');
  
  // [ALL YOUR EXISTING SOCKET.IO HANDLERS HERE]
  // Keep all your room, buzz, score, and audio logic
  // ...
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