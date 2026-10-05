/**
 * ============================================================
 *  headsUpServer.js — لعبة "البس على راسك" (Heads Up)
 *  ✅ الأدمن بقى لاعب كامل — يقدر يكون في فريق أو يلعب solo
 *  ✅ + close_game listener لتنظيف الغرفة
 * ============================================================
 */

const WORDS_DATA = require('./data/headsUpWords');

const TURN_DURATION_MS = 60000;
const READY_TIME_MS = 3500;
const TURN_END_DELAY_MS = 5000;
const TEAM_TARGET_SCORE = 15;

const headsUpRooms = {};

// ============================================================
// Helpers
// ============================================================
function getTeamPlayers(room, team) {
  return Object.values(room.players).filter((p) => p.team === team);
}

function getCategoryById(id) {
  return WORDS_DATA.categories.find((c) => c.id === id) || null;
}

function pickRandomWord(room) {
  const cat = getCategoryById(room.categoryId);
  if (!cat || cat.words.length === 0) return null;

  let available = cat.words.filter((w) => !room.usedWords.includes(w));
  if (available.length === 0) {
    room.usedWords = [];
    available = [...cat.words];
  }

  const word = available[Math.floor(Math.random() * available.length)];
  room.usedWords.push(word);
  return word;
}

function clearRoomTimers(room) {
  ['readyTimer', 'turnTimer', 'turnEndTimer'].forEach((k) => {
    if (room[k]) {
      clearTimeout(room[k]);
      room[k] = null;
    }
  });
}

function createEmptyRoom(roomCode) {
  return {
    roomCode,
    adminSocketId: null,
    adminPlayerId: null,   // ✅ جديد
    playerList: {},
    players: {},
    teams: {
      A: { name: 'الفريق أ', captainId: null, score: 0 },
      B: { name: 'الفريق ب', captainId: null, score: 0 },
    },
    mode: null,
    categoryId: null,
    phase: 'lobby',
    phaseStartedAt: Date.now(),
    roundNumber: 0,
    turnOrder: [],
    turnIndex: 0,
    currentTurnPlayerId: null,
    currentTurnTeam: null,
    currentWord: null,
    usedWords: [],
    turnLog: [],
    turnScore: 0,
    scores: {},
    winnerPlayerId: null,
    winnerTeam: null,
    readyTimer: null,
    turnTimer: null,
    turnEndTimer: null,
  };
}

function buildPublicState(room, forSocketId) {
  const isAdmin = room.adminSocketId === forSocketId;

  // ✅ me بيتجاب من players دايمًا (حتى لو admin)
  const me = Object.values(room.players).find((p) => p.socketId === forSocketId);
  const myPlayerId = me ? me.id : null;

  const isCaptainOnline = (captainId) => {
    if (!captainId) return false;
    const p = room.players[captainId];
    if (!p) return false;
    return !!room.io?.sockets?.sockets?.get(p.socketId);
  };

  const state = {
    roomCode: room.roomCode,
    mode: room.mode,
    categoryId: room.categoryId,
    category: room.categoryId ? (() => {
      const c = getCategoryById(room.categoryId);
      if (!c) return null;
      return { id: c.id, name: c.name, icon: c.icon, wordCount: c.words.length };
    })() : null,
    categoriesList: WORDS_DATA.categories.map((c) => ({
      id: c.id, name: c.name, icon: c.icon, wordCount: c.words.length,
    })),
    phase: room.phase,
    phaseStartedAt: room.phaseStartedAt,
    roundNumber: room.roundNumber || 0,
    turnDuration: TURN_DURATION_MS,
    readyDuration: READY_TIME_MS,
    turnEndDuration: TURN_END_DELAY_MS,
    targetScore: TEAM_TARGET_SCORE,
    teams: {
      A: {
        name: room.teams.A.name,
        captainId: room.teams.A.captainId,
        captainName: room.teams.A.captainId
          ? room.playerList[room.teams.A.captainId]?.name || null
          : null,
        captainOnline: isCaptainOnline(room.teams.A.captainId),
        players: getTeamPlayers(room, 'A').map((p) => ({ id: p.id, name: p.name })),
        score: room.teams.A.score,
      },
      B: {
        name: room.teams.B.name,
        captainId: room.teams.B.captainId,
        captainName: room.teams.B.captainId
          ? room.playerList[room.teams.B.captainId]?.name || null
          : null,
        captainOnline: isCaptainOnline(room.teams.B.captainId),
        players: getTeamPlayers(room, 'B').map((p) => ({ id: p.id, name: p.name })),
        score: room.teams.B.score,
      },
    },
    allPlayers: Object.values(room.playerList).map((p) => {
      const online = room.players[p.id];
      return {
        id: p.id,
        name: p.name,
        team: online?.team || null,
        isCaptain: p.id === room.teams.A.captainId || p.id === room.teams.B.captainId,
        isOnline: !!online,
        isAdmin: p.id === room.adminPlayerId,   // ✅ جديد
      };
    }),
    currentTurnPlayerId: room.currentTurnPlayerId,
    currentTurnPlayerName: room.currentTurnPlayerId
      ? room.playerList[room.currentTurnPlayerId]?.name || null
      : null,
    currentTurnTeam: room.currentTurnTeam,
    scores: { ...room.scores },
    turnIndex: room.turnIndex,
    turnOrderLength: room.turnOrder.length,
    winnerPlayerId: room.winnerPlayerId,
    winnerTeam: room.winnerTeam,
  };

  if (room.phase === 'playing' && room.currentWord) {
    state.currentWord = room.currentWord;
    state.turnScore = room.turnScore;
  }

  if (room.phase === 'turnEnd' || room.phase === 'gameover') {
    state.turnLog = room.turnLog;
    state.turnScore = room.turnScore;
  }

  // ✅ me — الأدمن بقى جزء من players
  if (myPlayerId) {
    const myPlayer = room.players[myPlayerId];
    const myTeamObj = myPlayer?.team ? room.teams[myPlayer.team] : null;
    state.me = {
      id: myPlayerId,
      name: myPlayer.name,
      team: myPlayer.team,
      isAdmin: isAdmin,
      isCaptain: !!(myTeamObj && myTeamObj.captainId === myPlayerId),
      isPhoneHolder: room.currentTurnPlayerId === myPlayerId,
      myScore: room.scores[myPlayerId] || 0,
    };
  } else if (isAdmin) {
    // fallback لو الأدمن لسه مش في players
    state.me = {
      id: null, name: 'Quiz Master', team: null,
      isAdmin: true, isCaptain: false, isPhoneHolder: false,
    };
  } else {
    state.me = {
      id: null, name: 'Spectator', team: null,
      isAdmin: false, isCaptain: false, isPhoneHolder: false,
    };
  }

  return state;
}

function broadcastState(io, room) {
  const sent = new Set();
  Object.values(room.players).forEach((p) => {
    if (sent.has(p.socketId)) return;
    const s = io.sockets.sockets.get(p.socketId);
    if (s) {
      s.emit('headsUp_state', buildPublicState(room, p.socketId));
      sent.add(p.socketId);
    }
  });
  // Fallback للأدمن لو مش موجود في players (legacy)
  if (room.adminSocketId && !sent.has(room.adminSocketId)) {
    const s = io.sockets.sockets.get(room.adminSocketId);
    if (s) s.emit('headsUp_state', buildPublicState(room, room.adminSocketId));
  }
}

// ============================================================
// Turn order
// ============================================================
function buildTeamTurnOrder(room) {
  const a = getTeamPlayers(room, 'A');
  const b = getTeamPlayers(room, 'B');
  const maxLen = Math.max(a.length, b.length);
  const order = [];
  for (let i = 0; i < maxLen; i++) {
    if (a[i]) order.push({ playerId: a[i].id, team: 'A' });
    if (b[i]) order.push({ playerId: b[i].id, team: 'B' });
  }
  return order;
}

function buildSoloTurnOrder(room) {
  return Object.values(room.players).map((p) => ({ playerId: p.id, team: null }));
}

// ============================================================
// Phase transitions
// ============================================================
function startReadyForCurrentTurn(io, room) {
  clearRoomTimers(room);
  room.phase = 'ready';
  room.phaseStartedAt = Date.now();

  const entry = room.turnOrder[room.turnIndex];
  if (!entry) {
    endGame(io, room);
    return;
  }
  room.currentTurnPlayerId = entry.playerId;
  room.currentTurnTeam = entry.team;
  room.currentWord = null;
  room.turnLog = [];
  room.turnScore = 0;

  broadcastState(io, room);

  room.readyTimer = setTimeout(() => startPlaying(io, room), READY_TIME_MS);
}

function startPlaying(io, room) {
  clearRoomTimers(room);
  room.phase = 'playing';
  room.phaseStartedAt = Date.now();
  room.turnLog = [];
  room.turnScore = 0;
  room.currentWord = pickRandomWord(room);

  broadcastState(io, room);

  room.turnTimer = setTimeout(() => endTurn(io, room), TURN_DURATION_MS);
}

function endTurn(io, room) {
  if (room.phase !== 'playing') return;
  clearRoomTimers(room);

  room.phase = 'turnEnd';
  room.phaseStartedAt = Date.now();

  if (room.mode === 'team' && room.currentTurnTeam) {
    room.teams[room.currentTurnTeam].score += room.turnScore;
  } else if (room.mode === 'solo' && room.currentTurnPlayerId) {
    room.scores[room.currentTurnPlayerId] =
      (room.scores[room.currentTurnPlayerId] || 0) + room.turnScore;
  }

  broadcastState(io, room);

  room.turnEndTimer = setTimeout(() => nextTurn(io, room), TURN_END_DELAY_MS);
}

function nextTurn(io, room) {
  if (room.mode === 'team') {
    if (room.teams.A.score >= TEAM_TARGET_SCORE) {
      room.winnerTeam = 'A';
      endGame(io, room);
      return;
    }
    if (room.teams.B.score >= TEAM_TARGET_SCORE) {
      room.winnerTeam = 'B';
      endGame(io, room);
      return;
    }
  }

  room.turnIndex += 1;
  if (room.turnIndex >= room.turnOrder.length) {
    clearRoomTimers(room);
    room.roundNumber = (room.roundNumber || 0) + 1;
    room.phase = 'betweenRounds';
    room.phaseStartedAt = Date.now();
    room.currentTurnPlayerId = null;
    room.currentTurnTeam = null;
    broadcastState(io, room);
    return;
  }

  startReadyForCurrentTurn(io, room);
}

function endGame(io, room) {
  clearRoomTimers(room);
  room.phase = 'gameover';
  room.phaseStartedAt = Date.now();

  if (room.mode === 'solo') {
    let best = -1;
    let winnerId = null;
    Object.entries(room.scores).forEach(([pid, sc]) => {
      if (sc > best) { best = sc; winnerId = pid; }
    });
    room.winnerPlayerId = winnerId;
  }

  broadcastState(io, room);
}

// ============================================================
// Handle leave
// ============================================================
function handleLeave(io, socket, roomCode) {
  const room = headsUpRooms[roomCode];
  if (!room) return;

  // ✅ لو الأدمن خرج، نشيل adminSocketId
  if (room.adminSocketId === socket.id) {
    room.adminSocketId = null;
  }

  const playerId = socket.data.headsUpPlayerId
    || Object.keys(room.players).find(id => room.players[id].socketId === socket.id);

  if (playerId && room.players[playerId]) {
    // لو كان صاحب الدور الحالي، اقفل الدور فورًا
    if (room.currentTurnPlayerId === playerId) {
      if (room.phase === 'playing' || room.phase === 'ready') {
        delete room.players[playerId];
        if (room.adminPlayerId === playerId) room.adminPlayerId = null;
        clearRoomTimers(room);
        room.phase = 'turnEnd';
        room.phaseStartedAt = Date.now();
        broadcastState(io, room);
        room.turnEndTimer = setTimeout(() => nextTurn(io, room), 2000);
        return;
      }
    }
    delete room.players[playerId];
    if (room.adminPlayerId === playerId) room.adminPlayerId = null;
  }

  broadcastState(io, room);
}

// ============================================================
// Setup
// ============================================================
module.exports = function setupHeadsUp(io) {
  io.on('connection', (socket) => {

    // ✅ انضمام لاعب (أدمن أو عادي) — بنفس الحدث
    socket.on('headsUp_join', ({ roomCode, playerId, playerName, isAdmin }) => {
      if (!roomCode || !playerId) return;
      if (!headsUpRooms[roomCode]) {
        headsUpRooms[roomCode] = createEmptyRoom(roomCode);
      }
      const room = headsUpRooms[roomCode];
      room.io = io;

      if (isAdmin) {
        room.adminSocketId = socket.id;
        room.adminPlayerId = playerId;
      }

      let team = null;
      if (room.teams.A.captainId === playerId) team = 'A';
      else if (room.teams.B.captainId === playerId) team = 'B';
      else team = room.players[playerId]?.team || null;

      room.players[playerId] = {
        id: playerId,
        socketId: socket.id,
        name: playerName || 'لاعب',
        team,
        isAdmin: !!isAdmin,
      };

      if (!room.playerList[playerId]) {
        room.playerList[playerId] = { id: playerId, name: playerName || 'لاعب' };
      } else {
        room.playerList[playerId].name = playerName || room.playerList[playerId].name;
      }

      socket.join(`headsUp_${roomCode}`);
      socket.data.headsUpRoomCode = roomCode;
      socket.data.headsUpPlayerId = playerId;

      socket.emit('headsUp_joined', { roomCode, playerId });
      broadcastState(io, room);
    });

    // ✅ legacy — للأمان
    socket.on('headsUp_admin_join', ({ roomCode, players }) => {
      if (!roomCode) return;
      if (!headsUpRooms[roomCode]) {
        headsUpRooms[roomCode] = createEmptyRoom(roomCode);
      }
      const room = headsUpRooms[roomCode];
      room.io = io;
      room.adminSocketId = socket.id;
      socket.join(`headsUp_${roomCode}`);
      socket.data.headsUpRoomCode = roomCode;

      (players || []).forEach((p) => {
        if (!p || !p.id) return;
        if (!room.playerList[p.id]) {
          room.playerList[p.id] = { id: p.id, name: p.name || 'لاعب' };
        } else {
          room.playerList[p.id].name = p.name || room.playerList[p.id].name;
        }
      });

      broadcastState(io, room);
    });

    // ✅ مزامنة قائمة اللاعبين من الأدمن (للـ playerList)
    socket.on('headsUp_seed_players', ({ roomCode, players }) => {
      const room = headsUpRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      let changed = false;
      (players || []).forEach((p) => {
        if (!p || !p.id) return;
        if (!room.playerList[p.id]) {
          room.playerList[p.id] = { id: p.id, name: p.name || 'لاعب' };
          changed = true;
        } else if (room.playerList[p.id].name !== p.name) {
          room.playerList[p.id].name = p.name;
          changed = true;
        }
      });
      if (changed) broadcastState(io, room);
    });

    // ===== اختيار المود =====
    socket.on('headsUp_select_mode', ({ roomCode, mode }) => {
      const room = headsUpRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase !== 'lobby') return;
      if (mode !== 'solo' && mode !== 'team') return;
      room.mode = mode;
      broadcastState(io, room);
    });

    // ===== اختيار الفئة =====
    socket.on('headsUp_select_category', ({ roomCode, categoryId }) => {
      const room = headsUpRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase !== 'lobby' && room.phase !== 'betweenRounds') return;
      if (!getCategoryById(categoryId)) return;
      room.categoryId = categoryId;
      room.usedWords = [];
      broadcastState(io, room);
    });

    // ===== اختيار القادة =====
    socket.on('headsUp_select_captains', ({ roomCode, captainA, captainB }) => {
      const room = headsUpRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase !== 'lobby') return;
      if (room.mode !== 'team') return;

      if (room.teams.A.captainId && room.players[room.teams.A.captainId]) {
        if (room.teams.A.captainId !== captainB) {
          room.players[room.teams.A.captainId].team = null;
        }
      }
      if (room.teams.B.captainId && room.players[room.teams.B.captainId]) {
        if (room.teams.B.captainId !== captainA) {
          room.players[room.teams.B.captainId].team = null;
        }
      }

      if (captainA && room.playerList[captainA] && captainA !== captainB) {
        room.teams.A.captainId = captainA;
        if (room.players[captainA]) room.players[captainA].team = 'A';
      } else {
        room.teams.A.captainId = null;
      }
      if (captainB && room.playerList[captainB] && captainB !== captainA) {
        room.teams.B.captainId = captainB;
        if (room.players[captainB]) room.players[captainB].team = 'B';
      } else {
        room.teams.B.captainId = null;
      }

      broadcastState(io, room);
    });

    // ===== انضم لفريق =====
    socket.on('headsUp_join_team', ({ roomCode, team }) => {
      const room = headsUpRooms[roomCode];
      if (!room || room.phase !== 'lobby') return;
      if (room.mode !== 'team') return;
      if (team !== 'A' && team !== 'B') return;
      if (!room.teams.A.captainId || !room.teams.B.captainId) {
        socket.emit('headsUp_error', { message: 'لازم المُيسّر يختار القادة أولاً' });
        return;
      }
      const playerId = socket.data.headsUpPlayerId;
      if (!playerId || !room.players[playerId]) return;
      if (room.teams.A.captainId === playerId || room.teams.B.captainId === playerId) return;
      room.players[playerId].team = team;
      broadcastState(io, room);
    });

    // ===== اخرج من فريق =====
    socket.on('headsUp_leave_team', ({ roomCode }) => {
      const room = headsUpRooms[roomCode];
      if (!room || room.phase !== 'lobby') return;
      const playerId = socket.data.headsUpPlayerId;
      if (!playerId || !room.players[playerId]) return;
      if (room.teams.A.captainId === playerId || room.teams.B.captainId === playerId) return;
      room.players[playerId].team = null;
      broadcastState(io, room);
    });

    // ===== اسم الفريق =====
    socket.on('headsUp_set_team_name', ({ roomCode, name }) => {
      const room = headsUpRooms[roomCode];
      if (!room || room.phase !== 'lobby') return;
      const playerId = socket.data.headsUpPlayerId;
      if (!playerId) return;
      let teamKey = null;
      if (room.teams.A.captainId === playerId) teamKey = 'A';
      else if (room.teams.B.captainId === playerId) teamKey = 'B';
      if (!teamKey) return;
      const clean = (name || '').toString().trim().slice(0, 30);
      if (!clean) return;
      room.teams[teamKey].name = clean;
      broadcastState(io, room);
    });

    // ===== بدء اللعبة =====
    socket.on('headsUp_start_game', ({ roomCode }) => {
      const room = headsUpRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase !== 'lobby') return;
      if (!room.mode) {
        socket.emit('headsUp_error', { message: 'اختر المود أولاً (فردي أو جماعي)' });
        return;
      }
      if (!room.categoryId) {
        socket.emit('headsUp_error', { message: 'اختر فئة الكلمات أولاً' });
        return;
      }

      if (room.mode === 'team') {
        const capA = room.teams.A.captainId;
        const capB = room.teams.B.captainId;
        if (!capA || !capB) {
          socket.emit('headsUp_error', { message: 'لازم قائدين للفريقين' });
          return;
        }
        if (getTeamPlayers(room, 'A').length === 0) {
          socket.emit('headsUp_error', { message: 'الفريق أ لسه فاضي' });
          return;
        }
        if (getTeamPlayers(room, 'B').length === 0) {
          socket.emit('headsUp_error', { message: 'الفريق ب لسه فاضي' });
          return;
        }
        const unassigned = Object.values(room.players).filter((p) => !p.team);
        if (unassigned.length > 0) {
          socket.emit('headsUp_error', {
            message: `في ${unassigned.length} لاعب لسه ما انضمش لفريق`,
          });
          return;
        }
        room.turnOrder = buildTeamTurnOrder(room);
      } else {
        if (Object.values(room.players).length === 0) {
          socket.emit('headsUp_error', { message: 'مفيش لاعبين' });
          return;
        }
        room.turnOrder = buildSoloTurnOrder(room);
        room.scores = {};
        Object.values(room.players).forEach((p) => { room.scores[p.id] = 0; });
      }

      room.turnIndex = 0;
      room.roundNumber = 1;
      room.teams.A.score = 0;
      room.teams.B.score = 0;
      room.usedWords = [];
      room.winnerPlayerId = null;
      room.winnerTeam = null;

      startReadyForCurrentTurn(io, room);
    });

    // ===== الكلمة اللي بعدها =====
    socket.on('headsUp_correct', ({ roomCode }) => {
      const room = headsUpRooms[roomCode];
      if (!room || room.phase !== 'playing') return;
      const playerId = socket.data.headsUpPlayerId;
      if (playerId !== room.currentTurnPlayerId) return;

      room.turnScore += 1;
      room.turnLog.push({ word: room.currentWord, result: 'correct' });
      room.currentWord = pickRandomWord(room);
      broadcastState(io, room);
    });

    socket.on('headsUp_pass', ({ roomCode }) => {
      const room = headsUpRooms[roomCode];
      if (!room || room.phase !== 'playing') return;
      const playerId = socket.data.headsUpPlayerId;
      if (playerId !== room.currentTurnPlayerId) return;

      room.turnLog.push({ word: room.currentWord, result: 'pass' });
      room.currentWord = pickRandomWord(room);
      broadcastState(io, room);
    });

    // ===== إنهاء الدور يدويًا =====
    socket.on('headsUp_force_end_turn', ({ roomCode }) => {
      const room = headsUpRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase !== 'playing') return;
      endTurn(io, room);
    });

    // ===== الجولة التالية =====
    socket.on('headsUp_start_next_round', ({ roomCode }) => {
      const room = headsUpRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase !== 'betweenRounds') return;

      if (room.mode === 'team') {
        room.turnOrder = buildTeamTurnOrder(room);
      } else {
        room.turnOrder = buildSoloTurnOrder(room);
      }
      room.turnIndex = 0;
      room.roundNumber = (room.roundNumber || 0) + 1;

      startReadyForCurrentTurn(io, room);
    });

    // ===== إعادة تعيين =====
    socket.on('headsUp_reset_game', ({ roomCode }) => {
      const room = headsUpRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;

      clearRoomTimers(room);
      room.phase = 'lobby';
      room.phaseStartedAt = Date.now();
      room.roundNumber = 0;
      room.turnIndex = 0;
      room.turnOrder = [];
      room.currentTurnPlayerId = null;
      room.currentTurnTeam = null;
      room.currentWord = null;
      room.turnLog = [];
      room.turnScore = 0;
      room.scores = {};
      room.teams.A.score = 0;
      room.teams.B.score = 0;
      room.usedWords = [];
      room.winnerPlayerId = null;
      room.winnerTeam = null;

      broadcastState(io, room);
    });

    socket.on('headsUp_leave', ({ roomCode }) => handleLeave(io, socket, roomCode));
    socket.on('disconnect', () => {
      const roomCode = socket.data?.headsUpRoomCode;
      if (roomCode) handleLeave(io, socket, roomCode);
    });

    // ✅ تنظيف الغرفة عند إغلاق اللعبة
    socket.on('close_game', ({ roomCode }) => {
      const room = headsUpRooms[roomCode];
      if (!room) return;
      clearRoomTimers(room);
      delete headsUpRooms[roomCode];
    });
  });

  console.log('🎯 Heads Up Server loaded');
};