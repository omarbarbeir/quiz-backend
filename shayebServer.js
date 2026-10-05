/**
 * ============================================================
 *  shayebServer.js — لعبة الشايب
 *  ✅ الأدمن بقى لاعب كامل في players[]
 *  ✅ + close_game listener لتنظيف الغرفة
 * ============================================================
 */

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const MAX_PLAYERS = 10;

const shayebRooms = {};
if (typeof global !== 'undefined') global.shayebRooms = shayebRooms;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
    finishedOrder: [],
    lastDraw: null,
    readyPlayers: [],
    preferredOrder: [],
    deckMultiplier: 1,
  };
}

function getPlayerBySocket(room, socketId) {
  return Object.values(room.players).find(p => p.socketId === socketId);
}

function getNextActivePlayer(room, currentId) {
  const n = room.playerOrder.length;
  if (n === 0) return null;
  const idx = room.playerOrder.indexOf(currentId);
  if (idx === -1) {
    return room.playerOrder.find(id => !room.players[id].isFinished) || null;
  }
  for (let i = 1; i < n; i++) {
    const nextId = room.playerOrder[(idx + i) % n];
    if (nextId === currentId) break;
    const p = room.players[nextId];
    if (p && !p.isFinished) return nextId;
  }
  return null;
}

function countActive(room) {
  return room.playerOrder.filter(id => !room.players[id].isFinished).length;
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

function buildState(room, forSocketId) {
  const me = getPlayerBySocket(room, forSocketId);
  const isAdmin = !!(me && me.isAdmin) || room.adminSocketId === forSocketId;

  const targetId = room.phase === 'playing' && room.currentTurn
    ? getNextActivePlayer(room, room.currentTurn)
    : null;
  const target = targetId ? room.players[targetId] : null;
  const isMyTurn = me && room.currentTurn === me.id;

  return {
    roomCode: room.roomCode,
    phase: room.phase,
    isAdmin,
    dealt: room.dealt,
    deckMultiplier: room.deckMultiplier || 1,
    tableCardsCount: room.tableCards.length,
    currentTurn: room.currentTurn,
    currentTurnName: room.currentTurn ? room.players[room.currentTurn]?.name : null,
    targetId,
    targetName: target?.name || null,
    isMyTurn,
    readyPlayers: room.readyPlayers || [],
    players: room.playerOrder.map(id => {
      const p = room.players[id];
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        handCount: p.hand.length,
        isFinished: p.isFinished,
        rank: p.rank,
        isTurn: room.currentTurn === id,
        isTarget: targetId === id,
        isMe: me && me.id === id,
        isReady: (room.readyPlayers || []).includes(id),
        isAdmin: !!p.isAdmin,
      };
    }).filter(Boolean),
    me: me ? {
      id: me.id,
      name: me.name,
      hand: me.hand.map(c => ({ id: c.id, suit: c.suit, rank: c.rank })),
      isTurn: isMyTurn,
      isFinished: me.isFinished,
      rank: me.rank,
      isTarget: targetId === me.id,
      isReady: (room.readyPlayers || []).includes(me.id),
      isAdmin: !!me.isAdmin,
    } : null,
    targetHand: (isMyTurn && target) ? target.hand.map(c => ({ id: c.id })) : null,
    scores: room.scores,
    winnerId: room.winnerId,
    lastDraw: (room.lastDraw && me && me.id === room.lastDraw.playerId) ? room.lastDraw : null,
  };
}

function broadcast(io, room) {
  const sent = new Set();
  Object.values(room.players).forEach(p => {
    if (sent.has(p.socketId)) return;
    const s = io.sockets.sockets.get(p.socketId);
    if (s) {
      s.emit('shayeb_state', buildState(room, p.socketId));
      sent.add(p.socketId);
    }
  });
  // Fallback للأدمن لو مش موجود في players (legacy)
  if (room.adminSocketId && !sent.has(room.adminSocketId)) {
    const s = io.sockets.sockets.get(room.adminSocketId);
    if (s) s.emit('shayeb_state', buildState(room, room.adminSocketId));
  }
}

function removeInitialPairs(player, room) {
  const byRank = {};
  for (const card of player.hand) {
    if (!byRank[card.rank]) byRank[card.rank] = [];
    byRank[card.rank].push(card);
  }
  const newHand = [];
  for (const rank in byRank) {
    const cards = byRank[rank];
    const pairsCount = Math.floor(cards.length / 2);
    for (let i = 0; i < pairsCount * 2; i++) {
      room.tableCards.push(cards[i]);
    }
    for (let i = pairsCount * 2; i < cards.length; i++) {
      newHand.push(cards[i]);
    }
  }
  player.hand = newHand;
}

function dealShayeb(room) {
  const multiplier = room.deckMultiplier || 1;
  const kings = [];
  const others = [];
  for (let m = 0; m < multiplier; m++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        const baseId = `${suit}_${rank}`;
        const id = multiplier > 1 ? `${baseId}_d${m}` : baseId;
        const card = { id, suit, rank, deckIndex: m };
        if (rank === 'K') kings.push(card);
        else others.push(card);
      }
    }
  }
  const sheikh = kings[Math.floor(Math.random() * kings.length)];
  const deck = shuffle([sheikh, ...others]);

  const n = room.playerOrder.length;
  const perPlayer = Math.floor(deck.length / n);
  let idx = 0;
  for (const pid of room.playerOrder) {
    const p = room.players[pid];
    p.hand = deck.slice(idx, idx + perPlayer);
    idx += perPlayer;
  }
  const remaining = deck.slice(idx);
  for (const pid of room.playerOrder) {
    if (remaining.length === 0) break;
    room.players[pid].hand.push(remaining.shift());
  }

  room.readyPlayers = [];
  room.phase = 'revealing';
}

function applyInitialPairs(room) {
  for (const pid of room.playerOrder) {
    const p = room.players[pid];
    if (p.isFinished) continue;
    removeInitialPairs(p, room);
    if (p.hand.length === 0 && !p.isFinished) {
      p.isFinished = true;
      p.rank = room.finishedOrder.length + 1;
      room.finishedOrder.push(pid);
    }
  }
  const firstActive = room.playerOrder.find(id => !room.players[id].isFinished);
  room.currentTurn = firstActive || null;
  room.phase = 'playing';
}

function endGame(room) {
  room.phase = 'gameEnd';
  room.currentTurn = null;

  const remaining = room.playerOrder.filter(id => !room.players[id].isFinished);
  for (const id of remaining) {
    const p = room.players[id];
    p.rank = room.finishedOrder.length + 1;
    p.isFinished = true;
    room.finishedOrder.push(id);
  }

  const N = room.playerOrder.length;
  room.scores = {};
  for (const id of room.playerOrder) {
    const p = room.players[id];
    room.scores[id] = {
      name: p.name,
      rank: p.rank,
      points: Math.max(0, N - p.rank + 1),
    };
  }
  room.winnerId = room.finishedOrder[0];
}

function handleLeave(io, socket, roomCode) {
  const room = shayebRooms[roomCode];
  if (!room) return;

  // ✅ لو الأدمن خرج، نشيل adminSocketId
  if (room.adminSocketId === socket.id) {
    room.adminSocketId = null;
  }

  // ✅ نشيل اللاعب (سواء أدمن أو عادي) من players
  const playerId = socket.data.shayebPlayerId
    || Object.keys(room.players).find(id => room.players[id].socketId === socket.id);

  if (playerId && room.players[playerId]) {
    delete room.players[playerId];
    room.playerOrder = room.playerOrder.filter(id => id !== playerId);
    if (room.adminPlayerId === playerId) room.adminPlayerId = null;
    if (room.readyPlayers) {
      room.readyPlayers = room.readyPlayers.filter(id => id !== playerId);
    }
    if (room.currentTurn === playerId && room.playerOrder.length > 0) {
      const next = getNextActivePlayer(room, playerId) || room.playerOrder[0];
      room.currentTurn = next;
    }
    if (room.phase === 'revealing' && room.playerOrder.every(pid => room.readyPlayers.includes(pid))) {
      applyInitialPairs(room);
      if (countActive(room) <= 1) endGame(room);
    }
  }

  if (room.playerOrder.length === 0 && !room.adminSocketId) {
    delete shayebRooms[roomCode];
    return;
  }

  broadcast(io, room);
}

module.exports = function setupShayeb(io) {
  io.on('connection', (socket) => {

    // ✅ انضمام لاعب (أدمن أو عادي) — بنفس الحدث
    socket.on('shayeb_join', ({ roomCode, playerId, playerName, isAdmin }) => {
      if (!roomCode || !playerId) return;
      if (!shayebRooms[roomCode]) shayebRooms[roomCode] = createRoom(roomCode);
      const room = shayebRooms[roomCode];

      if (!room.players[playerId] && room.playerOrder.length >= MAX_PLAYERS) {
        socket.emit('shayeb_error', { message: `الحد الأقصى ${MAX_PLAYERS} لاعبين` });
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
          hand: [], isFinished: false, rank: null,
          isAdmin: !!isAdmin,
        };
        room.playerOrder.push(playerId);
      }
      reorderPlayers(room);
      socket.join(`shayeb_${roomCode}`);
      socket.data.shayebRoomCode = roomCode;
      socket.data.shayebPlayerId = playerId;
      broadcast(io, room);
    });

    // ✅ legacy — للأمان
    socket.on('shayeb_admin_join', ({ roomCode }) => {
      if (!roomCode) return;
      if (!shayebRooms[roomCode]) shayebRooms[roomCode] = createRoom(roomCode);
      const room = shayebRooms[roomCode];
      room.adminSocketId = socket.id;
      socket.join(`shayeb_${roomCode}`);
      socket.data.shayebRoomCode = roomCode;
      socket.data.shayebIsAdmin = true;
      broadcast(io, room);
    });

    socket.on('shayeb_set_order', ({ roomCode, playerIds }) => {
      const room = shayebRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (!Array.isArray(playerIds)) return;
      room.preferredOrder = playerIds;
      reorderPlayers(room);
      broadcast(io, room);
    });

    socket.on('shayeb_start', ({ roomCode }) => {
      const room = shayebRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.dealt || room.phase === 'playing' || room.phase === 'revealing') return;
      if (room.playerOrder.length < 2) {
        socket.emit('shayeb_error', { message: 'محتاج لاعبين على الأقل (2)' });
        return;
      }

      reorderPlayers(room);

      for (const id of room.playerOrder) {
        const p = room.players[id];
        p.hand = []; p.isFinished = false; p.rank = null;
      }
      room.tableCards = [];
      room.finishedOrder = [];
      room.scores = {};
      room.winnerId = null;
      room.lastDraw = null;
      room.readyPlayers = [];

      dealShayeb(room);
      room.dealt = true;
      broadcast(io, room);
    });

    socket.on('shayeb_ready', ({ roomCode }) => {
      const room = shayebRooms[roomCode];
      if (!room || room.phase !== 'revealing') return;
      const playerId = socket.data.shayebPlayerId;
      if (!playerId) return;
      if (!room.readyPlayers) room.readyPlayers = [];
      if (!room.readyPlayers.includes(playerId)) {
        room.readyPlayers.push(playerId);
      }
      const allReady = room.playerOrder.every(pid => room.readyPlayers.includes(pid));
      if (allReady) {
        applyInitialPairs(room);
        if (countActive(room) <= 1) endGame(room);
      }
      broadcast(io, room);
    });

    socket.on('shayeb_set_deck_multiplier', ({ roomCode, multiplier }) => {
      const room = shayebRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase !== 'waiting') return;
      if (multiplier !== 1 && multiplier !== 2) return;
      room.deckMultiplier = multiplier;
      broadcast(io, room);
    });

    socket.on('shayeb_draw', ({ roomCode, cardId }) => {
      const room = shayebRooms[roomCode];
      if (!room || room.phase !== 'playing') return;
      const playerId = socket.data.shayebPlayerId;
      if (!playerId || room.currentTurn !== playerId) return;
      const player = room.players[playerId];
      if (!player || player.isFinished) return;
      if (room.lastDraw && room.lastDraw.playerId === playerId) return;

      const targetId = getNextActivePlayer(room, playerId);
      if (!targetId) return;
      const target = room.players[targetId];

      const cardIdx = target.hand.findIndex(c => c.id === cardId);
      if (cardIdx === -1) return;

      const [card] = target.hand.splice(cardIdx, 1);

      const matchIdx = player.hand.findIndex(c => c.rank === card.rank);
      let paired = false;
      let matchCard = null;
      if (matchIdx !== -1) {
        matchCard = player.hand.splice(matchIdx, 1)[0];
        room.tableCards.push(matchCard, card);
        paired = true;
      } else {
        player.hand.push(card);
      }

      room.lastDraw = {
        playerId,
        playerName: player.name,
        card: { id: card.id, suit: card.suit, rank: card.rank },
        matchCard: matchCard ? { id: matchCard.id, suit: matchCard.suit, rank: matchCard.rank } : null,
        paired,
        targetId,
        targetName: target.name,
      };

      if (target.hand.length === 0 && !target.isFinished) {
        target.isFinished = true;
        target.rank = room.finishedOrder.length + 1;
        room.finishedOrder.push(targetId);
      }
      if (player.hand.length === 0 && !player.isFinished) {
        player.isFinished = true;
        player.rank = room.finishedOrder.length + 1;
        room.finishedOrder.push(playerId);
      }

      if (countActive(room) <= 1) endGame(room);
      broadcast(io, room);
    });

    socket.on('shayeb_end_turn', ({ roomCode }) => {
      const room = shayebRooms[roomCode];
      if (!room || room.phase !== 'playing') return;
      const playerId = socket.data.shayebPlayerId;
      if (!playerId || room.currentTurn !== playerId) return;

      room.lastDraw = null;
      const next = getNextActivePlayer(room, playerId);
      if (!next) endGame(room);
      else room.currentTurn = next;
      broadcast(io, room);
    });

    socket.on('shayeb_shuffle_hand', ({ roomCode }) => {
      const room = shayebRooms[roomCode];
      if (!room || (room.phase !== 'playing' && room.phase !== 'revealing')) return;
      const playerId = socket.data.shayebPlayerId;
      if (!playerId) return;
      const player = room.players[playerId];
      if (!player || player.isFinished) return;
      player.hand = shuffle(player.hand);
      broadcast(io, room);
    });

    socket.on('shayeb_reset', ({ roomCode }) => {
      const room = shayebRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      room.tableCards = [];
      room.currentTurn = null;
      room.phase = 'waiting';
      room.dealt = false;
      room.scores = {};
      room.winnerId = null;
      room.finishedOrder = [];
      room.lastDraw = null;
      room.readyPlayers = [];
      for (const id of room.playerOrder) {
        const p = room.players[id];
        if (p) { p.hand = []; p.isFinished = false; p.rank = null; }
      }
      broadcast(io, room);
    });

    socket.on('shayeb_leave', ({ roomCode }) => handleLeave(io, socket, roomCode));
    socket.on('disconnect', () => {
      const roomCode = socket.data?.shayebRoomCode;
      if (roomCode) handleLeave(io, socket, roomCode);
    });

    // ✅ تنظيف الغرفة عند إغلاق اللعبة
    socket.on('close_game', ({ roomCode }) => {
      const room = shayebRooms[roomCode];
      if (!room) return;
      delete shayebRooms[roomCode];
    });
  });
  console.log('👑 Shayeb Server loaded');
};