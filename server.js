const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const randomPhotosData = require('./data_random');

const app = express();
const server = http.createServer(app);

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

// Generate unique stroke ID
function generateStrokeId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('create_room', () => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      players: [],
      activePlayer: null,
      buzzerLocked: false,
      currentQuestion: null,
      whiteboard: {
        strokes: [],
        currentStroke: null
      },
      timer: {
        duration: 120,
        intervalId: null,
        currentTime: null,
        isRunning: false
      }
    };
    socket.emit('room_created', roomCode);
    socket.join(roomCode);
    console.log(`Room created: ${roomCode}`);
  });
  
  socket.on('join_room', ({ roomCode, player }) => {
    if (rooms[roomCode]) {
      const playerWithSocket = { 
        ...player, 
        socketId: socket.id
      };
      rooms[roomCode].players.push(playerWithSocket);
      socket.join(roomCode);
      socket.emit('player_joined', player);
      io.to(roomCode).emit('player_joined', player);
      
      // Send whiteboard state to new player
      socket.emit('whiteboard_state', rooms[roomCode].whiteboard);
      
      // Send current timer state if active
      if (rooms[roomCode].timer.intervalId) {
        socket.emit('timer_started', rooms[roomCode].timer.currentTime);
      }
      
      socket.data = { roomCode, playerId: player.id };
      console.log(`Player ${player.name} joined room ${roomCode}`);
    } else {
      socket.emit('room_not_found');
    }
  });
  
  socket.on('buzz', ({ roomCode, playerId }) => {
    if (rooms[roomCode] && !rooms[roomCode].buzzerLocked) {
      rooms[roomCode].activePlayer = playerId;
      rooms[roomCode].buzzerLocked = true;
      socket.emit('pause_audio', roomCode);
      io.to(roomCode).emit('player_buzzed', playerId);
      console.log(`Player ${playerId} buzzed in room ${roomCode}`);
    }
  });
  
  socket.on('update_score', ({ roomCode, playerId, change }) => {
    if (rooms[roomCode]) {
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      if (player) {
        player.score = (player.score || 0) + change;
        io.to(roomCode).emit('update_score', player);
        console.log(`Updated score for player ${playerId} in room ${roomCode} to ${player.score}`);
        
        if (rooms[roomCode].activePlayer === playerId) {
          rooms[roomCode].activePlayer = null;
          rooms[roomCode].buzzerLocked = false;
          io.to(roomCode).emit('reset_buzzer');
        }
      }
    }
  });
  
  socket.on('reset_buzzer', (roomCode) => {
    if (rooms[roomCode]) {
      rooms[roomCode].activePlayer = null;
      rooms[roomCode].buzzerLocked = false;
      io.to(roomCode).emit('reset_buzzer');
      console.log(`Buzzer reset in room ${roomCode}`);
    }
  });
  
  socket.on('change_question', ({ roomCode, question }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].currentQuestion = question;
      rooms[roomCode].activePlayer = null;
      rooms[roomCode].buzzerLocked = false;
      io.to(roomCode).emit('question_changed', question);
      console.log(`Question changed in room ${roomCode}`);
    }
  });
  
  socket.on('end_game', (roomCode) => {
    if (rooms[roomCode]) {
      io.to(roomCode).emit('game_ended');
      console.log(`Game ended in room ${roomCode}`);
    }
  });
  
  socket.on('play_audio', (roomCode) => {
    io.to(roomCode).emit('play_audio');
  });
  
  socket.on('continue_audio', (roomCode, time) => {
    io.to(roomCode).emit('continue_audio', time);
  });
  
  socket.on('pause_audio', (roomCode) => {
    io.to(roomCode).emit('pause_audio');
  });
  
  socket.on('stop_audio', (roomCode) => {
    io.to(roomCode).emit('stop_audio');
  });
  
  socket.on('play_audio2', (roomCode) => {
    io.to(roomCode).emit('play_audio2');
  });
  
  socket.on('continue_audio2', (roomCode, time) => {
    io.to(roomCode).emit('continue_audio2', time);
  });
  
  socket.on('pause_audio2', (roomCode) => {
    io.to(roomCode).emit('pause_audio2');
  });
  
  socket.on('stop_audio2', (roomCode) => {
    io.to(roomCode).emit('stop_audio2');
  });
  
  socket.on('play_random_question', ({ roomCode, subcategoryId }) => {
    if (rooms[roomCode]) {
      const room = rooms[roomCode];
      
      // Reset buzzer state
      room.activePlayer = null;
      room.buzzerLocked = false;
      io.to(roomCode).emit('reset_buzzer');
      
      // SAFETY CHECK: Verify the category exists
      if (!randomPhotosData['random-photos']) {
        console.error('Random photos category not found in data');
        return;
      }
      
      // SAFETY CHECK: Verify the subcategory exists
      if (!randomPhotosData['random-photos'][subcategoryId]) {
        console.error(`Subcategory ${subcategoryId} not found in random-photos category`);
        console.log('Available subcategories:', Object.keys(randomPhotosData['random-photos']));
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
        if (availableIndices.length === 0) {
          console.error('Not enough questions for all players');
          return;
        }
        
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
    }
  });
  
  socket.on('leave_room', ({ roomCode, playerId }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== playerId);
      socket.leave(roomCode);
      io.to(roomCode).emit('player_left', playerId);
      console.log(`Player ${playerId} left room ${roomCode}`);
      
      if (rooms[roomCode].players.length === 0) {
        // Clear timer if running
        if (rooms[roomCode].timer.intervalId) {
          clearInterval(rooms[roomCode].timer.intervalId);
        }
        delete rooms[roomCode];
        console.log(`Room ${roomCode} closed`);
      }
    }
  });
  
  // Whiteboard event handlers
  socket.on('start_drawing', ({ roomCode, startX, startY, color, size }) => {
    if (rooms[roomCode]) {
      const strokeId = generateStrokeId();
      rooms[roomCode].whiteboard.currentStroke = {
        id: strokeId,
        color,
        size,
        points: [{ x: startX, y: startY }]
      };
      
      io.to(roomCode).emit('stroke_started', {
        strokeId,
        color,
        size,
        startX,
        startY
      });
    }
  });

  socket.on('update_drawing', ({ roomCode, x, y }) => {
    if (rooms[roomCode] && rooms[roomCode].whiteboard.currentStroke) {
      const stroke = rooms[roomCode].whiteboard.currentStroke;
      stroke.points.push({ x, y });
      
      io.to(roomCode).emit('stroke_updated', {
        strokeId: stroke.id,
        x,
        y
      });
    }
  });

  socket.on('end_drawing', ({ roomCode }) => {
    if (rooms[roomCode] && rooms[roomCode].whiteboard.currentStroke) {
      const stroke = rooms[roomCode].whiteboard.currentStroke;
      rooms[roomCode].whiteboard.strokes.push(stroke);
      rooms[roomCode].whiteboard.currentStroke = null;
      
      io.to(roomCode).emit('stroke_ended', {
        strokeId: stroke.id
      });
    }
  });

  socket.on('clear_whiteboard', ({ roomCode }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].whiteboard = {
        strokes: [],
        currentStroke: null
      };
      io.to(roomCode).emit('whiteboard_cleared');
    }
  });

  // Timer event handlers
  socket.on('start_timer', ({ roomCode, duration }) => {
    if (rooms[roomCode]) {
      // Clear any existing timer
      if (rooms[roomCode].timer.intervalId) {
        clearInterval(rooms[roomCode].timer.intervalId);
      }
      
      // Initialize timer
      rooms[roomCode].timer = {
        duration,
        currentTime: duration,
        isRunning: true,
        intervalId: setInterval(() => {
          rooms[roomCode].timer.currentTime--;
          
          // Broadcast to all players
          io.to(roomCode).emit('timer_update', rooms[roomCode].timer.currentTime);
          
          // End timer if time runs out
          if (rooms[roomCode].timer.currentTime <= 0) {
            clearInterval(rooms[roomCode].timer.intervalId);
            rooms[roomCode].timer.intervalId = null;
            rooms[roomCode].timer.isRunning = false;
            io.to(roomCode).emit('timer_end');
          }
        }, 1000)
      };
      
      // Broadcast initial timer state
      io.to(roomCode).emit('timer_started', rooms[roomCode].timer.currentTime);
      console.log(`Timer started in room ${roomCode}`);
    }
  });

  socket.on('stop_timer', ({ roomCode }) => {
    if (rooms[roomCode] && rooms[roomCode].timer.intervalId) {
      clearInterval(rooms[roomCode].timer.intervalId);
      rooms[roomCode].timer.intervalId = null;
      rooms[roomCode].timer.isRunning = false;
      io.to(roomCode).emit('timer_stopped');
      console.log(`Timer stopped in room ${roomCode}`);
    }
  });

  socket.on('continue_timer', ({ roomCode, currentTime }) => {
    if (rooms[roomCode]) {
      // Clear any existing timer
      if (rooms[roomCode].timer.intervalId) {
        clearInterval(rooms[roomCode].timer.intervalId);
      }
      
      // Continue timer from current time
      rooms[roomCode].timer.currentTime = currentTime;
      rooms[roomCode].timer.isRunning = true;
      rooms[roomCode].timer.intervalId = setInterval(() => {
        rooms[roomCode].timer.currentTime--;
        
        // Broadcast to all players
        io.to(roomCode).emit('timer_update', rooms[roomCode].timer.currentTime);
        
        // End timer if time runs out
        if (rooms[roomCode].timer.currentTime <= 0) {
          clearInterval(rooms[roomCode].timer.intervalId);
          rooms[roomCode].timer.intervalId = null;
          rooms[roomCode].timer.isRunning = false;
          io.to(roomCode).emit('timer_end');
        }
      }, 1000);
      
      // Broadcast timer continued
      io.to(roomCode).emit('timer_continued', rooms[roomCode].timer.currentTime);
      console.log(`Timer continued in room ${roomCode} from ${currentTime} seconds`);
    }
  });

  socket.on('reset_timer', ({ roomCode }) => {
    if (rooms[roomCode]) {
      // Clear any existing timer
      if (rooms[roomCode].timer.intervalId) {
        clearInterval(rooms[roomCode].timer.intervalId);
      }
      
      // Reset timer to initial state
      rooms[roomCode].timer = {
        duration: 120,
        currentTime: 120,
        intervalId: null,
        isRunning: false
      };
      
      // Broadcast timer reset
      io.to(roomCode).emit('timer_reset');
      console.log(`Timer reset in room ${roomCode}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    
    const roomCode = socket.data?.roomCode;
    const playerId = socket.data?.playerId;
    
    if (roomCode && rooms[roomCode] && playerId) {
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      if (player) {
        io.to(roomCode).emit('player_disconnected', {
          playerId,
          playerName: player.name
        });
        
        rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== playerId);
        console.log(`Player ${player.name} disconnected from room ${roomCode}`);
        
        if (rooms[roomCode].players.length === 0) {
          // Clear timer if running
          if (rooms[roomCode].timer.intervalId) {
            clearInterval(rooms[roomCode].timer.intervalId);
          }
          delete rooms[roomCode];
          console.log(`Room ${roomCode} closed`);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🩺 Health check available at: http://0.0.0.0:${PORT}/health`);
  
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