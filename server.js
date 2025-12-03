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

// Socket.IO config
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Import data files
const cardData = require('./data/cardData');
const randomPhotosData = require('./data_random');

// Game categories
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
  { 
    id: 37, 
    name: 'الفئة 37', 
    description: 'أفلام فيها البطل بيقتل حد',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 38, 
    name: 'الفئة 38', 
    description: 'أفلام بيحصل فيها انفصال بين اتنين (حتي إذا رجعوا بعد كده لبعض عادي)',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 39, 
    name: 'الفئة 39', 
    description: 'ممثلين مثلوا مع احمد عز و كريم عبد العزيز (مش لازم يكونوا في نفس الفيلم)',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 40, 
    name: 'الفئة 40', 
    description: 'ممثلين مثلوا مع احمد عز و أحمد السقا (مش لازم يكونوا في نفس الفيلم)',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 41, 
    name: 'الفئة 41', 
    description: 'فيلم فيه أغنية و تقول جزء من الأغنية',
    rules: 'اجمع ٣ بطاقات'
  },
  { 
    id: 42, 
    name: 'الفئة 42', 
    description: 'ممثل تقدر تقول إسم شخصيته في فيلمين',
    rules: 'اجمع ٣ بطاقات'
  },
];

const rooms = {};
const pendingActions = {};
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
  
  // Get only non-admin players for turn order
  const nonAdminPlayers = room.players.filter(p => !p.isAdmin);
  if (nonAdminPlayers.length === 0) return null;
  
  const currentIndex = nonAdminPlayers.findIndex(p => p.id === currentPlayerId);
  const nextIndex = (currentIndex + 1) % nonAdminPlayers.length;
  return nonAdminPlayers[nextIndex].id;
}

function getNextNonSkippedPlayer(roomCode, currentPlayerId, skippedPlayers) {
  let nextPlayerId = getNextPlayer(roomCode, currentPlayerId);
  let skippedCount = 0;
  const room = rooms[roomCode];
  const nonAdminPlayers = room.players.filter(p => !p.isAdmin);
  const totalPlayers = nonAdminPlayers.length;
  
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

function updatePlayerActivity(socketId) {
  playerActivity[socketId] = Date.now();
}

function checkInactivePlayers() {
  const now = Date.now();
  const FIVE_MINUTES = 5 * 60 * 1000;
  
  Object.keys(playerActivity).forEach(socketId => {
    const lastActivity = playerActivity[socketId];
    if (now - lastActivity > FIVE_MINUTES) {
      console.log(`⏰ Disconnecting inactive socket ${socketId}`);
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
        delete playerActivity[socketId];
      }
    }
  });
}

setInterval(checkInactivePlayers, 60000);

function initializeCardGame(players) {
  console.log('🃏 Initializing card game for players:', players.map(p => p.name));
  
  const filteredDeck = cardData.deck.filter(card => 
    card.type !== 'action' || 
    card.subtype === 'joker' || 
    card.subtype === 'skip' ||
    card.subtype === 'shake' ||
    card.subtype === 'exchange' ||
    card.subtype === 'collective_exchange'
  );
  
  console.log(`🃏 Total cards in filtered deck: ${filteredDeck.length}`);
  
  const shuffledDeck = shuffleDeck(filteredDeck);
  const playerHands = {};
  
  // Only deal cards to non-admin players
  const nonAdminPlayers = players.filter(p => !p.isAdmin);
  
  nonAdminPlayers.forEach(player => {
    playerHands[player.id] = shuffledDeck.splice(0, 5);
    console.log(`   Dealt 5 cards to ${player.name}:`, playerHands[player.id].map(card => ({ 
      name: card.name, 
      type: card.type, 
      subtype: card.subtype 
    })));
  });

  // Admin players get empty hands
  players.filter(p => p.isAdmin).forEach(admin => {
    playerHands[admin.id] = [];
  });

  console.log(`🃏 Remaining cards in draw pile: ${shuffledDeck.length}`);

  // Start with first non-admin player
  const firstPlayer = nonAdminPlayers[0]?.id || null;

  return {
    deck: shuffledDeck,
    drawPile: shuffledDeck,
    tableCards: [],
    playerHands,
    currentTurn: firstPlayer,
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
    winner: null,
    activeShake: null,
    activeExchange: null,
    activeCollectiveExchange: null,
    exchangeInitiator: null,
    exchangeRequests: {},
    shakeSelectedPlayer: null,
    shakePlacedCards: {}
  };
}

// Helper function to get all available cards from player (hand + circles)
function getAllPlayerCards(game, playerId) {
  const handCards = game.playerHands[playerId] || [];
  const circleCards = (game.playerCircles[playerId] || []).filter(card => card !== null);
  return [...handCards, ...circleCards];
}

// Helper function to remove card from player (hand or circle)
function removeCardFromPlayer(game, playerId, cardId) {
  // First check hand
  const handIndex = game.playerHands[playerId].findIndex(c => c.id === cardId);
  if (handIndex !== -1) {
    const [card] = game.playerHands[playerId].splice(handIndex, 1);
    return { card, source: 'hand' };
  }
  
  // Check circles
  const circleIndex = game.playerCircles[playerId].findIndex(c => c && c.id === cardId);
  if (circleIndex !== -1) {
    const card = game.playerCircles[playerId][circleIndex];
    game.playerCircles[playerId][circleIndex] = null;
    return { card, source: 'circle' };
  }
  
  return null;
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  updatePlayerActivity(socket.id);

  // Create room
  socket.on('create_room', () => {
    updatePlayerActivity(socket.id);
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      players: [],
      admin: socket.id,
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
    console.log(`🏠 Room created: ${roomCode} by admin ${socket.id}`);
  });

  // Join room
  socket.on('join_room', ({ roomCode, player }) => {
    updatePlayerActivity(socket.id);
    console.log(`👤 Player ${player.name} joining room: ${roomCode}`);
    
    if (rooms[roomCode]) {
      const playerWithSocket = { 
        ...player, 
        socketId: socket.id,
        isAdmin: socket.id === rooms[roomCode].admin
      };
      rooms[roomCode].players.push(playerWithSocket);
      socket.join(roomCode);
      
      socket.emit('player_joined', player);
      io.to(roomCode).emit('player_joined', player);
      
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

  // Draw card from pile - ADMIN CANNOT PLAY
  socket.on('card_game_draw', ({ roomCode, playerId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🃏 DRAW CARD by player ${playerId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      // Admin cannot play
      if (player && player.isAdmin) {
        console.log(`❌ Admin ${playerId} cannot play`);
        socket.emit('card_game_error', { message: 'Admin cannot play the game' });
        return;
      }
      
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

  // Play card to table - ADMIN CANNOT PLAY
  socket.on('card_game_play_table', ({ roomCode, playerId, cardId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🃏 PLAY TO TABLE by player ${playerId} with card ${cardId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      // Admin cannot play
      if (player && player.isAdmin) {
        console.log(`❌ Admin ${playerId} cannot play`);
        socket.emit('card_game_error', { message: 'Admin cannot play the game' });
        return;
      }
      
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

  // Take card from table - ADMIN CANNOT PLAY
  socket.on('card_game_take_table', ({ roomCode, playerId, cardId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🃏 TAKE FROM TABLE by player ${playerId} for card ${cardId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      // Admin cannot play
      if (player && player.isAdmin) {
        console.log(`❌ Admin ${playerId} cannot play`);
        socket.emit('card_game_error', { message: 'Admin cannot play the game' });
        return;
      }
      
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

  // Use skip card - ADMIN CANNOT PLAY
  socket.on('card_game_use_skip', ({ roomCode, playerId, cardId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🎭 USE SKIP CARD by player ${playerId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      // Admin cannot play
      if (player && player.isAdmin) {
        console.log(`❌ Admin ${playerId} cannot play`);
        socket.emit('card_game_error', { message: 'Admin cannot play the game' });
        return;
      }
      
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
      
      const nextPlayerId = getNextPlayer(roomCode, playerId);
      game.skippedPlayers[nextPlayerId] = true;
      
      game.tableCards.push(skipCard);
      
      game.playerHasDrawn[playerId] = false;
      delete game.skippedPlayers[playerId];
      
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

  // Use shake card - ADMIN CANNOT PLAY
  socket.on('card_game_use_shake', ({ roomCode, playerId, cardId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 USE SHAKE CARD by player ${playerId} in room ${roomCode}, cardId: ${cardId}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const room = rooms[roomCode];
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      // Admin cannot play
      if (player && player.isAdmin) {
        console.log(`❌ Admin ${playerId} cannot play`);
        socket.emit('card_game_error', { message: 'Admin cannot play the game' });
        return;
      }
      
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
        console.log(`❌ Shake card ${cardId} not found in player's hand`);
        socket.emit('card_game_error', { message: 'Shake card not found in hand' });
        return;
      }

      const [shakeCard] = game.playerHands[playerId].splice(cardIndex, 1);
      
      game.tableCards.push(shakeCard);
      
      // Reset shake state properly
      game.activeShake = {
        playerId: playerId,
        card: shakeCard,
        selectedPlayer: null,
        placedCards: {},
        canComplete: false
      };
      
      io.to(roomCode).emit('card_game_state_update', game);
      
      io.to(roomCode).emit('card_game_open_shake_square', {
        playerId: playerId,
        playerName: room.players.find(p => p.id === playerId)?.name || 'لاعب',
        actionCard: shakeCard
      });
      
      console.log(`✅ Shake card used by ${playerId}. Card placed on table. Shake square opened for ALL players.`);
      
      const currentPlayer = room.players.find(p => p.id === playerId);
      io.to(roomCode).emit('card_game_message', {
        type: 'shake',
        message: `${currentPlayer?.name || 'لاعب'} استخدم بطاقة نفض نفسك! يمكن للاعب واحد فقط وضع بطاقاته.`,
        playerId: playerId
      });
      
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // FIXED: Use exchange card - ADMIN CANNOT PLAY
  socket.on('card_game_use_exchange', ({ roomCode, playerId, cardId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 USE EXCHANGE CARD by player ${playerId} in room ${roomCode}, cardId: ${cardId}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const room = rooms[roomCode];
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      // Admin cannot play
      if (player && player.isAdmin) {
        console.log(`❌ Admin ${playerId} cannot play`);
        socket.emit('card_game_error', { message: 'Admin cannot play the game' });
        return;
      }
      
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
        console.log(`❌ Exchange card ${cardId} not found in player's hand`);
        socket.emit('card_game_error', { message: 'Exchange card not found in hand' });
        return;
      }

      const [exchangeCard] = game.playerHands[playerId].splice(cardIndex, 1);
      
      game.tableCards.push(exchangeCard);
      
      // Set up exchange state - initiator chooses a card first, then one other player chooses
      game.activeExchange = {
        initiatorId: playerId,
        card: exchangeCard,
        initiatorCard: null, // Card chosen by initiator
        initiatorSource: null, // Source of initiator's card (hand/circle)
        responderId: null, // Player who responds to exchange
        responderCard: null, // Card chosen by responder
        responderSource: null, // Source of responder's card (hand/circle)
        waitingForInitiator: true,
        waitingForResponder: false
      };
      
      io.to(roomCode).emit('card_game_state_update', game);
      
      // Only initiator chooses first
      socket.emit('card_game_exchange_choose_card', {
        initiatorId: playerId,
        actionCard: exchangeCard,
        message: 'اختر بطاقة من يدك أو دوائرك للتبادل'
      });
      
      // Notify other players to wait AND SHOW THEIR CARDS
      socket.to(roomCode).emit('card_game_exchange_waiting_with_cards', {
        initiatorId: playerId,
        initiatorName: room.players.find(p => p.id === playerId)?.name || 'لاعب',
        message: 'بانتظار اختيار اللاعب لبطاقته - يمكنك رؤية بطاقاتك لكن لا يمكنك الاختيار حتى يختار اللاعب الآخر'
      });
      
      console.log(`✅ Exchange card used by ${playerId}. Waiting for initiator to choose a card. Other players can see their cards.`);
      
      const currentPlayer = room.players.find(p => p.id === playerId);
      io.to(roomCode).emit('card_game_message', {
        type: 'exchange',
        message: `${currentPlayer?.name || 'لاعب'} استخدم بطاقة هات و خد! عليه اختيار بطاقة أولاً.`,
        playerId: playerId
      });
      
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // NEW: Use collective exchange card - SAME AS REGULAR EXCHANGE
  socket.on('card_game_use_collective_exchange', ({ roomCode, playerId, cardId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 USE COLLECTIVE EXCHANGE CARD by player ${playerId} in room ${roomCode}, cardId: ${cardId}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const room = rooms[roomCode];
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      // Admin cannot play
      if (player && player.isAdmin) {
        console.log(`❌ Admin ${playerId} cannot play`);
        socket.emit('card_game_error', { message: 'Admin cannot play the game' });
        return;
      }
      
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
        console.log(`❌ Collective exchange card ${cardId} not found in player's hand`);
        socket.emit('card_game_error', { message: 'Collective exchange card not found in hand' });
        return;
      }

      const [collectiveExchangeCard] = game.playerHands[playerId].splice(cardIndex, 1);
      
      game.tableCards.push(collectiveExchangeCard);
      
      // Set up collective exchange state
      game.activeCollectiveExchange = {
        initiatorId: playerId,
        card: collectiveExchangeCard,
        initiatorCard: null, // Card chosen by initiator
        initiatorSource: null, // Source of initiator's card (hand/circle)
        responderId: null, // Player who responds to exchange
        responderCard: null, // Card chosen by responder
        responderSource: null, // Source of responder's card (hand/circle)
        waitingForInitiator: true,
        waitingForResponder: false
      };
      
      io.to(roomCode).emit('card_game_state_update', game);
      
      // Only initiator chooses first
      socket.emit('card_game_collective_exchange_choose_card', {
        initiatorId: playerId,
        actionCard: collectiveExchangeCard,
        message: 'اختر بطاقة من يدك أو دوائرك للتبادل الجماعي'
      });
      
      // Notify other players to wait AND SHOW THEIR CARDS
      socket.to(roomCode).emit('card_game_collective_exchange_waiting_with_cards', {
        initiatorId: playerId,
        initiatorName: room.players.find(p => p.id === playerId)?.name || 'لاعب',
        message: 'بانتظار اختيار اللاعب لبطاقته - يمكنك رؤية بطاقاتك لكن لا يمكنك الاختيار حتى يختار اللاعب الآخر'
      });
      
      console.log(`✅ Collective exchange card used by ${playerId}. Waiting for initiator to choose a card. Other players can see their cards.`);
      
      const currentPlayer = room.players.find(p => p.id === playerId);
      io.to(roomCode).emit('card_game_message', {
        type: 'collective_exchange',
        message: `${currentPlayer?.name || 'لاعب'} استخدم بطاقة كل واحد يطلع باللي معاه! عليه اختيار بطاقة أولاً.`,
        playerId: playerId
      });
      
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // FIXED: Initiator chooses card for exchange (hand OR circle)
  socket.on('card_game_exchange_choose_card', ({ roomCode, playerId, cardId, source }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 EXCHANGE CHOOSE CARD by initiator ${playerId} in room ${roomCode}, cardId: ${cardId}, source: ${source}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const room = rooms[roomCode];
      
      if (!game.activeExchange) {
        console.log(`❌ No active exchange`);
        socket.emit('card_game_error', { message: 'No active exchange' });
        return;
      }

      if (playerId !== game.activeExchange.initiatorId) {
        console.log(`❌ Only initiator can choose card first`);
        socket.emit('card_game_error', { message: 'Only initiator can choose card first' });
        return;
      }

      if (!game.activeExchange.waitingForInitiator) {
        console.log(`❌ Not waiting for initiator card choice`);
        socket.emit('card_game_error', { message: 'Not waiting for initiator card choice' });
        return;
      }

      // Find and remove the selected card from hand or circle
      const removalResult = removeCardFromPlayer(game, playerId, cardId);
      if (!removalResult) {
        console.log(`❌ Selected card ${cardId} not found in player's hand or circles`);
        socket.emit('card_game_error', { message: 'Selected card not found' });
        return;
      }

      const { card: selectedCard, source: cardSource } = removalResult;
      
      game.activeExchange.initiatorCard = selectedCard;
      game.activeExchange.initiatorSource = cardSource;
      game.activeExchange.waitingForInitiator = false;
      game.activeExchange.waitingForResponder = true;
      
      io.to(roomCode).emit('card_game_state_update', game);
      
      // Notify all players that initiator has chosen
      io.to(roomCode).emit('card_game_exchange_initiator_chosen', {
        initiatorId: playerId,
        initiatorName: room.players.find(p => p.id === playerId)?.name || 'لاعب',
        initiatorCard: selectedCard,
        initiatorSource: cardSource,
        message: `${room.players.find(p => p.id === playerId)?.name || 'لاعب'} اختار بطاقة. الآن يمكن للاعب الآخر اختيار بطاقة للتبادل.`
      });
      
      console.log(`✅ Initiator ${playerId} chose card: ${selectedCard.name} from ${cardSource}. Now waiting for responder.`);
      
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // NEW: Initiator chooses card for collective exchange (hand OR circle)
  socket.on('card_game_collective_exchange_choose_card', ({ roomCode, playerId, cardId, source }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 COLLECTIVE EXCHANGE CHOOSE CARD by initiator ${playerId} in room ${roomCode}, cardId: ${cardId}, source: ${source}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const room = rooms[roomCode];
      
      if (!game.activeCollectiveExchange) {
        console.log(`❌ No active collective exchange`);
        socket.emit('card_game_error', { message: 'No active collective exchange' });
        return;
      }

      if (playerId !== game.activeCollectiveExchange.initiatorId) {
        console.log(`❌ Only initiator can choose card first`);
        socket.emit('card_game_error', { message: 'Only initiator can choose card first' });
        return;
      }

      if (!game.activeCollectiveExchange.waitingForInitiator) {
        console.log(`❌ Not waiting for initiator card choice`);
        socket.emit('card_game_error', { message: 'Not waiting for initiator card choice' });
        return;
      }

      // Find and remove the selected card from hand or circle
      const removalResult = removeCardFromPlayer(game, playerId, cardId);
      if (!removalResult) {
        console.log(`❌ Selected card ${cardId} not found in player's hand or circles`);
        socket.emit('card_game_error', { message: 'Selected card not found' });
        return;
      }

      const { card: selectedCard, source: cardSource } = removalResult;
      
      game.activeCollectiveExchange.initiatorCard = selectedCard;
      game.activeCollectiveExchange.initiatorSource = cardSource;
      game.activeCollectiveExchange.waitingForInitiator = false;
      game.activeCollectiveExchange.waitingForResponder = true;
      
      io.to(roomCode).emit('card_game_state_update', game);
      
      // Notify all players that initiator has chosen
      io.to(roomCode).emit('card_game_collective_exchange_initiator_chosen', {
        initiatorId: playerId,
        initiatorName: room.players.find(p => p.id === playerId)?.name || 'لاعب',
        initiatorCard: selectedCard,
        initiatorSource: cardSource,
        message: `${room.players.find(p => p.id === playerId)?.name || 'لاعب'} اختار بطاقة. الآن يمكن للاعب الآخر اختيار بطاقة للتبادل.`
      });
      
      console.log(`✅ Collective exchange initiator ${playerId} chose card: ${selectedCard.name} from ${cardSource}. Now waiting for responder.`);
      
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // FIXED: Responder chooses card for exchange (hand OR circle)
  socket.on('card_game_exchange_respond', ({ roomCode, playerId, cardId, source }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 EXCHANGE RESPOND by player ${playerId} in room ${roomCode}, cardId: ${cardId}, source: ${source}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const room = rooms[roomCode];
      
      if (!game.activeExchange) {
        console.log(`❌ No active exchange`);
        socket.emit('card_game_error', { message: 'No active exchange' });
        return;
      }

      if (playerId === game.activeExchange.initiatorId) {
        console.log(`❌ Initiator cannot respond to their own exchange`);
        socket.emit('card_game_error', { message: 'لا يمكنك الرد على تبادلك الخاص' });
        return;
      }

      if (!game.activeExchange.waitingForResponder) {
        console.log(`❌ Not waiting for responder`);
        socket.emit('card_game_error', { message: 'Not waiting for responder' });
        return;
      }

      if (game.activeExchange.responderId) {
        console.log(`❌ Another player already responded to this exchange`);
        socket.emit('card_game_error', { message: 'لاعب آخر استجاب لهذا التبادل مسبقاً' });
        return;
      }

      // Find and remove the selected card from hand or circle
      const removalResult = removeCardFromPlayer(game, playerId, cardId);
      if (!removalResult) {
        console.log(`❌ Selected card ${cardId} not found in player's hand or circles`);
        socket.emit('card_game_error', { message: 'Selected card not found' });
        return;
      }

      const { card: selectedCard, source: cardSource } = removalResult;
      
      game.activeExchange.responderId = playerId;
      game.activeExchange.responderCard = selectedCard;
      game.activeExchange.responderSource = cardSource;
      game.activeExchange.waitingForResponder = false;
      
      // Store exchange data BEFORE resetting activeExchange
      const initiatorId = game.activeExchange.initiatorId;
      const initiatorCard = game.activeExchange.initiatorCard;
      const initiatorSource = game.activeExchange.initiatorSource;
      const responderId = playerId;
      const responderCard = selectedCard;
      const responderSource = cardSource;

      const initiatorPlayer = room.players.find(p => p.id === initiatorId);
      const responderPlayer = room.players.find(p => p.id === responderId);
      
      // Perform the exchange - cards go to HAND of the other player
      game.playerHands[responderId].push(initiatorCard);
      game.playerHands[initiatorId].push(responderCard);
      
      console.log(`🔄 Exchange completed: ${responderId} gave "${responderCard.name}" from ${responderSource} and received "${initiatorCard.name}" from ${initiatorId}'s ${initiatorSource}`);
      
      // Reset exchange state - DO THIS BEFORE USING THE STORED VARIABLES
      const oldExchange = game.activeExchange;
      game.activeExchange = null;
      
      // Update game state
      game.playerHasDrawn[initiatorId] = false;
      delete game.skippedPlayers[initiatorId];
      
      let nextPlayerId = getNextNonSkippedPlayer(roomCode, initiatorId, game.skippedPlayers);
      game.currentTurn = nextPlayerId;
      
      io.to(roomCode).emit('card_game_exchange_completed', {
        initiatorId: initiatorId,
        initiatorName: initiatorPlayer?.name || 'لاعب',
        responderId: responderId,
        responderName: responderPlayer?.name || 'لاعب',
        initiatorCard: initiatorCard,
        responderCard: responderCard,
        initiatorSource: initiatorSource,
        responderSource: responderSource
      });
      
      io.to(roomCode).emit('card_game_message', {
        type: 'exchange_completed',
        message: `🔄 ${responderPlayer?.name || 'لاعب'} تبادل "${responderCard.name}" مع "${initiatorCard.name}" من ${initiatorPlayer?.name || 'اللاعب'}!`,
        initiatorId: initiatorId,
        responderId: responderId
      });
      
      io.to(roomCode).emit('card_game_state_update', game);
      
      console.log(`✅ Exchange completed between ${initiatorId} and ${responderId}. Turn moved to ${nextPlayerId}`);
      
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // NEW: Responder chooses card for collective exchange (hand OR circle)
  socket.on('card_game_collective_exchange_respond', ({ roomCode, playerId, cardId, source }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 COLLECTIVE EXCHANGE RESPOND by player ${playerId} in room ${roomCode}, cardId: ${cardId}, source: ${source}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const room = rooms[roomCode];
      
      if (!game.activeCollectiveExchange) {
        console.log(`❌ No active collective exchange`);
        socket.emit('card_game_error', { message: 'No active collective exchange' });
        return;
      }

      if (playerId === game.activeCollectiveExchange.initiatorId) {
        console.log(`❌ Initiator cannot respond to their own exchange`);
        socket.emit('card_game_error', { message: 'لا يمكنك الرد على تبادلك الخاص' });
        return;
      }

      if (!game.activeCollectiveExchange.waitingForResponder) {
        console.log(`❌ Not waiting for responder`);
        socket.emit('card_game_error', { message: 'Not waiting for responder' });
        return;
      }

      if (game.activeCollectiveExchange.responderId) {
        console.log(`❌ Another player already responded to this collective exchange`);
        socket.emit('card_game_error', { message: 'لاعب آخر استجاب لهذا التبادل مسبقاً' });
        return;
      }

      // Find and remove the selected card from hand or circle
      const removalResult = removeCardFromPlayer(game, playerId, cardId);
      if (!removalResult) {
        console.log(`❌ Selected card ${cardId} not found in player's hand or circles`);
        socket.emit('card_game_error', { message: 'Selected card not found' });
        return;
      }

      const { card: selectedCard, source: cardSource } = removalResult;
      
      game.activeCollectiveExchange.responderId = playerId;
      game.activeCollectiveExchange.responderCard = selectedCard;
      game.activeCollectiveExchange.responderSource = cardSource;
      game.activeCollectiveExchange.waitingForResponder = false;
      
      // Store exchange data BEFORE resetting activeCollectiveExchange
      const initiatorId = game.activeCollectiveExchange.initiatorId;
      const initiatorCard = game.activeCollectiveExchange.initiatorCard;
      const initiatorSource = game.activeCollectiveExchange.initiatorSource;
      const responderId = playerId;
      const responderCard = selectedCard;
      const responderSource = cardSource;

      const initiatorPlayer = room.players.find(p => p.id === initiatorId);
      const responderPlayer = room.players.find(p => p.id === responderId);
      
      // Perform the exchange - cards go to HAND of the other player
      game.playerHands[responderId].push(initiatorCard);
      game.playerHands[initiatorId].push(responderCard);
      
      console.log(`🔄 Collective exchange completed: ${responderId} gave "${responderCard.name}" from ${responderSource} and received "${initiatorCard.name}" from ${initiatorId}'s ${initiatorSource}`);
      
      // Reset collective exchange state
      game.activeCollectiveExchange = null;
      
      // Update game state
      game.playerHasDrawn[initiatorId] = false;
      delete game.skippedPlayers[initiatorId];
      
      let nextPlayerId = getNextNonSkippedPlayer(roomCode, initiatorId, game.skippedPlayers);
      game.currentTurn = nextPlayerId;
      
      io.to(roomCode).emit('card_game_collective_exchange_completed', {
        initiatorId: initiatorId,
        initiatorName: initiatorPlayer?.name || 'لاعب',
        responderId: responderId,
        responderName: responderPlayer?.name || 'لاعب',
        initiatorCard: initiatorCard,
        responderCard: responderCard,
        initiatorSource: initiatorSource,
        responderSource: responderSource
      });
      
      io.to(roomCode).emit('card_game_message', {
        type: 'collective_exchange_completed',
        message: `🔄 ${responderPlayer?.name || 'لاعب'} تبادل "${responderCard.name}" مع "${initiatorCard.name}" من ${initiatorPlayer?.name || 'اللاعب'} في التبادل الجماعي!`,
        initiatorId: initiatorId,
        responderId: responderId
      });
      
      io.to(roomCode).emit('card_game_state_update', game);
      
      console.log(`✅ Collective exchange completed between ${initiatorId} and ${responderId}. Turn moved to ${nextPlayerId}`);
      
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // Cancel exchange
  socket.on('card_game_exchange_cancel', ({ roomCode, playerId }) => {
    updatePlayerActivity(socket.id);
    console.log(`❌ EXCHANGE CANCELLED by player ${playerId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const room = rooms[roomCode];
      
      if (!game.activeExchange) {
        console.log(`❌ No active exchange to cancel`);
        socket.emit('card_game_error', { message: 'No active exchange to cancel' });
        return;
      }

      // Only initiator can cancel
      if (playerId !== game.activeExchange.initiatorId) {
        console.log(`❌ Only initiator can cancel exchange`);
        socket.emit('card_game_error', { message: 'Only initiator can cancel exchange' });
        return;
      }

      // Return initiator's card to hand or circle if they had chosen one
      if (game.activeExchange.initiatorCard) {
        const initiatorSource = game.activeExchange.initiatorSource;
        if (initiatorSource === 'circle') {
          // Find empty circle slot
          const emptyCircleIndex = game.playerCircles[playerId].findIndex(card => card === null);
          if (emptyCircleIndex !== -1) {
            game.playerCircles[playerId][emptyCircleIndex] = game.activeExchange.initiatorCard;
          } else {
            // No empty circle, put in hand
            game.playerHands[playerId].push(game.activeExchange.initiatorCard);
          }
        } else {
          // Return to hand
          game.playerHands[playerId].push(game.activeExchange.initiatorCard);
        }
      }

      const initiatorPlayer = room.players.find(p => p.id === playerId);
      
      // Reset exchange state
      game.activeExchange = null;
      game.playerHasDrawn[playerId] = false;
      delete game.skippedPlayers[playerId];
      
      // Turn remains with initiator
      game.currentTurn = playerId;
      
      io.to(roomCode).emit('card_game_exchange_cancelled', {
        initiatorId: playerId,
        initiatorName: initiatorPlayer?.name || 'لاعب'
      });
      
      io.to(roomCode).emit('card_game_message', {
        type: 'exchange_cancelled',
        message: `❌ ${initiatorPlayer?.name || 'لاعب'} ألغى التبادل.`,
        playerId: playerId
      });
      
      io.to(roomCode).emit('card_game_state_update', game);
      
      console.log(`✅ Exchange cancelled by ${playerId}. Turn remains with initiator.`);
      
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // NEW: Cancel collective exchange
  socket.on('card_game_collective_exchange_cancel', ({ roomCode, playerId }) => {
    updatePlayerActivity(socket.id);
    console.log(`❌ COLLECTIVE EXCHANGE CANCELLED by player ${playerId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const room = rooms[roomCode];
      
      if (!game.activeCollectiveExchange) {
        console.log(`❌ No active collective exchange to cancel`);
        socket.emit('card_game_error', { message: 'No active collective exchange to cancel' });
        return;
      }

      // Only initiator can cancel
      if (playerId !== game.activeCollectiveExchange.initiatorId) {
        console.log(`❌ Only initiator can cancel collective exchange`);
        socket.emit('card_game_error', { message: 'Only initiator can cancel collective exchange' });
        return;
      }

      // Return initiator's card to hand or circle if they had chosen one
      if (game.activeCollectiveExchange.initiatorCard) {
        const initiatorSource = game.activeCollectiveExchange.initiatorSource;
        if (initiatorSource === 'circle') {
          // Find empty circle slot
          const emptyCircleIndex = game.playerCircles[playerId].findIndex(card => card === null);
          if (emptyCircleIndex !== -1) {
            game.playerCircles[playerId][emptyCircleIndex] = game.activeCollectiveExchange.initiatorCard;
          } else {
            // No empty circle, put in hand
            game.playerHands[playerId].push(game.activeCollectiveExchange.initiatorCard);
          }
        } else {
          // Return to hand
          game.playerHands[playerId].push(game.activeCollectiveExchange.initiatorCard);
        }
      }

      const initiatorPlayer = room.players.find(p => p.id === playerId);
      
      // Reset collective exchange state
      game.activeCollectiveExchange = null;
      game.playerHasDrawn[playerId] = false;
      delete game.skippedPlayers[playerId];
      
      // CHANGED: Move turn to next player instead of keeping it with the initiator
      let nextPlayerId = getNextNonSkippedPlayer(roomCode, playerId, game.skippedPlayers);
      game.currentTurn = nextPlayerId;
      
      io.to(roomCode).emit('card_game_collective_exchange_cancelled', {
        initiatorId: playerId,
        initiatorName: initiatorPlayer?.name || 'لاعب'
      });
      
      io.to(roomCode).emit('card_game_message', {
        type: 'collective_exchange_cancelled',
        message: `❌ ${initiatorPlayer?.name || 'لاعب'} ألغى التبادل الجماعي. الدور انتقل للاعب التالي.`,
        playerId: playerId
      });
      
      io.to(roomCode).emit('card_game_state_update', game);
      
      console.log(`✅ Collective exchange cancelled by ${playerId}. Turn moved to ${nextPlayerId}.`);
      
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // Place ALL cards in shake - ADMIN CANNOT PLAY
  socket.on('card_game_shake_place_all', ({ roomCode, playerId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 PLACE ALL CARDS IN SHAKE by player ${playerId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const room = rooms[roomCode];
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      // Admin cannot play
      if (player && player.isAdmin) {
        console.log(`❌ Admin ${playerId} cannot play`);
        socket.emit('card_game_error', { message: 'Admin cannot play the game' });
        return;
      }
      
      if (!game.activeShake) {
        console.log(`❌ No active shake`);
        socket.emit('card_game_error', { message: 'No active shake' });
        return;
      }

      // Check if any player has already placed cards
      const anyPlayerPlacedCards = Object.keys(game.activeShake.placedCards).length > 0;
      if (anyPlayerPlacedCards) {
        console.log(`❌ Another player has already placed cards in this shake`);
        socket.emit('card_game_error', { message: 'لاعب آخر وضع بطاقاته بالفعل في هذا النفض' });
        return;
      }

      // Get ALL cards from player (hand + circles)
      const playerHandCards = [...game.playerHands[playerId]];
      const playerCircleCards = game.playerCircles[playerId].filter(card => card !== null);
      const allPlayerCards = [...playerHandCards, ...playerCircleCards];
      
      if (allPlayerCards.length === 0) {
        console.log(`❌ Player ${playerId} has no cards to place`);
        socket.emit('card_game_error', { message: 'ليس لديك بطاقات لوضعها' });
        return;
      }

      // Move all player's cards to shake (both hand and circles)
      game.playerHands[playerId] = [];
      game.playerCircles[playerId] = [null, null, null, null]; // Clear all circles
      
      if (!game.activeShake.placedCards[playerId]) {
        game.activeShake.placedCards[playerId] = [];
      }
      game.activeShake.placedCards[playerId].push(...allPlayerCards);
      
      // NEW: Enable completion for the initiator
      game.activeShake.canComplete = true;
      
      io.to(roomCode).emit('card_game_shake_all_cards_placed', {
        playerId: playerId,
        playerName: room.players.find(p => p.id === playerId)?.name || 'لاعب',
        cardCount: allPlayerCards.length,
        cards: allPlayerCards,
        canComplete: true // NEW: Notify that completion is now possible
      });
      
      io.to(roomCode).emit('card_game_state_update', game);
      console.log(`✅ Player ${playerId} placed ALL ${allPlayerCards.length} cards in shake (hand: ${playerHandCards.length}, circles: ${playerCircleCards.length}). Completion enabled.`);
      
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // Complete shake process - ADMIN CANNOT PLAY
  socket.on('card_game_complete_shake', ({ roomCode, playerId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 COMPLETE SHAKE by player ${playerId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const room = rooms[roomCode];
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      // Admin cannot play
      if (player && player.isAdmin) {
        console.log(`❌ Admin ${playerId} cannot play`);
        socket.emit('card_game_error', { message: 'Admin cannot play the game' });
        return;
      }
      
      if (!game.activeShake) {
        console.log(`❌ No active shake`);
        socket.emit('card_game_error', { message: 'No active shake' });
        return;
      }

      // NEW: Check if completion is allowed
      if (!game.activeShake.canComplete) {
        console.log(`❌ Cannot complete shake - no player has placed cards yet`);
        socket.emit('card_game_error', { message: 'لا يمكن إكمال النفض حتى يضع أحد اللاعبين بطاقاته' });
        return;
      }

      const shakeInitiatorId = game.activeShake.playerId;
      const placedCards = game.activeShake.placedCards;
      
      console.log(`🔄 Processing shake with placed cards from players:`, Object.keys(placedCards));
      
      // Move all placed cards to table (add to BOTTOM of table cards, not top)
      const allPlacedCards = Object.values(placedCards).flat();
      if (allPlacedCards.length > 0) {
        console.log(`🔄 Adding ${allPlacedCards.length} shaken cards to the BOTTOM of table. Table before: ${game.tableCards.length} cards`);
        
        // Use unshift instead of push to add cards to the beginning (bottom) of the table
        game.tableCards.unshift(...allPlacedCards);
        
        console.log(`✅ Shake completed: ${allPlacedCards.length} cards moved to BOTTOM of table. Table after: ${game.tableCards.length} cards`);
        
        // Give each player 5 new cards from draw pile ONLY
        Object.keys(placedCards).forEach(playerId => {
          const placedCount = placedCards[playerId].length;
          console.log(`🔄 Giving 5 new cards to player ${playerId} who placed ${placedCount} cards. Draw pile: ${game.drawPile.length} cards`);
          
          for (let i = 0; i < 5; i++) {
            if (game.drawPile.length > 0) {
              const drawnCard = game.drawPile.pop();
              game.playerHands[playerId].push(drawnCard);
            } else {
              console.log(`❌ No cards left in draw pile to give to player ${playerId}`);
              break;
            }
          }
          console.log(`✅ Player ${playerId} received 5 new cards after losing ${placedCount} cards. Now has ${game.playerHands[playerId].length} cards`);
        });
      }
      
      // Reset shake state
      game.activeShake = null;
      game.playerHasDrawn[shakeInitiatorId] = false;
      delete game.skippedPlayers[shakeInitiatorId];
      
      let nextPlayerId = getNextNonSkippedPlayer(roomCode, shakeInitiatorId, game.skippedPlayers);
      game.currentTurn = nextPlayerId;
      
      io.to(roomCode).emit('card_game_shake_completed', {
        playerId: playerId,
        totalCards: allPlacedCards.length
      });
      
      io.to(roomCode).emit('card_game_message', {
        type: 'shake_completed',
        message: `تم نفض ${allPlacedCards.length} بطاقة! اللاعبون الذين وضعوا بطاقاتهم حصلوا على 5 بطاقات جديدة.`,
        playerId: playerId
      });
      
      io.to(roomCode).emit('card_game_state_update', game);
      
      console.log(`✅ Shake completed by ${playerId}. ${allPlacedCards.length} cards moved to BOTTOM of table. Turn moved from ${shakeInitiatorId} to ${nextPlayerId}`);
      
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // Dice roll - ADMIN CAN PLAY
  socket.on('card_game_roll_dice', ({ roomCode, playerId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🎲 DICE ROLL by player ${playerId} in room ${roomCode}`);
    
    const diceValue = Math.floor(Math.random() * gameCategories.length) + 1;
    const category = gameCategories.find(cat => cat.id === diceValue);
    
    socket.emit('card_game_dice_rolled', { diceValue });
    
    if (category) {
      socket.emit('card_game_dice_category', { category });
      console.log(`🎯 Player ${playerId} rolled dice: ${diceValue} - Category: ${category.name}`);
    }
  });

  // Move card to circle - ADMIN CANNOT PLAY
  socket.on('card_game_move_to_circle', ({ roomCode, playerId, circleIndex, cardId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 MOVE TO CIRCLE by player ${playerId}, card ${cardId} to circle ${circleIndex} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      // Admin cannot play
      if (player && player.isAdmin) {
        console.log(`❌ Admin ${playerId} cannot play`);
        socket.emit('card_game_error', { message: 'Admin cannot play the game' });
        return;
      }
      
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

  // Remove card from circle - ADMIN CANNOT PLAY
  socket.on('card_game_remove_from_circle', ({ roomCode, playerId, circleIndex }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 REMOVE FROM CIRCLE by player ${playerId} from circle ${circleIndex} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      // Admin cannot play
      if (player && player.isAdmin) {
        console.log(`❌ Admin ${playerId} cannot play`);
        socket.emit('card_game_error', { message: 'Admin cannot play the game' });
        return;
      }
      
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

  // Declare category - ADMIN CANNOT PLAY
  socket.on('card_game_declare', ({ roomCode, playerId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🏆 DECLARE CATEGORY by player ${playerId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const room = rooms[roomCode];
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      // Admin cannot play
      if (player && player.isAdmin) {
        console.log(`❌ Admin ${playerId} cannot play`);
        socket.emit('card_game_error', { message: 'Admin cannot play the game' });
        return;
      }
      
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
        const player = room.players.find(p => p.id === playerId);
        game.declaredCategory = {
          playerId,
          playerName: player?.name || 'Unknown',
          category: game.playerCategories[playerId],
          cards: filledCircles
        };
        game.challengeInProgress = true;
        
        // Reset challenge responses
        game.challengeResponses = {};
        game.challengeRespondedPlayers = [];
        
        io.to(roomCode).emit('card_game_state_update', game);
        console.log(`✅ Category declared by ${playerId}. Waiting for challenge responses.`);
        
      } else {
        console.log(`❌ Not enough valid cards in circles (${filledCircles.length}/3, need at least 2 non-joker cards)`);
        socket.emit('card_game_error', { message: 'Need at least 3 cards in circles with at least 2 non-joker cards' });
      }
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // Challenge response
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

      // Check if player is admin - skip admin voting
      const respondingPlayer = room.players.find(p => p.id === playerId);
      if (respondingPlayer && respondingPlayer.isAdmin) {
        console.log(`❌ Admin ${playerId} cannot vote in challenges`);
        socket.emit('card_game_error', { message: 'Admin cannot vote in challenges' });
        return;
      }

      if (playerId === declaredPlayerId) {
        console.log(`❌ Declaring player cannot respond to their own challenge`);
        socket.emit('card_game_error', { message: 'You cannot respond to your own challenge' });
        return;
      }

      if (!game.challengeRespondedPlayers.includes(playerId)) {
        game.challengeRespondedPlayers.push(playerId);
        game.challengeResponses[playerId] = accept;
        
        console.log(`📝 Player ${playerId} responded: ${accept ? 'ACCEPT' : 'REJECT'}`);
        
        io.to(roomCode).emit('card_game_state_update', game);
      }

      // Get non-admin players excluding declarer
      const nonAdminPlayers = room.players.filter(p => !p.isAdmin);
      const otherPlayers = nonAdminPlayers.filter(p => p.id !== declaredPlayerId);
      
      const allResponded = otherPlayers.every(player => 
        game.challengeRespondedPlayers.includes(player.id)
      );

      if (allResponded) {
        console.log(`✅ All non-admin players have responded. Processing challenge result...`);
        
        const allAccepted = otherPlayers.every(player => 
          game.challengeResponses[player.id] === true
        );

        if (allAccepted) {
          console.log(`🎉 Challenge SUCCESS: All players accepted!`);
          const completedPlayer = room.players.find(p => p.id === declaredPlayerId);
          if (completedPlayer) {
            const completedCards = game.playerCircles[declaredPlayerId].filter(card => card !== null);
            
            // Move completed cards to table
            completedCards.forEach(card => {
              game.tableCards.unshift(card);
            });
            
            // Add to completed categories
            game.completedCategories[declaredPlayerId].push(game.playerCategories[declaredPlayerId]);
            
            // Increase player level
            game.playerLevels[declaredPlayerId] = Math.min(5, game.playerLevels[declaredPlayerId] + 1);
            
            // Clear circles
            game.playerCircles[declaredPlayerId] = [null, null, null, null];
            
            // Give player 3 new cards from draw pile
            for (let i = 0; i < 3; i++) {
              if (game.drawPile.length > 0) {
                const drawnCard = game.drawPile.pop();
                game.playerHands[declaredPlayerId].push(drawnCard);
              }
            }
            
            console.log(`✅ ${completedPlayer.name} completed category and received 3 new cards.`);
            
            // Check for winner and announce to ALL players
            if (game.playerLevels[declaredPlayerId] >= 5) {
              console.log(`🎊 ${completedPlayer.name} WON THE GAME! 🎊`);
              game.winner = declaredPlayerId;
              
              // Announce winner to ALL players including the winner
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
              io.to(roomCode).emit('card_game_message', {
                type: 'challenge_success',
                message: `🎉 ${completedPlayer.name} أكمل الفئة بنجاح!`,
                playerId: declaredPlayerId
              });
            }
          }
        } else {
          console.log(`❌ Challenge FAILED: At least one player rejected`);
          
          const declaringPlayer = room.players.find(p => p.id === declaredPlayerId);
          if (declaringPlayer) {
            console.log(`🔄 ${declaringPlayer.name} keeps their turn after failed challenge`);
            
            io.to(roomCode).emit('card_game_message', {
              type: 'challenge_failed',
              message: `❌ ${declaringPlayer.name} لم يكمل الفئة، لكنه يحتفظ بدوره!`,
              playerId: declaredPlayerId
            });
          }
        }
        
        // Reset challenge state but KEEP THE TURN with declaring player
        game.challengeInProgress = false;
        game.declaredCategory = null;
        game.challengeResponses = {};
        game.challengeRespondedPlayers = [];
        
        // IMPORTANT: Turn remains with the declaring player
        // They must now discard a card to end their turn
        game.currentTurn = declaredPlayerId;
        game.playerHasDrawn[declaredPlayerId] = true; // They need to discard
        
        io.to(roomCode).emit('card_game_state_update', game);
        console.log(`✅ Challenge resolved. Current turn remains with: ${game.currentTurn}`);
      }
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // Reset game by any player
  socket.on('card_game_reset_any_player', ({ roomCode }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 RESET CARD GAME by any player in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].players.length > 0) {
      try {
        // Properly reset all game states including winner
        const newGameState = initializeCardGame(rooms[roomCode].players);
        rooms[roomCode].cardGame = newGameState;
        
        // Emit reset event first to clear winner state on clients
        io.to(roomCode).emit('card_game_reset');
        
        // Then send the new game state
        io.to(roomCode).emit('card_game_state_update', newGameState);
        console.log(`✅ Card game reset successfully by any player in ${roomCode}. All players notified.`);
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

  // Reset card game
  socket.on('card_game_reset', ({ roomCode }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 RESET CARD GAME in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].players.length > 0) {
      try {
        // Properly reset all game states
        rooms[roomCode].cardGame = initializeCardGame(rooms[roomCode].players);
        
        io.to(roomCode).emit('card_game_reset');
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

  // Shuffle deck - ADMIN CAN DO THIS
  socket.on('card_game_shuffle', ({ roomCode }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔀 SHUFFLE CARDS (Table + Draw Pile) in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      
      const cardsToShuffle = [...game.drawPile, ...game.tableCards];
      
      if (cardsToShuffle.length === 0) {
        console.log('❌ No cards to shuffle');
        socket.emit('card_game_error', { message: 'No cards available to shuffle' });
        return;
      }
      
      const shuffled = shuffleDeck(cardsToShuffle);
      
      game.drawPile = shuffled;
      game.tableCards = [];
      
      io.to(roomCode).emit('card_game_state_update', game);
      console.log(`✅ Cards shuffled. Table cards moved to draw pile. Draw pile: ${game.drawPile.length} cards, Table: ${game.tableCards.length} cards`);
      
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
    
    delete playerActivity[socket.id];
    
    const roomCode = socket.data?.roomCode;
    const playerId = socket.data?.playerId;
    
    if (roomCode && rooms[roomCode] && playerId) {
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      if (player) {
        rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== playerId);
        console.log(`❌ ${player.name} disconnected from room ${roomCode}`);
        
        // If admin disconnects, assign new admin
        if (rooms[roomCode].admin === socket.id && rooms[roomCode].players.length > 0) {
          rooms[roomCode].admin = rooms[roomCode].players[0].socketId;
          console.log(`👑 New admin assigned: ${rooms[roomCode].players[0].name}`);
        }
        
        if (rooms[roomCode].players.length === 0) {
          delete rooms[roomCode];
          console.log(`🏠 Room ${roomCode} closed (no players)`);
        }
      }
    }
  });

  // Existing quiz game events
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
});