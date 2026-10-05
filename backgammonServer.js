/**
 * ============================================================
 *  backgammonServer.js — الطاولة المصرية (المحبوسة)
 *  ✅ الأدمن بقى لاعب كامل في players[]
 *  ✅ + close_game listener لتنظيف الغرفة
 * ============================================================
 */

const backgammonRooms = {};
if (typeof global !== 'undefined') global.backgammonRooms = backgammonRooms;

function createInitialBoard() {
  const b = Array.from({ length: 24 }, () => ({ color: null, count: 0 }));
  b[0] = { color: 'w', count: 15 };
  b[23] = { color: 'b', count: 15 };
  return b;
}

function rollDie() { return Math.floor(Math.random() * 6) + 1; }

function allInHome(board, color) {
  for (let i = 0; i < 24; i++) {
    const p = board[i];
    if (p.color !== color || p.count === 0) continue;
    if (color === 'w' && i < 18) return false;
    if (color === 'b' && i > 5) return false;
  }
  return true;
}

function canLandOn(board, index, color) {
  const p = board[index];
  if (p.color === null || p.count === 0) return { ok: true, hit: false };
  if (p.color === color) return { ok: true, hit: false };
  if (p.count === 1) return { ok: true, hit: true };
  return { ok: false, hit: false };
}

function getPossibleMoves(room, color) {
  const moves = [];
  const { board, bar, remainingMoves } = room;
  const dir = color === 'w' ? 1 : -1;
  const uniqueDice = [...new Set(remainingMoves)];

  if (bar[color] > 0) {
    for (const d of uniqueDice) {
      const idx = color === 'w' ? d - 1 : 24 - d;
      if (idx < 0 || idx > 23) continue;
      const r = canLandOn(board, idx, color);
      if (r.ok) moves.push({ fromType: 'bar', die: d, toIndex: idx, hit: r.hit, bearOff: false });
    }
    return moves;
  }

  const inHome = allInHome(board, color);
  for (let i = 0; i < 24; i++) {
    const p = board[i];
    if (p.color !== color || p.count === 0) continue;

    for (const d of uniqueDice) {
      const to = i + dir * d;
      if (to >= 0 && to <= 23) {
        const r = canLandOn(board, to, color);
        if (r.ok) moves.push({ fromType: 'board', fromIndex: i, die: d, toIndex: to, hit: r.hit, bearOff: false });
      }
      if (inHome) {
        if (color === 'w') {
          const dist = 24 - i;
          if (dist === d) {
            moves.push({ fromType: 'board', fromIndex: i, die: d, toIndex: -1, hit: false, bearOff: true });
          } else if (dist < d) {
            let blocked = false;
            for (let j = i + 1; j <= 23; j++) {
              if (board[j].color === 'w' && board[j].count > 0) { blocked = true; break; }
            }
            if (!blocked) moves.push({ fromType: 'board', fromIndex: i, die: d, toIndex: -1, hit: false, bearOff: true });
          }
        } else {
          const dist = i + 1;
          if (dist === d) {
            moves.push({ fromType: 'board', fromIndex: i, die: d, toIndex: -1, hit: false, bearOff: true });
          } else if (dist < d) {
            let blocked = false;
            for (let j = i - 1; j >= 0; j--) {
              if (board[j].color === 'b' && board[j].count > 0) { blocked = true; break; }
            }
            if (!blocked) moves.push({ fromType: 'board', fromIndex: i, die: d, toIndex: -1, hit: false, bearOff: true });
          }
        }
      }
    }
  }
  return moves;
}

function applyMove(room, color, move) {
  const { board, bar, off } = room;
  if (move.fromType === 'bar') bar[color]--;
  else {
    const from = board[move.fromIndex];
    from.count--;
    if (from.count === 0) from.color = null;
  }
  if (move.bearOff) off[color]++;
  else {
    const to = board[move.toIndex];
    if (move.hit) {
      bar[to.color]++;
      to.color = color;
      to.count = 1;
    } else {
      to.color = color;
      to.count++;
    }
  }
  const idx = room.remainingMoves.indexOf(move.die);
  if (idx !== -1) room.remainingMoves.splice(idx, 1);
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
    board: null,
    bar: { w: 0, b: 0 },
    off: { w: 0, b: 0 },
    turn: 'w',
    dice: [],
    remainingMoves: [],
    hasRolled: false,
    whiteId: null,
    blackId: null,
    winner: null,
    lastMove: null,
  };
}

function getPlayerBySocket(room, socketId) {
  return Object.values(room.players).find(p => p.socketId === socketId);
}

function reorderPlayers(room) {
  if (!room.preferredOrder?.length) return;
  const newOrder = [];
  for (const id of room.preferredOrder) if (room.players[id] && !newOrder.includes(id)) newOrder.push(id);
  for (const id of room.playerOrder) if (!newOrder.includes(id)) newOrder.push(id);
  room.playerOrder = newOrder;
}

function buildState(room, forSocketId) {
  const me = getPlayerBySocket(room, forSocketId);
  const isAdmin = !!(me && me.isAdmin) || room.adminSocketId === forSocketId;

  let myColor = null;
  if (me) {
    if (me.id === room.whiteId) myColor = 'w';
    else if (me.id === room.blackId) myColor = 'b';
  }
  let possibleMoves = [];
  if (room.phase === 'playing' && myColor === room.turn && room.remainingMoves.length > 0) {
    possibleMoves = getPossibleMoves(room, myColor);
  }
  return {
    roomCode: room.roomCode, phase: room.phase, isAdmin,
    board: room.board, bar: room.bar, off: room.off,
    turn: room.turn, dice: room.dice, remainingMoves: room.remainingMoves,
    hasRolled: room.hasRolled, myColor, winner: room.winner, lastMove: room.lastMove,
    possibleMoves, whiteId: room.whiteId, blackId: room.blackId,
    players: room.playerOrder.map(id => {
      const p = room.players[id];
      if (!p) return null;
      let color = null;
      if (id === room.whiteId) color = 'w';
      else if (id === room.blackId) color = 'b';
      return {
        id: p.id, name: p.name, color,
        isMe: me && me.id === id,
        isAdmin: !!p.isAdmin,
      };
    }).filter(Boolean),
    me: me ? {
      id: me.id,
      name: me.name,
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
      s.emit('backgammon_state', buildState(room, p.socketId));
      sent.add(p.socketId);
    }
  });
  // Fallback للأدمن لو مش موجود في players (legacy)
  if (room.adminSocketId && !sent.has(room.adminSocketId)) {
    const s = io.sockets.sockets.get(room.adminSocketId);
    if (s) s.emit('backgammon_state', buildState(room, room.adminSocketId));
  }
}

function endTurn(room) {
  room.turn = room.turn === 'w' ? 'b' : 'w';
  room.dice = [];
  room.remainingMoves = [];
  room.hasRolled = false;
}

function checkAutoEndTurn(room) {
  if (room.remainingMoves.length === 0) { endTurn(room); return true; }
  const moves = getPossibleMoves(room, room.turn);
  if (moves.length === 0) { endTurn(room); return true; }
  return false;
}

function handleLeave(io, socket, roomCode) {
  const room = backgammonRooms[roomCode];
  if (!room) return;

  // ✅ لو الأدمن خرج، نشيل adminSocketId
  if (room.adminSocketId === socket.id) {
    room.adminSocketId = null;
  }

  const playerId = socket.data.bgPlayerId
    || Object.keys(room.players).find(id => room.players[id].socketId === socket.id);

  if (playerId && room.players[playerId]) {
    delete room.players[playerId];
    room.playerOrder = room.playerOrder.filter(id => id !== playerId);
    if (room.adminPlayerId === playerId) room.adminPlayerId = null;
    if (room.whiteId === playerId) room.whiteId = null;
    if (room.blackId === playerId) room.blackId = null;
  }

  if (room.playerOrder.length === 0 && !room.adminSocketId) {
    delete backgammonRooms[roomCode];
    return;
  }

  broadcast(io, room);
}

module.exports = function setupBackgammon(io) {
  io.on('connection', (socket) => {

    // ✅ انضمام لاعب (أدمن أو عادي) — بنفس الحدث
    socket.on('backgammon_join', ({ roomCode, playerId, playerName, isAdmin }) => {
      if (!roomCode || !playerId) return;
      if (!backgammonRooms[roomCode]) backgammonRooms[roomCode] = createRoom(roomCode);
      const room = backgammonRooms[roomCode];

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
      }
      reorderPlayers(room);
      socket.join(`backgammon_${roomCode}`);
      socket.data.bgRoomCode = roomCode;
      socket.data.bgPlayerId = playerId;
      broadcast(io, room);
    });

    // ✅ legacy — للأمان
    socket.on('backgammon_admin_join', ({ roomCode }) => {
      if (!roomCode) return;
      if (!backgammonRooms[roomCode]) backgammonRooms[roomCode] = createRoom(roomCode);
      const room = backgammonRooms[roomCode];
      room.adminSocketId = socket.id;
      socket.join(`backgammon_${roomCode}`);
      socket.data.bgRoomCode = roomCode;
      broadcast(io, room);
    });

    socket.on('backgammon_set_order', ({ roomCode, playerIds }) => {
      const room = backgammonRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id || !Array.isArray(playerIds)) return;
      room.preferredOrder = playerIds;
      reorderPlayers(room);
      broadcast(io, room);
    });

    socket.on('backgammon_start', ({ roomCode, whiteId, blackId }) => {
      const room = backgammonRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id || room.phase === 'playing') return;
      if (room.playerOrder.length < 2) { socket.emit('backgammon_error', { message: 'محتاج لاعبين' }); return; }
      reorderPlayers(room);
      const w = whiteId && room.players[whiteId] ? whiteId : room.playerOrder[0];
      const b = blackId && room.players[blackId] ? blackId : room.playerOrder.find(id => id !== w);
      if (!b || b === w) { socket.emit('backgammon_error', { message: 'لاعبين مختلفين' }); return; }
      room.whiteId = w; room.blackId = b;
      room.board = createInitialBoard();
      room.bar = { w: 0, b: 0 }; room.off = { w: 0, b: 0 };
      room.turn = 'w'; room.dice = []; room.remainingMoves = []; room.hasRolled = false;
      room.winner = null; room.phase = 'playing'; room.lastMove = null;
      broadcast(io, room);
    });

    socket.on('backgammon_roll', ({ roomCode }) => {
      const room = backgammonRooms[roomCode];
      if (!room || room.phase !== 'playing') return;
      const pid = socket.data.bgPlayerId;
      let col = pid === room.whiteId ? 'w' : pid === room.blackId ? 'b' : null;
      if (!col || col !== room.turn || room.hasRolled) return;
      const d1 = rollDie(), d2 = rollDie();
      if (d1 === d2) {
        room.dice = [d1, d1, d1, d1];
        room.remainingMoves = [d1, d1, d1, d1];
      } else {
        room.dice = [d1, d2];
        room.remainingMoves = [d1, d2];
      }
      room.hasRolled = true;
      checkAutoEndTurn(room);
      broadcast(io, room);
    });

    socket.on('backgammon_move', ({ roomCode, fromType, fromIndex, toIndex, die }) => {
      const room = backgammonRooms[roomCode];
      if (!room || room.phase !== 'playing') return;
      const pid = socket.data.bgPlayerId;
      let col = pid === room.whiteId ? 'w' : pid === room.blackId ? 'b' : null;
      if (!col || col !== room.turn) return;
      const possible = getPossibleMoves(room, col);
      const move = possible.find(m =>
        m.fromType === fromType &&
        (m.fromType === 'bar' || m.fromIndex === fromIndex) &&
        m.toIndex === toIndex && m.die === die
      );
      if (!move) { socket.emit('backgammon_error', { message: 'حركة غير صحيحة' }); return; }
      applyMove(room, col, move);
      room.lastMove = { ...move, color: col };
      if (room.off[col] === 15) {
        room.phase = 'gameEnd'; room.winner = col;
        broadcast(io, room); return;
      }
      checkAutoEndTurn(room);
      broadcast(io, room);
    });

    socket.on('backgammon_end_turn', ({ roomCode }) => {
      const room = backgammonRooms[roomCode];
      if (!room || room.phase !== 'playing') return;
      const pid = socket.data.bgPlayerId;
      let col = pid === room.whiteId ? 'w' : pid === room.blackId ? 'b' : null;
      if (!col || col !== room.turn) return;
      endTurn(room);
      broadcast(io, room);
    });

    socket.on('backgammon_reset', ({ roomCode }) => {
      const room = backgammonRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      Object.assign(room, {
        board: null, bar: { w: 0, b: 0 }, off: { w: 0, b: 0 },
        turn: 'w', dice: [], remainingMoves: [], hasRolled: false,
        winner: null, whiteId: null, blackId: null, phase: 'waiting', lastMove: null,
      });
      broadcast(io, room);
    });

    socket.on('backgammon_leave', ({ roomCode }) => handleLeave(io, socket, roomCode));
    socket.on('disconnect', () => {
      const roomCode = socket.data?.bgRoomCode;
      if (roomCode) handleLeave(io, socket, roomCode);
    });

    // ✅ تنظيف الغرفة عند إغلاق اللعبة
    socket.on('close_game', ({ roomCode }) => {
      const room = backgammonRooms[roomCode];
      if (!room) return;
      delete backgammonRooms[roomCode];
    });
  });
  console.log('🎲 Backgammon Server loaded');
};