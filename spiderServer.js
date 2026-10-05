/**
 * ============================================================
 *  spiderServer.js — Spider Solitaire (فردية)
 *  ✅ الأدمن بقى لاعب كامل في players[]
 *  ✅ + close_game listener لتنظيف الغرفة
 * ============================================================
 */

const ALL_SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const COLS = 10;

const spiderRooms = {};
if (typeof global !== 'undefined') global.spiderRooms = spiderRooms;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rankValue(rank) {
  if (rank === 'A') return 1;
  if (rank === 'J') return 11;
  if (rank === 'Q') return 12;
  if (rank === 'K') return 13;
  return parseInt(rank, 10);
}

function createDeck(suitCount) {
  const suits = suitCount === 1 ? ['spades']
              : suitCount === 2 ? ['spades', 'hearts']
              : ALL_SUITS;
  const copies = 8 / suits.length;
  const deck = [];
  for (let c = 0; c < copies; c++) {
    for (const suit of suits) {
      for (const rank of RANKS) {
        deck.push({ id: `${suit}_${rank}_c${c}`, suit, rank, faceUp: false });
      }
    }
  }
  return deck;
}

function dealNewGame(suitCount = 1) {
  const deck = shuffle(createDeck(suitCount));
  const tableau = Array.from({ length: COLS }, () => []);

  for (let col = 0; col < COLS; col++) {
    const count = col < 4 ? 6 : 5;
    for (let i = 0; i < count; i++) {
      const card = deck.pop();
      tableau[col].push(card);
    }
    if (tableau[col].length > 0) {
      tableau[col][tableau[col].length - 1].faceUp = true;
    }
  }

  const stock = deck.map(c => ({ ...c, faceUp: false }));

  return {
    tableau,
    stock,
    completedSets: 0,
    suitCount,
    moves: 0,
    startTime: Date.now(),
    gameWon: false,
  };
}

function canStackOnTableau(card, targetCard) {
  if (!targetCard) return true;
  if (card.suit !== targetCard.suit) return false;
  return rankValue(card.rank) === rankValue(targetCard.rank) - 1;
}

function checkCompletedSequences(game) {
  let found = false;
  for (let colIdx = 0; colIdx < COLS; colIdx++) {
    const col = game.tableau[colIdx];
    if (col.length < 13) continue;

    const last13 = col.slice(-13);
    if (last13[0].rank !== 'K') continue;

    let valid = true;
    for (let i = 0; i < 13; i++) {
      if (!last13[i].faceUp) { valid = false; break; }
      if (last13[i].suit !== last13[0].suit) { valid = false; break; }
      if (rankValue(last13[i].rank) !== 13 - i) { valid = false; break; }
    }

    if (valid) {
      col.splice(-13);
      if (col.length > 0 && !col[col.length - 1].faceUp) {
        col[col.length - 1].faceUp = true;
      }
      game.completedSets++;
      found = true;
      colIdx--;
    }
  }
  return found;
}

function createRoom(roomCode) {
  return {
    roomCode,
    adminSocketId: null,
    adminPlayerId: null,   // ✅ جديد
    players: {},
    playerOrder: [],
  };
}

function buildState(room, socketId) {
  const me = Object.values(room.players).find(p => p.socketId === socketId);
  const isAdmin = !!(me && me.isAdmin) || room.adminSocketId === socketId;

  return {
    roomCode: room.roomCode,
    isAdmin,
    me: me ? {
      id: me.id,
      name: me.name,
      game: me.game,
      isAdmin: !!me.isAdmin,
    } : null,
    players: room.playerOrder.map(id => {
      const p = room.players[id];
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        moves: p.game?.moves || 0,
        gameWon: p.game?.gameWon || false,
        completedSets: p.game?.completedSets || 0,
        elapsed: p.game ? Math.floor((Date.now() - p.game.startTime) / 1000) : 0,
        suitCount: p.game?.suitCount || 1,
        isAdmin: !!p.isAdmin,
      };
    }).filter(Boolean),
  };
}

function broadcast(io, room) {
  const sent = new Set();
  room.playerOrder.forEach(id => {
    const p = room.players[id];
    if (!p || sent.has(p.socketId)) return;
    const s = io.sockets.sockets.get(p.socketId);
    if (s) {
      s.emit('spider_state', buildState(room, p.socketId));
      sent.add(p.socketId);
    }
  });
  if (room.adminSocketId && !sent.has(room.adminSocketId)) {
    const s = io.sockets.sockets.get(room.adminSocketId);
    if (s) s.emit('spider_state', buildState(room, room.adminSocketId));
  }
}

function handleLeave(io, socket, roomCode) {
  const room = spiderRooms[roomCode];
  if (!room) return;

  // ✅ لو الأدمن خرج، نشيل adminSocketId
  if (room.adminSocketId === socket.id) {
    room.adminSocketId = null;
  }

  const playerId = socket.data.spiderPlayerId
    || Object.keys(room.players).find(id => room.players[id].socketId === socket.id);

  if (playerId && room.players[playerId]) {
    delete room.players[playerId];
    room.playerOrder = room.playerOrder.filter(id => id !== playerId);
    if (room.adminPlayerId === playerId) room.adminPlayerId = null;
  }

  if (room.playerOrder.length === 0 && !room.adminSocketId) {
    delete spiderRooms[roomCode];
    return;
  }

  broadcast(io, room);
}

module.exports = function setupSpider(io) {
  io.on('connection', (socket) => {

    // ✅ انضمام لاعب (أدمن أو عادي) — بنفس الحدث
    socket.on('spider_join', ({ roomCode, playerId, playerName, isAdmin }) => {
      if (!roomCode || !playerId) return;
      if (!spiderRooms[roomCode]) spiderRooms[roomCode] = createRoom(roomCode);
      const room = spiderRooms[roomCode];

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
          game: dealNewGame(1),
          isAdmin: !!isAdmin,
        };
        room.playerOrder.push(playerId);
      }
      socket.join(`spider_${roomCode}`);
      socket.data.spiderRoomCode = roomCode;
      socket.data.spiderPlayerId = playerId;
      broadcast(io, room);
    });

    // ✅ legacy — للأمان
    socket.on('spider_admin_join', ({ roomCode }) => {
      if (!roomCode) return;
      if (!spiderRooms[roomCode]) spiderRooms[roomCode] = createRoom(roomCode);
      const room = spiderRooms[roomCode];
      room.adminSocketId = socket.id;
      socket.join(`spider_${roomCode}`);
      socket.data.spiderRoomCode = roomCode;
      broadcast(io, room);
    });

    socket.on('spider_new_game', ({ roomCode, suitCount }) => {
      const room = spiderRooms[roomCode];
      if (!room) return;
      const playerId = socket.data.spiderPlayerId;
      const player = room.players[playerId];
      if (!player) return;
      const sc = [1, 2, 4].includes(suitCount) ? suitCount : 1;
      player.game = dealNewGame(sc);
      broadcast(io, room);
    });

    socket.on('spider_draw', ({ roomCode }) => {
      const room = spiderRooms[roomCode];
      if (!room) return;
      const playerId = socket.data.spiderPlayerId;
      const player = room.players[playerId];
      if (!player || !player.game) return;
      const game = player.game;
      if (game.gameWon) return;

      if (game.stock.length === 0) {
        socket.emit('spider_error', { message: 'الديل فاضي!' });
        return;
      }

      if (game.tableau.some(col => col.length === 0)) {
        socket.emit('spider_error', { message: 'لازم تملأ الأعمدة الفاضية قبل ما تسحب!' });
        return;
      }

      for (let i = 0; i < COLS; i++) {
        const card = game.stock.pop();
        if (!card) break;
        card.faceUp = true;
        game.tableau[i].push(card);
      }

      game.moves++;
      checkCompletedSequences(game);

      if (game.completedSets >= 8) {
        game.gameWon = true;
      }

      broadcast(io, room);
    });

    socket.on('spider_move', ({ roomCode, fromCol, cardIndex, toCol }) => {
      const room = spiderRooms[roomCode];
      if (!room) return;
      const playerId = socket.data.spiderPlayerId;
      const player = room.players[playerId];
      if (!player || !player.game) return;
      const game = player.game;
      if (game.gameWon) return;

      if (fromCol === toCol) return;
      if (fromCol < 0 || fromCol >= COLS || toCol < 0 || toCol >= COLS) return;

      const srcCol = game.tableau[fromCol];
      const destCol = game.tableau[toCol];
      if (cardIndex < 0 || cardIndex >= srcCol.length) return;

      for (let i = cardIndex; i < srcCol.length; i++) {
        if (!srcCol[i].faceUp) return;
      }

      for (let i = cardIndex; i < srcCol.length - 1; i++) {
        if (srcCol[i].suit !== srcCol[i + 1].suit) return;
        if (rankValue(srcCol[i].rank) !== rankValue(srcCol[i + 1].rank) + 1) return;
      }

      const movingCards = srcCol.slice(cardIndex);
      const firstCard = movingCards[0];
      const destTop = destCol[destCol.length - 1];

      if (!canStackOnTableau(firstCard, destTop)) return;

      game.tableau[fromCol] = srcCol.slice(0, cardIndex);
      if (game.tableau[fromCol].length > 0 && !game.tableau[fromCol][game.tableau[fromCol].length - 1].faceUp) {
        game.tableau[fromCol][game.tableau[fromCol].length - 1].faceUp = true;
      }
      game.tableau[toCol] = [...destCol, ...movingCards];

      game.moves++;
      checkCompletedSequences(game);

      if (game.completedSets >= 8) {
        game.gameWon = true;
      }

      broadcast(io, room);
    });

    socket.on('spider_leave', ({ roomCode }) => handleLeave(io, socket, roomCode));
    socket.on('disconnect', () => {
      const roomCode = socket.data?.spiderRoomCode;
      if (roomCode) handleLeave(io, socket, roomCode);
    });

    // ✅ تنظيف الغرفة عند إغلاق اللعبة
    socket.on('close_game', ({ roomCode }) => {
      const room = spiderRooms[roomCode];
      if (!room) return;
      delete spiderRooms[roomCode];
    });
  });
  console.log('🕷️ Spider Server loaded');
};