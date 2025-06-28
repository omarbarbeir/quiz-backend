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

// Critical Koyeb fixes
app.set('trust proxy', true);  // Trust Koyeb's reverse proxy

// 1. HEALTH CHECK - MUST BE FIRST MIDDLEWARE
app.get('/health', (req, res) => {
  // Explicitly set plain text content type
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send('OK');
});

// 2. Handle Koyeb health checks with special header
app.use((req, res, next) => {
  // Intercept Koyeb health checks
  if (req.headers['x-koyeb-healthcheck'] === 'true') {
    return res.set('Content-Type', 'text/plain').status(200).send('OK');
  }
  next();
});

// 3. Request logging (now safe to add after health checks)
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

// Socket.IO setup with health check bypass
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://omarbarbeir.github.io"],
    methods: ["GET", "POST"]
  },
  // Prevent Socket.IO from handling HTTP requests
  connectTimeout: 10000,
  maxHttpBufferSize: 1e6
});

// Middleware to bypass health checks in Socket.IO
io.engine.on("initial_headers", (headers, req) => {
  if (req.url === '/health') {
    headers["Content-Type"] = "text/plain";
  }
});

io.engine.on("request", (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
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
  
  // Debug output for Koyeb
  console.log('Koyeb ENV:', JSON.stringify({
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    KOYEB_DEPLOYMENT: process.env.KOYEB_DEPLOYMENT
  }, null, 2));
});