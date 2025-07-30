// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const cors = require('cors');
// const randomPhotosData = require('./data_random');

// const app = express();
// const server = http.createServer(app);

// app.set('trust proxy', true);
// app.use((req, res, next) => {
//   if (req.headers['x-koyeb-healthcheck'] || req.path === '/health') {
//     res.setHeader('Content-Type', 'text/plain');
//     return res.status(200).end('HEALTHY');
//   }
//   next();
// });

// app.get('/health', (req, res) => {
//   res.setHeader('Content-Type', 'text/plain');
//   res.status(200).end('OK');
// });

// app.use(cors());
// app.use(express.json());

// app.get('/', (req, res) => {
//   res.send('Quiz Backend Operational');
// });

// const io = new Server(server, {
//   cors: {
//     origin: [
//       "http://localhost:3000", 
//       "https://omarbarbeir.github.io",
//       "https://ancient-prawn-omarelbarbeir-9282bb8f.koyeb.app"
//     ],
//     methods: ["GET", "POST"]
//   }
// });

// io.engine.on("request", (req, res) => {
//   if (req.url === '/health' || req.headers['x-koyeb-healthcheck']) {
//     res.setHeader('Content-Type', 'text/plain');
//     res.statusCode = 200;
//     return res.end('SOCKETIO_HEALTHY');
//   }
// });

// const rooms = {};

// io.on('connection', (socket) => {
//   console.log('New client connected');
  
//   socket.on('create_room', () => {
//     const roomCode = generateRoomCode();
//     rooms[roomCode] = {
//       players: [],
//       activePlayer: null,
//       buzzerLocked: false,
//       currentQuestion: null
//     };
//     socket.emit('room_created', roomCode);
//     socket.join(roomCode);
//     console.log(`Room created: ${roomCode}`);
//   });
  
//   socket.on('join_room', ({ roomCode, player }) => {
//     if (rooms[roomCode]) {
//       // Store socket ID with player
//       const playerWithSocket = { 
//         ...player, 
//         socketId: socket.id
//       };
//       rooms[roomCode].players.push(playerWithSocket);
//       socket.join(roomCode);
//       socket.emit('player_joined', player);
//       io.to(roomCode).emit('player_joined', player);
//       console.log(`Player ${player.name} joined room ${roomCode}`);
      
//       socket.data = { roomCode, playerId: player.id };
//     } else {
//       socket.emit('room_not_found');
//     }
//   });
  
//   socket.on('buzz', ({ roomCode, playerId }) => {
//     if (rooms[roomCode] && !rooms[roomCode].buzzerLocked) {
//       rooms[roomCode].activePlayer = playerId;
//       rooms[roomCode].buzzerLocked = true;
//       io.to(roomCode).emit('pause_audio');
//       io.to(roomCode).emit('player_buzzed', playerId);
//       console.log(`Player ${playerId} buzzed in room ${roomCode}`);
//     }
//   });
  
//   socket.on('update_score', ({ roomCode, playerId, change }) => {
//     if (rooms[roomCode]) {
//       const player = rooms[roomCode].players.find(p => p.id === playerId);
//       if (player) {
//         player.score = (player.score || 0) + change;
//         io.to(roomCode).emit('update_score', player);
//         console.log(`Updated score for player ${playerId} in room ${roomCode} to ${player.score}`);
        
//         if (rooms[roomCode].activePlayer === playerId) {
//           rooms[roomCode].activePlayer = null;
//           rooms[roomCode].buzzerLocked = false;
//           io.to(roomCode).emit('reset_buzzer');
//         }
//       }
//     }
//   });
  
//   socket.on('reset_buzzer', (roomCode) => {
//     if (rooms[roomCode]) {
//       rooms[roomCode].activePlayer = null;
//       rooms[roomCode].buzzerLocked = false;
//       io.to(roomCode).emit('reset_buzzer');
//       console.log(`Buzzer reset in room ${roomCode}`);
//     }
//   });
  
//   socket.on('change_question', ({ roomCode, question }) => {
//     if (rooms[roomCode]) {
//       rooms[roomCode].currentQuestion = question;
//       rooms[roomCode].activePlayer = null;
//       rooms[roomCode].buzzerLocked = false;
//       io.to(roomCode).emit('question_changed', question);
//       console.log(`Question changed in room ${roomCode}`);
//     }
//   });
  
//   socket.on('end_game', (roomCode) => {
//     if (rooms[roomCode]) {
//       io.to(roomCode).emit('game_ended');
//       console.log(`Game ended in room ${roomCode}`);
//     }
//   });
  
//   socket.on('play_audio', (roomCode) => {
//     io.to(roomCode).emit('play_audio');
//   });
  
//   socket.on('continue_audio', (roomCode, time) => {
//     io.to(roomCode).emit('continue_audio', time);
//   });
  
//   socket.on('pause_audio', (roomCode) => {
//     io.to(roomCode).emit('pause_audio');
//   });
  
//   socket.on('stop_audio', (roomCode) => {
//     io.to(roomCode).emit('stop_audio');
//   });
  
//   socket.on('play_audio2', (roomCode) => {
//     io.to(roomCode).emit('play_audio2');
//   });
  
//   socket.on('continue_audio2', (roomCode, time) => {
//     io.to(roomCode).emit('continue_audio2', time);
//   });
  
//   socket.on('pause_audio2', (roomCode) => {
//     io.to(roomCode).emit('pause_audio2');
//   });
  
//   socket.on('stop_audio2', (roomCode) => {
//     io.to(roomCode).emit('stop_audio2');
//   });
  
//   // Handle random photo requests
//   socket.on('play_random_question', ({ roomCode, subcategoryId }) => {
//     if (rooms[roomCode]) {
//       const room = rooms[roomCode];
      
//       // Reset buzzer state
//       room.activePlayer = null;
//       room.buzzerLocked = false;
//       io.to(roomCode).emit('reset_buzzer');
      
//       // SAFETY CHECK: Verify the category exists
//       if (!randomPhotosData['random-photos']) {
//         console.error('Random photos category not found in data');
//         return;
//       }
      
//       // SAFETY CHECK: Verify the subcategory exists
//       if (!randomPhotosData['random-photos'][subcategoryId]) {
//         console.error(`Subcategory ${subcategoryId} not found in random-photos category`);
//         console.log('Available subcategories:', Object.keys(randomPhotosData['random-photos']));
//         return;
//       }

//       // Get the subcategory questions
//       const subcatQuestions = randomPhotosData['random-photos'][subcategoryId];
      
//       // ADD THIS SAFETY CHECK
//       if (!subcatQuestions || subcatQuestions.length === 0) {
//         console.error(`No questions found for subcategory: ${subcategoryId}`);
//         return;
//       }

//       // Create a copy of the indices to track available questions
//       const availableIndices = [...Array(subcatQuestions.length).keys()];
      
//       // Log player count and socket IDs
//       console.log(`Distributing photos to ${room.players.length} players in room ${roomCode}`);
      
//       // Create player list string
//       const playerList = room.players.map(p => `${p.name} (${p.socketId})`).join(', ');
//       console.log(`Players: ${playerList}`);
      
//       // Send a unique random photo to each player
//       room.players.forEach(player => {
//         if (availableIndices.length === 0) {
//           console.error('Not enough questions for all players');
//           return;
//         }
        
//         const randomIndex = Math.floor(Math.random() * availableIndices.length);
//         const questionIndex = availableIndices.splice(randomIndex, 1)[0];
//         const randomQuestion = {
//           ...subcatQuestions[questionIndex],
//           category: 'random-photos',
//           subcategory: subcategoryId,
//           playerId: player.id
//         };
        
//         console.log(`Sending photo to ${player.name} (${player.socketId}): ${randomQuestion.image}`);
        
//         // Send to this specific player
//         io.to(player.socketId).emit('player_photo_question', randomQuestion);
//       });
      
//       console.log(`Sent random photos to players in room ${roomCode}`);
//     }
//   });
  
//   socket.on('leave_room', ({ roomCode, playerId }) => {
//     if (rooms[roomCode]) {
//       rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== playerId);
//       socket.leave(roomCode);
//       io.to(roomCode).emit('player_left', playerId);
//       console.log(`Player ${playerId} left room ${roomCode}`);
      
//       if (rooms[roomCode].players.length === 0) {
//         delete rooms[roomCode];
//         console.log(`Room ${roomCode} closed`);
//       }
//     }
//   });
  
//   // Handle disconnects
//   socket.on('disconnect', () => {
//     console.log('Client disconnected');
    
//     const roomCode = socket.data?.roomCode;
//     const playerId = socket.data?.playerId;
    
//     if (roomCode && rooms[roomCode] && playerId) {
//       const player = rooms[roomCode].players.find(p => p.id === playerId);
      
//       if (player) {
//         io.to(roomCode).emit('player_disconnected', {
//           playerId,
//           playerName: player.name
//         });
        
//         rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== playerId);
        
//         console.log(`Player ${player.name} disconnected from room ${roomCode}`);
        
//         if (rooms[roomCode].players.length === 0) {
//           delete rooms[roomCode];
//           console.log(`Room ${roomCode} closed`);
//         }
//       }
//     }
//   });
// });

// // Generate 4-digit alphanumeric room code
// function generateRoomCode() {
//   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//   let code = '';
//   for (let i = 0; i < 4; i++) {
//     code += chars.charAt(Math.floor(Math.random() * chars.length));
//   }
//   return code;
// }

// const PORT = process.env.PORT || 3001;
// server.listen(PORT, '0.0.0.0', () => {
//   console.log(`✅ Server running on port ${PORT}`);
//   console.log(`🩺 Health check available at: http://0.0.0.0:${PORT}/health`);
  
//   if (process.env.KOYEB_SERVICE_NAME) {
//     console.log('🚀 Running on Koyeb infrastructure');
//   }
// }).on('error', (err) => {
//   console.error('Failed to start server:', err);
// });

// process.on('unhandledRejection', (reason) => {
//   console.error('⚠️ UNHANDLED REJECTION:', reason);
// });

// process.on('uncaughtException', (err) => {
//   console.error('🚨 UNCAUGHT EXCEPTION:', err);
//   process.exit(1);
// });


























// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const cors = require('cors');
// const randomPhotosData = require('./data_random');

// const app = express();
// const server = http.createServer(app);

// // Constants
// const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes idle timeout

// app.set('trust proxy', true);
// app.use((req, res, next) => {
//   if (req.headers['x-koyeb-healthcheck'] || req.path === '/health') {
//     res.setHeader('Content-Type', 'text/plain');
//     return res.status(200).end('HEALTHY');
//   }
//   next();
// });

// app.get('/health', (req, res) => {
//   res.setHeader('Content-Type', 'text/plain');
//   res.status(200).end('OK');
// });

// app.use(cors());
// app.use(express.json());

// app.get('/', (req, res) => {
//   res.send('Quiz Backend Operational');
// });

// const io = new Server(server, {
//   cors: {
//     origin: [
//       "http://localhost:3000", 
//       "https://omarbarbeir.github.io",
//       "https://ancient-prawn-omarelbarbeir-9282bb8f.koyeb.app"
//     ],
//     methods: ["GET", "POST"]
//   }
// });

// io.engine.on("request", (req, res) => {
//   if (req.url === '/health' || req.headers['x-koyeb-healthcheck']) {
//     res.setHeader('Content-Type', 'text/plain');
//     res.statusCode = 200;
//     return res.end('SOCKETIO_HEALTHY');
//   }
// });

// const rooms = {};

// io.on('connection', (socket) => {
//   console.log('New client connected');
  
//   socket.on('create_room', () => {
//     const roomCode = generateRoomCode();
//     rooms[roomCode] = {
//       players: [],
//       activePlayer: null,
//       buzzerLocked: false,
//       currentQuestion: null
//     };
//     socket.emit('room_created', roomCode);
//     socket.join(roomCode);
//     console.log(`Room created: ${roomCode}`);
//   });
  
//   socket.on('join_room', ({ roomCode, player }) => {
//     if (rooms[roomCode]) {
//       // Store socket ID with player and last activity time
//       const playerWithSocket = { 
//         ...player, 
//         socketId: socket.id,
//         lastActivity: Date.now()  // Initialize activity tracker
//       };
//       rooms[roomCode].players.push(playerWithSocket);
//       socket.join(roomCode);
//       socket.emit('player_joined', player);
//       io.to(roomCode).emit('player_joined', player);
//       console.log(`Player ${player.name} joined room ${roomCode}`);
      
//       socket.data = { roomCode, playerId: player.id };
//     } else {
//       socket.emit('room_not_found');
//     }
//   });
  
//   // New event to track player activity
//   socket.on('player_activity', ({ roomCode, playerId }) => {
//     if (rooms[roomCode]) {
//       const player = rooms[roomCode].players.find(p => p.id === playerId);
//       if (player) {
//         player.lastActivity = Date.now();
//       }
//     }
//   });
  
//   socket.on('buzz', ({ roomCode, playerId }) => {
//     if (rooms[roomCode] && !rooms[roomCode].buzzerLocked) {
//       rooms[roomCode].activePlayer = playerId;
//       rooms[roomCode].buzzerLocked = true;
      
//       // Update player activity
//       const player = rooms[roomCode].players.find(p => p.id === playerId);
//       if (player) player.lastActivity = Date.now();
      
//       io.to(roomCode).emit('pause_audio');
//       io.to(roomCode).emit('player_buzzed', playerId);
//       console.log(`Player ${playerId} buzzed in room ${roomCode}`);
//     }
//   });
  
//   socket.on('update_score', ({ roomCode, playerId, change }) => {
//     if (rooms[roomCode]) {
//       const player = rooms[roomCode].players.find(p => p.id === playerId);
//       if (player) {
//         player.score = (player.score || 0) + change;
//         player.lastActivity = Date.now();  // Update activity
        
//         io.to(roomCode).emit('update_score', player);
//         console.log(`Updated score for player ${playerId} in room ${roomCode} to ${player.score}`);
        
//         if (rooms[roomCode].activePlayer === playerId) {
//           rooms[roomCode].activePlayer = null;
//           rooms[roomCode].buzzerLocked = false;
//           io.to(roomCode).emit('reset_buzzer');
//         }
//       }
//     }
//   });
  
//   socket.on('reset_buzzer', (roomCode) => {
//     if (rooms[roomCode]) {
//       rooms[roomCode].activePlayer = null;
//       rooms[roomCode].buzzerLocked = false;
//       io.to(roomCode).emit('reset_buzzer');
//       console.log(`Buzzer reset in room ${roomCode}`);
//     }
//   });
  
//   socket.on('change_question', ({ roomCode, question }) => {
//     if (rooms[roomCode]) {
//       rooms[roomCode].currentQuestion = question;
//       rooms[roomCode].activePlayer = null;
//       rooms[roomCode].buzzerLocked = false;
//       io.to(roomCode).emit('question_changed', question);
//       console.log(`Question changed in room ${roomCode}`);
//     }
//   });
  
//   socket.on('end_game', (roomCode) => {
//     if (rooms[roomCode]) {
//       io.to(roomCode).emit('game_ended');
//       console.log(`Game ended in room ${roomCode}`);
//     }
//   });
  
//   socket.on('play_audio', (roomCode) => {
//     io.to(roomCode).emit('play_audio');
//   });
  
//   socket.on('continue_audio', (roomCode, time) => {
//     io.to(roomCode).emit('continue_audio', time);
//   });
  
//   socket.on('pause_audio', (roomCode) => {
//     io.to(roomCode).emit('pause_audio');
//   });
  
//   socket.on('stop_audio', (roomCode) => {
//     io.to(roomCode).emit('stop_audio');
//   });
  
//   socket.on('play_audio2', (roomCode) => {
//     io.to(roomCode).emit('play_audio2');
//   });
  
//   socket.on('continue_audio2', (roomCode, time) => {
//     io.to(roomCode).emit('continue_audio2', time);
//   });
  
//   socket.on('pause_audio2', (roomCode) => {
//     io.to(roomCode).emit('pause_audio2');
//   });
  
//   socket.on('stop_audio2', (roomCode) => {
//     io.to(roomCode).emit('stop_audio2');
//   });
  
//   // Handle random photo requests
//   socket.on('play_random_question', ({ roomCode, subcategoryId }) => {
//     if (rooms[roomCode]) {
//       const room = rooms[roomCode];
      
//       // Reset buzzer state
//       room.activePlayer = null;
//       room.buzzerLocked = false;
//       io.to(roomCode).emit('reset_buzzer');
      
//       // Update activity for all players
//       room.players.forEach(player => player.lastActivity = Date.now());
      
//       // SAFETY CHECK: Verify the category exists
//       if (!randomPhotosData['random-photos']) {
//         console.error('Random photos category not found in data');
//         return;
//       }
      
//       // SAFETY CHECK: Verify the subcategory exists
//       if (!randomPhotosData['random-photos'][subcategoryId]) {
//         console.error(`Subcategory ${subcategoryId} not found in random-photos category`);
//         console.log('Available subcategories:', Object.keys(randomPhotosData['random-photos']));
//         return;
//       }

//       // Get the subcategory questions
//       const subcatQuestions = randomPhotosData['random-photos'][subcategoryId];
      
//       // ADD THIS SAFETY CHECK
//       if (!subcatQuestions || subcatQuestions.length === 0) {
//         console.error(`No questions found for subcategory: ${subcategoryId}`);
//         return;
//       }

//       // Create a copy of the indices to track available questions
//       const availableIndices = [...Array(subcatQuestions.length).keys()];
      
//       // Log player count and socket IDs
//       console.log(`Distributing photos to ${room.players.length} players in room ${roomCode}`);
      
//       // Create player list string
//       const playerList = room.players.map(p => `${p.name} (${p.socketId})`).join(', ');
//       console.log(`Players: ${playerList}`);
      
//       // Send a unique random photo to each player
//       room.players.forEach(player => {
//         if (availableIndices.length === 0) {
//           console.error('Not enough questions for all players');
//           return;
//         }
        
//         const randomIndex = Math.floor(Math.random() * availableIndices.length);
//         const questionIndex = availableIndices.splice(randomIndex, 1)[0];
//         const randomQuestion = {
//           ...subcatQuestions[questionIndex],
//           category: 'random-photos',
//           subcategory: subcategoryId,
//           playerId: player.id
//         };
        
//         console.log(`Sending photo to ${player.name} (${player.socketId}): ${randomQuestion.image}`);
        
//         // Send to this specific player
//         io.to(player.socketId).emit('player_photo_question', randomQuestion);
//       });
      
//       console.log(`Sent random photos to players in room ${roomCode}`);
//     }
//   });
  
//   socket.on('leave_room', ({ roomCode, playerId }) => {
//     if (rooms[roomCode]) {
//       rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== playerId);
//       socket.leave(roomCode);
//       io.to(roomCode).emit('player_left', playerId);
//       console.log(`Player ${playerId} left room ${roomCode}`);
      
//       if (rooms[roomCode].players.length === 0) {
//         delete rooms[roomCode];
//         console.log(`Room ${roomCode} closed`);
//       }
//     }
//   });
  
//   // Handle disconnects
//   socket.on('disconnect', () => {
//     console.log('Client disconnected');
    
//     const roomCode = socket.data?.roomCode;
//     const playerId = socket.data?.playerId;
    
//     if (roomCode && rooms[roomCode] && playerId) {
//       const player = rooms[roomCode].players.find(p => p.id === playerId);
      
//       if (player) {
//         io.to(roomCode).emit('player_disconnected', {
//           playerId,
//           playerName: player.name
//         });
        
//         rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== playerId);
        
//         console.log(`Player ${player.name} disconnected from room ${roomCode}`);
        
//         if (rooms[roomCode].players.length === 0) {
//           delete rooms[roomCode];
//           console.log(`Room ${roomCode} closed`);
//         }
//       }
//     }
//   });
// });

// // Generate 4-digit alphanumeric room code
// function generateRoomCode() {
//   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//   let code = '';
//   for (let i = 0; i < 4; i++) {
//     code += chars.charAt(Math.floor(Math.random() * chars.length));
//   }
//   return code;
// }

// // Idle player detection system
// setInterval(() => {
//   const now = Date.now();
//   for (const roomCode in rooms) {
//     const room = rooms[roomCode];
//     const playersToRemove = [];
    
//     room.players.forEach(player => {
//       if (now - player.lastActivity > IDLE_TIMEOUT) {
//         playersToRemove.push(player);
//       }
//     });

//     // Process idle players
//     playersToRemove.forEach(player => {
//       console.log(`Player ${player.name} idle in room ${roomCode}, disconnecting`);
      
//       // Notify room about idle disconnect
//       io.to(roomCode).emit('player_idle_disconnect', player.id);
      
//       // Remove player from room
//       room.players = room.players.filter(p => p.id !== player.id);
      
//       // Reset buzzer if active player
//       if (room.activePlayer === player.id) {
//         room.activePlayer = null;
//         room.buzzerLocked = false;
//         io.to(roomCode).emit('reset_buzzer');
//       }
      
//       // Disconnect socket
//       const playerSocket = io.sockets.sockets.get(player.socketId);
//       if (playerSocket) {
//         playerSocket.disconnect(true);
//       }
//     });

//     // Cleanup empty rooms
//     if (room.players.length === 0) {
//       delete rooms[roomCode];
//       console.log(`Room ${roomCode} closed (no players left)`);
//     }
//   }
// }, 30000); // Check every 30 seconds

// const PORT = process.env.PORT || 3001;
// server.listen(PORT, '0.0.0.0', () => {
//   console.log(`✅ Server running on port ${PORT}`);
//   console.log(`🩺 Health check available at: http://0.0.0.0:${PORT}/health`);
//   console.log(`⏳ Idle timeout set to ${IDLE_TIMEOUT/60000} minutes`);
  
//   if (process.env.KOYEB_SERVICE_NAME) {
//     console.log('🚀 Running on Koyeb infrastructure');
//   }
// }).on('error', (err) => {
//   console.error('Failed to start server:', err);
// });

// process.on('unhandledRejection', (reason) => {
//   console.error('⚠️ UNHANDLED REJECTION:', reason);
// });

// process.on('uncaughtException', (err) => {
//   console.error('🚨 UNCAUGHT EXCEPTION:', err);
//   process.exit(1);
// });


const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const randomPhotosData = require('./data_random');

const app = express();
const server = http.createServer(app);

// Constants
const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes idle timeout

app.set('trust proxy', true);
app.use((req, res, next) => {
  if (req.headers['x-koyeb-healthcheck'] || req.path === '/health') {
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).end('HEALTHY');
  }
  next();
});

app.get('/health', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).end('OK');
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Quiz Backend Operational');
});

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000", 
      "https://omarbarbeir.github.io",
      "https://ancient-prawn-omarelbarbeir-9282bb8f.koyeb.app"
    ],
    methods: ["GET", "POST"]
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  }
});

io.engine.on("request", (req, res) => {
  if (req.url === '/health' || req.headers['x-koyeb-healthcheck']) {
    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = 200;
    return res.end('SOCKETIO_HEALTHY');
  }
});

const rooms = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // FIXED: Add player data when creating room
  socket.on('create_room', (player) => {
    try {
      if (!player || !player.id || !player.name) {
        console.error('Invalid player data for room creation');
        socket.emit('create_room_failed', 'Invalid player data');
        return;
      }
      
      const roomCode = generateRoomCode();
      
      // Create player object with socket info
      const playerWithSocket = {
        id: player.id,
        name: player.name,
        avatar: player.avatar || '',
        socketId: socket.id,
        lastActivity: Date.now(),
        score: 0
      };

      rooms[roomCode] = {
        players: [playerWithSocket],
        activePlayer: null,
        buzzerLocked: false,
        currentQuestion: null,
        createdAt: Date.now(),
        roomCode: roomCode  // Store room code for easy access
      };

      socket.join(roomCode);
      socket.data = { 
        roomCode, 
        playerId: player.id,
        role: 'host'
      };
      
      // Send room created event to creator only
      socket.emit('room_created', roomCode);
      
      // Notify all players in room (currently just host)
      io.to(roomCode).emit('room_state_update', {
        players: rooms[roomCode].players,
        roomCode
      });
      
      console.log(`Room created: ${roomCode} by ${player.name} (${socket.id})`);
    } catch (err) {
      console.error('Error creating room:', err);
      socket.emit('create_room_failed', 'Internal server error');
    }
  });
  
  socket.on('join_room', ({ roomCode, player }) => {
    try {
      if (!roomCode || !player || !player.id || !player.name) {
        console.error('Invalid join room request');
        socket.emit('join_room_failed', 'Invalid request data');
        return;
      }
      
      if (!rooms[roomCode]) {
        console.log(`Room not found: ${roomCode}`);
        socket.emit('room_not_found');
        return;
      }
      
      // Prevent duplicate players
      const existingPlayer = rooms[roomCode].players.find(p => p.id === player.id);
      if (existingPlayer) {
        console.log(`Player ${player.id} already in room ${roomCode}`);
        socket.emit('player_already_joined', player);
        return;
      }
      
      // Create player object
      const playerWithSocket = { 
        id: player.id,
        name: player.name,
        avatar: player.avatar || '',
        socketId: socket.id,
        lastActivity: Date.now(),
        score: 0
      };
      
      rooms[roomCode].players.push(playerWithSocket);
      socket.join(roomCode);
      
      // Set socket data
      socket.data = { 
        roomCode, 
        playerId: player.id,
        role: 'player'
      };
      
      // Notify all players in room
      io.to(roomCode).emit('room_state_update', {
        players: rooms[roomCode].players,
        roomCode
      });
      
      console.log(`Player ${player.name} (${player.id}) joined room ${roomCode} via ${socket.id}`);
    } catch (err) {
      console.error('Error joining room:', err);
      socket.emit('join_room_failed', 'Internal server error');
    }
  });
  
  // New event to track player activity
  socket.on('player_activity', () => {
    try {
      const roomCode = socket.data?.roomCode;
      const playerId = socket.data?.playerId;
      
      if (roomCode && rooms[roomCode] && playerId) {
        const player = rooms[roomCode].players.find(p => p.id === playerId);
        if (player) {
          player.lastActivity = Date.now();
          // console.log(`Activity updated for ${player.name} in ${roomCode}`);
        }
      }
    } catch (err) {
      console.error('Error updating activity:', err);
    }
  });
  
  // Add heartbeat to keep connection alive
  socket.on('heartbeat', () => {
    socket.emit('heartbeat_ack');
  });
  
  socket.on('buzz', ({ playerId }) => {
    try {
      const roomCode = socket.data?.roomCode;
      if (!roomCode || !rooms[roomCode]) return;
      
      if (!rooms[roomCode].buzzerLocked) {
        rooms[roomCode].activePlayer = playerId;
        rooms[roomCode].buzzerLocked = true;
        
        const player = rooms[roomCode].players.find(p => p.id === playerId);
        if (player) player.lastActivity = Date.now();
        
        io.to(roomCode).emit('pause_audio');
        io.to(roomCode).emit('player_buzzed', playerId);
        console.log(`Player ${playerId} buzzed in room ${roomCode}`);
      }
    } catch (err) {
      console.error('Error handling buzz:', err);
    }
  });
  
  socket.on('update_score', ({ playerId, change }) => {
    try {
      const roomCode = socket.data?.roomCode;
      if (!roomCode || !rooms[roomCode]) return;
      
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      if (player) {
        player.score = (player.score || 0) + change;
        player.lastActivity = Date.now();
        
        io.to(roomCode).emit('update_score', player);
        console.log(`Updated score for ${player.name} to ${player.score} in ${roomCode}`);
        
        if (rooms[roomCode].activePlayer === playerId) {
          rooms[roomCode].activePlayer = null;
          rooms[roomCode].buzzerLocked = false;
          io.to(roomCode).emit('reset_buzzer');
        }
      }
    } catch (err) {
      console.error('Error updating score:', err);
    }
  });
  
  socket.on('reset_buzzer', () => {
    try {
      const roomCode = socket.data?.roomCode;
      if (roomCode && rooms[roomCode]) {
        rooms[roomCode].activePlayer = null;
        rooms[roomCode].buzzerLocked = false;
        io.to(roomCode).emit('reset_buzzer');
        console.log(`Buzzer reset in room ${roomCode}`);
      }
    } catch (err) {
      console.error('Error resetting buzzer:', err);
    }
  });
  
  socket.on('change_question', ({ question }) => {
    try {
      const roomCode = socket.data?.roomCode;
      if (roomCode && rooms[roomCode]) {
        rooms[roomCode].currentQuestion = question;
        rooms[roomCode].activePlayer = null;
        rooms[roomCode].buzzerLocked = false;
        io.to(roomCode).emit('question_changed', question);
        console.log(`Question changed in room ${roomCode}`);
      }
    } catch (err) {
      console.error('Error changing question:', err);
    }
  });
  
  socket.on('end_game', () => {
    try {
      const roomCode = socket.data?.roomCode;
      if (roomCode && rooms[roomCode]) {
        io.to(roomCode).emit('game_ended');
        console.log(`Game ended in room ${roomCode}`);
      }
    } catch (err) {
      console.error('Error ending game:', err);
    }
  });
  
  // Audio control handlers
  const audioHandlers = (event, action) => {
    socket.on(event, (time) => {
      try {
        const roomCode = socket.data?.roomCode;
        if (roomCode && rooms[roomCode]) {
          if (time) {
            io.to(roomCode).emit(event, time);
          } else {
            io.to(roomCode).emit(event);
          }
        }
      } catch (err) {
        console.error(`Error handling ${event}:`, err);
      }
    });
  };
  
  // Setup audio handlers
  audioHandlers('play_audio');
  audioHandlers('continue_audio');
  audioHandlers('pause_audio');
  audioHandlers('stop_audio');
  audioHandlers('play_audio2');
  audioHandlers('continue_audio2');
  audioHandlers('pause_audio2');
  audioHandlers('stop_audio2');
  
  // Handle random photo requests
  socket.on('play_random_question', ({ subcategoryId }) => {
    try {
      const roomCode = socket.data?.roomCode;
      if (!roomCode || !rooms[roomCode]) return;
      
      const room = rooms[roomCode];
      
      // Reset buzzer state
      room.activePlayer = null;
      room.buzzerLocked = false;
      io.to(roomCode).emit('reset_buzzer');
      
      // Update activity for all players
      room.players.forEach(player => player.lastActivity = Date.now());
      
      // SAFETY CHECK: Verify the category exists
      if (!randomPhotosData['random-photos']) {
        console.error('Random photos category not found in data');
        return;
      }
      
      // SAFETY CHECK: Verify the subcategory exists
      if (!randomPhotosData['random-photos'][subcategoryId]) {
        console.error(`Subcategory ${subcategoryId} not found in random-photos category`);
        return;
      }

      // Get the subcategory questions
      const subcatQuestions = randomPhotosData['random-photos'][subcategoryId];
      
      if (!subcatQuestions || subcatQuestions.length === 0) {
        console.error(`No questions found for subcategory: ${subcategoryId}`);
        return;
      }

      // Create a copy of the indices to track available questions
      const availableIndices = [...Array(subcatQuestions.length).keys()];
      
      // Send a unique random photo to each player
      room.players.forEach(player => {
        if (availableIndices.length === 0) return;
        
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        const questionIndex = availableIndices.splice(randomIndex, 1)[0];
        const randomQuestion = {
          ...subcatQuestions[questionIndex],
          category: 'random-photos',
          subcategory: subcategoryId,
          playerId: player.id
        };
        
        // Send to this specific player
        io.to(player.socketId).emit('player_photo_question', randomQuestion);
      });
      
      console.log(`Sent random photos to players in room ${roomCode}`);
    } catch (err) {
      console.error('Error handling random question:', err);
    }
  });
  
  socket.on('leave_room', () => {
    try {
      const roomCode = socket.data?.roomCode;
      const playerId = socket.data?.playerId;
      
      if (roomCode && rooms[roomCode] && playerId) {
        const player = rooms[roomCode].players.find(p => p.id === playerId);
        rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== playerId);
        
        socket.leave(roomCode);
        io.to(roomCode).emit('player_left', playerId);
        
        console.log(`Player ${player?.name || playerId} left room ${roomCode}`);
        
        // Update room state for remaining players
        if (rooms[roomCode].players.length > 0) {
          io.to(roomCode).emit('room_state_update', {
            players: rooms[roomCode].players,
            roomCode
          });
        } else {
          delete rooms[roomCode];
          console.log(`Room ${roomCode} closed (all players left)`);
        }
      }
    } catch (err) {
      console.error('Error leaving room:', err);
    }
  });
  
  // Handle disconnects
  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id} (Reason: ${reason})`);
    
    const roomCode = socket.data?.roomCode;
    const playerId = socket.data?.playerId;
    
    if (roomCode && rooms[roomCode] && playerId) {
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      if (player) {
        console.log(`Removing player ${player.name} from room ${roomCode}`);
        rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== playerId);
        
        // Notify other players
        io.to(roomCode).emit('player_disconnected', {
          playerId,
          playerName: player.name
        });
        
        // Update room state for remaining players
        if (rooms[roomCode].players.length > 0) {
          io.to(roomCode).emit('room_state_update', {
            players: rooms[roomCode].players,
            roomCode
          });
        } else {
          delete rooms[roomCode];
          console.log(`Room ${roomCode} closed (all players disconnected)`);
        }
      }
    }
  });
});

// Generate 4-digit alphanumeric room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Ensure unique code
  if (rooms[code]) {
    return generateRoomCode();
  }
  return code;
}

// Idle player detection system
setInterval(() => {
  const now = Date.now();
  for (const roomCode in rooms) {
    const room = rooms[roomCode];
    const playersToRemove = [];
    
    room.players.forEach(player => {
      if (now - player.lastActivity > IDLE_TIMEOUT) {
        playersToRemove.push(player);
      }
    });

    // Process idle players
    playersToRemove.forEach(player => {
      console.log(`Player ${player.name} idle in room ${roomCode}, disconnecting`);
      
      // Notify room about idle disconnect
      io.to(roomCode).emit('player_idle_disconnect', player.id);
      
      // Remove player from room
      room.players = room.players.filter(p => p.id !== player.id);
      
      // Reset buzzer if active player
      if (room.activePlayer === player.id) {
        room.activePlayer = null;
        room.buzzerLocked = false;
        io.to(roomCode).emit('reset_buzzer');
      }
      
      // Disconnect socket
      const playerSocket = io.sockets.sockets.get(player.socketId);
      if (playerSocket) {
        playerSocket.disconnect(true);
      }
    });

    // Update room state if players remain
    if (room.players.length > 0) {
      io.to(roomCode).emit('room_state_update', {
        players: room.players,
        roomCode
      });
    } 
    // Cleanup empty rooms
    else if (room.players.length === 0) {
      delete rooms[roomCode];
      console.log(`Room ${roomCode} closed (no players left)`);
    }
  }
}, 30000); // Check every 30 seconds

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🩺 Health check available at: http://0.0.0.0:${PORT}/health`);
  console.log(`⏳ Idle timeout set to ${IDLE_TIMEOUT/60000} minutes`);
  
  if (process.env.KOYEB_SERVICE_NAME) {
    console.log('🚀 Running on Koyeb infrastructure');
  }
}).on('error', (err) => {
  console.error('Failed to start server:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ UNHANDLED REJECTION:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('🚨 UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

