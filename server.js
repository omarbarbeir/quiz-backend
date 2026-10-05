const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const EventEmitter = require('events');


EventEmitter.defaultMaxListeners = 100;


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

// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"]
//   }
// });


const io = new Server(server, {
  cors: { origin: "*", methods: ["GET","POST"] },
  pingTimeout: 600000,      // 10 minutes (in milliseconds)
  pingInterval: 25000       // send ping every 25 seconds (default)
});

// Import data files (adjust paths as needed)
const cardData = require('./data/cardData');
const randomPhotosData = require('./data_random');
// const swordOfKnowledgeQuestions = require('./data/swordOfKnowledgeQuestions');
const hangmanWordsData = require('./data/hangmanWords');
const mafiosaCases = require('./data/mafiosaCases')
const { casesDatabase } = require('../main/project/src/data/casesData');
const { createMovieTacToeModule } = require('./movieTacToe');
const setupCivilRegistry = require('./civilRegistryNamespace');
const setupMusicServer = require('./musicServer');
// setupCivilRegistry(io);
require('./horrorServer')(io);
require('./urbexServer')(io);
require('./courtServer')(io);
require('./ bankElHazServer')(io);
require('./trapOpponentServer')(io);
require('./guessOpponentServer')(io);
require('./headsUpServer')(io);
require('./movieQuizServer')(io);
require('./investigationServer')(io);
require('./codenamesServer')(io);
require('./tabooServer')(io);
require('./basraServer')(io);
require('./bankServer')(io);
require('./shayebServer')(io);
require('./crazy8Server')(io);
require('./solitaireServer')(io);
require('./spiderServer')(io);
require('./memoryServer')(io);
require('./chessServer')(io);
require('./backgammonServer')(io);
require('./snakesServer')(io);
require('./escapeRoomServer')(io);
const setupSpyServer = require('./spyServer');
const setupReverseServer = require('./reverseServer');
const setupWhoamiServer = require('./whoamiServer');
const setupWhoSaidServer = require('./whoSaidServer');
const setupPutWordServer = require('./putWordServer');
const setupSongForServer = require('./songForServer');
const setupCinemaServer = require('./cinemaServer');
const setupFlagsServer = require('./flagsServer');
const setupAutobisServer = require('./autobisServer');
const setupBattleshipServer = require('./battleshipServer');
const setupSwordServer = require('./swordServer');
const setupHangmanServer = require('./hangmanServer');
const setupBracketServer = require('./bracketServer');
const setupTicTacToeServer = require('./ticTacToeServer');
const setupBingoServer = require('./bingoServer');

// Game categories (your full list – unchanged)
const gameCategories = [
  { id: 1, name: 'الفئة 1', description: 'أفلام كوميدي', rules: 'اجمع ٣ بطاقات' },
  { id: 2, name: 'الفئة 2', description: 'ممثلين غنوا في أفلام', rules: 'اجمع ٣ بطاقات' },
  { id: 3, name: 'الفئة 3', description: 'افلام بإسم البطل', rules: 'اجمع ٣ بطاقات' },
  { id: 4, name: 'الفئة 4', description: 'افلام رومانسية', rules: 'اجمع ٣ بطاقات' },
  { id: 5, name: 'الفئة 5', description: 'ممثلين عملوا أكتر من ٣ أفلام بطولة', rules: 'اجمع ٣ بطاقات' },
  { id: 6, name: 'الفئة 6', description: 'ممثلين مثلوا مع عادل إمام', rules: 'اجمع ٣ بطاقات' },
  { id: 7, name: 'الفئة 7', description: 'ممثلين مثلوا مع بعض في نفس الفيلم', rules: 'اجمع ٣ بطاقات' },
  { id: 8, name: 'الفئة 8', description: 'افلام فيهم حد شرب مخدرات', rules: 'اجمع ٣ بطاقات' },
  { id: 9, name: 'الفئة 9', description: 'ممثلين كانوا هربانين من البوليس في أي فيلم', rules: 'اجمع ٣ بطاقات' },
  { id: 10, name: 'الفئة 10', description: 'افلام اكشن', rules: 'اجمع ٣ بطاقات' },
  { id: 11, name: 'الفئة 11', description: 'افلام فيها حد من الابطال مات', rules: 'اجمع ٣ بطاقات' },
  { id: 12, name: 'الفئة 12', description: 'ممثلين مثلوا دور ظابط', rules: 'اجمع ٣ بطاقات' },
  { id: 13, name: 'الفئة 13', description: 'أفلام فيها فرح', rules: 'اجمع ٣ بطاقات' },
  { id: 14, name: 'الفئة 14', description: 'ممثلين ليهم مشاهد بيأكلوا فيها', rules: 'اجمع ٣ بطاقات' },
  { id: 15, name: 'الفئة 15', description: 'أفلام فيها عصابة', rules: 'اجمع ٣ بطاقات' },
  { id: 16, name: 'الفئة 16', description: 'أفلام فيها شخصية بتنتحل شخصية تانيه', rules: 'اجمع ٣ بطاقات' },
  { id: 17, name: 'الفئة 17', description: 'أفلام فيها مطاردة عربيات', rules: 'اجمع ٣ بطاقات' },
  { id: 18, name: 'الفئة 18', description: 'أفلام إسمها من ٣ كلمات', rules: 'اجمع ٣ بطاقات' },
  { id: 19, name: 'الفئة 19', description: 'ممثلين تقدر تذكر إسم شخصيتهم في فيلم علي الأقل', rules: 'اجمع ٣ بطاقات' },
  { id: 20, name: 'الفئة 20', description: 'فيلم ظهر فيه حمام سباحة', rules: 'اجمع ٣ بطاقات' },
  { id: 21, name: 'الفئة 21', description: 'أفلام البطل فيها دخل السجن', rules: 'اجمع ٣ بطاقات' },
  { id: 22, name: 'الفئة 22', description: 'ممثلين ليهم إخوات في فيلم', rules: 'اجمع ٣ بطاقات' },
  { id: 23, name: 'الفئة 23', description: 'ممثلين عملوا إعلان في التليفزيون', rules: 'اجمع ٣ بطاقات' },
  { id: 24, name: 'الفئة 24', description: 'أفلام ظهر فيها حيوان', rules: 'اجمع ٣ بطاقات' },
  { id: 25, name: 'الفئة 25', description: 'ممثلين تقدر تقول ليهم ٥ أفلام', rules: 'اجمع ٣ بطاقات' },
  { id: 26, name: 'الفئة 26', description: 'أفلام تقدر تقول منها ٣ إفيهات', rules: 'اجمع ٣ بطاقات' },
  { id: 27, name: 'الفئة 27', description: 'ممثلين عيطوا في أفلام', rules: 'اجمع ٣ بطاقات' },
  { id: 28, name: 'الفئة 28', description: 'أفلام حصل فيها جريمة قتل', rules: 'اجمع ٣ بطاقات' },
  { id: 29, name: 'الفئة 29', description: 'أفلام تقدر تقول فيها أسماء ٣ شخصيات في الفيلم غير البطل', rules: 'اجمع ٣ بطاقات' },
  { id: 30, name: 'الفئة 30', description: 'فيلم إسمه من كلمة واحدة', rules: 'اجمع ٣ بطاقات' },
  { id: 31, name: 'الفئة 31', description: 'ممثلات شاركوا في فيلم لأحمد حلمي', rules: 'اجمع ٣ بطاقات' },
  { id: 32, name: 'الفئة 32', description: 'ممثل أو ممثلة عملوا دور دكتور (طبيب)', rules: 'اجمع ٣ بطاقات' },
  { id: 33, name: 'الفئة 33', description: 'ممثلين اتقبض عليهم في فيلم', rules: 'اجمع ٣ بطاقات' },
  { id: 34, name: 'الفئة 34', description: 'أفلام بطليها بيتجوزوا في نهاية الفيلم', rules: 'اجمع ٣ بطاقات' },
  { id: 35, name: 'الفئة 35', description: 'فيلم و ٢ ممثلين موجودين فيه', rules: 'اجمع ٣ بطاقات' },
  { id: 36, name: 'الفئة 36', description: 'أفلام فيها مشهد في عربية', rules: 'اجمع ٣ بطاقات' },
  { id: 37, name: 'الفئة 37', description: 'أفلام فيها البطل بيقتل حد', rules: 'اجمع ٣ بطاقات' },
  { id: 38, name: 'الفئة 38', description: 'أفلام بيحصل فيها انفصال بين اتنين (حتي إذا رجعوا بعد كده لبعض عادي)', rules: 'اجمع ٣ بطاقات' },
  { id: 39, name: 'الفئة 39', description: 'ممثلين مثلوا مع احمد عز و كريم عبد العزيز (مش لازم يكونوا في نفس الفيلم)', rules: 'اجمع ٣ بطاقات' },
  { id: 40, name: 'الفئة 40', description: 'ممثلين مثلوا مع احمد عز و أحمد السقا (مش لازم يكونوا في نفس الفيلم)', rules: 'اجمع ٣ بطاقات' },
  { id: 41, name: 'الفئة 41', description: 'فيلم فيه أغنية و تقول جزء من الأغنية', rules: 'اجمع ٣ بطاقات' },
  { id: 42, name: 'الفئة 42', description: 'ممثل تقدر تقول إسم شخصيته في فيلمين', rules: 'اجمع ٣ بطاقات' },
];

const rooms = {};
const pendingActions = {};
const playerActivity = {};
const hangmanState = {};
const MAX_ATTEMPTS = 6;

const movieTTT = createMovieTacToeModule(io,rooms);


const roomVotes = {};
const mafiosaState = {};
const detectiveGames = {};

if (!global.detectiveGames) {
  global.detectiveGames = {};
}




function getMafiosaState(roomCode) {
  const state = mafiosaState[roomCode];
  if (!state) return null;
  return {
  ap: state.ap,
  maxAp: MAX_AP,
  inventory: state.inventory,
  gameOver: state.gameOver,
  };
}




const playerColorPalette = ['#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316'];

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

  const allPlayers = room.players;
  if (allPlayers.length === 0) return null;

  const currentIndex = allPlayers.findIndex(p => p.id === currentPlayerId);
  const nextIndex = (currentIndex + 1) % allPlayers.length;
  return allPlayers[nextIndex].id;
}

function getNextNonSkippedPlayer(roomCode, currentPlayerId, skippedPlayers) {
  let nextPlayerId = getNextPlayer(roomCode, currentPlayerId);
  let skippedCount = 0;
  const room = rooms[roomCode];
  const allPlayers = room.players;
  const totalPlayers = allPlayers.length;

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

// function checkInactivePlayers() {
//   const now = Date.now();
//   const FIVE_MINUTES = 5 * 60 * 1000;
  
//   Object.keys(playerActivity).forEach(socketId => {
//     const lastActivity = playerActivity[socketId];
//     if (now - lastActivity > FIVE_MINUTES) {
//       console.log(`⏰ Disconnecting inactive socket ${socketId}`);
//       const socket = io.sockets.sockets.get(socketId);
//       if (socket) {
//         socket.disconnect(true);
//         delete playerActivity[socketId];
//       }
//     }
//   });
// }

// setInterval(checkInactivePlayers, 60000);

function initializeCardGame(players, deal = false) {
  console.log('🃏 Initializing card game for players:', players.map(p => p.name));
  
  const filteredDeck = cardData.deck.filter(card => 
    card.type !== 'action' || 
    card.subtype === 'joker' || 
    card.subtype === 'skip' ||
    card.subtype === 'shake' ||
    card.subtype === 'exchange' ||
    card.subtype === 'collective_exchange'
  );
  
  const shuffledDeck = shuffleDeck(filteredDeck);
  const playerHands = {};
  
  players.forEach(player => {
    if (deal) {
      const handCards = shuffledDeck.splice(0, 5);
      handCards.forEach((card, index) => {
        card.originalHandIndex = index;
      });
      playerHands[player.id] = handCards;
    } else {
      playerHands[player.id] = [];
    }
  });

  const firstPlayer = players[0]?.id || null;

  return {
    deck: shuffledDeck,
    drawPile: shuffledDeck,
    tableCards: [],
    playerHands,
    currentTurn: firstPlayer,
    gameStarted: true,
    dealt: deal,          // ✅ جديد
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

function getAllPlayerCardsInOrder(game, playerId) {
  const handCards = game.playerHands[playerId] || [];
  const circleCards = (game.playerCircles[playerId] || []).filter(card => card !== null);
  
  const allCards = [];
  
  handCards.forEach((card, index) => {
    card.currentPosition = index;
    card.source = 'hand';
    allCards.push({...card});
  });
  
  circleCards.forEach(card => {
    card.source = 'circle';
    allCards.push({...card});
  });
  
  allCards.sort((a, b) => {
    const aIndex = a.originalHandIndex !== undefined ? a.originalHandIndex : 999;
    const bIndex = b.originalHandIndex !== undefined ? b.originalHandIndex : 999;
    return aIndex - bIndex;
  });
  
  return allCards;
}

function removeCardFromPlayer(game, playerId, cardId) {
  const handIndex = game.playerHands[playerId].findIndex(c => c.id === cardId);
  if (handIndex !== -1) {
    const [card] = game.playerHands[playerId].splice(handIndex, 1);
    return { card, source: 'hand' };
  }
  
  const circleIndex = game.playerCircles[playerId].findIndex(c => c && c.id === cardId);
  if (circleIndex !== -1) {
    const card = game.playerCircles[playerId][circleIndex];
    game.playerCircles[playerId][circleIndex] = null;
    return { card, source: 'circle' };
  }
  
  return null;
}

// ===================== SWORD OF KNOWLEDGE – SERVER MODULE =====================

// استيراد الأسئلة من ملف البيانات (يتم مرة واحدة هنا فقط)
// const swordOfKnowledgeQuestions = require('../../server/data/swordOfKnowledgeQuestions');

// تعريف القارات داخلياً (نفس الموجود في العميل حتى لا نعتمد عليه)
const SOK_CONTINENTS = [
  { id: 'africa', name: 'أفريقيا', regions: [
      { id: 'africa1', name: 'مصر' }, { id: 'africa2', name: 'نيجيريا' }, { id: 'africa3', name: 'جنوب أفريقيا' },
      { id: 'africa4', name: 'تونس' }, { id: 'africa5', name: 'الجزائر' }
    ]
  },
  { id: 'asia', name: 'آسيا', regions: [
      { id: 'asia1', name: 'السعودية' }, { id: 'asia2', name: 'الهند' }, { id: 'asia3', name: 'اليابان' },
      { id: 'asia4', name: 'الصين' }, { id: 'asia5', name: 'تايلاند' }
    ]
  },
  { id: 'europe', name: 'أوروبا', regions: [
      { id: 'europe1', name: 'فرنسا' }, { id: 'europe2', name: 'ألمانيا' }, { id: 'europe3', name: 'إيطاليا' },
      { id: 'europe4', name: 'إسبانيا' }, { id: 'europe5', name: 'البرتغال' }
    ]
  },
  { id: 'americas', name: 'الأمريكيتين', regions: [
      { id: 'americas1', name: 'أمريكا' }, { id: 'americas2', name: 'البرازيل' }, { id: 'americas3', name: 'كندا' },
      { id: 'americas4', name: 'الأرجنتين' }, { id: 'americas5', name: 'المكسيك' }
    ]
  },
  { id: 'australia', name: 'أستراليا', regions: [
      { id: 'aus1', name: 'سيدني' }, { id: 'aus2', name: 'ملبورن' }, { id: 'aus3', name: 'بريزبن' },
      { id: 'aus4', name: 'برث' }, { id: 'aus5', name: 'كانبيرا' }
    ]
  },
  { id: 'middleeast', name: 'الشرق الأوسط', regions: [
      { id: 'me1', name: 'الإمارات' }, { id: 'me2', name: 'قطر' }, { id: 'me3', name: 'الكويت' },
      { id: 'me4', name: 'عُمان' }, { id: 'me5', name: 'البحرين' }
    ]
  },
  { id: 'northasia', name: 'شمال آسيا', regions: [
      { id: 'na1', name: 'روسيا' }, { id: 'na2', name: 'كازاخستان' }, { id: 'na3', name: 'منغوليا' },
      { id: 'na4', name: 'كوريا' }, { id: 'na5', name: 'تركيا' }
    ]
  },
  { id: 'southasia', name: 'جنوب آسيا', regions: [
      { id: 'sa1', name: 'باكستان' }, { id: 'sa2', name: 'بنغلاديش' }, { id: 'sa3', name: 'سريلانكا' },
      { id: 'sa4', name: 'نيبال' }, { id: 'sa5', name: 'أفغانستان' }
    ]
  },
];

const MAX_CLAIM_ROUNDS = 4;

// Helper: اختيار سؤال عشوائي من القائمة
function getRandomQuestion() {
  const qs = swordOfKnowledgeQuestions;
  if (!qs || qs.length === 0) return null;
  return qs[Math.floor(Math.random() * qs.length)];
}

// Helper: sanitize game state for client (removes temporary data)
function sanitizeSOK(game) {
  if (!game) return null;
  const copy = { ...game };
  delete copy.timer;
  delete copy.currentQuestion;
  delete copy.pendingAction;
  delete copy.answersArray;
  if (copy.duel) {
    copy.duel = { ...copy.duel };
    delete copy.duel.question;
    delete copy.duel.answers;
  }
  if (!copy.ownership) copy.ownership = {};
  if (!copy.players) copy.players = [];
  return copy;
}

// Helper: get next player (skipping eliminated and skipped)
function getNextPlayerSOK(roomCode, currentPlayerId) {
  const room = rooms[roomCode];
  if (!room) return null;
  const nonAdmins = room.players.filter(p => !p.isAdmin && !p.eliminated);
  if (nonAdmins.length === 0) return null;
  const idx = nonAdmins.findIndex(p => p.id === currentPlayerId);
  let nextIdx = (idx + 1) % nonAdmins.length;
  let nextPlayer = nonAdmins[nextIdx];
  const game = room.sok;
  if (game && game.skippedPlayers) {
    let loopCount = 0;
    while (game.skippedPlayers[nextPlayer.id] && loopCount < nonAdmins.length) {
      delete game.skippedPlayers[nextPlayer.id];
      nextIdx = (nextIdx + 1) % nonAdmins.length;
      nextPlayer = nonAdmins[nextIdx];
      loopCount++;
    }
  }
  return nextPlayer.id;
}

// Helper: get player socket by ID
function getPlayerSocketSOK(roomCode, playerId) {
  const room = rooms[roomCode];
  if (!room) return null;
  const player = room.players.find(p => p.id === playerId);
  if (!player) return null;
  return io.sockets.sockets.get(player.socketId);
}

// Initialize a new game
function initSOKGame(room) {
  const nonAdmins = room.players.filter(p => !p.isAdmin);
  if (nonAdmins.length === 0) {
    console.log('[SOK] No non-admin players – game cannot start');
    return null;
  }

  const shuffledPlayers = [...nonAdmins].sort(() => Math.random() - 0.5);
  const shuffledContinents = [...SOK_CONTINENTS].sort(() => Math.random() - 0.5);

  const ownership = {};
  for (const cont of SOK_CONTINENTS) {
    ownership[cont.id] = {};
    for (const reg of cont.regions) {
      ownership[cont.id][reg.id] = null;
    }
  }

  for (let i = 0; i < shuffledPlayers.length; i++) {
    if (i >= shuffledContinents.length) break;
    const player = shuffledPlayers[i];
    const cont = shuffledContinents[i];
    ownership[cont.id][cont.regions[0].id] = player.id;
  }

  const gamePlayers = nonAdmins.map(p => ({
    id: p.id,
    name: p.name,
    color: p.color,
    eliminated: false
  }));

  return {
    phase: 'claiming',
    ownership,
    turn: nonAdmins[0].id,
    scores: {},
    players: gamePlayers,
    duel: null,
    timer: null,
    pendingAction: null,
    currentQuestion: null,
    answersArray: [],
    roundCount: 0,
    playedInRound: [],
    skippedPlayers: {},
  };
}

// =====================================================
// Socket.io connection handling
// =====================================================
io.on('connection', (socket) => {
  socket.setMaxListeners(100);
  console.log('🔌 New client connected:', socket.id);
  updatePlayerActivity(socket.id);
  setupSpyServer(socket, io, rooms);
  setupMusicServer(socket, io, rooms);
  setupReverseServer(socket, io, rooms);
  setupWhoamiServer(socket, io, rooms);
  setupWhoSaidServer(socket, io, rooms);
  setupPutWordServer(socket, io, rooms);
  setupSongForServer(socket, io, rooms);
  setupCinemaServer(socket, io, rooms);
  setupFlagsServer(socket, io, rooms);
  setupAutobisServer(socket, io, rooms);
  setupBattleshipServer(socket, io, rooms);
  setupSwordServer(socket, io, rooms);
  setupHangmanServer(socket, io, rooms);
  setupBracketServer(socket, io, rooms);
  setupTicTacToeServer(socket, io, rooms);
  setupBingoServer(socket, io, rooms);
  movieTTT.registerSocket(socket);

  socket.on('launch_game', ({ roomCode, gameId }) => {
    if (!rooms[roomCode]) return;
    io.to(roomCode).emit('game_launched', { gameId });
  });

  socket.on('close_room', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    
    // ابعت للكل إن الغرفة اتقفلت
    io.to(roomCode).emit('room_closed');
    
    // شيل الغرفة من الذاكرة
    delete rooms[roomCode];
  });

  socket.on('close_game', ({ roomCode }) => {
    if (!rooms[roomCode]) return;
    if (rooms[roomCode].sok?.timer) clearTimeout(rooms[roomCode].sok.timer);
    io.to(roomCode).emit('game_closed');
  });

  // Create room
  socket.on('create_room', ({ playerName } = {}) => {
    updatePlayerActivity(socket.id);
    const roomCode = generateRoomCode();

    // ✅ الأدمن بقى لاعب في players array بـ id حقيقي
    const adminId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const adminPlayer = {
      id: adminId,
      name: (playerName && playerName.trim()) || 'Quiz Master',
      score: 0,
      isAdmin: true,
      socketId: socket.id,
      color: playerColorPalette[0],
    };

    rooms[roomCode] = {
      players: [adminPlayer],       // ✅ الأدمن أول لاعب في الغرفة
      admin: socket.id,
      adminId: adminId,             // ✅ مرجع سريع لـ id الأدمن
      activePlayer: null,
      buzzerLocked: false,
      currentQuestion: null,
      cardGame: null,
      whiteboard: { strokes: [], currentStroke: null },
      timer: {
        duration: 120,
        intervalId: null,
        currentTime: null,
        isRunning: false,
      }
    };

    socket.emit('room_created', { roomCode, adminPlayer });
    socket.join(roomCode);
    io.to(roomCode).emit('update_players', rooms[roomCode].players);
    console.log(`🏠 Room created: ${roomCode} by admin ${adminPlayer.name} (${adminId})`);
  });

  // Join room
  socket.on('join_room', ({ roomCode, player }) => {
    updatePlayerActivity(socket.id);
    console.log(`👤 Player ${player.name} joining room: ${roomCode}`);

    if (!rooms[roomCode]) {
      socket.emit('room_not_found');
      console.log(`❌ Room ${roomCode} not found`);
      return;
    }

    // 🛡️ منع نفس السوكيت إنه يدخل مرتين
    if (rooms[roomCode].players.some(p => p.socketId === socket.id)) {
      console.log(`⚠️ Socket ${socket.id} already in room ${roomCode}`);
      socket.emit('update_players', rooms[roomCode].players);
      return;
    }

    // 🎨 لون فريد للاعب
    const nonAdminPlayers = rooms[roomCode].players.filter(p => !p.isAdmin);
    const colorIndex = nonAdminPlayers.length % playerColorPalette.length;
    const assignedColor = player.color || playerColorPalette[colorIndex];

    const playerWithSocket = {
      ...player,
      socketId: socket.id,
      isAdmin: socket.id === rooms[roomCode].admin,  // فقط لو نفس السوكيت
      color: assignedColor,
    };

    rooms[roomCode].players.push(playerWithSocket);
    socket.join(roomCode);
    socket.data = { roomCode, playerId: player.id };

    // ✅ مزامنة كاملة لكل اللاعبين (بما فيهم الأدمن)
    io.to(roomCode).emit('update_players', rooms[roomCode].players);

    socket.emit('whiteboard_state', rooms[roomCode].whiteboard);

    if (rooms[roomCode].cardGame) {
      socket.emit('card_game_state_update', rooms[roomCode].cardGame);
    }

    console.log(`✅ ${player.name} joined room ${roomCode} (color: ${assignedColor}). Total: ${rooms[roomCode].players.length}`);
  });

  // ===== WHITEBOARD EVENTS (existing) =====
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

  // Grid game – initial state request (per player)
  socket.on('grid_game_init', ({ roomCode, playerId }) => {
    if (!rooms[roomCode]) return;
    if (!rooms[roomCode].gridGames) {
      rooms[roomCode].gridGames = {};
    }
    if (!rooms[roomCode].gridGames[playerId]) {
      rooms[roomCode].gridGames[playerId] = Array.from({ length: 29 }, () => Array(9).fill(''));
    }
    // Send only this player's grid
    socket.emit('grid_game_state', { grid: rooms[roomCode].gridGames[playerId] });
  });

  // Grid cell update (per player)
  socket.on('grid_cell_update', ({ roomCode, playerId, row, col, value }) => {
    if (!rooms[roomCode]) return;
    if (!rooms[roomCode].gridGames) {
      rooms[roomCode].gridGames = {};
    }
    if (!rooms[roomCode].gridGames[playerId]) {
      rooms[roomCode].gridGames[playerId] = Array.from({ length: 29 }, () => Array(9).fill(''));
    }
    if (row >= 0 && row < 29 && col >= 0 && col < 9) {
      rooms[roomCode].gridGames[playerId][row][col] = value;
      // Send the updated grid back to this player only (private)
      socket.emit('grid_game_state', { grid: rooms[roomCode].gridGames[playerId] });
    }
  });


  // ✅ تبديل الطور في كوتشينة (بصرة ↔ بنك) — يمسح الغرفة القديمة
  socket.on('kotshina_switch_mode', ({ roomCode, mode, fromMode }) => {
    if (!roomCode) return;
    const VALID = ['basra', 'bank', 'shayeb', 'crazy8', 'solitaire', 'spider'];
    if (!VALID.includes(mode) || !VALID.includes(fromMode)) return;

    if (fromMode === 'basra' && global.basraRooms?.[roomCode]) delete global.basraRooms[roomCode];
    else if (fromMode === 'bank' && global.bankRooms?.[roomCode]) delete global.bankRooms[roomCode];
    else if (fromMode === 'shayeb' && global.shayebRooms?.[roomCode]) delete global.shayebRooms[roomCode];
    else if (fromMode === 'crazy8' && global.crazy8Rooms?.[roomCode]) delete global.crazy8Rooms[roomCode];
    else if (fromMode === 'solitaire' && global.solitaireRooms?.[roomCode]) delete global.solitaireRooms[roomCode];
    else if (fromMode === 'spider' && global.spiderRooms?.[roomCode]) delete global.spiderRooms[roomCode];

    io.to(roomCode).emit('kotshina_mode_changed', { mode });
  });



  // ===== CARD GAME EVENTS (all original handlers – unchanged) =====
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

      room.cardGame = initializeCardGame(room.players, false);
      
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

  // ✅ توزيع الورق — يدويًا لما الأدمن يدوس
  socket.on('card_game_deal', ({ roomCode }) => {
    updatePlayerActivity(socket.id);
    console.log(`🎴 DEAL CARDS in room ${roomCode}`);
    
    const room = rooms[roomCode];
    if (!room || !room.cardGame) {
      socket.emit('card_game_error', { message: 'Game not found' });
      return;
    }
    
    const game = room.cardGame;
    if (game.dealt) {
      console.log('⚠️ Already dealt');
      return;
    }
    
    // وزّع 5 كروت لكل لاعب
    room.players.forEach(player => {
      if (game.playerHands[player.id].length === 0) {
        for (let i = 0; i < 5; i++) {
          if (game.drawPile.length > 0) {
            const card = game.drawPile.pop();
            card.originalHandIndex = game.playerHands[player.id].length;
            game.playerHands[player.id].push(card);
          }
        }
      }
    });
    
    game.dealt = true;
    
    console.log(`✅ Cards dealt. Draw pile: ${game.drawPile.length}`);
    io.to(roomCode).emit('card_game_state_update', game);
  });

  // Draw card from pile
  socket.on('card_game_draw', ({ roomCode, playerId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🃏 DRAW CARD by player ${playerId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      
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
      drawnCard.originalHandIndex = game.playerHands[playerId].length;
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
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      
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
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      
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
      card.originalHandIndex = game.playerHands[playerId].length;
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
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      
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

  // Use shake card
  socket.on('card_game_use_shake', ({ roomCode, playerId, cardId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 USE SHAKE CARD by player ${playerId} in room ${roomCode}, cardId: ${cardId}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const room = rooms[roomCode];
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      
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

  // Use exchange card
  socket.on('card_game_use_exchange', ({ roomCode, playerId, cardId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 USE EXCHANGE CARD by player ${playerId} in room ${roomCode}, cardId: ${cardId}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const room = rooms[roomCode];
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      
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
      
      game.activeExchange = {
        initiatorId: playerId,
        card: exchangeCard,
        initiatorCard: null,
        initiatorSource: null,
        responderId: null,
        responderCard: null,
        responderSource: null,
        waitingForInitiator: true,
        waitingForResponder: false
      };
      
      io.to(roomCode).emit('card_game_state_update', game);
      
      const playerCardsInOrder = getAllPlayerCardsInOrder(game, playerId);
      
      socket.emit('card_game_exchange_choose_card', {
        initiatorId: playerId,
        actionCard: exchangeCard,
        playerCards: playerCardsInOrder,
        message: 'اختر بطاقة من يدك أو دوائرك للتبادل'
      });
      
      socket.to(roomCode).emit('card_game_exchange_waiting_with_cards', {
        initiatorId: playerId,
        initiatorName: room.players.find(p => p.id === playerId)?.name || 'لاعب',
        message: 'بانتظار اختيار اللاعب لبطاقته - يمكنك رؤية بطاقاتك لكن لا يمكنك الاختيار حتى يختار اللاعب الآخر'
      });
      
      console.log(`✅ Exchange card used by ${playerId}. Waiting for initiator to choose a card.`);
      
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

  // Use collective exchange card
  socket.on('card_game_use_collective_exchange', ({ roomCode, playerId, cardId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 USE COLLECTIVE EXCHANGE CARD by player ${playerId} in room ${roomCode}, cardId: ${cardId}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const room = rooms[roomCode];
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      
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
      
      game.activeCollectiveExchange = {
        initiatorId: playerId,
        card: collectiveExchangeCard,
        initiatorCard: null,
        initiatorSource: null,
        responderId: null,
        responderCard: null,
        responderSource: null,
        waitingForInitiator: true,
        waitingForResponder: false
      };
      
      io.to(roomCode).emit('card_game_state_update', game);
      
      const playerCardsInOrder = getAllPlayerCardsInOrder(game, playerId);
      
      socket.emit('card_game_collective_exchange_choose_card', {
        initiatorId: playerId,
        actionCard: collectiveExchangeCard,
        playerCards: playerCardsInOrder,
        message: 'اختر بطاقة من يدك أو دوائرك للتبادل الجماعي'
      });
      
      socket.to(roomCode).emit('card_game_collective_exchange_waiting_with_cards', {
        initiatorId: playerId,
        initiatorName: room.players.find(p => p.id === playerId)?.name || 'لاعب',
        message: 'بانتظار اختيار اللاعب لبطاقته - يمكنك رؤية بطاقاتك لكن لا يمكنك الاختيار حتى يختار اللاعب الآخر'
      });
      
      console.log(`✅ Collective exchange card used by ${playerId}. Waiting for initiator to choose a card.`);
      
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

  // Initiator chooses card for exchange
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

  // Initiator chooses card for collective exchange
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

  // Responder chooses card for exchange
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
      
      const initiatorId = game.activeExchange.initiatorId;
      const initiatorCard = game.activeExchange.initiatorCard;
      const initiatorSource = game.activeExchange.initiatorSource;
      const responderId = playerId;
      const responderCard = selectedCard;
      const responderSource = cardSource;

      const initiatorPlayer = room.players.find(p => p.id === initiatorId);
      const responderPlayer = room.players.find(p => p.id === responderId);
      
      responderCard.originalHandIndex = game.playerHands[initiatorId].length;
      initiatorCard.originalHandIndex = game.playerHands[responderId].length;
      
      game.playerHands[responderId].push(initiatorCard);
      game.playerHands[initiatorId].push(responderCard);
      
      console.log(`🔄 Exchange completed: ${responderId} gave "${responderCard.name}" from ${responderSource} and received "${initiatorCard.name}" from ${initiatorId}'s ${initiatorSource}`);
      
      game.activeExchange = null;
      
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

  // Responder chooses card for collective exchange
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
      
      const initiatorId = game.activeCollectiveExchange.initiatorId;
      const initiatorCard = game.activeCollectiveExchange.initiatorCard;
      const initiatorSource = game.activeCollectiveExchange.initiatorSource;
      const responderId = playerId;
      const responderCard = selectedCard;
      const responderSource = cardSource;

      const initiatorPlayer = room.players.find(p => p.id === initiatorId);
      const responderPlayer = room.players.find(p => p.id === responderId);
      
      responderCard.originalHandIndex = game.playerHands[initiatorId].length;
      initiatorCard.originalHandIndex = game.playerHands[responderId].length;
      
      game.playerHands[responderId].push(initiatorCard);
      game.playerHands[initiatorId].push(responderCard);
      
      console.log(`🔄 Collective exchange completed: ${responderId} gave "${responderCard.name}" from ${responderSource} and received "${initiatorCard.name}" from ${initiatorId}'s ${initiatorSource}`);
      
      game.activeCollectiveExchange = null;
      
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

      if (playerId !== game.activeExchange.initiatorId) {
        console.log(`❌ Only initiator can cancel exchange`);
        socket.emit('card_game_error', { message: 'Only initiator can cancel exchange' });
        return;
      }

      if (game.activeExchange.initiatorCard) {
        const initiatorSource = game.activeExchange.initiatorSource;
        if (initiatorSource === 'circle') {
          const emptyCircleIndex = game.playerCircles[playerId].findIndex(card => card === null);
          if (emptyCircleIndex !== -1) {
            game.playerCircles[playerId][emptyCircleIndex] = game.activeExchange.initiatorCard;
          } else {
            game.playerHands[playerId].push(game.activeExchange.initiatorCard);
          }
        } else {
          game.playerHands[playerId].push(game.activeExchange.initiatorCard);
        }
      }

      const initiatorPlayer = room.players.find(p => p.id === playerId);
      
      game.activeExchange = null;
      game.playerHasDrawn[playerId] = false;
      delete game.skippedPlayers[playerId];
      
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

  // Cancel collective exchange
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

      if (playerId !== game.activeCollectiveExchange.initiatorId) {
        console.log(`❌ Only initiator can cancel collective exchange`);
        socket.emit('card_game_error', { message: 'Only initiator can cancel collective exchange' });
        return;
      }

      if (game.activeCollectiveExchange.initiatorCard) {
        const initiatorSource = game.activeCollectiveExchange.initiatorSource;
        if (initiatorSource === 'circle') {
          const emptyCircleIndex = game.playerCircles[playerId].findIndex(card => card === null);
          if (emptyCircleIndex !== -1) {
            game.playerCircles[playerId][emptyCircleIndex] = game.activeCollectiveExchange.initiatorCard;
          } else {
            game.playerHands[playerId].push(game.activeCollectiveExchange.initiatorCard);
          }
        } else {
          game.playerHands[playerId].push(game.activeCollectiveExchange.initiatorCard);
        }
      }

      const initiatorPlayer = room.players.find(p => p.id === playerId);
      
      game.activeCollectiveExchange = null;
      game.playerHasDrawn[playerId] = false;
      delete game.skippedPlayers[playerId];
      
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

  // Move card to circle
  socket.on('card_game_move_to_circle', ({ roomCode, playerId, circleIndex, cardId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 MOVE TO CIRCLE by player ${playerId}, card ${cardId} to circle ${circleIndex} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      
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
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      
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
        card.originalHandIndex = game.playerHands[playerId].length;
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

  // Place ALL cards in shake
  socket.on('card_game_shake_place_all', ({ roomCode, playerId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 PLACE ALL CARDS IN SHAKE by player ${playerId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const room = rooms[roomCode];
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      
      if (!game.activeShake) {
        console.log(`❌ No active shake`);
        socket.emit('card_game_error', { message: 'No active shake' });
        return;
      }

      const anyPlayerPlacedCards = Object.keys(game.activeShake.placedCards).length > 0;
      if (anyPlayerPlacedCards) {
        console.log(`❌ Another player has already placed cards in this shake`);
        socket.emit('card_game_error', { message: 'لاعب آخر وضع بطاقاته بالفعل في هذا النفض' });
        return;
      }

      const playerHandCards = [...game.playerHands[playerId]];
      const playerCircleCards = game.playerCircles[playerId].filter(card => card !== null);
      const allPlayerCards = [...playerHandCards, ...playerCircleCards];
      
      if (allPlayerCards.length === 0) {
        console.log(`❌ Player ${playerId} has no cards to place`);
        socket.emit('card_game_error', { message: 'ليس لديك بطاقات لوضعها' });
        return;
      }

      game.playerHands[playerId] = [];
      game.playerCircles[playerId] = [null, null, null, null];
      
      if (!game.activeShake.placedCards[playerId]) {
        game.activeShake.placedCards[playerId] = [];
      }
      game.activeShake.placedCards[playerId].push(...allPlayerCards);
      
      game.activeShake.canComplete = true;
      
      io.to(roomCode).emit('card_game_shake_all_cards_placed', {
        playerId: playerId,
        playerName: room.players.find(p => p.id === playerId)?.name || 'لاعب',
        cardCount: allPlayerCards.length,
        cards: allPlayerCards,
        canComplete: true
      });
      
      io.to(roomCode).emit('card_game_state_update', game);
      console.log(`✅ Player ${playerId} placed ALL ${allPlayerCards.length} cards in shake (hand: ${playerHandCards.length}, circles: ${playerCircleCards.length}). Completion enabled.`);
      
    } else {
      socket.emit('card_game_error', { message: 'Game not found' });
    }
  });

  // Complete shake process
  socket.on('card_game_complete_shake', ({ roomCode, playerId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 COMPLETE SHAKE by player ${playerId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const room = rooms[roomCode];
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      
      if (!game.activeShake) {
        console.log(`❌ No active shake`);
        socket.emit('card_game_error', { message: 'No active shake' });
        return;
      }

      if (!game.activeShake.canComplete) {
        console.log(`❌ Cannot complete shake - no player has placed cards yet`);
        socket.emit('card_game_error', { message: 'لا يمكن إكمال النفض حتى يضع أحد اللاعبين بطاقاته' });
        return;
      }

      const shakeInitiatorId = game.activeShake.playerId;
      const placedCards = game.activeShake.placedCards;
      
      console.log(`🔄 Processing shake with placed cards from players:`, Object.keys(placedCards));
      
      const allPlacedCards = Object.values(placedCards).flat();
      if (allPlacedCards.length > 0) {
        console.log(`🔄 Adding ${allPlacedCards.length} shaken cards to the BOTTOM of table. Table before: ${game.tableCards.length} cards`);
        
        game.tableCards.unshift(...allPlacedCards);
        
        console.log(`✅ Shake completed: ${allPlacedCards.length} cards moved to BOTTOM of table. Table after: ${game.tableCards.length} cards`);
        
        Object.keys(placedCards).forEach(playerId => {
          const placedCount = placedCards[playerId].length;
          console.log(`🔄 Giving 5 new cards to player ${playerId} who placed ${placedCount} cards. Draw pile: ${game.drawPile.length} cards`);
          
          for (let i = 0; i < 5; i++) {
            if (game.drawPile.length > 0) {
              const drawnCard = game.drawPile.pop();
              drawnCard.originalHandIndex = i;
              game.playerHands[playerId].push(drawnCard);
            } else {
              console.log(`❌ No cards left in draw pile to give to player ${playerId}`);
              break;
            }
          }
          console.log(`✅ Player ${playerId} received 5 new cards after losing ${placedCount} cards. Now has ${game.playerHands[playerId].length} cards`);
        });
      }
      
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

  // Dice roll
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

  // Declare category
  socket.on('card_game_declare', ({ roomCode, playerId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🏆 DECLARE CATEGORY by player ${playerId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const room = rooms[roomCode];
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      
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

      const otherPlayers = room.players.filter(p => p.id !== declaredPlayerId);
      
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
            
            completedCards.forEach(card => {
              game.tableCards.unshift(card);
            });
            
            game.completedCategories[declaredPlayerId].push(game.playerCategories[declaredPlayerId]);
            
            game.playerLevels[declaredPlayerId] = Math.min(5, game.playerLevels[declaredPlayerId] + 1);
            
            game.playerCircles[declaredPlayerId] = [null, null, null, null];
            
            for (let i = 0; i < 3; i++) {
              if (game.drawPile.length > 0) {
                const drawnCard = game.drawPile.pop();
                drawnCard.originalHandIndex = i;
                game.playerHands[declaredPlayerId].push(drawnCard);
              }
            }
            
            console.log(`✅ ${completedPlayer.name} completed category and received 3 new cards.`);
            
            if (game.playerLevels[declaredPlayerId] >= 5) {
              console.log(`🎊 ${completedPlayer.name} WON THE GAME! 🎊`);
              game.winner = declaredPlayerId;
              
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
        
        game.challengeInProgress = false;
        game.declaredCategory = null;
        game.challengeResponses = {};
        game.challengeRespondedPlayers = [];
        
        game.currentTurn = declaredPlayerId;
        game.playerHasDrawn[declaredPlayerId] = true;
        
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
        const newGameState = initializeCardGame(rooms[roomCode].players);
        rooms[roomCode].cardGame = newGameState;
        
        io.to(roomCode).emit('card_game_reset');
        
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

  // Shuffle deck
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

  // Random photos question handler (existing)
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
  

  // ===== NEW: WHOAMI (unique photo per player) =====
  socket.on('whoami_start', ({ roomCode, assignments }) => {
    updatePlayerActivity(socket.id);
    console.log(`🖼️ WHOAMI START in room ${roomCode} with ${assignments.length} assignments`);
    
    if (!rooms[roomCode]) return;
    
    const room = rooms[roomCode];
    
    assignments.forEach(({ playerId, question }) => {
      const player = room.players.find(p => p.id === playerId);
      if (player) {
        io.to(player.socketId).emit('player_photo_question', {
          playerId,
          question
        });
        console.log(`  ✅ Sent whoami photo to ${player.name}`);
      }
    });
  });

  

  // =====MafiosoGame=====

  const MAX_AP = 10;
  const STARTING_POINTS = 100;
  const INVESTIGATION_COST = 10; // flat cost per suspect
  const BONUS_POINTS = 20;

  function getDialogueNode(suspect, nodeId) {
  return suspect.dialogue.find(d => d.id === nodeId) || null;
  }

  // Start a new case
// ==========================================
// كود استقبال بدء لعبة مافيوسو (Mafiosa Start)
// ==========================================
socket.on('mafiosa_start', ({ roomCode, caseIndex }) => {
    console.log(`[Mafiosa System] Received mafiosa_start for room: ${roomCode}`);

    const room = rooms[roomCode];
    if (!room) {
      console.log(`[Mafiosa Error] Room ${roomCode} not found in servers memory!`);
      socket.emit('mafiosa_error', { 
        message: 'انتهت صلاحية الغرفة أو أعيد تشغيل السيرفر. ارجع للرئيسية وأنشئ غرفة جديدة.' 
      });
      return;
    }

    if (!mafiosaCases || mafiosaCases.length === 0) {
      console.log(`[Mafiosa Error] mafiosaCases array is empty or not defined!`);
      socket.emit('mafiosa_error', { message: 'خطأ في السيرفر: لم يتم العثور على قضايا مافيوسو!' });
      return;
    }

    // ✅ CHANGE 1: was "if (!mafiosaState[roomCode] || mafiosaState[roomCode].gameOver)"
    // Now always reset so any player can start a fresh game
    if (true) {
      console.log(`[Mafiosa System] Initializing new game state for room: ${roomCode}`);
      
      const index = caseIndex !== undefined ? caseIndex : Math.floor(Math.random() * mafiosaCases.length);
      const nonAdmins = room.players.filter(p => !p.isAdmin);
      const playerPoints = {};
      nonAdmins.forEach(p => { playerPoints[p.id] = STARTING_POINTS; });

      mafiosaState[roomCode] = {
        caseIndex: index,
        inventory: [],
        searchedLocations: [],
        ap: MAX_AP,
        gameOver: false,
        votes: {},
        accusationPhase: false,
        playerPoints: playerPoints,
        investigatedSuspects: {},
        dialogueStates: {},
      };
    }

    const currentState = mafiosaState[roomCode];
    const caseData = mafiosaCases[currentState.caseIndex];

    console.log(`[Mafiosa System] Sending case data ("${caseData.title}") to room: ${roomCode}`);

    // ✅ CHANGE 2: tell ALL players a new game is starting (triggers overlay on every client)
    io.to(roomCode).emit('mafiosa_new_game_starting');

    io.to(roomCode).emit('mafiosa_case_data', {
      title: caseData.title,
      description: caseData.description,
      autopsy: caseData.autopsy || null,
      suspects: caseData.suspects,
      evidence: caseData.evidence,
      locations: caseData.locations || {},
      solutionImage: caseData.solution?.winnerImage || null,
    });

    io.to(roomCode).emit('mafiosa_state', {
      inventory: currentState.inventory,
      ap: currentState.ap,
      maxAp: MAX_AP,
      gameOver: currentState.gameOver,
      searchedLocations: currentState.searchedLocations,
      playerPoints: currentState.playerPoints,
      accusationPhase: currentState.accusationPhase,
    });
  });

  // Start investigation – deduct points ONLY if not already investigated this suspect
  socket.on('mafiosa_start_investigation', ({ roomCode, suspectId }) => {
  const state = mafiosaState[roomCode];
  if (!state || state.gameOver) return;
  const playerId = socket.data?.playerId;
  if (!playerId) return;

  // Ensure investigatedSuspects for this player exists
  if (!state.investigatedSuspects[playerId]) {
  state.investigatedSuspects[playerId] = [];
  }

  // Check if already investigated this suspect
  if (state.investigatedSuspects[playerId].includes(suspectId)) {
  // Already investigated – no cost, just allow chat
  socket.emit('mafiosa_investigation_started', { suspectId, points: state.playerPoints[playerId], cost: 0 });
  return;
  }

  // First time – deduct 10 points
  const cost = INVESTIGATION_COST;
  if (state.playerPoints[playerId] < cost) {
  socket.emit('mafiosa_error', { message: `لا يوجد نقاط كافية! التكلفة: ${cost}` });
  return;
  }

  state.playerPoints[playerId] -= cost;
  state.investigatedSuspects[playerId].push(suspectId);

  io.to(roomCode).emit('mafiosa_state', {
  inventory: state.inventory,
  ap: state.ap,
  maxAp: MAX_AP,
  gameOver: state.gameOver,
  searchedLocations: state.searchedLocations,
  playerPoints: state.playerPoints,
  });
  socket.emit('mafiosa_investigation_started', { suspectId, points: state.playerPoints[playerId], cost });
  });

  // Get dialogue for a suspect (no cost)
  socket.on('mafiosa_get_dialogue', ({ roomCode, suspectId }) => {
  const state = mafiosaState[roomCode];
  if (!state) return;
  const caseData = mafiosaCases[state.caseIndex];
  const suspect = caseData.suspects.find(s => s.id === suspectId);
  if (!suspect) return;
  const currentNodeId = state.dialogueStates?.[suspectId] || 'start';
  const node = getDialogueNode(suspect, currentNodeId);
  if (!node) return;
  socket.emit('mafiosa_dialogue', {
  suspectId,
  text: node.text,
  options: node.options || [],
  nodeId: currentNodeId,
  });
  });

  // Player chooses an option in dialogue
  socket.on('mafiosa_choose_option', ({ roomCode, suspectId, optionIndex }) => {
  const state = mafiosaState[roomCode];
  if (!state || state.gameOver) return;
  const caseData = mafiosaCases[state.caseIndex];
  const suspect = caseData.suspects.find(s => s.id === suspectId);
  if (!suspect) return;
  const currentNodeId = state.dialogueStates?.[suspectId] || 'start';
  const currentNode = getDialogueNode(suspect, currentNodeId);
  if (!currentNode || optionIndex >= currentNode.options.length) return;
  const selectedOption = currentNode.options[optionIndex];
  if (!selectedOption.nextNodeId) return;
  if (selectedOption.requiredEvidence && !state.inventory.includes(selectedOption.requiredEvidence)) {
  socket.emit('mafiosa_error', { message: 'ليس لديك الدليل المطلوب!' });
  return;
  }
  if (!state.dialogueStates) state.dialogueStates = {};
  state.dialogueStates[suspectId] = selectedOption.nextNodeId;
  const nextNode = getDialogueNode(suspect, selectedOption.nextNodeId);
  if (nextNode) {
  if (nextNode.unlockedBy) {
  state.ap += 1;
  io.to(roomCode).emit('mafiosa_notification', { message: `⚡ مواجهة ناجحة مع ${suspect.name}!`, type: 'success' });
  }
  if (nextNode.reward) {
  const rewardId = nextNode.reward.split(' ').join('_').toLowerCase();
  if (!state.inventory.includes(rewardId)) {
  state.inventory.push(rewardId);
  io.to(roomCode).emit('mafiosa_inventory_update', { inventory: state.inventory });
  io.to(roomCode).emit('mafiosa_notification', { message: `🔍 تم اكتشاف دليل جديد: ${nextNode.reward}`, type: 'clue' });
  }
  }
  socket.emit('mafiosa_dialogue_update', { suspectId, nodeId: selectedOption.nextNodeId });
  }
  io.to(roomCode).emit('mafiosa_state', {
  inventory: state.inventory,
  ap: state.ap,
  maxAp: MAX_AP,
  gameOver: state.gameOver,
  searchedLocations: state.searchedLocations,
  playerPoints: state.playerPoints,
  });
  });

  // Search a location
  socket.on('mafiosa_search', ({ roomCode, location }) => {
  const state = mafiosaState[roomCode];
  if (!state || state.gameOver) return;
  if (state.ap < 1) {
  socket.emit('mafiosa_error', { message: 'لا يوجد نقاط طاقة كافية!' });
  return;
  }
  if (state.searchedLocations.includes(location)) {
  socket.emit('mafiosa_error', { message: 'تم البحث في هذا المكان بالفعل!' });
  return;
  }
  state.ap -= 1;
  state.searchedLocations.push(location);
  const caseData = mafiosaCases[state.caseIndex];
  const locationData = caseData.locations?.[location];
  if (!locationData || !locationData.evidence || locationData.evidence.length === 0) {
  io.to(roomCode).emit('mafiosa_notification', { message: 'لا يوجد أدلة في هذا المكان!', type: 'info' });
  } else {
  const newEvidence = locationData.evidence.filter(e => !state.inventory.includes(e));
  if (newEvidence.length > 0) {
  state.inventory.push(...newEvidence);
  io.to(roomCode).emit('mafiosa_inventory_update', { inventory: state.inventory });
  const evidenceNames = newEvidence.map(e => {
  const ev = caseData.evidence.find(ev => ev.id === e);
  return ev ? ev.name : e;
  }).join('، ');
  io.to(roomCode).emit('mafiosa_notification', {
  message: `🔍 تم اكتشاف أدلة في ${locationData.name}: ${evidenceNames}`,
  type: 'clue',
  });
  } else {
  io.to(roomCode).emit('mafiosa_notification', { message: 'لا توجد أدلة جديدة في هذا المكان.', type: 'info' });
  }
  }
  io.to(roomCode).emit('mafiosa_state', {
  inventory: state.inventory,
  ap: state.ap,
  maxAp: MAX_AP,
  gameOver: state.gameOver,
  searchedLocations: state.searchedLocations,
  playerPoints: state.playerPoints,
  });
  });

  // Add evidence manually (from dialogue rewards)
  socket.on('mafiosa_add_evidence', ({ roomCode, evidenceId }) => {
  const state = mafiosaState[roomCode];
  if (!state) return;
  if (!state.inventory.includes(evidenceId)) {
  state.inventory.push(evidenceId);
  io.to(roomCode).emit('mafiosa_inventory_update', { inventory: state.inventory });
  }
  });

  // Confront with evidence (manual call)
  socket.on('mafiosa_confront', ({ roomCode, evidenceId }) => {
  const state = mafiosaState[roomCode];
  if (!state || state.gameOver) return;
  if (!state.inventory.includes(evidenceId)) {
  socket.emit('mafiosa_error', { message: 'ليس لديك هذا الدليل!' });
  return;
  }
  if (state.ap < 1) {
  socket.emit('mafiosa_error', { message: 'لا يوجد نقاط طاقة كافية!' });
  return;
  }
  state.ap -= 1;
  state.ap += 1; // success
  io.to(roomCode).emit('mafiosa_notification', { message: `⚡ مواجهة ناجحة!`, type: 'success' });
  io.to(roomCode).emit('mafiosa_state', {
  inventory: state.inventory,
  ap: state.ap,
  maxAp: MAX_AP,
  gameOver: state.gameOver,
  searchedLocations: state.searchedLocations,
  playerPoints: state.playerPoints,
  });
  });

  // Request key autopsy report (costs AP)
  socket.on('mafiosa_get_autopsy', ({ roomCode }) => {
  const state = mafiosaState[roomCode];
  if (!state || state.gameOver) return;
  const caseData = mafiosaCases[state.caseIndex];
  if (!caseData.autopsy || !caseData.autopsy.isKey) {
  socket.emit('mafiosa_error', { message: 'لا يوجد تقرير طبي متقدم في هذه القضية.' });
  return;
  }
  if (state.ap < 1) {
  socket.emit('mafiosa_error', { message: 'لا يوجد نقاط طاقة كافية!' });
  return;
  }
  const autopsyEvidenceId = 'autopsy_report';
  if (state.inventory.includes(autopsyEvidenceId)) {
  socket.emit('mafiosa_error', { message: 'لقد حصلت على التقرير الطبي بالفعل!' });
  return;
  }
  state.ap -= 1;
  state.inventory.push(autopsyEvidenceId);
  io.to(roomCode).emit('mafiosa_inventory_update', { inventory: state.inventory });
  io.to(roomCode).emit('mafiosa_notification', {
  message: `📋 تم الحصول على التقرير الطبي الكامل: ${caseData.autopsy.text}`,
  type: 'clue',
  });
  io.to(roomCode).emit('mafiosa_state', {
  inventory: state.inventory,
  ap: state.ap,
  maxAp: MAX_AP,
  gameOver: state.gameOver,
  searchedLocations: state.searchedLocations,
  playerPoints: state.playerPoints,
  });
  });

  // Start accusation phase (local – only for the player who clicked)
  socket.on('mafiosa_accuse', ({ roomCode }) => {
  const state = mafiosaState[roomCode];
  if (!state) return;
  // Reset votes for this room
  roomVotes[roomCode] = {};
  state.accusationPhase = true;
  // Emit only to the specific socket (the player who clicked)
  socket.emit('mafiosa_accusation_phase');
  });

  // Submit vote
  socket.on('mafiosa_submit_vote', ({ roomCode, playerId, vote }) => {
  if (!roomVotes[roomCode]) roomVotes[roomCode] = {};
  if (roomVotes[roomCode][playerId]) return; // already voted
  roomVotes[roomCode][playerId] = vote;

  const room = rooms[roomCode];
  if (!room) return;
  const nonAdmins = room.players.filter(p => !p.isAdmin);
  const totalPlayers = nonAdmins.length;
  const currentVotes = roomVotes[roomCode];
  const validVotesCount = Object.keys(currentVotes).length;

  console.log(`[Mafiosa] votes: ${validVotesCount}/${totalPlayers}`);

  if (validVotesCount >= totalPlayers && totalPlayers > 0) {
  const state = mafiosaState[roomCode];
  if (!state) return;

  const caseData = mafiosaCases[state.caseIndex];
  const correctCulprit = caseData.solution.culprit;
  const correctWeapon = caseData.solution.weapon;
  const correctMotive = caseData.solution.motive;
  const winners = [];

  for (const [pid, v] of Object.entries(currentVotes)) {
  if (v.suspect === correctCulprit && v.weapon === correctWeapon && v.motive === correctMotive) {
  const player = room.players.find(p => p.id === pid);
  winners.push(player ? player.name : 'محقق سري');
  if (state.playerPoints[pid] !== undefined) {
  state.playerPoints[pid] += BONUS_POINTS;
  }
  }
  }

  state.gameOver = true;
  io.to(roomCode).emit('mafiosa_solution', {
  culprit: correctCulprit,
  weapon: correctWeapon,
  motive: correctMotive,
  winners: winners,
  votes: currentVotes,
  finalPoints: state.playerPoints,
  image: caseData.solution?.winnerImage || null,
  });

  // Clear votes after solution
  delete roomVotes[roomCode];
  }
  });

  // Send cases list to admin
  socket.on('mafiosa_get_cases', ({ roomCode }) => {
  const casesList = mafiosaCases.map((c, idx) => ({ id: idx, title: c.title }));
  socket.emit('mafiosa_cases_list', { cases: casesList });
  }); 

  socket.on('mafiosa_spend_ap', ({ roomCode, amount }) => {
    const state = mafiosaState[roomCode];
    if (!state || state.ap < amount) return;
    state.ap -= amount;
    socket.emit('mafiosa_ap_update', { ap: state.ap });
    io.to(roomCode).emit('mafiosa_state', {
      inventory: state.inventory, ap: state.ap, maxAp: MAX_AP,
      gameOver: state.gameOver, searchedLocations: state.searchedLocations,
      playerPoints: state.playerPoints,
    });
  });


// ============================================================
// معالجات لعبة المحقق الرقمي
// ============================================================
    socket.on('detective_join', ({ roomCode, playerId }) => {
      console.log(`🕵️ Player ${playerId} joined detective game in room ${roomCode}`);

      if (!rooms[roomCode]) {
        rooms[roomCode] = { players: [] };
      }

      if (!rooms[roomCode].players.find(p => p.id === playerId)) {
        rooms[roomCode].players.push({
          id: playerId,
          name: `محقق ${rooms[roomCode].players.length + 1}`
        });
      }

      if (!detectiveGames[roomCode]) {
        detectiveGames[roomCode] = {
          caseId: 'case_murad_01',
          started: false,
          completed: false,
          players: rooms[roomCode].players,
          decryptedImages: [],
          decryptedVideos: [],
          decryptedDocs: [],
          decryptedMessages: [],
          encryptedFolderUnlocked: false,
          extractedEncryptedFolder: false,
          discoveredPhones: false,
          discoveredAtms: false,
          discoveredCameras: false,
          playerAnswers: {},
          correctCulprits: [],
          correctMotive: '',
          solutionSummary: '',
          allPlayersSubmitted: false,
          foundSocialProfiles: {},
        };
      } else {
        detectiveGames[roomCode].players = rooms[roomCode].players;
      }

      socket.join(roomCode);

      if (detectiveGames[roomCode].started) {
        socket.emit('detective_started', detectiveGames[roomCode]);
      } else {
        socket.emit('detective_game_updated', { gameState: detectiveGames[roomCode] });
      }

      socket.to(roomCode).emit('detective_game_updated', {
        gameState: detectiveGames[roomCode]
      });
    });

    // =============================================
    // 2. بدء اللعبة عن طريق الأدمن (رئيس الشرطة)
    // =============================================
    socket.on('start_digital_detective', ({ roomCode, caseId }) => {
      console.log(`👮 Admin started digital detective game in room ${roomCode}`);
      
      if (rooms[roomCode]) {
        rooms[roomCode].currentQuestion = { category: 'digital_detective' };
      }

      const currentPlayers = rooms[roomCode]?.players || [];
      const caseData = casesDatabase[caseId || 'case_murad_01'];
      console.log('caseData correctCulprits:', caseData?.correctCulprits);

      detectiveGames[roomCode] = {
        caseId: 'case_murad_01',
        started: true,
        completed: false,
        players: currentPlayers,
        decryptedImages: [],
        decryptedVideos: [],
        decryptedDocs: [],
        decryptedMessages: [],
        encryptedFolderUnlocked: false,
        extractedEncryptedFolder: false,
        discoveredPhones: false,
        discoveredAtms: false,
        discoveredCameras: false,
        playerAnswers: {},
        correctCulprits: caseData?.correctCulprits || [],
        correctMotive: caseData?.correctMotive || '',
        solutionSummary: caseData?.solutionSummary || '',
        allPlayersSubmitted: false,
        foundSocialProfiles: {},
        closureQuestions: caseData?.closureQuestions || {}
        
      };

      io.to(roomCode).emit('room_update', rooms[roomCode]);
      io.to(roomCode).emit('room_data', rooms[roomCode]);
      io.to(roomCode).emit('detective_started', detectiveGames[roomCode]);
      io.to(roomCode).emit('detective_game_updated', {
        gameState: detectiveGames[roomCode],
        logMessage: '🚀 تم بدء التحقيق بأمر من رئيس الشرطة!',
        logType: 'success'
      });
    });

    // =============================================
    // 3. بدء اللعبة من لاعب آخر
    // =============================================
    socket.on('detective_start', ({ roomCode, caseId }) => {
      console.log(`🚀 Starting detective game in room ${roomCode}`);
      const currentPlayers = rooms[roomCode]?.players || [];
      const caseData = casesDatabase[caseId || 'case_murad_01'];

      detectiveGames[roomCode] = {
        caseId: caseId || 'case_murad_01',
        started: true,
        completed: false,
        players: currentPlayers,
        decryptedImages: [],
        decryptedVideos: [],
        decryptedDocs: [],
        decryptedMessages: [],
        encryptedFolderUnlocked: false,
        extractedEncryptedFolder: false,
        discoveredPhones: false,
        discoveredAtms: false,
        discoveredCameras: false,
        playerAnswers: {},
        correctCulprits: caseData?.correctCulprits || [],
        correctMotive: caseData?.correctMotive || '',
        solutionSummary: caseData?.solutionSummary || '',
        allPlayersSubmitted: false,
        foundSocialProfiles: {},
      };

      io.to(roomCode).emit('detective_started', detectiveGames[roomCode]);
      io.to(roomCode).emit('detective_game_updated', {
        gameState: detectiveGames[roomCode],
        logMessage: '🚀 تم بدء التحقيق!',
        logType: 'success'
      });
    });

    // =============================================
    // 4. المحرك الرئيسي
    // =============================================
    socket.on('detective_action_submit', ({ roomCode, playerId, actionType, payload }) => {
      const game = detectiveGames[roomCode];
      if (!game) return;

      const player = game.players.find(p => p.id === playerId) || { name: 'محقق' };
      let logMessage = '';
      let logType = 'info';

      switch (actionType) {
        case 'SEARCH':
          if (payload.resultData) {
            game.lastSearchResults = payload.resultData;
            logMessage = `🔍 [${player.name}] بحث عن مصطلح!`;
            logType = 'info';
          } else {
            game.lastSearchResults = { results: null };
          }
          break;

        case 'UPDATE_STATE_VALUE':
          if (payload.targetKey) {
            game[payload.targetKey] = payload.value;
          }
          break;

        case 'UPDATE_STATE_ARRAY':
          if (payload.targetKey && payload.value) {
            if (!game[payload.targetKey]) game[payload.targetKey] = [];
            if (!game[payload.targetKey].includes(payload.value)) {
              game[payload.targetKey].push(payload.value);
            }
          }
          break;

        case 'EMAIL_CRACK_SUCCESS':
          game.emailCracked = true;
          logMessage = `🔓 [${player.name}] كسر حماية البريد!`;
          logType = 'success';
          break;

        case 'RESOLVE_CASE':
          game.completed = true;
          logMessage = `🎯 [${player.name}] حل القضية!`;
          logType = 'resolved';
          break;

        case 'RESET_EXTRACTED_DATA':
          game.extractedDocs = [];
          game.decryptedImages = [];
          game.decryptedVideos = [];
          game.decryptedDocs = [];
          game.decryptedMessages = [];
          game.encryptedFolderUnlocked = false;
          game.extractedEncryptedFolder = false;
          logMessage = `🔌 [${player.name}] قطع الاتصال.`;
          logType = 'info';
          break;

        default:
          break;
      }

      io.to(roomCode).emit('detective_game_updated', {
        gameState: game,
        logMessage,
        logType
      });
    });

    // =============================================
    // 5. المزامنة العامة
    // =============================================
    socket.on('custom_sync', ({ roomCode, type, data }) => {
      const game = detectiveGames[roomCode];
      if (!game) return;

      switch (type) {
        case 'sync_report_opened':
          game.hasOpenedReport = true;
          break;
        case 'unlock_location':
          if (!game.unlockedLocations) game.unlockedLocations = [];
          if (data?.locKey && !game.unlockedLocations.includes(data.locKey)) {
            game.unlockedLocations.push(data.locKey);
          }
          break;
        case 'sync_location_select':
          game.selectedLocation = data?.locKey || '';
          break;
        case 'sync_social_profile':
          if (data?.name) {
            game.foundSocialProfiles[data.name] = data;
          }
          break;
        case 'sync_comms':
          if (!game.commsHistory) game.commsHistory = [];
          game.commsHistory.push(data);
          break;
        case 'sync_system_hacked':
          if (!game.hackedSystems) game.hackedSystems = [];
          if (data?.sysKey && !game.hackedSystems.includes(data.sysKey)) {
            game.hackedSystems.push(data.sysKey);
          }
          break;
        default:
          break;
      }

      io.to(roomCode).emit('custom_sync', { type, data });
      io.to(roomCode).emit('detective_game_updated', {
        gameState: game,
        logMessage: getSyncLogMessage(type, data),
        logType: 'discovery'
      });
    });

    // =============================================
    // 6. مزامنة الملفات المفككة
    // =============================================
    socket.on('sync_decrypted_data', ({ roomCode, data }) => {
      const game = detectiveGames[roomCode];
      if (!game) return;

      game.decryptedImages = data.decryptedImages || [];
      game.decryptedVideos = data.decryptedVideos || [];
      game.decryptedDocs = data.decryptedDocs || [];
      game.decryptedMessages = data.decryptedMessages || [];
      game.encryptedFolderUnlocked = data.encryptedFolderUnlocked || false;
      game.extractedEncryptedFolder = data.extractedEncryptedFolder || false;
      game.discoveredPhones = data.discoveredPhones || false;
      game.discoveredAtms = data.discoveredAtms || false;
      game.discoveredCameras = data.discoveredCameras || false;

      io.to(roomCode).emit('sync_decrypted_data', {
        decryptedImages: game.decryptedImages,
        decryptedVideos: game.decryptedVideos,
        decryptedDocs: game.decryptedDocs,
        decryptedMessages: game.decryptedMessages,
        encryptedFolderUnlocked: game.encryptedFolderUnlocked,
        extractedEncryptedFolder: game.extractedEncryptedFolder,
        discoveredPhones: game.discoveredPhones,
        discoveredAtms: game.discoveredAtms,
        discoveredCameras: game.discoveredCameras
      });

      io.to(roomCode).emit('detective_game_updated', {
        gameState: game,
        logMessage: `🔓 تم تحديث الملفات المفككة.`,
        logType: 'info'
      });
    });

    // =============================================
    // 7. استقبال إجابة اللاعب
    // =============================================
    socket.on('submit_case_answer', ({ roomCode, playerId, answer }) => {
      const game = detectiveGames[roomCode];
      if (!game) return;

      if (!game.playerAnswers) game.playerAnswers = {};
      game.playerAnswers[playerId] = answer;

      const correctCulprits = game.correctCulprits || [];
      const questions = game.closureQuestions || {};

      // ── normalize ──
      const normalize = str => str.toLowerCase().trim()
        .replace(/\s+/g, '')
        .replace(/،/g, '')
        .replace(/,/g, '');

      // ── تحقق من المتهمين دايماً بنفس المنطق ──
      const culpritsAnswer = answer['culprits'] || '';
      const culpritsList = typeof culpritsAnswer === 'string'
        ? culpritsAnswer.split(/[,،]/).map(s => s.trim()).filter(Boolean)
        : culpritsAnswer;

      const culpritsCorrect =
        culpritsList.length === correctCulprits.length &&
        culpritsList.every(c =>
          correctCulprits.some(cc =>
            normalize(cc).includes(normalize(c)) ||
            normalize(c).includes(normalize(cc))
          )
        );

      // ── تحقق من باقي الأسئلة ديناميكياً ──
      let score = culpritsCorrect ? 1 : 0;
      const breakdown = [];

      // المتهمون أول حاجة في الـ breakdown
      breakdown.push({
        label: 'المتهمون',
        correct: culpritsCorrect,
        playerAnswer: culpritsList.join('، ') || '—',
        correctAnswer: correctCulprits.join('، ')
      });

      // باقي الأسئلة من closureQuestions — بس مش culprits لأنه اتعمل فوق
      Object.entries(questions).forEach(([key, q]) => {
        if (key === 'culprits') return; // اتعمل فوق

        const playerAnswer = (answer[key] || '').toLowerCase();
        const matched = q.keywords.some(k => playerAnswer.includes(k.toLowerCase()));
        if (matched) score++;

        breakdown.push({
          label: q.label,
          correct: matched,
          playerAnswer: answer[key] || '—',
          correctAnswer: q.keywords.slice(0, 3).join(' / ')
        });
      });

      const totalQuestions = Object.keys(questions).length;
      const isCorrect = score === totalQuestions;

      const totalPlayers = game.players.length;
      const submittedCount = Object.keys(game.playerAnswers).length;
      const allSubmitted = totalPlayers > 0 && submittedCount === totalPlayers;
      game.allPlayersSubmitted = allSubmitted;

      socket.emit('case_answer_result', {
        isCorrect,
        score,
        correctAnswer: {
          culprits: correctCulprits,
          motive: game.correctMotive || '',
          summary: game.solutionSummary || '',
          breakdown
        },
        allSubmitted
      });

      io.to(roomCode).emit('detective_game_updated', {
        gameState: game,
        logMessage: `📋 [${game.players.find(p => p.id === playerId)?.name || 'محقق'}] قدم إجابته — النقاط: ${score}/${totalQuestions}`,
        logType: isCorrect ? 'success' : 'error'
      });
    });

    // =============================================
    // 8. طلب قضية جديدة
    // =============================================
    socket.on('request_new_case', ({ roomCode }) => {
      if (detectiveGames[roomCode]) {
        const allCases = ['case_murad_01', 'case_palace_02', 'case_ship_03', 'case_writer_04', 'case_museum_05', 'case_artist_06', 'case_interpreter_07', 'case_coldcase_08', 'case_plane_9', 'case_witness_10', 'case_judge_11', 'case_hotel_12', 'case_memoirs_13'];
        const currentCase = detectiveGames[roomCode].caseId;
        const availableCases = allCases.filter(c => c !== currentCase);
        const nextCase = availableCases.length > 0
          ? availableCases[Math.floor(Math.random() * availableCases.length)]
          : allCases[Math.floor(Math.random() * allCases.length)];

        const caseData = casesDatabase[nextCase];

        detectiveGames[roomCode] = {
          ...detectiveGames[roomCode],
          caseId: nextCase,
          completed: false,
          decryptedImages: [],
          decryptedVideos: [],
          decryptedDocs: [],
          decryptedMessages: [],
          encryptedFolderUnlocked: false,
          extractedEncryptedFolder: false,
          discoveredPhones: false,
          discoveredAtms: false,
          discoveredCameras: false,
          playerAnswers: {},
          allPlayersSubmitted: false,
          correctCulprits: caseData?.correctCulprits || [],
          correctMotive: caseData?.correctMotive || '',
          solutionSummary: caseData?.solutionSummary || '',
          closureQuestions: caseData?.closureQuestions || {},
        };

        io.to(roomCode).emit('trigger_case_loading');
        io.to(roomCode).emit('detective_game_updated', {
          gameState: detectiveGames[roomCode],
          logMessage: `📡 تم تهيئة القضية الجديدة: ${nextCase}`,
          logType: 'system'
        });
      }
    });

    // =============================================
    // 9. دالة مساعدة
    // =============================================
    function getSyncLogMessage(type, data) {
      switch (type) {
        case 'sync_report_opened': return '📑 تم فتح المحضر.';
        case 'unlock_location': return `🗺️ تم فتح موقع: ${data?.locName || ''}`;
        case 'sync_location_select': return `🔬 فحص موقع: ${data?.locName || ''}`;
        case 'sync_social_profile': return `👤 رصد حساب: ${data?.name || ''}`;
        case 'sync_comms': return `📡 بث اتصال جديد.`;
        case 'sync_system_hacked': return `⚡ اختراق خادم: ${data?.sysName || ''}`;
        default: return '🔄 تحديث في النظام.';
      }
    }






// فحص الفوز بالشبكة


  // ===== EXISTING QUIZ EVENTS =====
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
    if (!rooms[roomCode]) return;

    rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== playerId);
    io.to(roomCode).emit('player_left', playerId);
    io.to(roomCode).emit('update_players', rooms[roomCode].players);

    if (rooms[roomCode].players.length === 0) {
      if (rooms[roomCode].timerInterval) clearInterval(rooms[roomCode].timerInterval);
      movieTTT.stopTimer(roomCode);
      delete rooms[roomCode];
    }
  });

  socket.on('play_audio', (roomCode) => {
    console.log('🖥️ [SERVER] received play_audio for room:', roomCode);
    updatePlayerActivity(socket.id);
    io.to(roomCode).emit('play_audio');
  });

  socket.on('pause_audio', (roomCode) => {
    console.log('🖥️ [SERVER] received pause_audio for room:', roomCode);
    updatePlayerActivity(socket.id);
    io.to(roomCode).emit('pause_audio');
  });

  socket.on('continue_audio', (roomCode, time) => {
    updatePlayerActivity(socket.id);
    io.to(roomCode).emit('continue_audio', time);
  });

  // ----- TIMER (authoritative on server) -----
  socket.on('timer_update', ({ roomCode, seconds, running }) => {
    updatePlayerActivity(socket.id);
    const room = rooms[roomCode];
    if (!room) return;

    // Clear any existing timer interval
    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }

    room.timerSeconds = seconds;
    room.timerRunning = running;

    // Broadcast immediately
    io.to(roomCode).emit('timer_sync', { seconds, running });

    // If running, start server‑side tick
    if (running) {
      room.timerInterval = setInterval(() => {
        room.timerSeconds += 1;
        io.to(roomCode).emit('timer_sync', {
          seconds: room.timerSeconds,
          running: true
        });
      }, 1000);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);

    delete playerActivity[socket.id];

    const roomCode = socket.data?.roomCode;
    const playerId = socket.data?.playerId;

    if (!roomCode || !rooms[roomCode]) return;

    // لو السوكيت ده كان الأدمن، نشيله من players
    const adminPlayer = rooms[roomCode].players.find(p => p.socketId === socket.id);
    if (adminPlayer) {
      rooms[roomCode].players = rooms[roomCode].players.filter(p => p.socketId !== socket.id);
      console.log(`❌ Admin ${adminPlayer.name} disconnected from room ${roomCode}`);
    } else if (playerId) {
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      if (player) {
        rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== playerId);
        console.log(`❌ ${player.name} disconnected from room ${roomCode}`);
      }
    }

    // تعيين أدمن جديد لو الأدمن القديم خرج وباقي لاعبين
    const oldAdminSocketId = rooms[roomCode].admin;
    if (!rooms[roomCode].players.some(p => p.socketId === oldAdminSocketId) && rooms[roomCode].players.length > 0) {
      const newAdmin = rooms[roomCode].players[0];
      rooms[roomCode].admin = newAdmin.socketId;
      newAdmin.isAdmin = true;
      console.log(`👑 New admin assigned: ${newAdmin.name}`);
    }

    if (rooms[roomCode].players.length === 0) {
      if (rooms[roomCode].timerInterval) clearInterval(rooms[roomCode].timerInterval);
      movieTTT.stopTimer(roomCode);
      delete rooms[roomCode];
      console.log(`🏠 Room ${roomCode} closed (no players)`);
    } else {
      io.to(roomCode).emit('update_players', rooms[roomCode].players);
    }
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
  console.log(`🖼️ Whoami (unique photos) system ready!`);
  console.log(`🕵️ Spy (personalised words) system ready!`);
});