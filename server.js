const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send('Quiz Game Server Running');
});

// CRITICAL FIX: Use EXACT same Socket.IO config as old working code
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Import data files
const cardData = require('./data/cardData');
const randomPhotosData = require('./data_random');

// Game categories - Numbers 1 to 24 (increased from 12)
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
    description: 'أفلام فيها فرح',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 14, 
    name: 'الفئة 14', 
    description: 'ممثلين ليهم مشاهد بيأكلوا فيها',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 15, 
    name: 'الفئة 15', 
    description: 'أفلام فيها عصابة',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 16, 
    name: 'الفئة 16', 
    description: 'أفلام فيها شخصية بتنتحل شخصية تانيه',
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
    description: 'ممثلين تقدر تذكر إسم شخصيتهم في فيلم علي الأقل',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 20, 
    name: 'الفئة 20', 
    description: 'فيلم ظهر فيه حمام سباحة',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 21, 
    name: 'الفئة 21', 
    description: 'أفلام البطل فيها دخل السجن',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 22, 
    name: 'الفئة 22', 
    description: 'ممثلين ليهم إخوات في فيلم',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 23, 
    name: 'الفئة 23', 
    description: 'ممثلين عملوا إعلان في التليفزيون',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 24, 
    name: 'الفئة 24', 
    description: 'أفلام ظهر فيها حيوان',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 25, 
    name: 'الفئة 25', 
    description: 'ممثلين تقدر تقول ليهم ٥ أفلام',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 26, 
    name: 'الفئة 26', 
    description: 'أفلام تقدر تقول منها ٣ إفيهات',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 27, 
    name: 'الفئة 27', 
    description: 'ممثلين عيطوا في أفلام',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 28, 
    name: 'الفئة 28', 
    description: 'أفلام حصل فيها جريمة قتل',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 29, 
    name: 'الفئة 29', 
    description: 'أفلام تقدر تقول فيها أسماء ٣ شخصيات في الفيلم غير البطل',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 30, 
    name: 'الفئة 30', 
    description: 'فيلم إسمه من كلمة واحدة',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 31, 
    name: 'الفئة 31', 
    description: 'ممثلات شاركوا في فيلم لأحمد حلمي',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 32, 
    name: 'الفئة 32', 
    description: 'ممثل أو ممثلة عملوا دور دكتور (طبيب)',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 33, 
    name: 'الفئة 33', 
    description: 'ممثلين اتقبض عليهم في فيلم',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 34, 
    name: 'الفئة 34', 
    description: 'أفلام بطليها بيتجوزوا في نهاية الفيلم',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 35, 
    name: 'الفئة 35', 
    description: 'فيلم و ٢ ممثلين موجودين فيه',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 36, 
    name: 'الفئة 36', 
    description: 'أفلام فيها مشهد في عربية',
    rules: 'اجمع ٣ بطاقات'
  },
];

const rooms = {};
const pendingActions = {};

// NEW: Track player activity timestamps
const playerActivity = {};

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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

// NEW: Update player activity timestamp
function updatePlayerActivity(socketId) {
  playerActivity[socketId] = Date.now();
  console.log(`🕐 Updated activity for socket ${socketId}`);
}

// NEW: Check for inactive players and disconnect them
function checkInactivePlayers() {
  const now = Date.now();
  const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  Object.keys(playerActivity).forEach(socketId => {
    const lastActivity = playerActivity[socketId];
    if (now - lastActivity > FIVE_MINUTES) {
      console.log(`⏰ Disconnecting inactive socket ${socketId} (last activity: ${new Date(lastActivity).toISOString()})`);
      
      // Find the socket and disconnect it
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
        delete playerActivity[socketId];
      }
    }
  });
}

// NEW: Start the inactivity checker (runs every minute)
setInterval(checkInactivePlayers, 60000);

// UPDATED: Use ALL cards from the deck without limiting to 60
function initializeCardGame(players) {
  console.log('🃏 Initializing card game for players:', players.map(p => p.name));
  
  // Filter out action cards except joker and skip
  const filteredDeck = cardData.deck.filter(card => 
    card.type !== 'action' || card.subtype === 'joker' || card.subtype === 'skip'
  );
  
  console.log(`🃏 Total cards in filtered deck: ${filteredDeck.length}`);
  
  // Use ALL filtered cards instead of generating a limited deck
  const shuffledDeck = shuffleDeck(filteredDeck);
  const playerHands = {};
  
  players.forEach(player => {
    playerHands[player.id] = shuffledDeck.splice(0, 5);
    console.log(`   Dealt 5 cards to ${player.name}`);
  });

  console.log(`🃏 Remaining cards in draw pile: ${shuffledDeck.length}`);

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
    skippedPlayers: {},
    challengeResponses: {},
    challengeRespondedPlayers: [],
    winner: null // NEW: Initialize winner as null
  };
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  // NEW: Initialize activity tracking for this socket
  updatePlayerActivity(socket.id);

  // Create room
  socket.on('create_room', () => {
    updatePlayerActivity(socket.id);
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
      }
    };
    
    socket.emit('room_created', roomCode);
    socket.join(roomCode);
    console.log(`🏠 Room created: ${roomCode}`);
  });

  // Join room
  socket.on('join_room', ({ roomCode, player }) => {
    updatePlayerActivity(socket.id);
    console.log(`👤 Player ${player.name} joining room: ${roomCode}`);
    
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
      
      if (rooms[roomCode].cardGame) {
        socket.emit('card_game_state_update', rooms[roomCode].cardGame);
      }
      
      socket.data = { roomCode, playerId: player.id };
      console.log(`✅ ${player.name} joined room ${roomCode}. Total players: ${rooms[roomCode].players.length}`);
    } else {
      socket.emit('room_not_found');
      console.log(`❌ Room ${roomCode} not found`);
    }
  });

  // WHITEBOARD EVENTS
  socket.on('start_drawing', ({ roomCode, startX, startY, color, size }) => {
    updatePlayerActivity(socket.id);
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
    updatePlayerActivity(socket.id);
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
    updatePlayerActivity(socket.id);
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
    updatePlayerActivity(socket.id);
    if (rooms[roomCode]) {
      rooms[roomCode].whiteboard = {
        strokes: [],
        currentStroke: null
      };
      io.to(roomCode).emit('whiteboard_cleared');
    }
  });

  // CARD GAME EVENTS
  socket.on('card_game_initialize', ({ roomCode }) => {
    updatePlayerActivity(socket.id);
    console.log(`🎮 CARD GAME INITIALIZE for room: ${roomCode}`);
    
    if (!rooms[roomCode]) {
      console.log(`❌ Room ${roomCode} not found`);
      socket.emit('card_game_error', { message: 'Room not found' });
      return;
    }

    try {
      const room = rooms[roomCode];
      
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
      console.log(`   Player hands:`, Object.keys(room.cardGame.playerHands).length);
      
      io.to(roomCode).emit('card_game_state_update', room.cardGame);
      console.log(`📤 Game state sent to room ${roomCode}`);
      
    } catch (error) {
      console.error('❌ Error initializing card game:', error);
      socket.emit('card_game_error', { message: 'Failed to initialize game: ' + error.message });
    }
  });

  // Draw card from pile
  socket.on('card_game_draw', ({ roomCode, playerId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🃏 DRAW CARD by player ${playerId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      
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

  // Play card to table
  socket.on('card_game_play_table', ({ roomCode, playerId, cardId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🃏 PLAY TO TABLE by player ${playerId} with card ${cardId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      
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
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // Take card from table
  socket.on('card_game_take_table', ({ roomCode, playerId, cardId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🃏 TAKE FROM TABLE by player ${playerId} for card ${cardId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      
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

      // NEW: Skip cards cannot be taken from table
      if (topCard.type === 'action' && topCard.subtype === 'skip') {
        console.log(`❌ Skip cards cannot be taken from table`);
        socket.emit('card_game_error', { message: 'Skip cards cannot be taken from the table' });
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

  // Use skip card
  socket.on('card_game_use_skip', ({ roomCode, playerId, cardId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🎭 USE SKIP CARD by player ${playerId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      
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

      const [skipCard] = game.playerHands[playerId].splice(cardIndex, 1);
      
      // NEW: Automatically skip the next player
      const nextPlayerId = getNextPlayer(roomCode, playerId);
      game.skippedPlayers[nextPlayerId] = true;
      
      // Put skip card on table (cannot be taken)
      game.tableCards.push(skipCard);
      
      game.playerHasDrawn[playerId] = false;
      delete game.skippedPlayers[playerId];
      
      // Move turn to player after the skipped one
      let finalNextPlayerId = getNextNonSkippedPlayer(roomCode, playerId, game.skippedPlayers);
      game.currentTurn = finalNextPlayerId;
      
      io.to(roomCode).emit('card_game_state_update', game);
      console.log(`✅ Skip card used by ${playerId}. Next player ${nextPlayerId} skipped. Turn moved to ${finalNextPlayerId}`);
      
      const currentPlayer = rooms[roomCode].players.find(p => p.id === playerId);
      const skippedPlayer = rooms[roomCode].players.find(p => p.id === nextPlayerId);
      io.to(roomCode).emit('card_game_message', {
        type: 'skip',
        message: `${currentPlayer?.name || 'لاعب'} استخدم بطاقة تخطي! ${skippedPlayer?.name || 'اللاعب التالي'} تم تخطيه.`,
        playerId: playerId,
        skippedPlayerId: nextPlayerId
      });
      
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // Use joker card
  socket.on('card_game_use_joker', ({ roomCode, playerId, cardId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🃏 USE JOKER CARD by player ${playerId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      
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
        console.log(`❌ Joker card ${cardId} not found in player's hand`);
        socket.emit('card_game_error', { message: 'Joker card not found in hand' });
        return;
      }

      const [jokerCard] = game.playerHands[playerId].splice(cardIndex, 1);
      
      // Put joker card on table (can be taken)
      game.tableCards.push(jokerCard);
      
      io.to(roomCode).emit('card_game_state_update', game);
      console.log(`✅ Joker card used by ${playerId}. Player can continue turn.`);
      
      const currentPlayer = rooms[roomCode].players.find(p => p.id === playerId);
      io.to(roomCode).emit('card_game_message', {
        type: 'joker',
        message: `${currentPlayer?.name || 'لاعب'} استخدم بطاقة جوكر!`,
        playerId: playerId
      });
      
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // UPDATED: Dice roll for categories - Show dice number and category only to player who rolled
  socket.on('card_game_roll_dice', ({ roomCode, playerId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🎲 DICE ROLL by player ${playerId} in room ${roomCode}`);
    
    // DYNAMIC: Automatically works with any number of categories
    const diceValue = Math.floor(Math.random() * gameCategories.length) + 1;
    
    // Find the category with this ID - works with any categories array
    const category = gameCategories.find(cat => cat.id === diceValue);
    
    // UPDATED: Send dice value ONLY to the player who rolled (not to all players)
    socket.emit('card_game_dice_rolled', { diceValue });
    
    // NEW: Send category ONLY to the player who rolled
    if (category) {
      socket.emit('card_game_dice_category', { category });
      console.log(`🎯 Player ${playerId} rolled dice: ${diceValue} - Category: ${category.name}`);
      console.log(`📊 Total categories available: ${gameCategories.length}`);
    } else {
      console.log(`❌ Category not found for dice value: ${diceValue}`);
      console.log(`📊 Available categories:`, gameCategories.map(c => c.id));
    }
  });

  // Move card to circle
  socket.on('card_game_move_to_circle', ({ roomCode, playerId, circleIndex, cardId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 MOVE TO CIRCLE by player ${playerId}, card ${cardId} to circle ${circleIndex} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      
      if (game.currentTurn !== playerId) {
        console.log(`❌ Not player ${playerId}'s turn`);
        socket.emit('card_game_error', { message: 'Not your turn' });
        return;
      }

      if (!game.playerHasDrawn[playerId]) {
        console.log(`❌ Player ${playerId} must draw a card first`);
        socket.emit('card_game_error', { message: 'You must draw a card before placing cards in circles' });
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
    updatePlayerActivity(socket.id);
    console.log(`🔄 REMOVE FROM CIRCLE by player ${playerId} from circle ${circleIndex} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      
      if (game.currentTurn !== playerId) {
        console.log(`❌ Not player ${playerId}'s turn`);
        socket.emit('card_game_error', { message: 'Not your turn' });
        return;
      }

      if (!game.playerHasDrawn[playerId]) {
        console.log(`❌ Player ${playerId} must draw a card first`);
        socket.emit('card_game_error', { message: 'You must draw a card before modifying circles' });
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
    updatePlayerActivity(socket.id);
    console.log(`🏆 DECLARE CATEGORY by player ${playerId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      
      if (game.currentTurn !== playerId) {
        console.log(`❌ Not player ${playerId}'s turn`);
        socket.emit('card_game_error', { message: 'Not your turn' });
        return;
      }

      if (!game.playerHasDrawn[playerId]) {
        console.log(`❌ Player ${playerId} must draw a card first`);
        socket.emit('card_game_error', { message: 'You must draw a card before declaring category' });
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
        
        // NEW: Initialize challenge tracking
        game.challengeResponses = {};
        game.challengeRespondedPlayers = [];
        
        io.to(roomCode).emit('card_game_state_update', game);
        console.log(`✅ Category declared: Category ${game.playerCategories[playerId]?.id}`);
        console.log(`🔄 Challenge started. Waiting for responses from other players.`);
      } else {
        console.log(`❌ Not enough valid cards in circles (${filledCircles.length}/3, need at least 2 non-joker cards)`);
        socket.emit('card_game_error', { message: 'Need at least 3 cards in circles with at least 2 non-joker cards' });
      }
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // UPDATED: Challenge response - Player who rejects doesn't lose turn
  socket.on('card_game_challenge_response', ({ roomCode, playerId, accept, declaredPlayerId }) => {
    updatePlayerActivity(socket.id);
    console.log(`⚖️ CHALLENGE RESPONSE by player ${playerId}: ${accept ? 'ACCEPT' : 'REJECT'} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const room = rooms[roomCode];
      
      if (!game.challengeInProgress) {
        console.log(`❌ No challenge in progress`);
        socket.emit('card_game_error', { message: 'No challenge in progress' });
        return;
      }

      // Track responses
      if (!game.challengeRespondedPlayers.includes(playerId)) {
        game.challengeRespondedPlayers.push(playerId);
        game.challengeResponses[playerId] = accept;
        
        console.log(`📝 Player ${playerId} responded: ${accept ? 'ACCEPT' : 'REJECT'}`);
        console.log(`📊 Responses so far:`, game.challengeResponses);
        
        // Send update to show who has responded
        io.to(roomCode).emit('card_game_state_update', game);
      }

      // Check if all players have responded (excluding the declaring player)
      const otherPlayers = room.players.filter(p => p.id !== declaredPlayerId);
      const allResponded = otherPlayers.every(player => 
        game.challengeRespondedPlayers.includes(player.id)
      );

      if (allResponded) {
        console.log(`✅ All players have responded. Processing challenge result...`);
        
        // Check if all players accepted
        const allAccepted = otherPlayers.every(player => 
          game.challengeResponses[player.id] === true
        );

        if (allAccepted) {
          console.log(`🎉 Challenge SUCCESS: All players accepted!`);
          const completedPlayer = room.players.find(p => p.id === declaredPlayerId);
          if (completedPlayer) {
            const completedCards = game.playerCircles[declaredPlayerId].filter(card => card !== null);
            
            completedCards.forEach(card => {
              game.tableCards.unshift(card);
            });
            
            game.completedCategories[declaredPlayerId].push(game.playerCategories[declaredPlayerId]);
            
            // FIXED: Allow progression to level 5 (WIN)
            game.playerLevels[declaredPlayerId] = Math.min(5, game.playerLevels[declaredPlayerId] + 1);
            game.playerCircles[declaredPlayerId] = [null, null, null, null];
            
            // Give 3 new cards but player must still discard
            for (let i = 0; i < 3; i++) {
              if (game.drawPile.length > 0) {
                const drawnCard = game.drawPile.pop();
                game.playerHands[declaredPlayerId].push(drawnCard);
              }
            }
            
            // NEW: Check for winner and announce to all players
            if (game.playerLevels[declaredPlayerId] >= 5) {
              console.log(`🎊 ${completedPlayer.name} WON THE GAME! 🎊`);
              game.winner = declaredPlayerId;
              
              // NEW: Emit winner announcement to ALL players
              io.to(roomCode).emit('card_game_winner_announced', {
                playerId: declaredPlayerId,
                winnerName: completedPlayer.name
              });
              
              io.to(roomCode).emit('card_game_message', {
                type: 'game_win',
                message: `🎉 ${completedPlayer.name} فاز باللعبة! 🎉`,
                playerId: declaredPlayerId,
                winnerName: completedPlayer.name
              });
            } else {
              // Send success message for regular level completion
              io.to(roomCode).emit('card_game_message', {
                type: 'challenge_success',
                message: `🎉 ${completedPlayer.name} أكمل الفئة بنجاح!`,
                playerId: declaredPlayerId
              });
            }
            
            console.log(`✅ ${completedPlayer.name} completed category: Category ${game.declaredCategory.category?.id}`);
            console.log(`   Moved ${completedCards.length} circle cards to BOTTOM of table`);
            console.log(`   Player drew 3 new cards from pile`);
            console.log(`   Level: ${game.playerLevels[declaredPlayerId]}`);
            console.log(`   Player must now discard one card`);
          }
        } else {
          console.log(`❌ Challenge FAILED: At least one player rejected`);
          
          // NEW: Challenge failed but declaring player keeps their turn
          const declaringPlayer = room.players.find(p => p.id === declaredPlayerId);
          if (declaringPlayer) {
            console.log(`🔄 ${declaringPlayer.name} keeps their turn after failed challenge`);
            
            // Send failure message
            io.to(roomCode).emit('card_game_message', {
              type: 'challenge_failed',
              message: `❌ ${declaringPlayer.name} لم يكمل الفئة، لكنه يحتفظ بدوره!`,
              playerId: declaredPlayerId
            });
          }
        }
        
        // End challenge regardless of outcome
        game.challengeInProgress = false;
        game.declaredCategory = null;
        game.challengeResponses = {};
        game.challengeRespondedPlayers = [];
        
        io.to(roomCode).emit('card_game_state_update', game);
        console.log(`✅ Challenge resolved. Current turn remains with: ${game.currentTurn}`);
      }
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // NEW: Allow any player to reset the game from winner modal
  socket.on('card_game_reset_any_player', ({ roomCode }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 RESET CARD GAME by any player in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].players.length > 0) {
      try {
        // Clear any winner state first
        if (rooms[roomCode].cardGame) {
          rooms[roomCode].cardGame.winner = null;
        }
        
        rooms[roomCode].cardGame = initializeCardGame(rooms[roomCode].players);
        
        // NEW: Emit reset event to all players first
        io.to(roomCode).emit('card_game_reset');
        
        // Then send the updated game state
        io.to(roomCode).emit('card_game_state_update', rooms[roomCode].cardGame);
        console.log(`✅ Card game reset successfully by any player in ${roomCode}`);
      } catch (error) {
        console.error('❌ Error resetting card game:', error);
        socket.emit('card_game_error', { message: 'Failed to reset game: ' + error.message });
      }
    } else {
      socket.emit('card_game_error', { message: 'Game not found or no players' });
    }
  });

  // Exit card game
  socket.on('card_game_exit', ({ roomCode }) => {
    updatePlayerActivity(socket.id);
    console.log(`🚪 EXIT CARD GAME in room ${roomCode}`);
    
    if (rooms[roomCode]) {
      rooms[roomCode].cardGame = null;
      io.to(roomCode).emit('card_game_exited');
      console.log(`✅ Card game exited in room ${roomCode}`);
    }
  });

  // UPDATED: Reset card game - properly broadcast to all players
  socket.on('card_game_reset', ({ roomCode }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 RESET CARD GAME in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].players.length > 0) {
      try {
        // Clear any winner state first
        if (rooms[roomCode].cardGame) {
          rooms[roomCode].cardGame.winner = null;
        }
        
        rooms[roomCode].cardGame = initializeCardGame(rooms[roomCode].players);
        
        // NEW: Emit reset event to all players first
        io.to(roomCode).emit('card_game_reset');
        
        // Then send the updated game state
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

  // UPDATED: Shuffle deck - Only shuffle table cards and draw pile, keep player hands unchanged
  socket.on('card_game_shuffle', ({ roomCode }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔀 SHUFFLE CARDS (Table + Draw Pile) in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      
      // Combine only table cards and draw pile
      const cardsToShuffle = [...game.drawPile, ...game.tableCards];
      
      if (cardsToShuffle.length === 0) {
        console.log('❌ No cards to shuffle');
        socket.emit('card_game_error', { message: 'No cards available to shuffle' });
        return;
      }
      
      const shuffled = shuffleDeck(cardsToShuffle);
      
      // Update draw pile with shuffled cards
      game.drawPile = shuffled;
      
      // Clear table cards
      game.tableCards = [];
      
      // Player hands remain unchanged
      
      io.to(roomCode).emit('card_game_state_update', game);
      console.log(`✅ Cards shuffled. Table cards moved to draw pile. Draw pile: ${game.drawPile.length} cards, Table: ${game.tableCards.length} cards`);
      console.log(`   Player hands remain unchanged`);
      
      // Send message to all players
      io.to(roomCode).emit('card_game_message', {
        type: 'shuffle',
        message: `تم خلط ${shuffled.length} بطاقة من الطاولة والمجموعة!`,
        shuffledCards: shuffled.length
      });
      
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // Random photos question handler
  socket.on('play_random_question', ({ roomCode, subcategoryId }) => {
    updatePlayerActivity(socket.id);
    console.log(`📸 PLAY RANDOM QUESTION for subcategory: ${subcategoryId} in room: ${roomCode}`);
    
    if (rooms[roomCode]) {
      const room = rooms[roomCode];
      
      room.activePlayer = null;
      room.buzzerLocked = false;
      io.to(roomCode).emit('reset_buzzer');
      
      if (!randomPhotosData['random-photos']) {
        console.error('Random photos category not found in data');
        return;
      }
      
      if (!randomPhotosData['random-photos'][subcategoryId]) {
        console.error(`Subcategory ${subcategoryId} not found in random-photos category`);
        console.log('Available subcategories:', Object.keys(randomPhotosData['random-photos']));
        return;
      }

      const subcatQuestions = randomPhotosData['random-photos'][subcategoryId];
      
      if (!subcatQuestions || subcatQuestions.length === 0) {
        console.error(`No questions found for subcategory: ${subcategoryId}`);
        return;
      }

      const availableIndices = [...Array(subcatQuestions.length).keys()];
      
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
        
        io.to(player.socketId).emit('player_photo_question', randomQuestion);
      });
      
      console.log(`✅ Sent random photos to players in room ${roomCode}`);
    }
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
    
    // NEW: Remove from activity tracking
    delete playerActivity[socket.id];
    
    const roomCode = socket.data?.roomCode;
    const playerId = socket.data?.playerId;
    
    if (roomCode && rooms[roomCode] && playerId) {
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      if (player) {
        rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== playerId);
        console.log(`❌ ${player.name} disconnected from room ${roomCode}`);
        
        if (rooms[roomCode].players.length === 0) {
          delete rooms[roomCode];
          console.log(`🏠 Room ${roomCode} closed (no players)`);
        }
      }
    }
  });

  // Existing quiz game events - ALL UPDATED with activity tracking
  socket.on('buzz', ({ roomCode, playerId }) => {
    updatePlayerActivity(socket.id);
    if (rooms[roomCode]) {
      rooms[roomCode].activePlayer = playerId;
      rooms[roomCode].buzzerLocked = true;
      io.to(roomCode).emit('player_buzzed', playerId);
    }
  });

  socket.on('reset_buzzer', (roomCode) => {
    updatePlayerActivity(socket.id);
    if (rooms[roomCode]) {
      rooms[roomCode].activePlayer = null;
      rooms[roomCode].buzzerLocked = false;
      io.to(roomCode).emit('reset_buzzer');
    }
  });

  socket.on('update_score', ({ roomCode, playerId, change }) => {
    updatePlayerActivity(socket.id);
    if (rooms[roomCode]) {
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      if (player) {
        player.score += change;
        io.to(roomCode).emit('update_score', player);
      }
    }
  });

  socket.on('change_question', ({ roomCode, question }) => {
    updatePlayerActivity(socket.id);
    if (rooms[roomCode]) {
      rooms[roomCode].currentQuestion = question;
      io.to(roomCode).emit('question_changed', question);
    }
  });

  socket.on('end_game', (roomCode) => {
    updatePlayerActivity(socket.id);
    if (rooms[roomCode]) {
      io.to(roomCode).emit('game_ended');
    }
  });

  socket.on('leave_room', ({ roomCode, playerId }) => {
    updatePlayerActivity(socket.id);
    if (rooms[roomCode]) {
      rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== playerId);
      io.to(roomCode).emit('player_left', playerId);
      
      if (rooms[roomCode].players.length === 0) {
        delete rooms[roomCode];
      }
    }
  });

  socket.on('play_audio', (roomCode) => {
    updatePlayerActivity(socket.id);
    io.to(roomCode).emit('play_audio');
  });

  socket.on('pause_audio', (roomCode) => {
    updatePlayerActivity(socket.id);
    io.to(roomCode).emit('pause_audio');
  });

  socket.on('continue_audio', (roomCode, time) => {
    updatePlayerActivity(socket.id);
    io.to(roomCode).emit('continue_audio', time);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🃏 Card game system ready!`);
  console.log(`📸 Random photos system ready!`);
  console.log(`🖊️ Whiteboard system ready!`);
  console.log(`🎲 Dice system ready with ${gameCategories.length} categories!`);
  console.log(`🎯 Private dice rolls enabled - only showing to rolling player`);
  console.log(`🔀 Shuffle system ready - table cards move to draw pile only`);
  console.log(`⏰ Inactivity timeout enabled - players will be disconnected after 5 minutes of inactivity`);
  console.log(`🏆 Win condition enabled - players can now reach level 5 and win the game!`);
  console.log(`🔄 Any player can now reset the game from winner modal!`);
});