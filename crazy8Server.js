/**
 * ============================================================
 *  crazy8Server.js — لعبة Crazy 8
 *  ✅ الأدمن بقى لاعب كامل في players[]
 *  ✅ + close_game listener لتنظيف الغرفة
 * ============================================================
 */

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const MAX_PLAYERS = 10;
const HAND_SIZE = 7;
const ROUND_DELAY = 5000;

const crazy8Rooms = {};
if (typeof global !== 'undefined') global.crazy8Rooms = crazy8Rooms;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cardValue(card) {
  if (card.rank === 'A') return 1;
  if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') return 15;
  return parseInt(card.rank, 10);
}

function createDeck(multiplier = 1) {
  const deck = [];
  for (let m = 0; m < multiplier; m++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        const baseId = `${suit}_${rank}`;
        const id = multiplier > 1 ? `${baseId}_d${m}` : baseId;
        deck.push({ id, suit, rank, deckIndex: m });
      }
    }
  }
  return shuffle(deck);
}

function canPlay(card, topCard, currentSuit) {
  if (!topCard) return true;
  if (card.rank === '8') return true;
  if (card.suit === currentSuit) return true;
  if (card.rank === topCard.rank) return true;
  return false;
}

function createRoom(roomCode) {
  return {
    roomCode,
    adminSocketId: null,
    adminPlayerId: null,   // ✅ جديد
    players: {},
    playerOrder: [],
    preferredOrder: [],
    hands: {},
    deck: [],
    tablePile: [],
    currentSuit: null,
    currentTurn: null,
    phase: 'waiting',
    roundNumber: 0,
    roundScores: {},
    totalScores: {},
    lastPlayed: null,
    drawnMessage: null,
    roundEndData: null,
    winnerId: null,
    roundEndTimer: null,
    deckMultiplier: 1,
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

function buildState(room, socketId) {
  const me = getPlayerBySocket(room, socketId);
  const isAdmin = !!(me && me.isAdmin) || room.adminSocketId === socketId;
  const topCard = room.tablePile.length > 0 ? room.tablePile[room.tablePile.length - 1] : null;

  return {
    roomCode: room.roomCode,
    phase: room.phase,
    isAdmin,
    roundNumber: room.roundNumber,
    deckMultiplier: room.deckMultiplier || 1,
    topCard: topCard ? { id: topCard.id, suit: topCard.suit, rank: topCard.rank } : null,
    currentSuit: room.currentSuit,
    currentTurn: room.currentTurn,
    currentTurnName: room.currentTurn ? room.players[room.currentTurn]?.name : null,
    tableCount: room.tablePile.length,
    deckCount: room.deck.length,
    lastPlayed: room.lastPlayed,
    drawnMessage: (room.drawnMessage && me && room.drawnMessage.playerId === me.id) ? room.drawnMessage : null,
    roundEndData: room.roundEndData,
    winnerId: room.winnerId,
    players: room.playerOrder.map(id => {
      const p = room.players[id];
      if (!p) return null;
      const hand = room.hands[id] || [];
      return {
        id, name: p.name,
        handCount: hand.length,
        isTurn: room.currentTurn === id,
        isMe: me && me.id === id,
        calledLastCard: !!p.calledLastCard,
        totalScore: room.totalScores[id] || 0,
        roundScores: room.roundScores[id] || [],
        isAdmin: !!p.isAdmin,
      };
    }).filter(Boolean),
    me: me ? {
      id: me.id, name: me.name,
      hand: (room.hands[me.id] || []).map(c => ({ id: c.id, suit: c.suit, rank: c.rank })),
      isTurn: room.currentTurn === me.id,
      calledLastCard: !!me.calledLastCard,
      totalScore: room.totalScores[me.id] || 0,
      roundScores: room.roundScores[me.id] || [],
      isAdmin: !!me.isAdmin,
    } : null,
  };
}

function broadcast(io, room) {
  const sent = new Set();
  Object.values(room.players).forEach(p => {
    if (sent.has(p.socketId)) return;
    const s = io.sockets.sockets.get(p.socketId);
    if (s) {
      s.emit('crazy8_state', buildState(room, p.socketId));
      sent.add(p.socketId);
    }
  });
  // Fallback للأدمن لو مش موجود في players (legacy)
  if (room.adminSocketId && !sent.has(room.adminSocketId)) {
    const s = io.sockets.sockets.get(room.adminSocketId);
    if (s) s.emit('crazy8_state', buildState(room, room.adminSocketId));
  }
}

function startNewRound(io, room, isFirst) {
  if (room.roundEndTimer) { clearTimeout(room.roundEndTimer); room.roundEndTimer = null; }
  room.roundNumber = isFirst ? 1 : room.roundNumber + 1;
  room.deck = createDeck(room.deckMultiplier || 1);
  room.tablePile = [];
  room.lastPlayed = null;
  room.drawnMessage = null;
  room.roundEndData = null;

  for (const pid of room.playerOrder) {
    room.hands[pid] = [];
    room.players[pid].calledLastCard = false;
  }

  for (let i = 0; i < HAND_SIZE; i++) {
    for (const pid of room.playerOrder) {
      const c = room.deck.pop();
      if (c) room.hands[pid].push(c);
    }
  }

  let tableCard = null;
  let tries = 0;
  while (room.deck.length > 0 && tries < 200) {
    tries++;
    const c = room.deck.pop();
    if (c.rank !== '8') { tableCard = c; break; }
    room.deck.splice(Math.floor(Math.random() * room.deck.length), 0, c);
  }
  if (tableCard) {
    room.tablePile.push(tableCard);
    room.currentSuit = tableCard.suit;
  } else {
    room.currentSuit = SUITS[0];
  }

  room.currentTurn = room.playerOrder[0];
  room.phase = 'playing';
  broadcast(io, room);
}

function endRound(io, room, winnerId) {
  room.phase = 'roundEnd';
  room.currentTurn = null;

  const roundScoresThis = {};
  for (const pid of room.playerOrder) {
    if (pid === winnerId) roundScoresThis[pid] = 0;
    else {
      const hand = room.hands[pid] || [];
      roundScoresThis[pid] = hand.reduce((s, c) => s + cardValue(c), 0);
    }
  }

  for (const pid of room.playerOrder) {
    if (!room.roundScores[pid]) room.roundScores[pid] = [];
    room.roundScores[pid].push(roundScoresThis[pid] || 0);
    room.totalScores[pid] = (room.totalScores[pid] || 0) + (roundScoresThis[pid] || 0);
  }

  room.roundEndData = {
    winnerId,
    winnerName: room.players[winnerId]?.name,
    roundScores: roundScoresThis,
    roundNumber: room.roundNumber,
  };

  broadcast(io, room);

  room.roundEndTimer = setTimeout(() => {
    const r = crazy8Rooms[room.roomCode];
    if (!r || r.phase !== 'roundEnd') return;
    startNewRound(io, r, false);
  }, ROUND_DELAY);
}

function advanceTurn(io, room, fromPlayerId) {
  let next = nextPlayer(room, fromPlayerId);
  let safety = 0;
  const n = room.playerOrder.length;

  while (safety < n && next !== fromPlayerId) {
    safety++;
    const hand = room.hands[next] || [];
    const p = room.players[next];
    if (hand.length === 1 && !p.calledLastCard) {
      const s = io.sockets.sockets.get(p.socketId);
      if (s) s.emit('crazy8_skipped_penalty', {
        message: '⚠️ نسيت تقول "آخر كارت"! الدور اتخطى. دوس على الزرار قبل دورك الجاي.',
      });
      next = nextPlayer(room, next);
      continue;
    }
    break;
  }

  room.currentTurn = next;
  broadcast(io, room);
}

function handleLeave(io, socket, roomCode) {
  const room = crazy8Rooms[roomCode];
  if (!room) return;

  // ✅ لو الأدمن خرج، نشيل adminSocketId
  if (room.adminSocketId === socket.id) {
    room.adminSocketId = null;
  }

  const playerId = socket.data.crazy8PlayerId
    || Object.keys(room.players).find(id => room.players[id].socketId === socket.id);

  if (playerId && room.players[playerId]) {
    const wasTurn = room.currentTurn === playerId;
    delete room.players[playerId];
    room.playerOrder = room.playerOrder.filter(id => id !== playerId);
    delete room.hands[playerId];
    if (room.adminPlayerId === playerId) room.adminPlayerId = null;

    if (room.playerOrder.length === 0 && !room.adminSocketId) {
      if (room.roundEndTimer) clearTimeout(room.roundEndTimer);
      delete crazy8Rooms[roomCode];
      return;
    }
    if (wasTurn && room.playerOrder.length > 0 && room.phase === 'playing') {
      room.currentTurn = room.playerOrder[0];
    }
  }

  broadcast(io, room);
}

module.exports = function setupCrazy8(io) {
  io.on('connection', (socket) => {

    // ✅ انضمام لاعب (أدمن أو عادي) — بنفس الحدث
    socket.on('crazy8_join', ({ roomCode, playerId, playerName, isAdmin }) => {
      if (!roomCode || !playerId) return;
      if (!crazy8Rooms[roomCode]) crazy8Rooms[roomCode] = createRoom(roomCode);
      const room = crazy8Rooms[roomCode];

      if (!room.players[playerId] && room.playerOrder.length >= MAX_PLAYERS) {
        socket.emit('crazy8_error', { message: `الحد الأقصى ${MAX_PLAYERS} لاعبين` });
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
          calledLastCard: false,
          isAdmin: !!isAdmin,
        };
        room.playerOrder.push(playerId);
        if (!room.hands[playerId]) room.hands[playerId] = [];
        if (!room.roundScores[playerId]) room.roundScores[playerId] = [];
        if (room.totalScores[playerId] === undefined) room.totalScores[playerId] = 0;
      }
      reorderPlayers(room);
      socket.join(`crazy8_${roomCode}`);
      socket.data.crazy8RoomCode = roomCode;
      socket.data.crazy8PlayerId = playerId;
      broadcast(io, room);
    });

    // ✅ legacy — للأمان
    socket.on('crazy8_admin_join', ({ roomCode }) => {
      if (!roomCode) return;
      if (!crazy8Rooms[roomCode]) crazy8Rooms[roomCode] = createRoom(roomCode);
      const room = crazy8Rooms[roomCode];
      room.adminSocketId = socket.id;
      socket.join(`crazy8_${roomCode}`);
      socket.data.crazy8RoomCode = roomCode;
      socket.data.crazy8IsAdmin = true;
      broadcast(io, room);
    });

    socket.on('crazy8_set_order', ({ roomCode, playerIds }) => {
      const room = crazy8Rooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (!Array.isArray(playerIds)) return;
      room.preferredOrder = playerIds;
      reorderPlayers(room);
      broadcast(io, room);
    });

    socket.on('crazy8_set_deck_multiplier', ({ roomCode, multiplier }) => {
      const room = crazy8Rooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase !== 'waiting') return;
      if (multiplier !== 1 && multiplier !== 2) return;
      room.deckMultiplier = multiplier;
      broadcast(io, room);
    });

    socket.on('crazy8_start', ({ roomCode }) => {
      const room = crazy8Rooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase === 'playing' || room.phase === 'roundEnd') return;
      if (room.playerOrder.length < 2) {
        socket.emit('crazy8_error', { message: 'محتاج لاعبين على الأقل (2)' });
        return;
      }

      reorderPlayers(room);
      startNewRound(io, room, true);
    });

    socket.on('crazy8_next_round', ({ roomCode }) => {
      const room = crazy8Rooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase !== 'roundEnd') return;

      reorderPlayers(room);
      startNewRound(io, room, false);
    });

    socket.on('crazy8_play_card', ({ roomCode, cardId }) => {
      const room = crazy8Rooms[roomCode];
      if (!room || room.phase !== 'playing') return;
      const playerId = socket.data.crazy8PlayerId;
      if (!playerId || room.currentTurn !== playerId) return;

      const hand = room.hands[playerId];
      const cardIdx = hand.findIndex(c => c.id === cardId);
      if (cardIdx === -1) return;

      const card = hand[cardIdx];
      const topCard = room.tablePile[room.tablePile.length - 1];

      if (!canPlay(card, topCard, room.currentSuit)) {
        socket.emit('crazy8_error', { message: 'الكارت مش صالح — لازم يطابق الرقم أو النوع أو يكون 8' });
        return;
      }

      hand.splice(cardIdx, 1);
      room.tablePile.push(card);
      room.players[playerId].calledLastCard = false;

      room.lastPlayed = {
        playerId,
        playerName: room.players[playerId].name,
        card: { id: card.id, suit: card.suit, rank: card.rank },
        is8: card.rank === '8',
        newSuit: null,
      };
      room.drawnMessage = null;

      if (hand.length === 0) {
        endRound(io, room, playerId);
        return;
      }

      room.currentSuit = card.suit;
      if (room.lastPlayed) room.lastPlayed.newSuit = card.suit;

      advanceTurn(io, room, playerId);
    });

    socket.on('crazy8_draw', ({ roomCode }) => {
      const room = crazy8Rooms[roomCode];
      if (!room || room.phase !== 'playing') return;
      const playerId = socket.data.crazy8PlayerId;
      if (!playerId || room.currentTurn !== playerId) return;

      const hand = room.hands[playerId];
      const topCard = room.tablePile[room.tablePile.length - 1];

      if (room.deck.length === 0) {
        if (room.tablePile.length <= 1) {
          socket.emit('crazy8_error', { message: 'مفيش كروت تانية في الديل' });
          return;
        }
        const top = room.tablePile[room.tablePile.length - 1];
        const rest = room.tablePile.slice(0, -1);
        room.deck = shuffle(rest);
        room.tablePile = [top];
      }

      const drawn = room.deck.pop();
      if (!drawn) {
        socket.emit('crazy8_error', { message: 'مفيش كروت تانية في الديل' });
        return;
      }
      hand.push(drawn);
      room.players[playerId].calledLastCard = false;

      const isPlayable = canPlay(drawn, topCard, room.currentSuit);

      room.drawnMessage = {
        playerId,
        count: 1,
        playable: isPlayable ? { id: drawn.id, suit: drawn.suit, rank: drawn.rank } : null,
      };

      broadcast(io, room);
    });

    socket.on('crazy8_call_last_card', ({ roomCode }) => {
      const room = crazy8Rooms[roomCode];
      if (!room || room.phase !== 'playing') return;
      const playerId = socket.data.crazy8PlayerId;
      if (!playerId) return;
      const hand = room.hands[playerId] || [];
      if (hand.length !== 1) return;
      if (room.players[playerId].calledLastCard) return;

      room.players[playerId].calledLastCard = true;

      io.to(room.roomCode).emit('crazy8_last_card_called', {
        playerId,
        playerName: room.players[playerId].name,
      });

      broadcast(io, room);
    });

    socket.on('crazy8_end_game', ({ roomCode }) => {
      const room = crazy8Rooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.roundEndTimer) { clearTimeout(room.roundEndTimer); room.roundEndTimer = null; }
      room.phase = 'gameEnd';
      room.currentTurn = null;
      room.roundEndData = null;
      broadcast(io, room);
    });

    socket.on('crazy8_reset', ({ roomCode }) => {
      const room = crazy8Rooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.roundEndTimer) { clearTimeout(room.roundEndTimer); room.roundEndTimer = null; }
      room.hands = {};
      room.deck = [];
      room.tablePile = [];
      room.currentSuit = null;
      room.currentTurn = null;
      room.phase = 'waiting';
      room.roundNumber = 0;
      room.roundScores = {};
      room.totalScores = {};
      room.lastPlayed = null;
      room.drawnMessage = null;
      room.roundEndData = null;
      room.winnerId = null;
      for (const pid of room.playerOrder) {
        room.hands[pid] = [];
        room.roundScores[pid] = [];
        room.totalScores[pid] = 0;
        room.players[pid].calledLastCard = false;
      }
      broadcast(io, room);
    });

    socket.on('crazy8_leave', ({ roomCode }) => handleLeave(io, socket, roomCode));
    socket.on('disconnect', () => {
      const roomCode = socket.data?.crazy8RoomCode;
      if (roomCode) handleLeave(io, socket, roomCode);
    });

    // ✅ تنظيف الغرفة عند إغلاق اللعبة
    socket.on('close_game', ({ roomCode }) => {
      const room = crazy8Rooms[roomCode];
      if (!room) return;
      if (room.roundEndTimer) clearTimeout(room.roundEndTimer);
      delete crazy8Rooms[roomCode];
    });
  });
  console.log('🎴 Crazy8 Server loaded');
};