/**
 * ============================================================
 *  snakesServer.js — السلم والثعبان
 *  ✅ الأدمن بقى لاعب كامل في players[]
 *  ✅ + close_game listener لتنظيف الغرفة
 * ============================================================
 */

const snakesRooms = {};
if (typeof global !== 'undefined') global.snakesRooms = snakesRooms;

const MAX_PLAYERS = 6;
const MIN_PLAYERS = 2;

const LADDERS = {
  1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100,
};

const SNAKES = {
  16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78,
};

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

function createRoom(roomCode) {
  return {
    roomCode,
    adminSocketId: null,
    adminPlayerId: null,   // ✅ جديد
    players: {},
    playerOrder: [],
    preferredOrder: [],
    phase: 'waiting',
    positions: {},
    currentTurn: null,
    lastRoll: null,
    winner: null,
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
  if (!room.preferredOrder?.length) return;
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
    roomCode: room.roomCode,
    phase: room.phase,
    isAdmin,
    positions: room.positions,
    currentTurn: room.currentTurn,
    currentTurnName: room.currentTurn ? room.players[room.currentTurn]?.name : null,
    lastRoll: room.lastRoll,
    winner: room.winner,
    ladders: LADDERS,
    snakes: SNAKES,
    players: room.playerOrder.map((id, i) => {
      const p = room.players[id];
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        color: COLORS[i % COLORS.length],
        position: room.positions[id] || 0,
        isTurn: room.currentTurn === id,
        isMe: me && me.id === id,
        isAdmin: !!p.isAdmin,
      };
    }).filter(Boolean),
    me: me ? {
      id: me.id,
      name: me.name,
      isTurn: room.currentTurn === me.id,
      isAdmin: !!me.isAdmin,
    } : null,
  };
}

function broadcast(io, room) {
  const sent = new Set();
  room.playerOrder.forEach(id => {
    const p = room.players[id];
    if (!p || sent.has(p.socketId)) return;
    const s = io.sockets.sockets.get(p.socketId);
    if (s) {
      s.emit('snakes_state', buildState(room, p.socketId));
      sent.add(p.socketId);
    }
  });
  // Fallback للأدمن لو مش موجود في players (legacy)
  if (room.adminSocketId && !sent.has(room.adminSocketId)) {
    const s = io.sockets.sockets.get(room.adminSocketId);
    if (s) s.emit('snakes_state', buildState(room, room.adminSocketId));
  }
}

function handleLeave(io, socket, roomCode) {
  const room = snakesRooms[roomCode];
  if (!room) return;

  // ✅ لو الأدمن خرج، نشيل adminSocketId
  if (room.adminSocketId === socket.id) {
    room.adminSocketId = null;
  }

  const playerId = socket.data.snakesPlayerId
    || Object.keys(room.players).find(id => room.players[id].socketId === socket.id);

  if (playerId && room.players[playerId]) {
    const wasTurn = room.currentTurn === playerId;
    delete room.players[playerId];
    delete room.positions[playerId];
    room.playerOrder = room.playerOrder.filter(id => id !== playerId);
    if (room.adminPlayerId === playerId) room.adminPlayerId = null;

    if (wasTurn && room.playerOrder.length > 0 && room.phase === 'playing') {
      room.currentTurn = nextPlayer(room, playerId);
    }
  }

  if (room.playerOrder.length === 0 && !room.adminSocketId) {
    delete snakesRooms[roomCode];
    return;
  }

  broadcast(io, room);
}

module.exports = function setupSnakes(io) {
  io.on('connection', (socket) => {

    // ✅ انضمام لاعب (أدمن أو عادي) — بنفس الحدث
    socket.on('snakes_join', ({ roomCode, playerId, playerName, isAdmin }) => {
      if (!roomCode || !playerId) return;
      if (!snakesRooms[roomCode]) snakesRooms[roomCode] = createRoom(roomCode);
      const room = snakesRooms[roomCode];

      if (!room.players[playerId] && room.playerOrder.length >= MAX_PLAYERS) {
        socket.emit('snakes_error', { message: `الحد الأقصى ${MAX_PLAYERS} لاعبين` });
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
          isAdmin: !!isAdmin,
        };
        room.playerOrder.push(playerId);
        room.positions[playerId] = 0;
      }
      reorderPlayers(room);
      socket.join(`snakes_${roomCode}`);
      socket.data.snakesRoomCode = roomCode;
      socket.data.snakesPlayerId = playerId;
      broadcast(io, room);
    });

    // ✅ legacy — للأمان
    socket.on('snakes_admin_join', ({ roomCode }) => {
      if (!roomCode) return;
      if (!snakesRooms[roomCode]) snakesRooms[roomCode] = createRoom(roomCode);
      const room = snakesRooms[roomCode];
      room.adminSocketId = socket.id;
      socket.join(`snakes_${roomCode}`);
      socket.data.snakesRoomCode = roomCode;
      broadcast(io, room);
    });

    socket.on('snakes_set_order', ({ roomCode, playerIds }) => {
      const room = snakesRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (!Array.isArray(playerIds)) return;
      room.preferredOrder = playerIds;
      reorderPlayers(room);
      broadcast(io, room);
    });

    socket.on('snakes_start', ({ roomCode }) => {
      const room = snakesRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase === 'playing') return;
      if (room.playerOrder.length < MIN_PLAYERS) {
        socket.emit('snakes_error', { message: `محتاج ${MIN_PLAYERS}-${MAX_PLAYERS} لاعبين` });
        return;
      }

      reorderPlayers(room);

      room.positions = {};
      room.playerOrder.forEach(id => { room.positions[id] = 0; });

      room.currentTurn = room.playerOrder[0];
      room.phase = 'playing';
      room.winner = null;
      room.lastRoll = null;
      broadcast(io, room);
    });

    socket.on('snakes_roll', ({ roomCode }) => {
      const room = snakesRooms[roomCode];
      if (!room || room.phase !== 'playing') return;
      const pid = socket.data.snakesPlayerId;
      if (!pid || room.currentTurn !== pid) return;

      const roll = Math.floor(Math.random() * 6) + 1;
      const fromPos = room.positions[pid] || 0;
      let newPos = fromPos + roll;
      let snake = false;
      let ladder = false;
      let overshoot = false;

      if (newPos > 100) {
        overshoot = true;
        newPos = fromPos;
      } else {
        if (LADDERS[newPos]) {
          ladder = true;
          newPos = LADDERS[newPos];
        } else if (SNAKES[newPos]) {
          snake = true;
          newPos = SNAKES[newPos];
        }
      }

      room.positions[pid] = newPos;
      room.lastRoll = {
        playerId: pid,
        playerName: room.players[pid].name,
        value: roll,
        from: fromPos,
        to: newPos,
        snake,
        ladder,
        overshoot,
        timestamp: Date.now(),
      };

      if (newPos === 100) {
        room.phase = 'gameEnd';
        room.winner = pid;
        broadcast(io, room);
        return;
      }

      room.currentTurn = nextPlayer(room, pid);
      broadcast(io, room);
    });

    socket.on('snakes_reset', ({ roomCode }) => {
      const room = snakesRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      room.positions = {};
      room.playerOrder.forEach(id => { room.positions[id] = 0; });
      room.currentTurn = null;
      room.phase = 'waiting';
      room.winner = null;
      room.lastRoll = null;
      broadcast(io, room);
    });

    socket.on('snakes_leave', ({ roomCode }) => handleLeave(io, socket, roomCode));
    socket.on('disconnect', () => {
      const roomCode = socket.data?.snakesRoomCode;
      if (roomCode) handleLeave(io, socket, roomCode);
    });

    // ✅ تنظيف الغرفة عند إغلاق اللعبة
    socket.on('close_game', ({ roomCode }) => {
      const room = snakesRooms[roomCode];
      if (!room) return;
      delete snakesRooms[roomCode];
    });
  });

  console.log('🐍 Snakes & Ladders Server loaded');
};