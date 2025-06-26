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

// Create app
const app = express();

// CRITICAL KOYEB FIX
app.use((req, res, next) => {
  // Fix for Koyeb's load balancer
  req.headers.host = req.headers['x-forwarded-host'] || req.headers.host;
  next();
});

// Health endpoint (MUST BE PLAIN TEXT)
app.get('/health', (req, res) => {
  res.status(200).type('text').send('OK');
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Quiz Backend is Running');
});

// Create server
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
});