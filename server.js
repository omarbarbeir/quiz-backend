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

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Import data files
const cardData = require('./data/cardData');
const randomPhotosData = require('./data_random');

// Game categories - Numbers 1 to 12 only
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
  }
];

const rooms = {};
const pendingActions = {};

// Utility functions
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

function generateLargeDeck(baseDeck, targetSize = 60) {
  console.log(`🃏 Generating large deck: ${baseDeck.length} base cards → ${targetSize} target size`);
  
  const largeDeck = [...baseDeck];
  
  while (largeDeck.length < targetSize) {
    const cardsToAdd = Math.min(baseDeck.length, targetSize - largeDeck.length);
    for (let i = 0; i < cardsToAdd; i++) {
      const originalCard = baseDeck[i % baseDeck.length];
      const newCard = {
        ...originalCard,
        id: largeDeck.length + 1,
        name: `${originalCard.name} (${Math.floor(largeDeck.length / baseDeck.length) + 1})`
      };
      largeDeck.push(newCard);
    }
  }
  
  console.log(`✅ Generated ${largeDeck.length} cards for the deck`);
  return largeDeck;
}

function initializeCardGame(players) {
  console.log('🃏 Initializing card game for players:', players.map(p => p.name));
  
  // Filter out action cards except joker
  const filteredDeck = cardData.deck.filter(card => 
    card.type !== 'action' || card.subtype === 'joker'
  );
  
  const largeDeck = generateLargeDeck(filteredDeck, 60);
  const shuffledDeck = shuffleDeck(largeDeck);
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

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  // Create room
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
      }
    };
    
    socket.emit('room_created', roomCode);
    socket.join(roomCode);
    console.log(`🏠 Room created: ${roomCode}`);
  });

  // Join room
  socket.on('join_room', ({ roomCode, player }) => {
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

  // WHITEBOARD EVENTS - FIXED: Using old whiteboard system
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

  // CARD GAME EVENTS
  socket.on('card_game_initialize', ({ roomCode }) => {
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
      
      // REMOVED ACTION CARD HANDLING - ONLY JOKER REMAINS
      game.tableCards.push(card);
      
      game.playerHasDrawn[playerId] = false;
      
      delete game.skippedPlayers[playerId];
      
      let nextPlayerId = getNextPlayer(roomCode, playerId);
      while (game.skippedPlayers[nextPlayerId]) {
        console.log(`⏭️ Skipping ${nextPlayerId} because they are skipped`);
        delete game.skippedPlayers[nextPlayerId];
        nextPlayerId = getNextPlayer(roomCode, nextPlayerId);
      }
      game.currentTurn = nextPlayerId;
      
      io.to(roomCode).emit('card_game_state_update', game);
      console.log(`✅ Card played to table. Table cards: ${game.tableCards.length}. Next turn: ${game.currentTurn}`);
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // Take card from table
  socket.on('card_game_take_table', ({ roomCode, playerId, cardId }) => {
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

      const [card] = game.tableCards.splice(-1, 1);
      game.playerHands[playerId].push(card);
      game.playerHasDrawn[playerId] = true;
      
      io.to(roomCode).emit('card_game_state_update', game);
      console.log(`✅ Top card taken from table. Table cards: ${game.tableCards.length}. Player must now discard.`);
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // INDEPENDENT DICE FUNCTION
  socket.on('card_game_roll_dice', ({ roomCode, playerId }) => {
    console.log(`🎲 INDEPENDENT DICE ROLL by player ${playerId} in room ${roomCode}`);
    
    const diceValue = Math.floor(Math.random() * 12) + 1;
    
    socket.emit('card_game_dice_rolled', { diceValue });
    
    console.log(`🎯 Player ${playerId} rolled dice: ${diceValue}`);
    console.log(`   ✅ Dice is completely independent - no game state changes`);
  });

  // Move card to circle
  socket.on('card_game_move_to_circle', ({ roomCode, playerId, circleIndex, cardId }) => {
    console.log(`🔄 MOVE TO CIRCLE by player ${playerId}, card ${cardId} to circle ${circleIndex} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      
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

  // Challenge response
  socket.on('card_game_challenge_response', ({ roomCode, playerId, accept, declaredPlayerId }) => {
    console.log(`⚖️ CHALLENGE RESPONSE by player ${playerId}: ${accept ? 'ACCEPT' : 'REJECT'} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      
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
          
          for (let i = 0; i < 3; i++) {
            if (game.drawPile.length > 0) {
              const drawnCard = game.drawPile.pop();
              game.playerHands[declaredPlayerId].push(drawnCard);
            }
          }
          
          game.currentTurn = getNextPlayer(roomCode, declaredPlayerId);
          
          console.log(`✅ ${completedPlayer.name} completed category: Category ${game.declaredCategory.category?.id}`);
          console.log(`   Moved ${completedCards.length} circle cards to BOTTOM of table`);
          console.log(`   Player drew 3 new cards from pile`);
          console.log(`   Level: ${game.playerLevels[declaredPlayerId]}`);
          console.log(`   Turn goes to NEXT player: ${game.currentTurn}`);
        }
      } else {
        game.currentTurn = getNextPlayer(roomCode, playerId);
      }
      
      game.challengeInProgress = false;
      game.declaredCategory = null;
      
      io.to(roomCode).emit('card_game_state_update', game);
      console.log(`✅ Challenge resolved. Next turn: ${game.currentTurn}`);
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // NEW: Exit card game and return to categories
  socket.on('card_game_exit', ({ roomCode }) => {
    console.log(`🚪 EXIT CARD GAME in room ${roomCode}`);
    
    if (rooms[roomCode]) {
      rooms[roomCode].cardGame = null;
      io.to(roomCode).emit('card_game_exited');
      console.log(`✅ Card game exited in room ${roomCode}`);
    }
  });

  // NEW: Reset card game
  socket.on('card_game_reset', ({ roomCode }) => {
    console.log(`🔄 RESET CARD GAME in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].players.length > 0) {
      try {
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

  // Use action card - SIMPLIFIED: Only joker remains
  socket.on('card_game_use_action', ({ roomCode, playerId, cardId, actionType }) => {
    console.log(`🎭 USE ACTION CARD by player ${playerId}: ${actionType} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      
      const cardIndex = game.playerHands[playerId].findIndex(c => c.id === cardId);
      if (cardIndex === -1) {
        console.log(`❌ Action card ${cardId} not found in player's hand`);
        socket.emit('card_game_error', { message: 'Action card not found in hand' });
        return;
      }

      // Remove action card from player's hand
      const [actionCard] = game.playerHands[playerId].splice(cardIndex, 1);

      // Only handle joker - other action cards are removed
      if (actionType === 'joker') {
        // Joker can be used anytime - no restrictions
        console.log(`✅ Joker card used by ${playerId}`);
        game.drawPile.unshift(actionCard);
        
        io.to(roomCode).emit('card_game_state_update', game);
        console.log(`✅ Joker card used successfully by player ${playerId}`);
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

  // Shuffle deck
  socket.on('card_game_shuffle', ({ roomCode }) => {
    console.log(`🔀 SHUFFLE DECK in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      
      const allCards = [...game.drawPile, ...game.tableCards];
      Object.values(game.playerHands).forEach(hand => {
        allCards.push(...hand);
      });
      
      const shuffled = shuffleDeck(allCards);
      
      game.drawPile = shuffled;
      game.tableCards = [];
      
      Object.keys(game.playerHands).forEach(playerId => {
        game.playerHands[playerId] = game.drawPile.splice(0, 5);
      });
      
      io.to(roomCode).emit('card_game_state_update', game);
      console.log(`✅ Deck shuffled. Draw pile: ${shuffled.length} cards`);
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // FIXED: Random photos question handler - using OLD system
  socket.on('play_random_question', ({ roomCode, subcategoryId }) => {
    console.log(`📸 PLAY RANDOM QUESTION for subcategory: ${subcategoryId} in room: ${roomCode}`);
    
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
      
      console.log(`✅ Sent random photos to players in room ${roomCode}`);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
    
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

  // Existing quiz game events (keep these for backward compatibility)
  socket.on('buzz', ({ roomCode, playerId }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].activePlayer = playerId;
      rooms[roomCode].buzzerLocked = true;
      io.to(roomCode).emit('player_buzzed', playerId);
    }
  });

  socket.on('reset_buzzer', (roomCode) => {
    if (rooms[roomCode]) {
      rooms[roomCode].activePlayer = null;
      rooms[roomCode].buzzerLocked = false;
      io.to(roomCode).emit('reset_buzzer');
    }
  });

  socket.on('update_score', ({ roomCode, playerId, change }) => {
    if (rooms[roomCode]) {
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      if (player) {
        player.score += change;
        io.to(roomCode).emit('update_score', player);
      }
    }
  });

  socket.on('change_question', ({ roomCode, question }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].currentQuestion = question;
      io.to(roomCode).emit('question_changed', question);
    }
  });

  socket.on('end_game', (roomCode) => {
    if (rooms[roomCode]) {
      io.to(roomCode).emit('game_ended');
    }
  });

  socket.on('leave_room', ({ roomCode, playerId }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== playerId);
      io.to(roomCode).emit('player_left', playerId);
      
      if (rooms[roomCode].players.length === 0) {
        delete rooms[roomCode];
      }
    }
  });

  socket.on('play_audio', (roomCode) => {
    io.to(roomCode).emit('play_audio');
  });

  socket.on('pause_audio', (roomCode) => {
    io.to(roomCode).emit('pause_audio');
  });

  socket.on('continue_audio', (roomCode, time) => {
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
});