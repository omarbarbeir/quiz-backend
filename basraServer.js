/**
 * ============================================================
 *  basraServer.js — لعبة بصرة مصرية
 *  ✅ الأدمن بقى لاعب كامل في players[]
 *  ✅ + close_game listener لتنظيف الغرفة
 * ============================================================
 */

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const MAX_PLAYERS = 15;
const CARDS_PER_HAND = 4;

const basraRooms = {};
if (typeof global !== 'undefined') global.basraRooms = basraRooms;

function getValue(card) {
  if (card.rank === 'A') return 1;
  if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') return null;
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
  return deck;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function findSubsetsSummingTo(cards, target) {
  const results = [];
  const n = cards.length;
  const values = cards.map(c => getValue(c));
  function backtrack(start, current, sum) {
    if (sum === target && current.length >= 2) { results.push([...current]); return; }
    if (sum >= target || start >= n) return;
    for (let i = start; i < n; i++) {
      const v = values[i];
      if (v === null) continue;
      if (sum + v > target) continue;
      current.push(cards[i]);
      backtrack(i + 1, current, sum + v);
      current.pop();
    }
  }
  backtrack(0, [], 0);
  return results;
}

function getAllCaptureOptions(playedCard, tableCards) {
  if (tableCards.length === 0) return [];
  const rank = playedCard.rank;

  if (rank === 'J') {
    if (tableCards.length === 1 && tableCards[0].rank === 'J') {
      return [{ captured: [...tableCards], isBasra: true, basraPoints: 25, label: 'بصرة 25' }];
    }
    return [{ captured: [...tableCards], isBasra: false, basraPoints: 0, label: 'ياخد كل الأرض' }];
  }

  if (rank === 'Q' || rank === 'K') {
    const matching = tableCards.filter(c => c.rank === rank);
    if (matching.length === 0) return [];
    const isBasra = matching.length === tableCards.length;
    return [{ captured: matching, isBasra, basraPoints: isBasra ? 10 : 0, label: `مطابقة ${rank}` }];
  }

  const value = getValue(playedCard);
  const rankMatches = tableCards.filter(c => c.rank === rank);
  const otherCards = tableCards.filter(c => c.rank !== rank && c.rank !== 'J' && c.rank !== 'Q' && c.rank !== 'K');

  if (rankMatches.length > 0) {
    const subsets = findSubsetsSummingTo(otherCards, value);
    const allSubset = otherCards.length > 0
      ? subsets.find(s => s.length === otherCards.length)
      : null;

    if (allSubset) {
      const combined = [...rankMatches, ...allSubset];
      const isBasra = combined.length === tableCards.length;
      return [{
        captured: combined,
        isBasra,
        basraPoints: isBasra ? 10 : 0,
        label: `مطابقة ${rank} + جمع ${value}`,
      }];
    }

    if (subsets.length > 0) {
      return subsets.map(subset => {
        const combined = [...rankMatches, ...subset];
        const isBasra = combined.length === tableCards.length;
        return {
          captured: combined,
          isBasra,
          basraPoints: isBasra ? 10 : 0,
          label: `مطابقة ${rank} + جمع ${value}`,
        };
      });
    }

    const isBasra = rankMatches.length === tableCards.length;
    return [{
      captured: rankMatches,
      isBasra,
      basraPoints: isBasra ? 10 : 0,
      label: `مطابقة ${rank}`,
    }];
  }

  const subsets = findSubsetsSummingTo(otherCards, value);
  return subsets.map(subset => {
    const isBasra = subset.length === tableCards.length;
    return {
      captured: subset,
      isBasra,
      basraPoints: isBasra ? 10 : 0,
      label: `جمع ${value}`,
    };
  });
}

function createRoom(roomCode) {
  return {
    roomCode,
    adminSocketId: null,
    adminPlayerId: null,   // ✅ جديد
    players: {},
    playerOrder: [],
    deck: [],
    tableCards: [],
    currentTurn: null,
    phase: 'waiting',
    dealt: false,
    scores: {},
    winnerId: null,
    deckMultiplier: 1,
    preferredOrder: [],
  };
}

function getPlayerBySocket(room, socketId) {
  return Object.values(room.players).find(p => p.socketId === socketId);
}

function getNextPlayer(room, currentId) {
  const idx = room.playerOrder.indexOf(currentId);
  if (idx === -1) return room.playerOrder[0];
  return room.playerOrder[(idx + 1) % room.playerOrder.length];
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

  return {
    roomCode: room.roomCode, phase: room.phase, isAdmin, dealt: room.dealt,
    deckCount: room.deck.length, deckMultiplier: room.deckMultiplier || 1,
    tableCards: room.tableCards, currentTurn: room.currentTurn,
    currentTurnName: room.currentTurn ? room.players[room.currentTurn]?.name : null,
    players: room.playerOrder.map(id => {
      const p = room.players[id];
      if (!p) return null;
      const basraPts = p.basraCards.reduce((s, c) => s + (c.points || 0), 0);
      return {
        id: p.id, name: p.name, cardCount: p.hand.length,
        regularCount: p.capturedCards.length, basraCount: p.basraCards.length,
        basraPoints: basraPts, totalPoints: p.capturedCards.length + basraPts,
        isTurn: room.currentTurn === id, isMe: me && me.id === id,
        isAdmin: !!p.isAdmin,
      };
    }).filter(Boolean),
    me: me ? {
      id: me.id, name: me.name, hand: me.hand, capturedCards: me.capturedCards,
      basraCards: me.basraCards,
      basraPoints: me.basraCards.reduce((s, c) => s + (c.points || 0), 0),
      isTurn: room.currentTurn === me.id,
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
      s.emit('basra_state', buildState(room, p.socketId));
      sent.add(p.socketId);
    }
  });
  // Fallback للأدمن لو مش موجود في players (legacy)
  if (room.adminSocketId && !sent.has(room.adminSocketId)) {
    const s = io.sockets.sockets.get(room.adminSocketId);
    if (s) s.emit('basra_state', buildState(room, room.adminSocketId));
  }
}

function dealCards(room, isInitial) {
  const players = room.playerOrder.map(id => room.players[id]).filter(Boolean);
  for (const p of players) {
    for (let i = 0; i < CARDS_PER_HAND; i++) {
      if (room.deck.length === 0) break;
      p.hand.push(room.deck.pop());
    }
  }
  if (isInitial) {
    let attempts = 0;
    while (room.tableCards.length < 4 && room.deck.length > 0 && attempts < 200) {
      const card = room.deck.pop();
      if (card.rank === 'J') {
        room.deck.push(card);
        room.deck = shuffle(room.deck);
        attempts++;
        continue;
      }
      room.tableCards.push(card);
    }
  }
}

function endGame(room) {
  room.phase = 'gameEnd';
  room.currentTurn = null;
  room.scores = {};
  for (const id of room.playerOrder) {
    const p = room.players[id];
    if (!p) continue;
    const regularPoints = p.capturedCards.length;
    const basraPoints = p.basraCards.reduce((s, c) => s + (c.points || 0), 0);
    room.scores[id] = { name: p.name, regular: regularPoints, basra: basraPoints, total: regularPoints + basraPoints };
  }
  let maxScore = -1, winnerId = null;
  for (const [id, s] of Object.entries(room.scores)) {
    if (s.total > maxScore) { maxScore = s.total; winnerId = id; }
  }
  room.winnerId = winnerId;
}

function checkRoundEnd(io, room) {
  const allEmpty = room.playerOrder.every(id => {
    const p = room.players[id];
    return p && p.hand.length === 0;
  });
  if (!allEmpty) return false;
  if (room.deck.length > 0) { dealCards(room, false); return false; }
  endGame(room);
  broadcast(io, room);
  return true;
}

function handleLeave(io, socket, roomCode) {
  const room = basraRooms[roomCode];
  if (!room) return;

  // ✅ لو الأدمن خرج، نشيل adminSocketId
  if (room.adminSocketId === socket.id) {
    room.adminSocketId = null;
  }

  const playerId = Object.keys(room.players).find(
    id => room.players[id].socketId === socket.id
  );

  if (playerId) {
    delete room.players[playerId];
    room.playerOrder = room.playerOrder.filter(id => id !== playerId);
    if (room.currentTurn === playerId && room.playerOrder.length > 0) {
      room.currentTurn = room.playerOrder[0];
    }
    if (room.adminPlayerId === playerId) room.adminPlayerId = null;
  }

  if (room.playerOrder.length === 0 && !room.adminSocketId) {
    delete basraRooms[roomCode];
    return;
  }

  broadcast(io, room);
}

module.exports = function setupBasra(io) {
  io.on('connection', (socket) => {

    // ✅ انضمام لاعب (أدمن أو عادي) — بنفس الحدث
    socket.on('basra_join', ({ roomCode, playerId, playerName, isAdmin }) => {
      if (!roomCode || !playerId) return;
      if (!basraRooms[roomCode]) basraRooms[roomCode] = createRoom(roomCode);
      const room = basraRooms[roomCode];

      if (!room.players[playerId] && room.playerOrder.length >= MAX_PLAYERS) {
        socket.emit('basra_error', { message: `الحد الأقصى ${MAX_PLAYERS} لاعبين` });
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
          hand: [], capturedCards: [], basraCards: [],
          isAdmin: !!isAdmin,
        };
        room.playerOrder.push(playerId);
      }
      reorderPlayers(room);
      socket.join(`basra_${roomCode}`);
      socket.data.basraRoomCode = roomCode;
      socket.data.basraPlayerId = playerId;
      broadcast(io, room);
    });

    // ✅ legacy — للأمان
    socket.on('basra_admin_join', ({ roomCode }) => {
      if (!roomCode) return;
      if (!basraRooms[roomCode]) basraRooms[roomCode] = createRoom(roomCode);
      const room = basraRooms[roomCode];
      room.adminSocketId = socket.id;
      socket.join(`basra_${roomCode}`);
      socket.data.basraRoomCode = roomCode;
      socket.data.basraIsAdmin = true;
      broadcast(io, room);
    });

    socket.on('basra_set_deck_multiplier', ({ roomCode, multiplier }) => {
      const room = basraRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.dealt || room.deck.length > 0) return;
      if (multiplier !== 1 && multiplier !== 2) return;
      room.deckMultiplier = multiplier;
      broadcast(io, room);
    });

    socket.on('basra_shuffle', ({ roomCode }) => {
      const room = basraRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.dealt) return;
      room.deck = shuffle(createDeck(room.deckMultiplier || 1));
      broadcast(io, room);
    });

    socket.on('basra_deal', ({ roomCode }) => {
      const room = basraRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.dealt) return;
      if (room.playerOrder.length < 2) { socket.emit('basra_error', { message: 'محتاج لاعبين على الأقل (2)' }); return; }
      if (room.deck.length === 0) { socket.emit('basra_error', { message: 'اقلب الورق الأول' }); return; }
      for (const id of room.playerOrder) {
        const p = room.players[id];
        if (p) { p.hand = []; p.capturedCards = []; p.basraCards = []; }
      }
      room.tableCards = [];
      dealCards(room, true);
      room.dealt = true;
      broadcast(io, room);
    });

    socket.on('basra_set_order', ({ roomCode, playerIds }) => {
      const room = basraRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (!Array.isArray(playerIds)) return;
      room.preferredOrder = playerIds;
      reorderPlayers(room);
      broadcast(io, room);
    });

    socket.on('basra_start', ({ roomCode }) => {
      const room = basraRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (!room.dealt || room.phase === 'playing') return;
      reorderPlayers(room);
      room.phase = 'playing';
      room.currentTurn = room.playerOrder[0];
      broadcast(io, room);
    });

    socket.on('basra_play', ({ roomCode, cardId, chosenCapturedIds }) => {
      const room = basraRooms[roomCode];
      if (!room || room.phase !== 'playing') return;
      const playerId = socket.data.basraPlayerId;
      if (!playerId || room.currentTurn !== playerId) return;
      const player = room.players[playerId];
      if (!player) return;
      const cardIdx = player.hand.findIndex(c => c.id === cardId);
      if (cardIdx === -1) return;
      const card = player.hand[cardIdx];

      let capture = null;
      if (Array.isArray(chosenCapturedIds) && chosenCapturedIds.length > 0) {
        const chosenSet = new Set(chosenCapturedIds);
        const captured = room.tableCards.filter(c => chosenSet.has(c.id));
        if (captured.length === chosenCapturedIds.length) {
          const rank = card.rank;
          let isValid = false;
          if (rank === 'J') {
            if (captured.length === 1 && captured[0].rank === 'J' && room.tableCards.length === 1) isValid = true;
            else if (captured.length === room.tableCards.length) isValid = true;
          } else if (rank === 'Q' || rank === 'K') {
            isValid = captured.every(c => c.rank === rank);
          } else {
            const value = getValue(card);
            const hasRankMatch = captured.some(c => c.rank === rank);
            const otherCaptured = captured.filter(c => c.rank !== rank);
            if (hasRankMatch) {
              if (otherCaptured.length === 0) isValid = true;
              else {
                const allNumeric = otherCaptured.every(c => getValue(c) !== null);
                const sum = otherCaptured.reduce((s, c) => s + (getValue(c) || 0), 0);
                if (allNumeric && sum === value) isValid = true;
              }
            } else {
              const allNumeric = captured.every(c => getValue(c) !== null);
              const sum = captured.reduce((s, c) => s + (getValue(c) || 0), 0);
              if (allNumeric && sum === value && captured.length >= 2) isValid = true;
            }
          }
          if (isValid) {
            const isBasra = captured.length === room.tableCards.length;
            let basraPoints = 0;
            if (isBasra) {
              if (rank === 'J' && captured.length === 1 && captured[0].rank === 'J') basraPoints = 25;
              else if (rank !== 'J') basraPoints = 10;
            }
            capture = { captured, isBasra, basraPoints };
          }
        }
      }
      if (!capture) {
        const allOptions = getAllCaptureOptions(card, room.tableCards);
        if (allOptions.length > 0) capture = allOptions[0];
      }
      player.hand.splice(cardIdx, 1);
      if (capture) {
        const capturedIds = new Set(capture.captured.map(c => c.id));
        room.tableCards = room.tableCards.filter(c => !capturedIds.has(c.id));
        if (capture.isBasra && capture.basraPoints > 0) player.basraCards.push({ ...card, points: capture.basraPoints });
        else player.capturedCards.push(card);
        capture.captured.forEach(c => player.capturedCards.push(c));
      } else {
        room.tableCards.push(card);
      }
      room.currentTurn = getNextPlayer(room, playerId);
      const ended = checkRoundEnd(io, room);
      if (!ended) broadcast(io, room);
    });

    socket.on('basra_reset', ({ roomCode }) => {
      const room = basraRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      room.deck = []; room.tableCards = []; room.currentTurn = null;
      room.phase = 'waiting'; room.dealt = false; room.scores = {}; room.winnerId = null;
      for (const id of room.playerOrder) {
        const p = room.players[id];
        if (p) { p.hand = []; p.capturedCards = []; p.basraCards = []; }
      }
      broadcast(io, room);
    });

    socket.on('basra_leave', ({ roomCode }) => handleLeave(io, socket, roomCode));
    socket.on('disconnect', () => {
      const roomCode = socket.data?.basraRoomCode;
      if (roomCode) handleLeave(io, socket, roomCode);
    });

    // ✅ تنظيف الغرفة عند إغلاق اللعبة
    socket.on('close_game', ({ roomCode }) => {
      const room = basraRooms[roomCode];
      if (!room) return;
      delete basraRooms[roomCode];
    });
  });
  console.log('🎴 Basra Server loaded');
};