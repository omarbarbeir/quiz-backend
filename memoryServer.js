/**
 * ============================================================
 *  memoryServer.js — تحدي الذاكرة (Memory Grid)
 *  ✅ الأدمن بقى لاعب كامل في players[]
 *  ✅ + close_game listener لتنظيف الغرفة
 *  ✅ CDN أوثق للصور
 * ============================================================
 */

const MAX_PLAYERS = 10;
const FLIP_BACK_DELAY = 1500;

const THEMES = {
  animals: {
    name: 'حيوانات', emoji: '🐶',
    items: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦆','🦅','🦉','🐺','🐗','🐴','🦄','🐝','🦋','🐌','🐞','🐢','🐍','🦎','🐙','🦀','🐠','🐬','🐳','🦈','🦓','🦒','🦔','🦥','🦦','🦘'],
  },
  fruits: {
    name: 'فواكه', emoji: '🍎',
    items: ['🍎','🍊','🍋','🍌','🍉','🍇','🍓','🍒','🍑','🥝','🍍','🥥','🍅','🥕','🌽','🥦','🍄','🌰','🥜','🍯','🍞','🧀','🥚','🍗','🍔','🍕','🍟','🌭','🍿','🍩','🍪','🎂','🍰','🍫','🍬','🍭','🍮','🍦','🥧','🧁'],
  },
  vehicles: {
    name: 'عربيات', emoji: '🚗',
    items: ['🚗','🚕','🚙','🚌','🚎','🏎','🚓','🚑','🚒','🚐','🚚','🚛','🚜','🛵','🏍','🚲','🛴','✈','🚀','🚁','⛵','🚤','🛸','🚂','🚢','🛰','🛶','⛴','🚡','🚠','🚟','🚞','🚖','🚘','🚍','🚔','🚃','🚄','🚅'],
  },
  landmarks: {
    name: 'معالم', emoji: '🗽',
    items: ['🗽','🏰','🏯','🕌','🕍','⛩','🏛','🎡','🎢','🌉','🗼','⛲','🏝','🏔','🌋','🗻','🏟','🏖','🏜','⛰','🏞','🌆','🌇','🌃','🏙','🎠','🎪','🎭','🎨','🖼','🕋','🎑','🎆','🎇','🌁','🌌','🏕','⛺','🏘'],
  },
  nature: {
    name: 'طبيعة', emoji: '🌳',
    items: ['🌳','🌲','🌴','🌵','🌷','🌹','🌻','🌺','🍀','🍁','🌊','🌋','⭐','🌙','☀','🌈','⚡','❄','🔥','💧','🌪','🌫','☁','🌤','⛅','🌦','🌧','⛈','🌩','🌨','🌬','🌡','☂','☔','🌂','💨','✨','🌟'],
  },
  sports: {
    name: 'رياضة', emoji: '⚽',
    items: ['⚽','🏀','🏈','⚾','🎾','🏐','🎱','🏓','🎳','🥊','🥋','🏊','🚴','🏃','🏂','⛷','🏋','🤸','⛹','🤺','🏇','🧘','🏄','🚣','🧗','🤾','🏌','🏹','🎯','🎽','🥇','🏆','🥈','🥉','🏅','🎖','🎗','🎫'],
  },
  objects: {
    name: 'أشياء', emoji: '🎮',
    items: ['📱','💻','🎮','🎸','🎺','🎨','🎭','📚','✏','🎁','🎈','🎉','🎂','🎄','🔔','💎','⌚','📷','🎧','🎤','🎬','🎯','🎲','🧩','🪁','🎰','💡','🔑','🔒','📖','🎵','🎶','📺','📻','☎','📞','🖥','⌨','🖨','🕹'],
  },
};

const DIFFICULTY = {
  easy:   { rows: 4, cols: 4, pairs: 8 },
  medium: { rows: 6, cols: 6, pairs: 18 },
  hard:   { rows: 8, cols: 8, pairs: 32 },
};

const memoryRooms = {};
if (typeof global !== 'undefined') global.memoryRooms = memoryRooms;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function emojiToCodepoint(emoji) {
  const codepoints = [];
  for (const char of emoji) {
    const cp = char.codePointAt(0);
    if (cp === 0xFE0F) continue;
    codepoints.push(cp.toString(16));
  }
  return codepoints.join('-');
}

// ✅ CDN الأساسي (cdnjs) — أوثق من gh على jsdelivr
function getTwemojiUrl(emoji) {
  const cp = emojiToCodepoint(emoji);
  return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${cp}.svg`;
}

function getTheme(themeId) {
  return THEMES[themeId] || THEMES.animals;
}

function createRoom(roomCode) {
  return {
    roomCode,
    adminSocketId: null,
    adminPlayerId: null,   // ✅ جديد
    players: {},
    playerOrder: [],
    preferredOrder: [],
    phase: 'waiting',
    difficulty: 'easy',
    theme: 'animals',
    grid: [],
    gridSize: { rows: 4, cols: 4 },
    flippedCards: [],
    currentTurn: null,
    timer: null,
    scores: {},
    winnerId: null,
    lastMatch: null,
    lastMiss: null,
    startTime: null,
  };
}

function getPlayerBySocket(room, socketId) {
  return Object.values(room.players).find(p => p.socketId === socketId);
}

function nextPlayer(room, currentId) {
  const n = room.playerOrder.length;
  if (n === 0) return null;
  const idx = room.playerOrder.indexOf(currentId);
  if (idx === -1) return room.playerOrder[0];
  return room.playerOrder[(idx + 1) % n];
}

function reorderPlayers(room) {
  if (!room.preferredOrder || room.preferredOrder.length === 0) return;
  const newOrder = [];
  for (const id of room.preferredOrder) {
    if (room.players[id] && !newOrder.includes(id)) newOrder.push(id);
  }
  for (const id of room.playerOrder) {
    if (!newOrder.includes(id)) newOrder.push(id);
  }
  room.playerOrder = newOrder;
}

function generateGrid(difficulty, themeId) {
  const config = DIFFICULTY[difficulty] || DIFFICULTY.easy;
  const theme = getTheme(themeId);
  const shuffledItems = shuffle([...theme.items]);
  const selectedItems = shuffledItems.slice(0, config.pairs);
  const cards = [];
  for (let i = 0; i < config.pairs; i++) {
    const emoji = selectedItems[i];
    cards.push({ id: uid(), pairId: i, emoji, flipped: false, matched: false });
    cards.push({ id: uid(), pairId: i, emoji, flipped: false, matched: false });
  }
  return { cards: shuffle(cards), config };
}

function buildState(room, forSocketId) {
  const me = getPlayerBySocket(room, forSocketId);
  const isAdmin = !!(me && me.isAdmin) || room.adminSocketId === forSocketId;

  return {
    roomCode: room.roomCode,
    phase: room.phase,
    isAdmin,
    difficulty: room.difficulty,
    theme: room.theme || 'animals',
    gridSize: room.gridSize,
    currentTurn: room.currentTurn,
    currentTurnName: room.currentTurn ? room.players[room.currentTurn]?.name : null,
    flippedCards: room.flippedCards,
    lastMatch: room.lastMatch,
    lastMiss: room.lastMiss,
    winnerId: room.winnerId,
    scores: room.scores,
    isSolo: room.playerOrder.length === 1,
    startTime: room.startTime,
    players: room.playerOrder.map(id => {
      const p = room.players[id];
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        score: p.score || 0,
        moves: p.moves || 0,
        isTurn: room.currentTurn === id,
        isMe: me && me.id === id,
        isAdmin: !!p.isAdmin,
      };
    }).filter(Boolean),
    me: me ? {
      id: me.id,
      name: me.name,
      isTurn: room.currentTurn === me.id,
      score: me.score || 0,
      moves: me.moves || 0,
      isAdmin: !!me.isAdmin,
    } : null,
    grid: room.grid.map(c => ({
      id: c.id,
      pairId: c.pairId,
      emoji: c.emoji,
      flipped: c.flipped,
      matched: c.matched,
    })),
  };
}

function broadcast(io, room) {
  const sent = new Set();
  room.playerOrder.forEach(id => {
    const p = room.players[id];
    if (!p || sent.has(p.socketId)) return;
    const s = io.sockets.sockets.get(p.socketId);
    if (s) {
      s.emit('memory_state', buildState(room, p.socketId));
      sent.add(p.socketId);
    }
  });
  if (room.adminSocketId && !sent.has(room.adminSocketId)) {
    const s = io.sockets.sockets.get(room.adminSocketId);
    if (s) s.emit('memory_state', buildState(room, room.adminSocketId));
  }
}

function checkGameEnd(io, room) {
  const allMatched = room.grid.every(c => c.matched);
  if (!allMatched) return false;
  room.phase = 'gameEnd';
  room.currentTurn = null;
  room.scores = {};
  for (const id of room.playerOrder) {
    const p = room.players[id];
    if (!p) continue;
    room.scores[id] = { name: p.name, score: p.score || 0, moves: p.moves || 0 };
  }
  let maxScore = -1, winnerId = null;
  for (const [id, s] of Object.entries(room.scores)) {
    if (s.score > maxScore) { maxScore = s.score; winnerId = id; }
  }
  room.winnerId = winnerId;
  broadcast(io, room);
  return true;
}

function handleLeave(io, socket, roomCode) {
  const room = memoryRooms[roomCode];
  if (!room) return;

  if (room.adminSocketId === socket.id) {
    room.adminSocketId = null;
  }

  const playerId = socket.data.memoryPlayerId
    || Object.keys(room.players).find(id => room.players[id].socketId === socket.id);

  if (playerId && room.players[playerId]) {
    const wasTurn = room.currentTurn === playerId;
    delete room.players[playerId];
    room.playerOrder = room.playerOrder.filter(id => id !== playerId);
    if (room.adminPlayerId === playerId) room.adminPlayerId = null;

    if (room.playerOrder.length === 0 && !room.adminSocketId) {
      if (room.timer) clearTimeout(room.timer);
      delete memoryRooms[roomCode];
      return;
    }
    if (wasTurn && room.playerOrder.length > 0 && room.phase === 'playing') {
      room.currentTurn = nextPlayer(room, playerId);
    }
  }

  broadcast(io, room);
}

module.exports = function setupMemory(io) {
  io.on('connection', (socket) => {

    // ✅ انضمام لاعب (أدمن أو عادي) — بنفس الحدث
    socket.on('memory_join', ({ roomCode, playerId, playerName, isAdmin }) => {
      if (!roomCode || !playerId) return;
      if (!memoryRooms[roomCode]) memoryRooms[roomCode] = createRoom(roomCode);
      const room = memoryRooms[roomCode];

      if (!room.players[playerId] && room.playerOrder.length >= MAX_PLAYERS) {
        socket.emit('memory_error', { message: `الحد الأقصى ${MAX_PLAYERS} لاعبين` });
        return;
      }

      if (isAdmin) {
        room.adminSocketId = socket.id;
        room.adminPlayerId = playerId;
      }

      const existing = room.players[playerId];
      if (existing) {
        existing.socketId = socket.id;
        existing.name = playerName || existing.name;
        existing.isAdmin = !!isAdmin;
      } else {
        room.players[playerId] = {
          id: playerId, socketId: socket.id, name: playerName || 'لاعب',
          score: 0, moves: 0, isAdmin: !!isAdmin,
        };
        room.playerOrder.push(playerId);
      }
      reorderPlayers(room);
      socket.join(`memory_${roomCode}`);
      socket.data.memoryRoomCode = roomCode;
      socket.data.memoryPlayerId = playerId;
      broadcast(io, room);
    });

    // ✅ legacy — للأمان
    socket.on('memory_admin_join', ({ roomCode }) => {
      if (!roomCode) return;
      if (!memoryRooms[roomCode]) memoryRooms[roomCode] = createRoom(roomCode);
      const room = memoryRooms[roomCode];
      room.adminSocketId = socket.id;
      socket.join(`memory_${roomCode}`);
      socket.data.memoryRoomCode = roomCode;
      socket.data.memoryIsAdmin = true;
      broadcast(io, room);
    });

    socket.on('memory_set_order', ({ roomCode, playerIds }) => {
      const room = memoryRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (!Array.isArray(playerIds)) return;
      room.preferredOrder = playerIds;
      reorderPlayers(room);
      broadcast(io, room);
    });

    socket.on('memory_set_difficulty', ({ roomCode, difficulty }) => {
      const room = memoryRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase === 'playing') return;
      if (!DIFFICULTY[difficulty]) return;
      room.difficulty = difficulty;
      broadcast(io, room);
    });

    socket.on('memory_set_theme', ({ roomCode, theme }) => {
      const room = memoryRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase === 'playing') return;
      if (!THEMES[theme]) return;
      room.theme = theme;
      broadcast(io, room);
    });

    socket.on('memory_start', ({ roomCode }) => {
      const room = memoryRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase === 'playing') return;
      if (room.playerOrder.length < 1) {
        socket.emit('memory_error', { message: 'محتاج لاعب على الأقل' });
        return;
      }

      reorderPlayers(room);
      const { cards, config } = generateGrid(room.difficulty, room.theme || 'animals');
      room.grid = cards;
      room.gridSize = { rows: config.rows, cols: config.cols };
      room.flippedCards = [];
      room.lastMatch = null;
      room.lastMiss = null;
      room.scores = {};
      room.winnerId = null;
      room.phase = 'playing';
      room.startTime = Date.now();

      for (const id of room.playerOrder) {
        room.players[id].score = 0;
        room.players[id].moves = 0;
      }

      room.currentTurn = room.playerOrder[0];
      broadcast(io, room);
    });

    socket.on('memory_flip', ({ roomCode, cardIndex }) => {
      const room = memoryRooms[roomCode];
      if (!room || room.phase !== 'playing') return;
      if (room.flippedCards.length >= 2) return;

      const playerId = socket.data.memoryPlayerId;
      if (!playerId || room.currentTurn !== playerId) return;

      const card = room.grid[cardIndex];
      if (!card) return;
      if (card.matched || card.flipped) return;

      card.flipped = true;
      room.flippedCards.push(cardIndex);
      room.players[playerId].moves = (room.players[playerId].moves || 0) + 1;

      if (room.flippedCards.length === 1) {
        broadcast(io, room);
        return;
      }

      const [i1, i2] = room.flippedCards;
      const card1 = room.grid[i1];
      const card2 = room.grid[i2];

      if (card1.pairId === card2.pairId) {
        card1.matched = true;
        card2.matched = true;
        card1.flipped = false;
        card2.flipped = false;
        room.flippedCards = [];
        room.players[playerId].score = (room.players[playerId].score || 0) + 1;
        room.lastMatch = {
          playerId,
          playerName: room.players[playerId].name,
          imageUrl: card1.imageUrl,
          emoji: card1.emoji,
          cards: [i1, i2],
          timestamp: Date.now(),
        };
        broadcast(io, room);
        if (checkGameEnd(io, room)) return;
      } else {
        room.lastMiss = { playerName: room.players[playerId].name, cards: [i1, i2] };
        broadcast(io, room);
        room.timer = setTimeout(() => {
          const r = memoryRooms[roomCode];
          if (!r || r.phase !== 'playing') return;
          card1.flipped = false;
          card2.flipped = false;
          r.flippedCards = [];
          r.lastMiss = null;
          r.currentTurn = nextPlayer(r, playerId);
          broadcast(io, r);
        }, FLIP_BACK_DELAY);
      }
    });

    socket.on('memory_reset', ({ roomCode }) => {
      const room = memoryRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.timer) { clearTimeout(room.timer); room.timer = null; }
      room.grid = [];
      room.gridSize = { rows: 4, cols: 4 };
      room.flippedCards = [];
      room.currentTurn = null;
      room.phase = 'waiting';
      room.scores = {};
      room.winnerId = null;
      room.lastMatch = null;
      room.lastMiss = null;
      room.startTime = null;
      for (const id of room.playerOrder) {
        room.players[id].score = 0;
        room.players[id].moves = 0;
      }
      broadcast(io, room);
    });

    socket.on('memory_leave', ({ roomCode }) => handleLeave(io, socket, roomCode));
    socket.on('disconnect', () => {
      const roomCode = socket.data?.memoryRoomCode;
      if (roomCode) handleLeave(io, socket, roomCode);
    });

    // ✅ تنظيف الغرفة عند إغلاق اللعبة
    socket.on('close_game', ({ roomCode }) => {
      const room = memoryRooms[roomCode];
      if (!room) return;
      if (room.timer) clearTimeout(room.timer);
      delete memoryRooms[roomCode];
    });
  });
  console.log('🧠 Memory Server loaded');
};