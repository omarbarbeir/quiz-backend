const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Enhanced middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Enhanced health check with more info
app.get('/health', (req, res) => {
  const roomCount = Object.keys(rooms).length;
  const totalPlayers = Object.values(rooms).reduce((sum, room) => sum + room.players.length, 0);
  
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    rooms: roomCount,
    players: totalPlayers,
    memory: process.memoryUsage()
  });
});

app.get('/', (req, res) => {
  res.send('Quiz Game Server Running - Enhanced Connection Stability');
});

// ENHANCED: Improved Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000, // Increased ping timeout
  pingInterval: 25000, // Increased ping interval
  connectTimeout: 45000, // Increased connection timeout
  transports: ['websocket', 'polling'],
  allowEIO3: true, // Enable Engine.IO v3 compatibility
  maxHttpBufferSize: 1e8, // Increase max buffer size
  cookie: false
});

// Import data files
const cardData = require('./data/cardData');
const randomPhotosData = require('./data_random');

// Game categories - Numbers 1 to 24
const gameCategories = [
  { 
    id: 1, 
    name: 'الفئة 1', 
    description: 'أفلام كوميدي',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 2, 
    name: 'الفئة 2', 
    description: 'ممثلين غنوا في أفلام',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 3, 
    name: 'الفئة 3', 
    description: 'افلام بإسم البطل',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 4, 
    name: 'الفئة 4', 
    description: 'افلام رومانسية',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 5, 
    name: 'الفئة 5', 
    description: 'ممثلين عملوا أكتر من ٣ أفلام بطولة',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 6, 
    name: 'الفئة 6', 
    description: 'ممثلين مثلوا مع عادل إمام',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 7, 
    name: 'الفئة 7', 
    description: 'ممثلين مثلوا مع بعض في نفس الفيلم',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 8, 
    name: 'الفئة 8', 
    description: 'افلام فيهم حد شرب مخدرات',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 9, 
    name: 'الفئة 9', 
    description: 'ممثلين كانوا هربانين من البوليس في أي فيلم',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 10, 
    name: 'الفئة 10', 
    description: 'افلام اكشن',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 11, 
    name: 'الفئة 11', 
    description: 'افلام فيها حد من الابطال مات',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 12, 
    name: 'الفئة 12', 
    description: 'ممثلين مثلوا دور ظابط',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 13, 
    name: 'الفئة 13', 
    description: 'ممثلين ليهم مشاهد بياكلوا فيها',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 14, 
    name: 'الفئة 14', 
    description: 'أفلام فيها عصابة',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 15, 
    name: 'الفئة 15', 
    description: 'أفلام فيها شخصية بتنتحل شخصية تانية',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 16, 
    name: 'الفئة 16', 
    description: 'ممثلين عملوا إعلانات في التليفزيون',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 17, 
    name: 'الفئة 17', 
    description: 'أفلام فيها مطاردة عربيات',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 18, 
    name: 'الفئة 18', 
    description: 'أفلام إسمها من ٣ كلمات',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 19, 
    name: 'الفئة 19', 
    description: 'ممثلين تقدر تقول إسم شخصيتهم في فيلم علي الأقل (مش لازم يكونوا كلهم في نفس الفيلم، يعني تذكر اسم شخصية كل ممثل في فيلم هو كان فيه)',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 20, 
    name: 'الفئة 20', 
    description: 'أفلام فيها رقص',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 21, 
    name: 'الفئة 21', 
    description: 'أفلام فيها حمام سباحة (يعني حمام السباحة ظهر في مشهد و تذكر ما هو المشهد)',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 22, 
    name: 'الفئة 22', 
    description: 'افلام فيها البطل دخل السجن',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 23, 
    name: 'الفئة 23', 
    description: 'أفلام البطل فيها كان له إخوات',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 24, 
    name: 'الفئة 24', 
    description: 'أفلام البطل فيها قتل شخصية ليست ثانوية (بمعني انها شخصية تكرر ظهورها ولم تظهر في مشهد مقتلها فقط)',
    rules: 'اجمع ٣ بطاقات'
  }
];

const rooms = {};
const pendingActions = {};

// NEW: Connection monitoring
const connectionStats = {
  totalConnections: 0,
  activeConnections: 0,
  reconnections: 0
};

// NEW: Room cleanup interval - ENHANCED: Longer intervals for admin rooms
setInterval(() => {
  const now = Date.now();
  let cleanedRooms = 0;
  
  Object.keys(rooms).forEach(roomCode => {
    const room = rooms[roomCode];
    const roomAge = now - (room.createdAt || now);
    const hasAdmin = room.players.some(p => p.isAdmin);
    const lastActivity = now - room.lastActivity;
    
    // Different cleanup rules for admin rooms vs regular rooms
    if (room.players.length === 0) {
      if (hasAdmin) {
        // Admin rooms: keep for 2 hours if no activity, otherwise 4 hours
        const maxAge = lastActivity > 7200000 ? 14400000 : 14400000; // 2 hours inactive = 4 hours total
        if (roomAge > maxAge) {
          delete rooms[roomCode];
          cleanedRooms++;
          console.log(`🧹 Cleaned up inactive admin room: ${roomCode}`);
        }
      } else {
        // Regular rooms: clean up after 1 hour
        if (roomAge > 3600000) {
          delete rooms[roomCode];
          cleanedRooms++;
          console.log(`🧹 Cleaned up empty room: ${roomCode}`);
        }
      }
    }
  });
  
  if (cleanedRooms > 0) {
    console.log(`🧹 Cleaned up ${cleanedRooms} rooms`);
  }
}, 300000); // Check every 5 minutes

function generateRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function generateStrokeId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function shuffleDeck(deck) {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

function getNextPlayer(roomCode, currentPlayerId) {
  const room = rooms[roomCode];
  if (!room || !room.players.length) return null;
  
  const currentIndex = room.players.findIndex(p => p.id === currentPlayerId);
  const nextIndex = (currentIndex + 1) % room.players.length;
  return room.players[nextIndex].id;
}

function getNextNonSkippedPlayer(roomCode, currentPlayerId, skippedPlayers) {
  let nextPlayerId = getNextPlayer(roomCode, currentPlayerId);
  let skippedCount = 0;
  const totalPlayers = rooms[roomCode].players.length;
  
  while (skippedPlayers[nextPlayerId] && skippedCount < totalPlayers) {
    console.log(`⏭️ Skipping ${nextPlayerId} because they are marked as skipped`);
    delete skippedPlayers[nextPlayerId];
    nextPlayerId = getNextPlayer(roomCode, nextPlayerId);
    skippedCount++;
  }
  
  if (skippedCount >= totalPlayers) {
    console.log(`⚠️ All players were skipped, resetting skip state`);
    Object.keys(skippedPlayers).forEach(playerId => {
      delete skippedPlayers[playerId];
    });
    nextPlayerId = getNextPlayer(roomCode, currentPlayerId);
  }
  
  return nextPlayerId;
}

function canTakeCardFromTable(card) {
  if (card.type === 'action') {
    return false;
  }
  return true;
}

function generateGameDeck(baseDeck) {
  console.log(`🃏 Generating game deck from ${baseDeck.length} available cards`);
  
  const actionCards = baseDeck.filter(card => 
    card.type === 'action' && (card.subtype === 'joker' || card.subtype === 'skip')
  );
  
  const nonActionCards = baseDeck.filter(card => 
    card.type !== 'action' || (card.subtype !== 'joker' && card.subtype !== 'skip')
  );
  
  console.log(`📊 Action cards: ${actionCards.length}, Non-action cards: ${nonActionCards.length}`);
  
  const actionCardCopies = [];
  
  actionCards.forEach(card => {
    for (let i = 0; i < 5; i++) {
      actionCardCopies.push({
        ...card,
        id: `${card.id}_copy_${i}`
      });
    }
  });
  
  const enhancedDeck = [...nonActionCards, ...actionCardCopies];
  
  console.log(`🎯 Enhanced deck: ${enhancedDeck.length} cards (${actionCardCopies.length} action cards)`);
  
  const finalDeck = shuffleDeck(enhancedDeck);
  
  console.log(`✅ Using enhanced deck with ${finalDeck.length} cards (more action cards)`);
  return finalDeck;
}

function initializeCardGame(players) {
  console.log('🎮 Initializing card game for players:', players.map(p => p.name));
  
  const gameDeck = generateGameDeck(cardData.deck);
  const shuffledDeck = shuffleDeck(gameDeck);
  const playerHands = {};
  
  players.forEach(player => {
    playerHands[player.id] = shuffledDeck.splice(0, 5);
    console.log(`   Dealt 5 cards to ${player.name}`);
  });

  return {
    deck: shuffledDeck,
    drawPile: shuffledDeck,
    tableCards: [],
    playerHands,
    currentTurn: players[0]?.id,
    gameStarted: true,
    declaredCategory: null,
    challengeInProgress: false,
    playerCircles: Object.fromEntries(players.map(p => [p.id, [null, null, null, null]])),
    playerLevels: Object.fromEntries(players.map(p => [p.id, 1])),
    completedCategories: Object.fromEntries(players.map(p => [p.id, []])),
    categories: gameCategories,
    playerHasDrawn: Object.fromEntries(players.map(p => [p.id, false])),
    playerCategories: Object.fromEntries(players.map(p => [p.id, null])),
    skippedPlayers: {}
  };
}

// ENHANCED: Socket.io connection handling with better monitoring and admin protection
io.on('connection', (socket) => {
  connectionStats.totalConnections++;
  connectionStats.activeConnections++;
  
  console.log('🔌 New client connected:', socket.id, 
    `(Active: ${connectionStats.activeConnections}, Total: ${connectionStats.totalConnections})`);

  // NEW: Handle ping/pong for connection health
  socket.on('ping', () => {
    socket.emit('pong');
  });

  // NEW: Handle connection errors
  socket.on('error', (error) => {
    console.error('❌ Socket error for', socket.id, ':', error);
  });

  // Create room with enhanced room tracking
  socket.on('create_room', () => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      players: [],
      activePlayer: null,
      buzzerLocked: false,
      currentQuestion: null,
      cardGame: null,
      whiteboard: {
        strokes: [],
        currentStroke: null
      },
      timer: {
        duration: 120,
        intervalId: null,
        currentTime: null,
        isRunning: false
      },
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isAdminRoom: true // NEW: Mark as admin room for special handling
    };
    
    socket.emit('room_created', roomCode);
    socket.join(roomCode);
    console.log(`🏠 Admin Room created: ${roomCode} (Total rooms: ${Object.keys(rooms).length})`);
  });

  // Enhanced join room with activity tracking
  socket.on('join_room', ({ roomCode, player }) => {
    console.log(`👤 Player ${player.name} joining room: ${roomCode}`);
    
    if (rooms[roomCode]) {
      const playerWithSocket = { 
        ...player, 
        socketId: socket.id,
        joinedAt: Date.now(),
        lastSeen: Date.now()
      };
      rooms[roomCode].players.push(playerWithSocket);
      rooms[roomCode].lastActivity = Date.now();
      socket.join(roomCode);
      
      socket.emit('player_joined', player);
      io.to(roomCode).emit('player_joined', player);
      
      // Send whiteboard state to new player
      socket.emit('whiteboard_state', rooms[roomCode].whiteboard);
      
      if (rooms[roomCode].cardGame) {
        socket.emit('card_game_state_update', rooms[roomCode].cardGame);
      }
      
      socket.data = { 
        roomCode, 
        playerId: player.id,
        playerName: player.name,
        isAdmin: player.isAdmin || false,
        joinedAt: Date.now()
      };
      console.log(`✅ ${player.name} joined room ${roomCode}. Total players: ${rooms[roomCode].players.length}`);
    } else {
      socket.emit('room_not_found');
      console.log(`❌ Room ${roomCode} not found`);
    }
  });

  // Enhanced rejoin room with better error handling
  socket.on('rejoin_room', ({ roomCode, player }) => {
    console.log(`🔄 Rejoining room: ${roomCode} for player: ${player.name}`);
    connectionStats.reconnections++;
    
    if (rooms[roomCode]) {
      const existingPlayerIndex = rooms[roomCode].players.findIndex(p => p.id === player.id);
      
      if (existingPlayerIndex === -1) {
        const playerWithSocket = { 
          ...player, 
          socketId: socket.id,
          joinedAt: Date.now(),
          lastSeen: Date.now(),
          reconnected: true
        };
        rooms[roomCode].players.push(playerWithSocket);
      } else {
        rooms[roomCode].players[existingPlayerIndex].socketId = socket.id;
        rooms[roomCode].players[existingPlayerIndex].lastSeen = Date.now();
        rooms[roomCode].players[existingPlayerIndex].reconnected = true;
      }
      
      rooms[roomCode].lastActivity = Date.now();
      socket.join(roomCode);
      
      // Send current room state to rejoining player
      socket.emit('rejoin_success', {
        players: rooms[roomCode].players,
        cardGame: rooms[roomCode].cardGame,
        currentQuestion: rooms[roomCode].currentQuestion,
        activePlayer: rooms[roomCode].activePlayer
      });
      
      // Notify other players about reconnection
      socket.to(roomCode).emit('player_reconnected', player);
      
      socket.data = { 
        roomCode, 
        playerId: player.id,
        playerName: player.name,
        isAdmin: player.isAdmin || false,
        rejoinedAt: Date.now()
      };
      
      console.log(`✅ ${player.name} rejoined room ${roomCode}`);
    } else {
      socket.emit('rejoin_failed');
      console.log(`❌ Room ${roomCode} not found for rejoin`);
    }
  });

  // NEW: Handle player reconnection notification
  socket.on('player_reconnected', ({ roomCode, playerId }) => {
    if (rooms[roomCode]) {
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      if (player) {
        player.lastSeen = Date.now();
        socket.to(roomCode).emit('player_reconnected', player);
      }
    }
  });

  // WHITEBOARD EVENTS
  socket.on('start_drawing', ({ roomCode, startX, startY, color, size }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].lastActivity = Date.now();
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
      rooms[roomCode].lastActivity = Date.now();
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
      rooms[roomCode].lastActivity = Date.now();
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
      rooms[roomCode].lastActivity = Date.now();
      rooms[roomCode].whiteboard = {
        strokes: [],
        currentStroke: null
      };
      io.to(roomCode).emit('whiteboard_cleared');
    }
  });

  // CARD GAME EVENTS with activity tracking
  socket.on('card_game_initialize', ({ roomCode }) => {
    console.log(`🎮 CARD GAME INITIALIZE for room: ${roomCode}`);
    
    if (!rooms[roomCode]) {
      console.log(`❌ Room ${roomCode} not found`);
      socket.emit('card_game_error', { message: 'Room not found' });
      return;
    }

    try {
      const room = rooms[roomCode];
      room.lastActivity = Date.now();
      
      if (room.players.length === 0) {
        console.log('❌ No players in room');
        socket.emit('card_game_error', { message: 'No players in room' });
        return;
      }

      console.log(`👥 Players in room:`, room.players.map(p => p.name));

      room.cardGame = initializeCardGame(room.players);
      
      console.log(`✅ Card game initialized successfully in ${roomCode}`);
      console.log(`   Players: ${room.players.length}`);
      console.log(`   Draw pile: ${room.cardGame.drawPile.length} cards`);
      
      io.to(roomCode).emit('card_game_state_update', room.cardGame);
      console.log(`📤 Game state sent to room ${roomCode}`);
      
    } catch (error) {
      console.error('❌ Error initializing card game:', error);
      socket.emit('card_game_error', { message: 'Failed to initialize game: ' + error.message });
    }
  });

  // Draw card from pile
  socket.on('card_game_draw', ({ roomCode, playerId }) => {
    console.log(`🃏 DRAW CARD by player ${playerId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      rooms[roomCode].lastActivity = Date.now();
      
      if (game.skippedPlayers[playerId]) {
        console.log(`❌ Player ${playerId} is skipped this turn`);
        socket.emit('card_game_error', { message: 'You are skipped this turn' });
        return;
      }
      
      if (game.drawPile.length === 0) {
        if (game.tableCards.length > 0) {
          console.log(`🔄 Draw pile empty! Shuffling ${game.tableCards.length} table cards into new draw pile`);
          game.drawPile = shuffleDeck([...game.tableCards]);
          game.tableCards = [];
          console.log(`✅ New draw pile created with ${game.drawPile.length} cards`);
        } else {
          console.log('❌ No cards left to draw');
          socket.emit('card_game_error', { message: 'No cards left to draw' });
          return;
        }
      }
      
      if (game.currentTurn !== playerId) {
        console.log(`❌ Not player ${playerId}'s turn. Current turn: ${game.currentTurn}`);
        socket.emit('card_game_error', { message: 'Not your turn' });
        return;
      }

      if (game.playerHasDrawn[playerId]) {
        console.log(`❌ Player ${playerId} has already drawn this turn`);
        socket.emit('card_game_error', { message: 'You have already drawn a card this turn. You must discard a card now.' });
        return;
      }

      const drawnCard = game.drawPile.pop();
      game.playerHands[playerId].push(drawnCard);
      game.playerHasDrawn[playerId] = true;
      
      io.to(roomCode).emit('card_game_state_update', game);
      console.log(`✅ Player drew a card. Draw pile: ${game.drawPile.length} cards left. Player must now discard.`);
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // Play card to table handler with enhanced validation
  socket.on('card_game_play_table', ({ roomCode, playerId, cardId }) => {
    console.log(`🃏 PLAY TO TABLE by player ${playerId} with card ${cardId} in room ${roomCode}`);
    
    if (!rooms[roomCode]) {
      console.log(`❌ Room ${roomCode} not found`);
      socket.emit('card_game_error', { message: 'Room not found. Please rejoin the game.' });
      return;
    }
    
    if (!rooms[roomCode].cardGame) {
      console.log(`❌ Card game not initialized in room ${roomCode}`);
      socket.emit('card_game_error', { message: 'Game not found. Please restart the card game.' });
      return;
    }
    
    const game = rooms[roomCode].cardGame;
    rooms[roomCode].lastActivity = Date.now();
    
    if (game.skippedPlayers[playerId]) {
      console.log(`❌ Player ${playerId} is skipped this turn`);
      socket.emit('card_game_error', { message: 'You are skipped this turn' });
      return;
    }
    
    if (game.currentTurn !== playerId) {
      console.log(`❌ Not player ${playerId}'s turn. Current turn: ${game.currentTurn}`);
      socket.emit('card_game_error', { message: 'Not your turn' });
      return;
    }

    if (!game.playerHasDrawn[playerId]) {
      console.log(`❌ Player ${playerId} must draw a card first`);
      socket.emit('card_game_error', { message: 'You must draw a card before discarding' });
      return;
    }

    const cardIndex = game.playerHands[playerId].findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      console.log(`❌ Card ${cardId} not found in player's hand`);
      socket.emit('card_game_error', { message: 'Card not found in hand' });
      return;
    }

    const [card] = game.playerHands[playerId].splice(cardIndex, 1);
    game.tableCards.push(card);
    
    game.playerHasDrawn[playerId] = false;
    
    delete game.skippedPlayers[playerId];
    
    let nextPlayerId = getNextNonSkippedPlayer(roomCode, playerId, game.skippedPlayers);
    game.currentTurn = nextPlayerId;
    
    io.to(roomCode).emit('card_game_state_update', game);
    console.log(`✅ Card played to table. Table cards: ${game.tableCards.length}. Next turn: ${game.currentTurn}`);
  });

  // Take card from table - Action cards cannot be taken
  socket.on('card_game_take_table', ({ roomCode, playerId, cardId }) => {
    console.log(`🃏 TAKE FROM TABLE by player ${playerId} for card ${cardId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      rooms[roomCode].lastActivity = Date.now();
      
      if (game.skippedPlayers[playerId]) {
        console.log(`❌ Player ${playerId} is skipped this turn`);
        socket.emit('card_game_error', { message: 'You are skipped this turn' });
        return;
      }
      
      if (game.currentTurn !== playerId) {
        console.log(`❌ Not player ${playerId}'s turn`);
        socket.emit('card_game_error', { message: 'Not your turn' });
        return;
      }

      if (game.playerHasDrawn[playerId]) {
        console.log(`❌ Player ${playerId} has already drawn this turn`);
        socket.emit('card_game_error', { message: 'You have already drawn a card this turn. You must discard a card now.' });
        return;
      }

      const topCard = game.tableCards[game.tableCards.length - 1];
      if (!topCard || topCard.id !== cardId) {
        console.log(`❌ Card ${cardId} is not the top card on table`);
        socket.emit('card_game_error', { message: 'You can only take the top card from the table' });
        return;
      }

      if (!canTakeCardFromTable(topCard)) {
        console.log(`❌ Action card ${cardId} cannot be taken from table`);
        socket.emit('card_game_error', { message: 'Action cards cannot be taken from the table' });
        return;
      }

      const [card] = game.tableCards.splice(-1, 1);
      game.playerHands[playerId].push(card);
      game.playerHasDrawn[playerId] = true;
      
      io.to(roomCode).emit('card_game_state_update', game);
      console.log(`✅ Top card taken from table. Table cards: ${game.tableCards.length}. Player must now discard.`);
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // Use skip card - AUTOMATICALLY skips next player
  socket.on('card_game_use_skip', ({ roomCode, playerId, cardId }) => {
    console.log(`🎭 USE SKIP CARD by player ${playerId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      rooms[roomCode].lastActivity = Date.now();
      
      if (game.currentTurn !== playerId) {
        console.log(`❌ Not player ${playerId}'s turn`);
        socket.emit('card_game_error', { message: 'Not your turn' });
        return;
      }

      if (!game.playerHasDrawn[playerId]) {
        console.log(`❌ Player ${playerId} must draw a card first`);
        socket.emit('card_game_error', { message: 'You must draw a card before using action cards' });
        return;
      }

      const cardIndex = game.playerHands[playerId].findIndex(c => c.id === cardId);
      if (cardIndex === -1) {
        console.log(`❌ Skip card ${cardId} not found in player's hand`);
        socket.emit('card_game_error', { message: 'Skip card not found in hand' });
        return;
      }

      const nextPlayerId = getNextPlayer(roomCode, playerId);
      game.skippedPlayers[nextPlayerId] = true;
      
      const [skipCard] = game.playerHands[playerId].splice(cardIndex, 1);
      game.tableCards.push(skipCard);
      
      game.playerHasDrawn[playerId] = false;
      
      delete game.skippedPlayers[playerId];
      
      let nextTurnPlayerId = getNextNonSkippedPlayer(roomCode, playerId, game.skippedPlayers);
      game.currentTurn = nextTurnPlayerId;
      
      io.to(roomCode).emit('card_game_state_update', game);
      console.log(`✅ Skip card used by ${playerId} on ${nextPlayerId}. Turn ended and moved to ${nextTurnPlayerId}`);
      
      const currentPlayer = rooms[roomCode].players.find(p => p.id === playerId);
      const skippedPlayer = rooms[roomCode].players.find(p => p.id === nextPlayerId);
      const nextPlayer = rooms[roomCode].players.find(p => p.id === nextTurnPlayerId);
      
      io.to(roomCode).emit('card_game_message', {
        type: 'skip',
        message: `${currentPlayer?.name || 'لاعب'} استخدم بطاقة تخطي! تم تخطي ${skippedPlayer?.name || 'اللاعب التالي'}. الدور ينتقل إلى ${nextPlayer?.name || 'اللاعب التالي'}.`,
        playerId: playerId,
        skippedPlayerId: nextPlayerId,
        nextPlayerId: nextTurnPlayerId
      });
      
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // INDEPENDENT DICE FUNCTION - Now 24 numbers
  socket.on('card_game_roll_dice', ({ roomCode, playerId }) => {
    console.log(`🎲 INDEPENDENT DICE ROLL by player ${playerId} in room ${roomCode}`);
    
    if (rooms[roomCode]) {
      rooms[roomCode].lastActivity = Date.now();
    }
    
    const diceValue = Math.floor(Math.random() * 24) + 1; // Now 1-24
    
    socket.emit('card_game_dice_rolled', { diceValue });
    
    console.log(`🎯 Player ${playerId} rolled dice: ${diceValue}`);
    console.log(`   ✅ Dice is completely independent - no game state changes`);
  });

  // Move card to circle
  socket.on('card_game_move_to_circle', ({ roomCode, playerId, circleIndex, cardId }) => {
    console.log(`🔄 MOVE TO CIRCLE by player ${playerId}, card ${cardId} to circle ${circleIndex} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      rooms[roomCode].lastActivity = Date.now();
      
      if (game.currentTurn !== playerId) {
        console.log(`❌ Not player ${playerId}'s turn`);
        socket.emit('card_game_error', { message: 'Not your turn' });
        return;
      }

      const cardIndex = game.playerHands[playerId].findIndex(c => c.id === cardId);
      if (cardIndex === -1) {
        console.log(`❌ Card ${cardId} not found in player's hand`);
        socket.emit('card_game_error', { message: 'Card not found in hand' });
        return;
      }

      const [card] = game.playerHands[playerId].splice(cardIndex, 1);
      game.playerCircles[playerId][circleIndex] = card;
      
      io.to(roomCode).emit('card_game_state_update', game);
      console.log(`✅ Card moved to circle ${circleIndex}`);
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // Remove card from circle
  socket.on('card_game_remove_from_circle', ({ roomCode, playerId, circleIndex }) => {
    console.log(`🔄 REMOVE FROM CIRCLE by player ${playerId} from circle ${circleIndex} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      rooms[roomCode].lastActivity = Date.now();
      
      if (game.currentTurn !== playerId) {
        console.log(`❌ Not player ${playerId}'s turn`);
        socket.emit('card_game_error', { message: 'Not your turn' });
        return;
      }

      const card = game.playerCircles[playerId][circleIndex];
      
      if (card) {
        game.playerCircles[playerId][circleIndex] = null;
        game.playerHands[playerId].push(card);
        
        io.to(roomCode).emit('card_game_state_update', game);
        console.log(`✅ Card removed from circle ${circleIndex}`);
      } else {
        socket.emit('card_game_error', { message: 'No card in circle' });
      }
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // Declare category
  socket.on('card_game_declare', ({ roomCode, playerId }) => {
    console.log(`🏆 DECLARE CATEGORY by player ${playerId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      rooms[roomCode].lastActivity = Date.now();
      
      if (game.currentTurn !== playerId) {
        console.log(`❌ Not player ${playerId}'s turn`);
        socket.emit('card_game_error', { message: 'Not your turn' });
        return;
      }

      const playerCircles = game.playerCircles[playerId];
      const filledCircles = playerCircles.filter(card => card !== null);
      
      const nonJokerCards = filledCircles.filter(card => card.type !== 'action' || card.subtype !== 'joker');
      const jokerCards = filledCircles.filter(card => card.type === 'action' && card.subtype === 'joker');
      
      if (nonJokerCards.length >= 2 && filledCircles.length >= 3) {
        const player = rooms[roomCode].players.find(p => p.id === playerId);
        game.declaredCategory = {
          playerId,
          playerName: player?.name || 'Unknown',
          category: game.playerCategories[playerId],
          cards: filledCircles
        };
        game.challengeInProgress = true;
        
        io.to(roomCode).emit('card_game_state_update', game);
        console.log(`✅ Category declared: Category ${game.playerCategories[playerId]?.id}`);
      } else {
        console.log(`❌ Not enough valid cards in circles (${filledCircles.length}/3, need at least 2 non-joker cards)`);
        socket.emit('card_game_error', { message: 'Need at least 3 cards in circles with at least 2 non-joker cards' });
      }
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // Challenge response - Player must discard after receiving 3 cards
  socket.on('card_game_challenge_response', ({ roomCode, playerId, accept, declaredPlayerId }) => {
    console.log(`⚖️ CHALLENGE RESPONSE by player ${playerId}: ${accept ? 'ACCEPT' : 'REJECT'} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      rooms[roomCode].lastActivity = Date.now();
      
      if (accept) {
        const completedPlayer = rooms[roomCode].players.find(p => p.id === declaredPlayerId);
        if (completedPlayer) {
          const completedCards = game.playerCircles[declaredPlayerId].filter(card => card !== null);
          
          completedCards.forEach(card => {
            game.tableCards.unshift(card);
          });
          
          game.completedCategories[declaredPlayerId].push(game.playerCategories[declaredPlayerId]);
          
          game.playerLevels[declaredPlayerId] = Math.min(4, game.playerLevels[declaredPlayerId] + 1);
          
          game.playerCircles[declaredPlayerId] = [null, null, null, null];
          
          // Draw 3 new cards
          for (let i = 0; i < 3; i++) {
            if (game.drawPile.length > 0) {
              const drawnCard = game.drawPile.pop();
              game.playerHands[declaredPlayerId].push(drawnCard);
            }
          }
          
          // Force the player to discard a card after receiving 3 new cards
          game.playerHasDrawn[declaredPlayerId] = true;
          
          // Keep the turn with the same player so they can discard
          game.currentTurn = declaredPlayerId;
          
          console.log(`✅ ${completedPlayer.name} completed category: Category ${game.declaredCategory.category?.id}`);
          console.log(`   Moved ${completedCards.length} circle cards to BOTTOM of table`);
          console.log(`   Player drew 3 new cards from pile`);
          console.log(`   Level: ${game.playerLevels[declaredPlayerId]}`);
          console.log(`   Player must now discard a card before turn ends`);
        }
      } else {
        game.currentTurn = getNextNonSkippedPlayer(roomCode, playerId, game.skippedPlayers);
      }
      
      game.challengeInProgress = false;
      game.declaredCategory = null;
      
      io.to(roomCode).emit('card_game_state_update', game);
      console.log(`✅ Challenge resolved. Next turn: ${game.currentTurn}`);
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // Exit card game and return to categories
  socket.on('card_game_exit', ({ roomCode }) => {
    console.log(`🚪 EXIT CARD GAME in room ${roomCode}`);
    
    if (rooms[roomCode]) {
      rooms[roomCode].lastActivity = Date.now();
      rooms[roomCode].cardGame = null;
      io.to(roomCode).emit('card_game_exited');
      console.log(`✅ Card game exited in room ${roomCode}`);
    }
  });

  // Reset card game
  socket.on('card_game_reset', ({ roomCode }) => {
    console.log(`🔄 RESET CARD GAME in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].players.length > 0) {
      try {
        rooms[roomCode].lastActivity = Date.now();
        rooms[roomCode].cardGame = initializeCardGame(rooms[roomCode].players);
        io.to(roomCode).emit('card_game_state_update', rooms[roomCode].cardGame);
        console.log(`✅ Card game reset successfully in ${roomCode}`);
      } catch (error) {
        console.error('❌ Error resetting card game:', error);
        socket.emit('card_game_error', { message: 'Failed to reset game: ' + error.message });
      }
    } else {
      socket.emit('card_game_error', { message: 'Game not found or no players' });
    }
  });

  // Use action card - SIMPLIFIED: Only joker and skip remain
  socket.on('card_game_use_action', ({ roomCode, playerId, cardId, actionType }) => {
    console.log(`🎭 USE ACTION CARD by player ${playerId}: ${actionType} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      rooms[roomCode].lastActivity = Date.now();
      
      const cardIndex = game.playerHands[playerId].findIndex(c => c.id === cardId);
      if (cardIndex === -1) {
        console.log(`❌ Action card ${cardId} not found in player's hand`);
        socket.emit('card_game_error', { message: 'Action card not found in hand' });
        return;
      }

      // Remove action card from player's hand
      const [actionCard] = game.playerHands[playerId].splice(cardIndex, 1);

      // Handle different action types
      if (actionType === 'joker') {
        // Joker can be used anytime - no restrictions
        console.log(`✅ Joker card used by ${playerId}`);
        game.drawPile.unshift(actionCard);
        
        io.to(roomCode).emit('card_game_state_update', game);
        console.log(`✅ Joker card used successfully by player ${playerId}`);
      } else if (actionType === 'skip') {
        // Skip card logic is now handled separately via card_game_use_skip
        console.log(`❌ Skip card should be used via card_game_use_skip event`);
        socket.emit('card_game_error', { message: 'Skip card should be used via the skip interface' });
        return;
      } else {
        console.log(`❌ Unknown action type: ${actionType}`);
        socket.emit('card_game_error', { message: 'Unknown action type' });
        return;
      }
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // Next turn
  socket.on('card_game_next_turn', ({ roomCode }) => {
    console.log(`🔄 NEXT TURN in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      rooms[roomCode].lastActivity = Date.now();
      const currentPlayerIndex = rooms[roomCode].players.findIndex(p => p.id === game.currentTurn);
      const nextPlayerIndex = (currentPlayerIndex + 1) % rooms[roomCode].players.length;
      game.currentTurn = rooms[roomCode].players[nextPlayerIndex].id;
      
      game.playerHasDrawn[game.currentTurn] = false;
      
      io.to(roomCode).emit('card_game_state_update', game);
      console.log(`✅ Next turn: ${game.currentTurn}`);
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // Shuffle deck - Only shuffles table cards and draw pile, keeps player hands
  socket.on('card_game_shuffle', ({ roomCode }) => {
    console.log(`🔀 SHUFFLE DECK in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      rooms[roomCode].lastActivity = Date.now();
      
      // ONLY shuffle table cards and draw pile, NOT player hands
      const allCards = [...game.drawPile, ...game.tableCards];
      
      if (allCards.length === 0) {
        console.log('❌ No cards to shuffle');
        socket.emit('card_game_error', { message: 'No cards available to shuffle' });
        return;
      }
      
      const shuffled = shuffleDeck(allCards);
      
      game.drawPile = shuffled;
      game.tableCards = [];
      
      io.to(roomCode).emit('card_game_state_update', game);
      console.log(`✅ Deck shuffled. Draw pile: ${shuffled.length} cards (player hands preserved)`);
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // Random photos question handler
  socket.on('play_random_question', ({ roomCode, subcategoryId }) => {
    console.log(`📸 PLAY RANDOM QUESTION for subcategory: ${subcategoryId} in room: ${roomCode}`);
    
    if (rooms[roomCode]) {
      const room = rooms[roomCode];
      room.lastActivity = Date.now();
      
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
      
      console.log(`✅ Sent random photos to players in room ${roomCode}`);
    }
  });

  // ENHANCED: Disconnect handler with admin protection
  socket.on('disconnect', (reason) => {
    connectionStats.activeConnections--;
    console.log('🔌 Client disconnected:', socket.id, 'Reason:', reason, 
      `(Active: ${connectionStats.activeConnections})`);
    
    const roomCode = socket.data?.roomCode;
    const playerId = socket.data?.playerId;
    const playerName = socket.data?.playerName;
    const isAdmin = socket.data?.isAdmin || false;
    
    if (roomCode && rooms[roomCode] && playerId) {
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      if (player) {
        if (player.socketId === socket.id) {
          // ENHANCED: Different timeout for admin vs regular players
          const timeoutDuration = isAdmin ? 30000 : 5000; // 30 seconds for admin, 5 for others
          
          setTimeout(() => {
            if (rooms[roomCode]) {
              const currentPlayer = rooms[roomCode].players.find(p => p.id === playerId);
              // Only remove if player hasn't reconnected with new socket
              if (currentPlayer && currentPlayer.socketId === socket.id) {
                rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== playerId);
                console.log(`❌ ${playerName || 'Player'} disconnected from room ${roomCode}`);
                
                // If admin disconnected, notify other players but don't close room immediately
                if (isAdmin) {
                  console.log(`🚨 Admin ${playerName} disconnected from room ${roomCode}. Room will be kept active for reconnection.`);
                  io.to(roomCode).emit('admin_disconnected', { 
                    playerName, 
                    message: 'المسؤول فقد الاتصال. الغرفة ستبقى مفتوحة للسماح بإعادة الاتصال.' 
                  });
                }
                
                if (rooms[roomCode].players.length === 0) {
                  // Delay room deletion to allow reconnection - longer for admin rooms
                  const roomDeleteDelay = isAdmin ? 60000 : 30000; // 60 seconds for admin rooms, 30 for regular
                  setTimeout(() => {
                    if (rooms[roomCode] && rooms[roomCode].players.length === 0) {
                      delete rooms[roomCode];
                      console.log(`🏠 Room ${roomCode} closed (no players)`);
                    }
                  }, roomDeleteDelay);
                } else {
                  // Notify other players after a short delay
                  setTimeout(() => {
                    if (rooms[roomCode] && !rooms[roomCode].players.find(p => p.id === playerId)) {
                      io.to(roomCode).emit('player_left', playerId);
                    }
                  }, 5000);
                }
              }
            }
          }, timeoutDuration);
        } else {
          console.log(`🔄 ${playerName || 'Player'} reconnected with new socket, keeping in room`);
        }
      }
    }
  });

  // Existing quiz game events with activity tracking
  socket.on('buzz', ({ roomCode, playerId }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].lastActivity = Date.now();
      rooms[roomCode].activePlayer = playerId;
      rooms[roomCode].buzzerLocked = true;
      io.to(roomCode).emit('player_buzzed', playerId);
    }
  });

  socket.on('reset_buzzer', (roomCode) => {
    if (rooms[roomCode]) {
      rooms[roomCode].lastActivity = Date.now();
      rooms[roomCode].activePlayer = null;
      rooms[roomCode].buzzerLocked = false;
      io.to(roomCode).emit('reset_buzzer');
    }
  });

  socket.on('update_score', ({ roomCode, playerId, change }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].lastActivity = Date.now();
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      if (player) {
        player.score += change;
        io.to(roomCode).emit('update_score', player);
      }
    }
  });

  socket.on('change_question', ({ roomCode, question }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].lastActivity = Date.now();
      rooms[roomCode].currentQuestion = question;
      io.to(roomCode).emit('question_changed', question);
    }
  });

  socket.on('end_game', (roomCode) => {
    if (rooms[roomCode]) {
      rooms[roomCode].lastActivity = Date.now();
      io.to(roomCode).emit('game_ended');
    }
  });

  socket.on('leave_room', ({ roomCode, playerId }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].lastActivity = Date.now();
      rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== playerId);
      io.to(roomCode).emit('player_left', playerId);
      
      if (rooms[roomCode].players.length === 0) {
        setTimeout(() => {
          if (rooms[roomCode] && rooms[roomCode].players.length === 0) {
            delete rooms[roomCode];
            console.log(`🏠 Room ${roomCode} closed (no players)`);
          }
        }, 30000);
      }
    }
  });

  socket.on('play_audio', (roomCode) => {
    if (rooms[roomCode]) {
      rooms[roomCode].lastActivity = Date.now();
      io.to(roomCode).emit('play_audio');
    }
  });

  socket.on('pause_audio', (roomCode) => {
    if (rooms[roomCode]) {
      rooms[roomCode].lastActivity = Date.now();
      io.to(roomCode).emit('pause_audio');
    }
  });

  socket.on('continue_audio', (roomCode, time) => {
    if (rooms[roomCode]) {
      rooms[roomCode].lastActivity = Date.now();
      io.to(roomCode).emit('continue_audio', time);
    }
  });
});

// Enhanced server startup with monitoring
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🃏 Card game system ready!`);
  console.log(`📸 Random photos system ready!`);
  console.log(`🖊️ Whiteboard system ready!`);
  console.log(`🔧 Enhanced connection stability enabled`);
  console.log(`👑 Admin room protection enabled`);
});

// NEW: Periodic server status logging
setInterval(() => {
  const roomCount = Object.keys(rooms).length;
  const totalPlayers = Object.values(rooms).reduce((sum, room) => sum + room.players.length, 0);
  const adminRooms = Object.values(rooms).filter(room => room.isAdminRoom).length;
  const memoryUsage = process.memoryUsage();
  
  console.log(`📊 Server Status - Rooms: ${roomCount} (${adminRooms} admin), Players: ${totalPlayers}, ` +
    `Active Connections: ${connectionStats.activeConnections}, ` +
    `Memory: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
}, 60000); // Log every minute