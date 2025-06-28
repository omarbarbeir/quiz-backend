const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');

// 1. Health Server
const healthServer = http.createServer((req, res) => {
  console.log(`[Health] ${req.method} ${req.url}`);
  
  if (req.url === '/health' || req.headers['x-koyeb-healthcheck']) {
    console.log('Health check request received');
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

// 2. Main Server
const app = express();
const mainServer = http.createServer(app);

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[Main] ${req.method} ${req.url}`);
  next();
});

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "https://omarbarbeir.github.io",
  "https://minimal-alison-omarelbarbeir-0fc063fa.koyeb.app"
];

app.use(cors({ origin: allowedOrigins }));

// Root endpoint
app.get('/', (req, res) => {
  console.log('Handling root request');
  res.send('BACKEND_OPERATIONAL');
});

// Socket.IO setup
const io = new Server(mainServer, {
  cors: { origin: allowedOrigins }
});

// Game logic (your existing code)
// ...

// Start main server with error handling
mainServer.listen(3001, '0.0.0.0', () => {
  console.log(`✅ Main server running on port 3001`);
}).on('error', (err) => {
  console.error('❌ Server error:', err);
});

// Error handling
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ UNHANDLED REJECTION:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('🚨 UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});