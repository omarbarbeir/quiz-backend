/**
 * ============================================================
 *  bankServer.js — لعبة بنك مصرية
 *  ✅ الأدمن بقى لاعب كامل في players[]
 *  ✅ + close_game listener لتنظيف الغرفة
 * ============================================================
 */

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const NUMERIC_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const FACE_RANKS = ['J', 'Q', 'K'];
const LOAN_VALUES = { Q: 5, K: 15, J: 25 };
const MAX_PLAYERS = 15;

const bankRooms = {};
if (typeof global !== 'undefined') global.bankRooms = bankRooms;

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

function createRoom(roomCode) {
  return {
    roomCode,
    adminSocketId: null,
    adminPlayerId: null,   // ✅ جديد
    players: {},
    playerOrder: [],
    tableCards: [],
    currentTurn: null,
    phase: 'waiting',
    dealt: false,
    scores: {},
    winnerId: null,
    pendingBorrow: null,
    deckMultiplier: 1,
    preferredOrder: [],
  };
}

function getPlayerBySocket(room, socketId) {
  return Object.values(room.players).find(p => p.socketId === socketId);
}

function isPlayerOut(p) {
  return p.hand.length === 0 && p.loanCards.length === 0;
}

function getNextActivePlayer(room, currentId) {
  const n = room.playerOrder.length;
  if (n === 0) return null;
  const idx = room.playerOrder.indexOf(currentId);
  if (idx === -1) return room.playerOrder.find(id => !isPlayerOut(room.players[id])) || null;
  for (let i = 1; i <= n; i++) {
    const nextId = room.playerOrder[(idx + i) % n];
    const p = room.players[nextId];
    if (p && !isPlayerOut(p)) return nextId;
  }
  return null;
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

function countActive(room) {
  return room.playerOrder.filter(id => {
    const p = room.players[id];
    return p && !isPlayerOut(p);
  }).length;
}

function buildState(room, forSocketId) {
  const me = getPlayerBySocket(room, forSocketId);
  const isAdmin = !!(me && me.isAdmin) || room.adminSocketId === forSocketId;

  return {
    roomCode: room.roomCode, phase: room.phase, isAdmin, dealt: room.dealt,
    deckMultiplier: room.deckMultiplier || 1,
    tableCards: room.tableCards, currentTurn: room.currentTurn,
    currentTurnName: room.currentTurn ? room.players[room.currentTurn]?.name : null,
    pendingBorrow: room.pendingBorrow ? {
      requestId: room.pendingBorrow.requestId,
      borrowerId: room.pendingBorrow.borrowerId,
      borrowerName: room.players[room.pendingBorrow.borrowerId]?.name,
      targetId: room.pendingBorrow.targetId,
      targetName: room.players[room.pendingBorrow.targetId]?.name,
      amount: room.pendingBorrow.amount,
      isForMe: me && room.pendingBorrow.targetId === me.id,
      isMine: me && room.pendingBorrow.borrowerId === me.id,
    } : null,
    players: room.playerOrder.map(id => {
      const p = room.players[id];
      if (!p) return null;
      return {
        id: p.id, name: p.name, handCount: p.hand.length,
        loanCount: p.loanCards.length, isOut: isPlayerOut(p),
        isTurn: room.currentTurn === id, isMe: me && me.id === id,
        isAdmin: !!p.isAdmin,
      };
    }).filter(Boolean),
    me: me ? {
      id: me.id, name: me.name,
      hand: me.hand.map(c => ({ id: c.id })),
      loanCards: me.loanCards.map(c => ({ id: c.id, suit: c.suit, rank: c.rank })),
      isTurn: room.currentTurn === me.id, isOut: isPlayerOut(me),
      isAdmin: !!me.isAdmin,
    } : null,
    scores: room.scores, winnerId: room.winnerId,
  };
}

function broadcast(io, room) {
  const sent = new Set();
  Object.values(room.players).forEach(p => {
    if (sent.has(p.socketId)) return;
    const s = io.sockets.sockets.get(p.socketId);
    if (s) {
      s.emit('bank_state', buildState(room, p.socketId));
      sent.add(p.socketId);
    }
  });
  // Fallback للأدمن لو مش موجود في players (legacy)
  if (room.adminSocketId && !sent.has(room.adminSocketId)) {
    const s = io.sockets.sockets.get(room.adminSocketId);
    if (s) s.emit('bank_state', buildState(room, room.adminSocketId));
  }
}

function dealBankGame(room) {
  const playerCount = room.playerOrder.length;
  const deckCount = room.deckMultiplier === 2
    ? 2
    : Math.max(1, Math.ceil(playerCount / 2));

  const allNumeric = [];
  const allFace = [];
  for (let d = 0; d < deckCount; d++) {
    for (const suit of SUITS) {
      for (const rank of NUMERIC_RANKS) allNumeric.push({ id: `n_${suit}_${rank}_d${d}`, suit, rank, deckIndex: d });
      for (const rank of FACE_RANKS) allFace.push({ id: `f_${suit}_${rank}_d${d}`, suit, rank, deckIndex: d });
    }
  }

  const shuffledNumeric = shuffle(allNumeric);
  const shuffledFace = shuffle(allFace);
  const faceByRank = { J: [], Q: [], K: [] };
  shuffledFace.forEach(c => faceByRank[c.rank].push(c));

  for (const pid of room.playerOrder) {
    const p = room.players[pid];
    p.loanCards = [];
    p.hand = [];
    ['Q', 'K', 'J'].forEach(rank => {
      for (let i = 0; i < 2; i++) {
        if (faceByRank[rank].length > 0) p.loanCards.push(faceByRank[rank].pop());
      }
    });
  }

  const perPlayer = Math.floor(shuffledNumeric.length / playerCount);
  let idx = 0;
  for (const pid of room.playerOrder) {
    const p = room.players[pid];
    for (let i = 0; i < perPlayer; i++) p.hand.push(shuffledNumeric[idx++]);
  }
  room.tableCards = shuffle(shuffledNumeric.slice(idx));
}

function endGame(room) {
  room.phase = 'gameEnd';
  room.currentTurn = null;
  room.pendingBorrow = null;
  room.scores = {};
  for (const id of room.playerOrder) {
    const p = room.players[id];
    if (!p) continue;
    room.scores[id] = { name: p.name, total: p.hand.length };
  }
  let maxScore = -1, winnerId = null;
  for (const [id, s] of Object.entries(room.scores)) {
    if (s.total > maxScore) { maxScore = s.total; winnerId = id; }
  }
  room.winnerId = winnerId;
}

function checkGameEnd(io, room) {
  if (countActive(room) <= 1) {
    endGame(room);
    broadcast(io, room);
    return true;
  }
  return false;
}

function advanceTurn(io, room) {
  const next = getNextActivePlayer(room, room.currentTurn);
  if (!next) { endGame(room); broadcast(io, room); return; }
  room.currentTurn = next;
  broadcast(io, room);
}

function handleLeave(io, socket, roomCode) {
  const room = bankRooms[roomCode];
  if (!room) return;

  // ✅ لو الأدمن خرج، نشيل adminSocketId
  if (room.adminSocketId === socket.id) {
    room.adminSocketId = null;
  }

  const playerId = socket.data.bankPlayerId
    || Object.keys(room.players).find(id => room.players[id].socketId === socket.id);

  if (playerId && room.players[playerId]) {
    if (room.pendingBorrow && (room.pendingBorrow.borrowerId === playerId || room.pendingBorrow.targetId === playerId)) {
      room.pendingBorrow = null;
    }
    delete room.players[playerId];
    room.playerOrder = room.playerOrder.filter(id => id !== playerId);
    if (room.adminPlayerId === playerId) room.adminPlayerId = null;
    if (room.currentTurn === playerId && room.playerOrder.length > 0) {
      const next = getNextActivePlayer(room, playerId) || room.playerOrder[0];
      room.currentTurn = next;
    }
  }

  if (room.playerOrder.length === 0 && !room.adminSocketId) {
    delete bankRooms[roomCode];
    return;
  }

  broadcast(io, room);
}

module.exports = function setupBank(io) {
  io.on('connection', (socket) => {

    // ✅ انضمام لاعب (أدمن أو عادي) — بنفس الحدث
    socket.on('bank_join', ({ roomCode, playerId, playerName, isAdmin }) => {
      if (!roomCode || !playerId) return;
      if (!bankRooms[roomCode]) bankRooms[roomCode] = createRoom(roomCode);
      const room = bankRooms[roomCode];

      if (!room.players[playerId] && room.playerOrder.length >= MAX_PLAYERS) {
        socket.emit('bank_error', { message: `الحد الأقصى ${MAX_PLAYERS} لاعبين` });
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
          hand: [], loanCards: [],
          isAdmin: !!isAdmin,
        };
        room.playerOrder.push(playerId);
      }
      reorderPlayers(room);
      socket.join(`bank_${roomCode}`);
      socket.data.bankRoomCode = roomCode;
      socket.data.bankPlayerId = playerId;
      broadcast(io, room);
    });

    // ✅ legacy — للأمان
    socket.on('bank_admin_join', ({ roomCode }) => {
      if (!roomCode) return;
      if (!bankRooms[roomCode]) bankRooms[roomCode] = createRoom(roomCode);
      const room = bankRooms[roomCode];
      room.adminSocketId = socket.id;
      socket.join(`bank_${roomCode}`);
      socket.data.bankRoomCode = roomCode;
      socket.data.bankIsAdmin = true;
      broadcast(io, room);
    });

    socket.on('bank_start', ({ roomCode }) => {
      const room = bankRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.dealt || room.phase === 'playing') return;
      if (room.playerOrder.length < 2) { socket.emit('bank_error', { message: 'محتاج لاعبين على الأقل (2)' }); return; }
      reorderPlayers(room);
      dealBankGame(room);
      room.dealt = true;
      room.phase = 'playing';
      room.currentTurn = room.playerOrder[0];
      broadcast(io, room);
    });

    socket.on('bank_set_order', ({ roomCode, playerIds }) => {
      const room = bankRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (!Array.isArray(playerIds)) return;
      room.preferredOrder = playerIds;
      reorderPlayers(room);
      broadcast(io, room);
    });

    socket.on('bank_play_card', ({ roomCode, cardId }) => {
      const room = bankRooms[roomCode];
      if (!room || room.phase !== 'playing') return;
      if (room.pendingBorrow) return;
      const playerId = socket.data.bankPlayerId;
      if (!playerId || room.currentTurn !== playerId) return;
      const player = room.players[playerId];
      if (!player) return;
      const cardIdx = player.hand.findIndex(c => c.id === cardId);
      if (cardIdx === -1) return;

      const [card] = player.hand.splice(cardIdx, 1);
      const topCard = room.tableCards.length > 0 ? room.tableCards[room.tableCards.length - 1] : null;

      if (topCard && topCard.rank === card.rank) {
        const capturedCount = room.tableCards.length + 1;
        player.hand.push(...room.tableCards, card);
        room.tableCards = [];
        io.to(roomCode).emit('bank_table_captured', {
          playerId,
          playerName: player.name,
          count: capturedCount,
        });
      } else {
        room.tableCards.push(card);
      }

      if (checkGameEnd(io, room)) return;
      advanceTurn(io, room);
    });

    socket.on('bank_borrow_from_table', ({ roomCode, loanCardId }) => {
      const room = bankRooms[roomCode];
      if (!room || room.phase !== 'playing') return;
      if (room.pendingBorrow) return;
      const playerId = socket.data.bankPlayerId;
      if (!playerId || room.currentTurn !== playerId) return;
      const borrower = room.players[playerId];
      if (!borrower || borrower.hand.length > 0) return;
      const loanCard = borrower.loanCards.find(c => c.id === loanCardId);
      if (!loanCard) return;
      if (room.tableCards.length === 0) { socket.emit('bank_error', { message: 'الأرض فاضية' }); return; }

      const amount = LOAN_VALUES[loanCard.rank];
      const topCard = room.tableCards[room.tableCards.length - 1];
      const rest = shuffle(room.tableCards.slice(0, -1));
      const takeCount = Math.min(amount, rest.length);
      const taken = rest.slice(0, takeCount);
      const remaining = rest.slice(takeCount);

      borrower.hand.push(...taken);
      room.tableCards = [...remaining, topCard];
      const loanIdx = borrower.loanCards.findIndex(c => c.id === loanCardId);
      if (loanIdx !== -1) borrower.loanCards.splice(loanIdx, 1);
      broadcast(io, room);
    });

    socket.on('bank_request_borrow', ({ roomCode, loanCardId, targetId }) => {
      const room = bankRooms[roomCode];
      if (!room || room.phase !== 'playing') return;
      if (room.pendingBorrow) { socket.emit('bank_error', { message: 'في طلب استلاف معلق' }); return; }
      const playerId = socket.data.bankPlayerId;
      if (!playerId || room.currentTurn !== playerId) return;
      const borrower = room.players[playerId];
      if (!borrower || borrower.hand.length > 0) return;
      const loanCard = borrower.loanCards.find(c => c.id === loanCardId);
      if (!loanCard) { socket.emit('bank_error', { message: 'كارت استلاف غير صحيح' }); return; }
      const target = room.players[targetId];
      if (!target || targetId === playerId) { socket.emit('bank_error', { message: 'لاعب غير صحيح' }); return; }
      if (target.hand.length === 0) { socket.emit('bank_error', { message: 'اللاعب ده مفلس' }); return; }

      const amount = LOAN_VALUES[loanCard.rank];
      room.pendingBorrow = { requestId: uid(), borrowerId: playerId, targetId, amount, loanCardId };

      const targetSocket = io.sockets.sockets.get(target.socketId);
      if (targetSocket) {
        targetSocket.emit('bank_borrow_request', {
          requestId: room.pendingBorrow.requestId,
          borrowerName: borrower.name, amount, loanCardRank: loanCard.rank,
        });
      }
      broadcast(io, room);
    });

    socket.on('bank_set_deck_multiplier', ({ roomCode, multiplier }) => {
      const room = bankRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase !== 'waiting') return;
      if (multiplier !== 1 && multiplier !== 2) return;
      room.deckMultiplier = multiplier;
      broadcast(io, room);
    });

    socket.on('bank_respond_borrow', ({ roomCode, requestId, accept }) => {
      const room = bankRooms[roomCode];
      if (!room || !room.pendingBorrow) return;
      if (room.pendingBorrow.requestId !== requestId) return;
      const playerId = socket.data.bankPlayerId;
      if (playerId !== room.pendingBorrow.targetId) return;

      const { borrowerId, targetId, amount, loanCardId } = room.pendingBorrow;
      const borrower = room.players[borrowerId];
      const target = room.players[targetId];
      if (!borrower || !target) { room.pendingBorrow = null; broadcast(io, room); return; }

      if (accept) {
        const takeCount = Math.min(amount, target.hand.length);
        const taken = target.hand.splice(0, takeCount);
        borrower.hand.push(...taken);
        const loanIdx = borrower.loanCards.findIndex(c => c.id === loanCardId);
        if (loanIdx !== -1) borrower.loanCards.splice(loanIdx, 1);
        const borrowerSocket = io.sockets.sockets.get(borrower.socketId);
        if (borrowerSocket) borrowerSocket.emit('bank_borrow_response', {
          status: 'accepted', amount: takeCount, fromPlayerName: target.name,
        });
      } else {
        const borrowerSocket = io.sockets.sockets.get(borrower.socketId);
        if (borrowerSocket) borrowerSocket.emit('bank_borrow_response', {
          status: 'rejected', fromPlayerName: target.name,
        });
      }
      room.pendingBorrow = null;
      broadcast(io, room);
    });

    socket.on('bank_end_game', ({ roomCode }) => {
      const room = bankRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase !== 'playing') return;
      endGame(room);
      broadcast(io, room);
    });

    socket.on('bank_reset', ({ roomCode }) => {
      const room = bankRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      room.tableCards = []; room.currentTurn = null; room.phase = 'waiting';
      room.dealt = false; room.scores = {}; room.winnerId = null; room.pendingBorrow = null;
      for (const id of room.playerOrder) {
        const p = room.players[id];
        if (p) { p.hand = []; p.loanCards = []; }
      }
      broadcast(io, room);
    });

    socket.on('bank_leave', ({ roomCode }) => handleLeave(io, socket, roomCode));
    socket.on('disconnect', () => {
      const roomCode = socket.data?.bankRoomCode;
      if (roomCode) handleLeave(io, socket, roomCode);
    });

    // ✅ تنظيف الغرفة عند إغلاق اللعبة
    socket.on('close_game', ({ roomCode }) => {
      const room = bankRooms[roomCode];
      if (!room) return;
      delete bankRooms[roomCode];
    });
  });
  console.log('🏦 Bank Server loaded');
};