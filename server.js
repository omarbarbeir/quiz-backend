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
const swordOfKnowledgeQuestions = require('./data/swordOfKnowledgeQuestions');
const hangmanWordsData = require('./data/hangmanWords');
const mafiosaCases = require('./data/mafiosaCases')

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

const roomVotes = {};
const mafiosaState = {};




const hangmanWords = Array.isArray(hangmanWordsData) ? hangmanWordsData : (hangmanWordsData.words || []);


// دالة ذكية لسحب الكلمة والتلميح بدون ما السيرفر يضرب
function getRandomWordData() {
  const randomItem = hangmanWords[Math.floor(Math.random() * hangmanWords.length)];
  
  // لو الداتا بالشكل الجديد (كائن فيه word و hint)
  if (typeof randomItem === 'object' && randomItem !== null) {
    return { 
      word: randomItem.word || 'خطأ_في_الكلمة', 
      hint: randomItem.hint || '' 
    };
  } 
  // لو الداتا لسه فيها كلمات بالطريقة القديمة (نص عادي)
  else if (typeof randomItem === 'string') {
    return { 
      word: randomItem, 
      hint: 'بدون تلميح' 
    };
  }
  
  // لو حصل أي تهنيج في الداتا
  return { word: 'داتا_غير_صالحة', hint: '' };
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
  
  const nonAdminPlayers = players.filter(p => !p.isAdmin);
  
  nonAdminPlayers.forEach(player => {
    const handCards = shuffledDeck.splice(0, 5);
    handCards.forEach((card, index) => {
      card.originalHandIndex = index;
    });
    playerHands[player.id] = handCards;
    console.log(`   Dealt 5 cards to ${player.name}:`, playerHands[player.id].map(card => ({ 
      name: card.name, 
      type: card.type, 
      subtype: card.subtype,
      originalHandIndex: card.originalHandIndex
    })));
  });

  players.filter(p => p.isAdmin).forEach(admin => {
    playerHands[admin.id] = [];
  });

  console.log(`🃏 Remaining cards in draw pile: ${shuffledDeck.length}`);

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

function setupSwordOfKnowledge(socket) {
  let resolveClaim, askDuelQuestion, resolveDuelRound;

  // ========== SOCKET EVENT HANDLERS ==========
  socket.on('sok_init', ({ roomCode }) => {
    console.log(`[SOK] sok_init for room ${roomCode}`);
    const room = rooms[roomCode];
    if (!room) {
      console.log(`[SOK] Room ${roomCode} not found`);
      return;
    }

    if (room.sok) {
      room.sok.players = room.players.filter(p => !p.isAdmin).map(p => ({
        id: p.id, name: p.name, color: p.color, eliminated: p.eliminated || false
      }));
      const state = sanitizeSOK(room.sok);
      socket.emit('sok_state', state);
      return;
    }

    const game = initSOKGame(room);
    if (!game) {
      socket.emit('sok_error', { message: 'Could not initialize game' });
      return;
    }
    room.sok = game;
    const state = sanitizeSOK(room.sok);
    socket.emit('sok_state', state);
  });

  socket.on('sok_reset', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    room.players.forEach(p => { p.eliminated = false; });
    const game = initSOKGame(room);
    if (game) {
      room.sok = game;
      io.to(roomCode).emit('sok_state', sanitizeSOK(game));
    }
  });

  socket.on('sok_claim', ({ roomCode, continentId, regionName, playerId }) => {
    const game = rooms[roomCode]?.sok;
    if (!game) return;
    if ((game.phase !== 'claiming' && game.phase !== 'attacking') || game.turn !== playerId) return;
    const cont = SOK_CONTINENTS.find(c => c.id === continentId);
    if (!cont) return;
    const region = cont.regions.find(r => r.id === regionName);
    if (!region || game.ownership[continentId][regionName] !== null) return;

    // نختار سؤالاً عشوائياً من السيرفر
    const question = getRandomQuestion();
    if (!question) return;

    game.currentQuestion = question;
    game.answersArray = [];
    game.pendingAction = { type: 'claim', continentId, regionName, playerId };

    const playerName = rooms[roomCode].players.find(p => p.id === playerId)?.name || '???';
    io.to(roomCode).emit('sok_claim_start', {
      playerName,
      regionName: region.name,
      continentName: cont.name,
      isEmpty: true,
    });

    clearTimeout(game.timer);
    game.timer = setTimeout(() => {
      if (rooms[roomCode]?.sok?.currentQuestion === question) {
        io.to(roomCode).emit('sok_question', question);
        clearTimeout(rooms[roomCode].sok.timer);
        rooms[roomCode].sok.timer = setTimeout(() => {
          resolveClaim(roomCode, continentId, regionName);
        }, 20000);
      }
    }, 5000);

    io.to(roomCode).emit('sok_state', sanitizeSOK(game));
  });

  socket.on('sok_attack_hub', ({ roomCode, continentId, regionName, attackerId }) => {
    const game = rooms[roomCode]?.sok;
    if (!game || game.phase !== 'attacking' || game.turn !== attackerId) return;
    const cont = SOK_CONTINENTS.find(c => c.id === continentId);
    if (!cont) return;
    const region = cont.regions.find(r => r.id === regionName);
    if (!region) return;
    const currentOwner = game.ownership[continentId][regionName];
    if (!currentOwner || currentOwner === attackerId) return;

    const question = getRandomQuestion();
    if (!question) return;

    game.phase = 'duel';
    game.duel = {
      attackerId,
      defenderId: currentOwner,
      scores: { [attackerId]: 0, [currentOwner]: 0 },
      round: 1,
      question: null,
      answers: {},
      useDelay: true,
    };
    game.pendingAction = { type: 'attack_hub', continentId, regionName, attackerId, defenderId: currentOwner };

    const attackerName = rooms[roomCode].players.find(p => p.id === attackerId)?.name || '???';
    const defenderName = rooms[roomCode].players.find(p => p.id === currentOwner)?.name || '???';
    io.to(roomCode).emit('sok_duel_start', {
      attackerName,
      defenderName,
      regionName: region.name,
      continentName: cont.name,
      ownerName: defenderName,
    });

    // نبدأ الجولة الأولى بعد تأخير (كما في النسخة الأصلية)
    askDuelQuestion(roomCode, question, 5000);
    io.to(roomCode).emit('sok_state', sanitizeSOK(game));
  });

  socket.on('sok_attack_base', ({ roomCode, continentId, attackerId }) => {
    const game = rooms[roomCode]?.sok;
    if (!game || game.phase !== 'attacking' || game.turn !== attackerId) return;
    const cont = SOK_CONTINENTS.find(c => c.id === continentId);
    if (!cont) return;
    const baseRegionId = cont.regions[0].id;
    const defenderId = game.ownership[continentId][baseRegionId];
    if (!defenderId || defenderId === attackerId) return;

    const defenderHomeContinent = Object.keys(game.ownership).find(cid =>
      game.ownership[cid][SOK_CONTINENTS.find(c => c.id === cid).regions[0].id] === defenderId
    );
    if (!defenderHomeContinent) return;
    const foreignOwned = Object.keys(game.ownership).some(cid => {
      if (cid === defenderHomeContinent) return false;
      return Object.values(game.ownership[cid]).some(owner => owner === defenderId);
    });
    if (foreignOwned) return;

    const defenderHubs = cont.regions.filter((_, idx) => idx > 0 && idx <= 4);
    const attackerHubCount = defenderHubs.filter(r => game.ownership[continentId][r.id] === attackerId).length;
    if (attackerHubCount < 3) return;

    const question = getRandomQuestion();
    if (!question) return;

    game.phase = 'duel';
    game.duel = {
      attackerId,
      defenderId,
      scores: { [attackerId]: 0, [defenderId]: 0 },
      round: 1,
      question: null,
      answers: {},
      useDelay: false,
    };
    game.pendingAction = { type: 'attack_base', continentId, attackerId, defenderId };

    askDuelQuestion(roomCode, question, 0);
    io.to(roomCode).emit('sok_state', sanitizeSOK(game));
  });

  socket.on('sok_claim_answer', ({ roomCode, playerId, answer }) => {
    const game = rooms[roomCode]?.sok;
    if (!game || !game.currentQuestion || (game.phase !== 'claiming' && game.phase !== 'attacking')) return;
    if (!game.pendingAction || game.pendingAction.type !== 'claim') return;
    if (game.answersArray.some(a => a.playerId === playerId)) return;
    game.answersArray.push({ playerId, answer });

    const nonAdmins = rooms[roomCode].players.filter(p => !p.isAdmin && !p.eliminated);
    const allAnswered = nonAdmins.every(p => game.answersArray.some(a => a.playerId === p.id));
    if (allAnswered) {
      clearTimeout(game.timer);
      resolveClaim(roomCode, game.pendingAction.continentId, game.pendingAction.regionName);
    }
  });

  socket.on('sok_duel_answer', ({ roomCode, playerId, answer }) => {
    const game = rooms[roomCode]?.sok;
    if (!game || game.phase !== 'duel' || !game.duel) return;
    if (playerId !== game.duel.attackerId && playerId !== game.duel.defenderId) return;
    if (game.duel.answers[playerId] !== undefined) return;
    game.duel.answers[playerId] = answer;
    if (Object.keys(game.duel.answers).length === 2) {
      clearTimeout(game.timer);
      resolveDuelRound(roomCode);
    }
  });

  // مقبض جديد: عندما يطلب السيرفر من المهاجم سؤالاً، المهاجم يرد فقط بالإشارة (بدون سؤال)
  socket.on('sok_provide_duel_question', ({ roomCode }) => {
    const game = rooms[roomCode]?.sok;
    if (!game || game.phase !== 'duel' || !game.duel) return;
    // نختار سؤالاً جديداً ونرسله فوراً
    const question = getRandomQuestion();
    if (!question) return;
    askDuelQuestion(roomCode, question, 0);
  });

  // ========== INTERNAL RESOLVERS ==========
  resolveClaim = (roomCode, continentId, regionName) => {
    const game = rooms[roomCode]?.sok;
    if (!game || !game.currentQuestion) return;

    const q = game.currentQuestion;
    let winner = null;

    if (q.type === 'numeric') {
      let bestDiff = Infinity;
      for (const entry of game.answersArray) {
        const num = parseFloat(entry.answer);
        if (isNaN(num)) continue;
        const diff = Math.abs(num - q.answer);
        if (diff < bestDiff) { bestDiff = diff; winner = entry.playerId; }
      }
    } else if (q.type === 'mcq') {
      const correctIdx = q.answer;
      for (const entry of game.answersArray) {
        if (parseInt(entry.answer.trim(), 10) === correctIdx) { winner = entry.playerId; break; }
      }
    }

    if (winner) {
      game.ownership[continentId][regionName] = winner;
      game.scores[winner] = (game.scores[winner] || 0) + 1;
    } else {
      const initiatorId = game.pendingAction?.playerId;
      if (game.phase === 'attacking' && initiatorId) {
        game.skippedPlayers[initiatorId] = true;
      }
    }

    const initiatorId = game.pendingAction?.playerId;
    const results = {
      answers: game.answersArray.map(entry => {
        const p = rooms[roomCode].players.find(pl => pl.id === entry.playerId);
        return { playerId: entry.playerId, playerName: p?.name || '???', answer: entry.answer, color: p?.color || '#fff' };
      }),
      winner,
      correctAnswer: q.type === 'numeric' ? q.answer : q.options?.[q.answer],
      correctIndex: q.type === 'mcq' ? q.answer : null,
      initiatorCorrect: winner === initiatorId,
    };
    io.to(roomCode).emit('sok_results', results);

    game.currentQuestion = null;
    game.pendingAction = null;
    game.answersArray = [];

    if (game.phase === 'claiming') {
      game.turn = getNextPlayerSOK(roomCode, game.turn);
      const currentPlayer = initiatorId;
      if (!game.playedInRound) game.playedInRound = [];
      if (currentPlayer && !game.playedInRound.includes(currentPlayer)) {
        game.playedInRound.push(currentPlayer);
      }
      const nonAdmins = rooms[roomCode].players.filter(p => !p.isAdmin && !p.eliminated).map(p => p.id);
      const allPlayed = nonAdmins.every(pid => game.playedInRound.includes(pid));
      if (allPlayed) {
        game.roundCount = (game.roundCount || 0) + 1;
        game.playedInRound = [];
        let allClaimed = true;
        for (const cont of SOK_CONTINENTS) {
          for (const reg of cont.regions) {
            if (game.ownership[cont.id][reg.id] === null) { allClaimed = false; break; }
          }
          if (!allClaimed) break;
        }
        if (game.roundCount >= MAX_CLAIM_ROUNDS || allClaimed) {
          game.phase = 'attacking';
          io.to(roomCode).emit('sok_stage_changed', { stage: 'attacking' });
        }
      }
    } else if (game.phase === 'attacking') {
      game.turn = getNextPlayerSOK(roomCode, game.turn);
    }

    io.to(roomCode).emit('sok_state', sanitizeSOK(game));
    io.to(roomCode).emit('sok_clear_question');
  };

  askDuelQuestion = (roomCode, question, delay = 0) => {
    const game = rooms[roomCode]?.sok;
    if (!game || !game.duel) return;

    const broadcast = () => {
      const currentGame = rooms[roomCode]?.sok;
      if (!currentGame || !currentGame.duel) return;
      currentGame.duel.question = question;
      currentGame.duel.answers = {};
      const attackerSocket = getPlayerSocketSOK(roomCode, currentGame.duel.attackerId);
      const defenderSocket = getPlayerSocketSOK(roomCode, currentGame.duel.defenderId);
      if (attackerSocket) attackerSocket.emit('sok_duel_question', question);
      if (defenderSocket) defenderSocket.emit('sok_duel_question', question);
      io.to(roomCode).emit('sok_duel_status', {
        attacker: currentGame.duel.attackerId,
        defender: currentGame.duel.defenderId,
        round: currentGame.duel.round
      });
      clearTimeout(currentGame.timer);
      currentGame.timer = setTimeout(() => {
        const g = rooms[roomCode]?.sok;
        if (g && g.phase === 'duel' && g.duel) {
          resolveDuelRound(roomCode);
        }
      }, 20000);
    };

    if (delay > 0) {
      clearTimeout(game.timer);
      game.timer = setTimeout(broadcast, delay);
    } else {
      broadcast();
    }
  };

  resolveDuelRound = (roomCode) => {
    const game = rooms[roomCode]?.sok;
    if (!game || !game.duel) return;
    const { attackerId, defenderId, question, answers } = game.duel;
    let roundWinner = null;

    if (question.type === 'numeric') {
      let bestDiff = Infinity;
      for (const [pid, ans] of Object.entries(answers)) {
        const num = parseFloat(ans);
        if (isNaN(num)) continue;
        const diff = Math.abs(num - question.answer);
        if (diff < bestDiff) { bestDiff = diff; roundWinner = pid; }
      }
    } else if (question.type === 'mcq') {
      const correctIdx = question.answer;
      if (answers[attackerId] !== undefined && parseInt(answers[attackerId].trim(), 10) === correctIdx) roundWinner = attackerId;
      else if (answers[defenderId] !== undefined && parseInt(answers[defenderId].trim(), 10) === correctIdx) roundWinner = defenderId;
    }

    if (roundWinner) game.duel.scores[roundWinner]++;

    io.to(roomCode).emit('sok_duel_round_result', {
      round: game.duel.round,
      winner: roundWinner,
      scores: game.duel.scores,
      correctAnswer: question.type === 'numeric' ? question.answer : question.options[question.answer],
      answers: answers,
    });

    if (game.duel.scores[attackerId] >= 2 || game.duel.scores[defenderId] >= 2) {
      const duelWinner = game.duel.scores[attackerId] >= 2 ? attackerId : defenderId;
      const duelLoser = duelWinner === attackerId ? defenderId : attackerId;

      if (game.pendingAction.type === 'attack_hub') {
        if (duelWinner === attackerId) {
          game.ownership[game.pendingAction.continentId][game.pendingAction.regionName] = attackerId;
          game.scores[attackerId] = (game.scores[attackerId] || 0) + 1;
          game.scores[defenderId] = Math.max(0, (game.scores[defenderId] || 1) - 1);
        }
      } else if (game.pendingAction.type === 'attack_base') {
        if (duelWinner === attackerId) {
          for (const cont of SOK_CONTINENTS) {
            for (const reg of cont.regions) {
              if (game.ownership[cont.id][reg.id] === duelLoser) {
                game.ownership[cont.id][reg.id] = duelWinner;
                game.scores[duelWinner] = (game.scores[duelWinner] || 0) + 1;
                game.scores[duelLoser] = Math.max(0, (game.scores[duelLoser] || 1) - 1);
              }
            }
          }
          const room = rooms[roomCode];
          const loserPlayer = room.players.find(p => p.id === duelLoser);
          if (loserPlayer) loserPlayer.eliminated = true;
          game.players = room.players.filter(p => !p.isAdmin).map(p => ({
            id: p.id, name: p.name, color: p.color, eliminated: p.eliminated || false
          }));
        }
      }

      game.duel = null;
      game.pendingAction = null;
      game.phase = 'attacking';
      game.turn = getNextPlayerSOK(roomCode, attackerId);

      const activePlayers = game.players.filter(p => !p.eliminated);
      if (activePlayers.length === 1) {
        game.phase = 'ended';
        io.to(roomCode).emit('sok_game_over', { winner: activePlayers[0].id, name: activePlayers[0].name });
      }
    } else {
      game.duel.round++;
      game.duel.question = null;
      game.duel.answers = {};
      // إرسال طلب للمهاجم ليُشعِرنا بأنه مستعد للجولة التالية (دون إرسال سؤال)
      const attackerSocket = getPlayerSocketSOK(roomCode, attackerId);
      if (attackerSocket) attackerSocket.emit('sok_request_duel_question');
    }
    io.to(roomCode).emit('sok_state', sanitizeSOK(game));
  };
}

// تصدير الدالة (تأكد من استدعائها عند اتصال socket)
module.exports = { setupSwordOfKnowledge };


// =====================================================
// Socket.io connection handling
// =====================================================
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  updatePlayerActivity(socket.id);
  setupSwordOfKnowledge(socket);

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
      // 🎨 Assign a unique colour
      const nonAdminPlayers = rooms[roomCode].players.filter(p => !p.isAdmin);
      const colorIndex = nonAdminPlayers.length % playerColorPalette.length;
      const assignedColor = player.color || playerColorPalette[colorIndex];

      const playerWithSocket = { 
        ...player, 
        socketId: socket.id,
        isAdmin: socket.id === rooms[roomCode].admin,
        color: assignedColor,
      };
      rooms[roomCode].players.push(playerWithSocket);
      socket.join(roomCode);
      
      socket.emit('player_joined', playerWithSocket);
      io.to(roomCode).emit('player_joined', playerWithSocket);
      
      socket.emit('whiteboard_state', rooms[roomCode].whiteboard);
      
      if (rooms[roomCode].cardGame) {
        socket.emit('card_game_state_update', rooms[roomCode].cardGame);
      }
      
      socket.data = { roomCode, playerId: player.id };
      console.log(`✅ ${player.name} joined room ${roomCode} (color: ${assignedColor}). Total players: ${rooms[roomCode].players.length}`);
    } else {
      socket.emit('room_not_found');
      console.log(`❌ Room ${roomCode} not found`);
    }
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

  // ===== TIC TAC TOE EVENTS =====
  socket.on('tic_tac_toe_start', ({ roomCode, playerX, playerO }) => {
    updatePlayerActivity(socket.id);
    const room = rooms[roomCode];
    if (!room) return;
    room.ticTacToe = {
      board: Array(9).fill(null),
      turn: 'X',
      winner: null,
      playerX,
      playerO
    };
    io.to(roomCode).emit('tic_tac_toe_state', room.ticTacToe);
  });

  socket.on('tic_tac_toe_move', ({ roomCode, index, playerId }) => {
    updatePlayerActivity(socket.id);
    const room = rooms[roomCode];
    if (!room || !room.ticTacToe) return;
    const game = room.ticTacToe;
    if (game.board[index] || game.winner) return;

    const currentPlayer = game.turn === 'X' ? game.playerX : game.playerO;
    if (currentPlayer.id !== playerId) return; // not this player's turn

    game.board[index] = game.turn;

    // Check winner
    const lines = [
      [0,1,2],[3,4,5],[6,7,8], // rows
      [0,3,6],[1,4,7],[2,5,8], // cols
      [0,4,8],[2,4,6]          // diags
    ];
    for (let line of lines) {
      const [a,b,c] = line;
      if (game.board[a] && game.board[a] === game.board[b] && game.board[a] === game.board[c]) {
        game.winner = game.turn;
        break;
      }
    }
    if (!game.winner && game.board.every(cell => cell !== null)) {
      game.winner = 'draw';
    }

    game.turn = game.turn === 'X' ? 'O' : 'X';
    io.to(roomCode).emit('tic_tac_toe_state', game);
  });

  socket.on('tic_tac_toe_reset', ({ roomCode }) => {
    updatePlayerActivity(socket.id);
    const room = rooms[roomCode];
    if (!room || !room.ticTacToe) return;
    room.ticTacToe.board = Array(9).fill(null);
    room.ticTacToe.turn = 'X';
    room.ticTacToe.winner = null;
    io.to(roomCode).emit('tic_tac_toe_state', room.ticTacToe);
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
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
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

  // Take card from table
  socket.on('card_game_take_table', ({ roomCode, playerId, cardId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🃏 TAKE FROM TABLE by player ${playerId} for card ${cardId} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
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

  // Use shake card
  socket.on('card_game_use_shake', ({ roomCode, playerId, cardId }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 USE SHAKE CARD by player ${playerId} in room ${roomCode}, cardId: ${cardId}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const room = rooms[roomCode];
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
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

  // Remove card from circle
  socket.on('card_game_remove_from_circle', ({ roomCode, playerId, circleIndex }) => {
    updatePlayerActivity(socket.id);
    console.log(`🔄 REMOVE FROM CIRCLE by player ${playerId} from circle ${circleIndex} in room ${roomCode}`);
    
    if (rooms[roomCode] && rooms[roomCode].cardGame) {
      const game = rooms[roomCode].cardGame;
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
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

  // Bingo – initialise per player
  socket.on('bingo_init', ({ roomCode, playerId }) => {
    if (!rooms[roomCode]) return;
    if (!rooms[roomCode].bingoGames) {
      rooms[roomCode].bingoGames = {};
    }
    if (!rooms[roomCode].bingoGames[playerId]) {
      rooms[roomCode].bingoGames[playerId] = {
        grid: Array.from({ length: 5 }, () => Array(5).fill('')),
        marks: Array.from({ length: 5 }, () => Array(5).fill(false)),
      };
    }
    socket.emit('bingo_state', rooms[roomCode].bingoGames[playerId]);
  });

  // Bingo cell number update
  socket.on('bingo_cell_update', ({ roomCode, playerId, row, col, value }) => {
    if (!rooms[roomCode] || !rooms[roomCode].bingoGames) return;
    if (!rooms[roomCode].bingoGames[playerId]) {
      rooms[roomCode].bingoGames[playerId] = {
        grid: Array.from({ length: 5 }, () => Array(5).fill('')),
        marks: Array.from({ length: 5 }, () => Array(5).fill(false)),
      };
    }
    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      rooms[roomCode].bingoGames[playerId].grid[row][col] = value;
      socket.emit('bingo_state', rooms[roomCode].bingoGames[playerId]);
    }
  });

  // Bingo mark toggle
  socket.on('bingo_mark_update', ({ roomCode, playerId, row, col, marked }) => {
    if (!rooms[roomCode] || !rooms[roomCode].bingoGames) return;
    if (!rooms[roomCode].bingoGames[playerId]) {
      rooms[roomCode].bingoGames[playerId] = {
        grid: Array.from({ length: 5 }, () => Array(5).fill('')),
        marks: Array.from({ length: 5 }, () => Array(5).fill(false)),
      };
    }
    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      rooms[roomCode].bingoGames[playerId].marks[row][col] = marked;
      socket.emit('bingo_state', rooms[roomCode].bingoGames[playerId]);
    }
  });

  socket.on('bingo_reset', ({ roomCode, playerId }) => {
    if (!rooms[roomCode] || !rooms[roomCode].bingoGames) return;
    if (rooms[roomCode].bingoGames[playerId]) {
      rooms[roomCode].bingoGames[playerId] = {
        grid: Array.from({ length: 5 }, () => Array(5).fill('')),
        marks: Array.from({ length: 5 }, () => Array(5).fill(false)),
      };

      // ★ Clear shared called numbers
      if (rooms[roomCode].bingoCalled) {
        rooms[roomCode].bingoCalled = [];
        io.to(roomCode).emit('bingo_called_numbers', []);
      }
      socket.emit('bingo_state', rooms[roomCode].bingoGames[playerId]);
    }
  });

  socket.on('bingo_call_number', ({ roomCode }) => {
    if (!rooms[roomCode]) return;
    if (!rooms[roomCode].bingoCalled) {
      rooms[roomCode].bingoCalled = [];
    }
    const called = rooms[roomCode].bingoCalled;
    // Generate random number 1-25 not already called
    if (called.length >= 25) return; // all called
    let num;
    do {
      num = Math.floor(Math.random() * 25) + 1;
    } while (called.includes(num));
    called.push(num);
    io.to(roomCode).emit('bingo_called_numbers', called);
  });


  // Battleship – init per player
  socket.on('battleship_init', ({ roomCode, playerId }) => {
    if (!rooms[roomCode]) return;
    if (!rooms[roomCode].battleship) {
      rooms[roomCode].battleship = {};
    }
    if (!rooms[roomCode].battleship[playerId]) {
      rooms[roomCode].battleship[playerId] = {
        grid: Array.from({ length: 11 }, () => Array(11).fill(null)),
        placedShips: [],
      };
    }
    socket.emit('battleship_state', rooms[roomCode].battleship[playerId]);
  });

  // Place a ship
  socket.on('battleship_place', ({ roomCode, playerId, shipId, positions }) => {
    if (!rooms[roomCode]?.battleship?.[playerId]) return;
    const board = rooms[roomCode].battleship[playerId];
    // Mark grid
    positions.forEach(({ r, c }) => {
      if (r >= 0 && r < 11 && c >= 0 && c < 11) {
        board.grid[r][c] = shipId;
      }
    });
    board.placedShips.push({ shipId, positions });
    socket.emit('battleship_state', board);
  });

  // Remove a ship
  socket.on('battleship_remove', ({ roomCode, playerId, shipId }) => {
    if (!rooms[roomCode]?.battleship?.[playerId]) return;
    const board = rooms[roomCode].battleship[playerId];
    const ship = board.placedShips.find(s => s.shipId === shipId);
    if (ship) {
      ship.positions.forEach(({ r, c }) => {
        if (r >= 0 && r < 11 && c >= 0 && c < 11) {
          board.grid[r][c] = null;
        }
      });
      board.placedShips = board.placedShips.filter(s => s.shipId !== shipId);
      socket.emit('battleship_state', board);
    }
  });

  socket.on('battleship_miss', ({ roomCode, playerId, row, col }) => {
    if (!rooms[roomCode]?.battleship?.[playerId]) return;
    const board = rooms[roomCode].battleship[playerId];
    if (row >= 1 && row <= 10 && col >= 1 && col <= 10 && board.grid[row][col] === null) {
      board.grid[row][col] = 'miss';
      socket.emit('battleship_state', board);
    }
  });

  // Reset board
  socket.on('battleship_reset', ({ roomCode, playerId }) => {
    if (!rooms[roomCode]?.battleship) return;
    rooms[roomCode].battleship[playerId] = {
      grid: Array.from({ length: 11 }, () => Array(11).fill(null)),
      placedShips: [],
    };
    socket.emit('battleship_state', rooms[roomCode].battleship[playerId]);
  });

  // Destroy a single cell of a ship
  socket.on('battleship_destroy', ({ roomCode, playerId, row, col, shipId }) => {
    if (!rooms[roomCode]?.battleship?.[playerId]) return;
    const board = rooms[roomCode].battleship[playerId];
    if (row >= 0 && row < 11 && col >= 0 && col < 11 && board.grid[row][col] && !board.grid[row][col].startsWith('hit-')) {
      board.grid[row][col] = `hit-${shipId}`;
      socket.emit('battleship_state', board);
    }
  });


  // ===================== BRACKET (دور الـ١٦) =====================
  socket.on('bracket_init', ({ roomCode }) => {
    if (!rooms[roomCode]) return;
    if (rooms[roomCode].bracket) {
      socket.emit('bracket_state', rooms[roomCode].bracket);
      return;
    }
    rooms[roomCode].bracket = {
      rounds: [
        { matches: [] },  // round of 16
        { matches: [] },  // quarter
        { matches: [] },  // semi
        { matches: [] },  // final
      ],
      currentRoundIndex: 0,
    };
    socket.emit('bracket_state', rooms[roomCode].bracket);
  });

  socket.on('bracket_randomize', ({ roomCode, names }) => {
    if (!rooms[roomCode]) return;
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    const matches = [];
    for (let i = 0; i < 8; i++) {
      matches.push({
        team1: shuffled[i * 2] || `فريق ${i * 2 + 1}`,
        team2: shuffled[i * 2 + 1] || `فريق ${i * 2 + 2}`,
        votes: {},
        voters: [],
        winner: null,
      });
    }
    rooms[roomCode].bracket.rounds[0].matches = matches;
    rooms[roomCode].bracket.currentRoundIndex = 0;
    for (let i = 1; i < 4; i++) {
      rooms[roomCode].bracket.rounds[i].matches = [];
    }
    io.to(roomCode).emit('bracket_state', rooms[roomCode].bracket);
  });

  socket.on('bracket_vote', ({ roomCode, roundIndex, matchIndex, choice, playerId }) => {
    if (!rooms[roomCode]?.bracket) return;
    const round = rooms[roomCode].bracket.rounds[roundIndex];
    if (!round || !round.matches[matchIndex]) return;
    const match = round.matches[matchIndex];
    if (match.winner) return;
    if (!match.votes) match.votes = {};
    if (!match.voters) match.voters = [];
    if (match.voters.includes(playerId)) return;
    match.votes[choice] = (match.votes[choice] || 0) + 1;
    match.voters.push(playerId);
    io.to(roomCode).emit('bracket_state', rooms[roomCode].bracket);
  });

  socket.on('bracket_next_round', ({ roomCode }) => {
    if (!rooms[roomCode]?.bracket) return;
    const bracket = rooms[roomCode].bracket;
    const currentRound = bracket.rounds[bracket.currentRoundIndex];

    // Determine winners by vote count
    currentRound.matches.forEach(match => {
      if (!match.winner) {
        const votes = match.votes || {};
        const team1Votes = votes[match.team1] || 0;
        const team2Votes = votes[match.team2] || 0;
        match.winner = team1Votes >= team2Votes ? match.team1 : match.team2;
      }
    });

    // Collect winners in order
    const winners = currentRound.matches.map(m => m.winner);
    const nextRoundIndex = bracket.currentRoundIndex + 1;
    if (nextRoundIndex > 3) return;
    const nextRound = bracket.rounds[nextRoundIndex];
    nextRound.matches = [];
    for (let i = 0; i < winners.length; i += 2) {
      nextRound.matches.push({
        team1: winners[i],
        team2: winners[i + 1],
        votes: {},
        voters: [],
        winner: null,
      });
    }
    bracket.currentRoundIndex = nextRoundIndex;
    io.to(roomCode).emit('bracket_state', bracket);
  });

  socket.on('bracket_reset', ({ roomCode }) => {
    if (!rooms[roomCode]) return;
    rooms[roomCode].bracket = {
      rounds: [
        { matches: [] },
        { matches: [] },
        { matches: [] },
        { matches: [] },
      ],
      currentRoundIndex: 0,
    };
    io.to(roomCode).emit('bracket_state', rooms[roomCode].bracket);
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

  // ===== NEW: SPY (personalised word) =====
  // 1. تحديث حدث spy_start عشان نحفظ الجاسوس
  socket.on('spy_start', ({ roomCode, assignments }) => {
    updatePlayerActivity(socket.id);
    console.log(`🕵️ SPY START in room ${roomCode} with ${assignments.length} assignments`);
    
    if (!rooms[roomCode]) return;
    
    const room = rooms[roomCode];
    room.spyVotes = {}; // تصفير التصويتات القديمة

    io.to(roomCode).emit('update_players', room.players);
    
    assignments.forEach(({ playerId, question }) => {
      // تحديد الجاسوس (بافتراض أن كلمة الجاسوس تحتوي على كلمة Spy أو جاسوس)
      if (question.text.toLowerCase().includes('spy') || question.text.includes('جاسوس')) {
        room.spyId = playerId;
      }
      
      const player = room.players.find(p => p.id === playerId);
      if (player) {
        io.to(player.socketId).emit('player_photo_question', {
          playerId,
          question
        });
      }
    });
  });

  // 2. أحداث التصويت الجديدة
  socket.on('start_spy_voting', (roomCode) => {
    io.to(roomCode).emit('open_spy_voting');
  });

  socket.on('submit_spy_vote', ({ roomCode, voterId, votedForId }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].spyVotes[voterId] = votedForId; // حفظ تصويت اللاعب
    }
  });

  socket.on('end_spy_voting', (roomCode) => {
    const room = rooms[roomCode];
    if (!room || !room.spyId) return;

    const votes = room.spyVotes || {};
    const spyId = room.spyId;

    // ✅ هل أي لاعب صوت للجاسوس؟
    const spyCaught = Object.values(votes).includes(spyId);

    let correctVoters = [];
    let roundScores = [];

    room.players.forEach(player => {
      let pointsEarned = 0;

      if (spyCaught) {
        // الجاسوس انكشف – المصوتون الصحيحون فقط يحصلون على نقطة
        if (votes[player.id] === spyId) {
          pointsEarned = 1;
          correctVoters.push(player.name);
        }
      } else {
        // الجاسوس هرب – الجاسوس فقط يحصل على نقطة
        if (player.id === spyId) {
          pointsEarned = 1;
        }
      }

      if (pointsEarned > 0) {
        player.score = (player.score || 0) + pointsEarned;
      }

      roundScores.push({
        name: player.name,
        pointsEarned: pointsEarned,
        isSpy: player.id === spyId
      });
    });

    io.to(roomCode).emit('spy_voting_results', {
      spyCaught,
      spyId,
      correctVoters,
      players: room.players,
      roundScores
    });

    io.to(roomCode).emit('update_players', room.players); // 🔄 تحديث لوحة النتائج
  });



  
  // ===================== HANGMAN GAME =====================

  function getHangmanState(roomCode) {
    const state = hangmanState[roomCode];
    
    // ضفنا هنا !state.word عشان لو مفيش كلمة ميضربش السيرفر
    if (!state || !state.word) return null; 
    
    const word = state.word;
    const guessedLetters = state.guessedLetters;
    
    const display = word.split('').map(c => {
      if (c === ' ') return ' ';
      return guessedLetters.includes(c) ? c : '_';
    }).join(' ');

    const uniqueRemainingLetters = new Set(
      word.split('').filter(c => c !== ' ')
    );
    guessedLetters.forEach(g => uniqueRemainingLetters.delete(g));

    return {
      display,
      guessedLetters,
      attempts: state.attempts,
      maxAttempts: state.maxAttempts,
      gameOver: state.gameOver,
      won: state.won,
      word: state.gameOver ? word : '', 
      hint: state.hint, 
      remaining: uniqueRemainingLetters.size,
    };
  }

    socket.on('hangman_get_state', ({ roomCode }) => {
      if (!roomCode) return;
      socket.join(roomCode); 

      if (hangmanState[roomCode]) {
        socket.emit('hangman_state', getHangmanState(roomCode));
        return;
      }

      // الاستخدام هنا 👇
      const randomData = getRandomWordData();
      
      hangmanState[roomCode] = {
        word: randomData.word,
        hint: randomData.hint,
        guessedLetters: [],
        attempts: 0,
        maxAttempts: MAX_ATTEMPTS,
        gameOver: false,
        won: false,
      };
      socket.emit('hangman_state', getHangmanState(roomCode));
    });

  socket.on('hangman_guess', ({ roomCode, letter }) => {
    if (!roomCode) return;
    const state = hangmanState[roomCode];
    if (!state || state.gameOver) return;

    const guessed = letter.trim(); 
    if (guessed.length !== 1) return;

    if (state.guessedLetters.includes(guessed)) return;
    
    state.guessedLetters.push(guessed);

    const wordLetters = state.word.split('').filter(c => c !== ' ');

    if (wordLetters.includes(guessed)) {
      const guessedSet = new Set(state.guessedLetters);
      const allGuessed = wordLetters.every(c => guessedSet.has(c));
      if (allGuessed) {
        state.won = true;
        state.gameOver = true;
      }
    } else {
      state.attempts += 1;
      if (state.attempts >= state.maxAttempts) {
        state.gameOver = true;
        state.won = false;
      }
    }
    io.to(roomCode).emit('hangman_state', getHangmanState(roomCode));
  });

  socket.on('hangman_reset', ({ roomCode }) => {
    if (!roomCode) return;
    
    // الاستخدام هنا 👇
    const randomData = getRandomWordData();
    
    hangmanState[roomCode] = {
      word: randomData.word,
      hint: randomData.hint,
      guessedLetters: [],
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      gameOver: false,
      won: false,
    };
    io.to(roomCode).emit('hangman_state', getHangmanState(roomCode));
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

    // 1. فحص هل الغرفة موجودة في ذاكرة السيرفر
    const room = rooms[roomCode];
    if (!room) {
      console.log(`[Mafiosa Error] Room ${roomCode} not found in servers memory!`);
      socket.emit('mafiosa_error', { 
        message: 'انتهت صلاحية الغرفة أو أعيد تشغيل السيرفر. ارجع للرئيسية وأنشئ غرفة جديدة.' 
      });
      return;
    }

    // 2. فحص أمان للتأكد من وجود مصفوفة القضايا (تأكد من مطابقة الاسم mafiosaCases)
    if (!mafiosaCases || mafiosaCases.length === 0) {
      console.log(`[Mafiosa Error] mafiosaCases array is empty or not defined!`);
      socket.emit('mafiosa_error', { message: 'خطأ في السيرفر: لم يتم العثور على قضايا مافيوسو!' });
      return;
    }

    // 3. تهيئة حالة اللعبة لو مش متهيئة أو لو اللعبة القديمة خلصت
    if (!mafiosaState[roomCode] || mafiosaState[roomCode].gameOver) {
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
        investigatedSuspects: {}, // playerId: [suspectId, ...]
      };
    }

    // 4. إرسال البيانات والـ State الحالي للفرونت إند لفتح اللعبة
    const currentState = mafiosaState[roomCode];
    const caseData = mafiosaCases[currentState.caseIndex];

    console.log(`[Mafiosa System] Sending case data ("${caseData.title}") to room: ${roomCode}`);

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
    if (rooms[roomCode]) {
      rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== playerId);
      io.to(roomCode).emit('player_left', playerId);
      
      if (rooms[roomCode].players.length === 0) {
        // stop the timer before deleting the room
        if (rooms[roomCode].timerInterval) clearInterval(rooms[roomCode].timerInterval);
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
    
    if (roomCode && rooms[roomCode] && playerId) {
      const player = rooms[roomCode].players.find(p => p.id === playerId);
      
      if (player) {
        rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== playerId);
        console.log(`❌ ${player.name} disconnected from room ${roomCode}`);
        
        if (rooms[roomCode].admin === socket.id && rooms[roomCode].players.length > 0) {
          rooms[roomCode].admin = rooms[roomCode].players[0].socketId;
          console.log(`👑 New admin assigned: ${rooms[roomCode].players[0].name}`);
        }
        
        if (rooms[roomCode].players.length === 0) {
          // 👇 stop the timer before deleting the room
          if (rooms[roomCode].timerInterval) clearInterval(rooms[roomCode].timerInterval);
          delete rooms[roomCode];
          console.log(`🏠 Room ${roomCode} closed (no players)`);
        }
      }
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