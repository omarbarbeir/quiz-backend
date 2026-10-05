/**
 * ============================================================
 *  guessOpponentServer.js — لعبة "خمّن جوابي"
 *  ✅ الأدمن بقى لاعب كامل — يقدر يكون قائد أو عضو فريق عادي
 *  ✅ + close_game listener لتنظيف الغرفة
 * ============================================================
 */

const QUESTIONS = require('./data/guessOpponentQuestions');

const TARGET_SCORE      = 15;
const READY_TIME_MS     = 1800;
const QUESTION_TIME_MS  = 25000;
const REVEAL_TIME_MS    = 7000;

const guessRooms = {};

// ===== Helpers =====
function getTeamPlayers(room, team) {
  return Object.values(room.players).filter((p) => p.team === team);
}

function getRandomQuestion(room) {
  const available = QUESTIONS.filter((q) => !room.usedQuestionIds.includes(q.id));
  const pool = available.length > 0 ? available : QUESTIONS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function normalizeAnswer(s) {
  return (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

function clearRoomTimers(room) {
  ['readyTimer', 'questionTimer', 'revealTimer'].forEach((k) => {
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
    adminPlayerId: null,
    playerList: {},
    players: {},
    teams: {
      A: { name: 'الفريق أ', captainId: null, score: 0 },
      B: { name: 'الفريق ب', captainId: null, score: 0 },
    },
    phase: 'lobby',
    phaseStartedAt: Date.now(),
    roundNumber: 0,
    answeringTeam: 'A',
    currentQuestion: null,
    answers: {},
    roundResults: null,
    winnerTeam: null,
    usedQuestionIds: [],
    readyTimer: null,
    questionTimer: null,
    revealTimer: null,
  };
}

function buildPublicState(room, forSocketId) {
  const isAdmin = room.adminSocketId === forSocketId;
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
    phase: room.phase,
    phaseStartedAt: room.phaseStartedAt,
    phaseDurations: {
      ready: READY_TIME_MS,
      question: QUESTION_TIME_MS,
      reveal: REVEAL_TIME_MS,
    },
    targetScore: TARGET_SCORE,
    roundNumber: room.roundNumber || 0,
    answeringTeam: room.answeringTeam,
    winnerTeam: room.winnerTeam,
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
      const online = Object.values(room.players).find((rp) => rp.id === p.id);
      return {
        id: p.id,
        name: p.name,
        team: online?.team || null,
        isCaptain:
          p.id === room.teams.A.captainId || p.id === room.teams.B.captainId,
        isOnline: !!online,
        isAdmin: p.id === room.adminPlayerId,
      };
    }),
  };

  if (room.currentQuestion) {
    state.currentQuestion = {
      id: room.currentQuestion.id,
      question: room.currentQuestion.question,
    };
  }

  if (room.phase === 'question') {
    const totalPlayers = Object.values(room.players).filter((p) => p.team).length;
    const submitted = Object.keys(room.answers).length;
    state.submissionProgress = { submitted, total: totalPlayers };
  }

  if ((room.phase === 'reveal' || room.phase === 'gameover') && room.roundResults) {
    state.roundResults = {
      answeringTeam: room.roundResults.answeringTeam,
      guessingTeam: room.roundResults.guessingTeam,
      teamPointsThisRound: room.roundResults.teamPointsThisRound,
      answeringPlayers: room.roundResults.answeringPlayers,
      guessingPlayers: room.roundResults.guessingPlayers,
    };
  }

  if (myPlayerId) {
    const myPlayer = room.players[myPlayerId];
    const myTeamObj = myPlayer?.team ? room.teams[myPlayer.team] : null;
    state.me = {
      id: myPlayerId,
      name: myPlayer.name,
      team: myPlayer.team,
      isAdmin: isAdmin,
      isCaptain: !!(myTeamObj && myTeamObj.captainId === myPlayerId),
      hasSubmitted: !!room.answers[myPlayerId],
      myAnswer: room.answers[myPlayerId] || null,
    };
  } else if (isAdmin) {
    state.me = {
      id: null,
      name: 'Quiz Master',
      team: null,
      isAdmin: true,
      isCaptain: false,
      hasSubmitted: false,
      myAnswer: null,
    };
  } else {
    state.me = {
      id: null,
      name: 'Spectator',
      team: null,
      isAdmin: false,
      isCaptain: false,
      hasSubmitted: false,
      myAnswer: null,
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
      s.emit('guess_state', buildPublicState(room, p.socketId));
      sent.add(p.socketId);
    }
  });
  if (room.adminSocketId && !sent.has(room.adminSocketId)) {
    const s = io.sockets.sockets.get(room.adminSocketId);
    if (s) s.emit('guess_state', buildPublicState(room, room.adminSocketId));
  }
}

// ===== Transitions =====
function startReady(io, room) {
  clearRoomTimers(room);
  room.phase = 'ready';
  room.phaseStartedAt = Date.now();
  room.roundNumber = (room.roundNumber || 0) + 1;
  room.answers = {};
  room.roundResults = null;
  room.currentQuestion = null;
  broadcastState(io, room);
  room.readyTimer = setTimeout(() => startQuestion(io, room), READY_TIME_MS);
}

function startQuestion(io, room) {
  clearRoomTimers(room);
  room.phase = 'question';
  room.phaseStartedAt = Date.now();
  room.currentQuestion = getRandomQuestion(room);
  if (!room.usedQuestionIds.includes(room.currentQuestion.id)) {
    room.usedQuestionIds.push(room.currentQuestion.id);
  }
  room.answers = {};
  room.roundResults = null;
  broadcastState(io, room);
  room.questionTimer = setTimeout(() => finalizeQuestion(io, room), QUESTION_TIME_MS);
}

function finalizeQuestion(io, room) {
  if (room.phase !== 'question') return;
  clearRoomTimers(room);

  const answeringTeam = room.answeringTeam;
  const guessingTeam = answeringTeam === 'A' ? 'B' : 'A';
  const answeringPlayers = getTeamPlayers(room, answeringTeam);
  const guessingPlayers = getTeamPlayers(room, guessingTeam);

  const guessMap = new Map();
  for (const p of guessingPlayers) {
    const raw = (room.answers[p.id] || '').toString().trim();
    const norm = normalizeAnswer(raw);
    if (!norm) continue;
    if (!guessMap.has(norm)) guessMap.set(norm, []);
    guessMap.get(norm).push(p.name);
  }

  const teammateMap = new Map();
  for (const p of answeringPlayers) {
    const norm = normalizeAnswer(room.answers[p.id] || '');
    if (!norm) continue;
    if (!teammateMap.has(norm)) teammateMap.set(norm, []);
    teammateMap.get(norm).push(p.id);
  }

  const answeringResults = [];
  let teamPointsThisRound = 0;

  for (const p of answeringPlayers) {
    const raw = (room.answers[p.id] || '').toString().trim();
    const norm = normalizeAnswer(raw);

    let gotPoint = false;
    let trappedBy = [];
    let duplicatedBy = [];
    let reason = null;

    if (norm.length > 0) {
      const teammateIds = teammateMap.get(norm) || [];
      const hasDuplicate = teammateIds.length > 1;

      if (hasDuplicate) {
        duplicatedBy = answeringPlayers
          .filter((tp) => tp.id !== p.id && teammateIds.includes(tp.id))
          .map((tp) => tp.name);
        reason = 'duplicate';
      } else if (guessMap.has(norm)) {
        trappedBy = guessMap.get(norm);
        reason = 'trapped';
      } else {
        gotPoint = true;
        teamPointsThisRound++;
      }
    } else {
      reason = 'empty';
    }

    answeringResults.push({
      playerId: p.id,
      name: p.name,
      answer: raw || '(لم يجب)',
      gotPoint,
      trappedBy,
      duplicatedBy,
      reason,
    });
  }

  const guessingResults = guessingPlayers.map((p) => {
    const raw = (room.answers[p.id] || '').toString().trim();
    const norm = normalizeAnswer(raw);
    const matchedNames = [];
    if (norm.length > 0) {
      for (const ap of answeringPlayers) {
        if (normalizeAnswer(room.answers[ap.id]) === norm) {
          matchedNames.push(ap.name);
        }
      }
    }
    return {
      playerId: p.id,
      name: p.name,
      answer: raw || '(لم يجب)',
      matchedNames,
    };
  });

  room.teams[answeringTeam].score += teamPointsThisRound;

  room.roundResults = {
    answeringTeam,
    guessingTeam,
    answeringPlayers: answeringResults,
    guessingPlayers: guessingResults,
    teamPointsThisRound,
  };

  if (room.teams[answeringTeam].score >= TARGET_SCORE) {
    room.winnerTeam = answeringTeam;
    room.phase = 'gameover';
    room.phaseStartedAt = Date.now();
    broadcastState(io, room);
    return;
  }

  room.phase = 'reveal';
  room.phaseStartedAt = Date.now();
  broadcastState(io, room);

  room.revealTimer = setTimeout(() => nextRound(io, room), REVEAL_TIME_MS);
}

function nextRound(io, room) {
  if (room.phase !== 'reveal') return;
  clearRoomTimers(room);
  room.answeringTeam = room.answeringTeam === 'A' ? 'B' : 'A';
  startReady(io, room);
}

function handleLeave(io, socket, roomCode) {
  const room = guessRooms[roomCode];
  if (!room) return;

  const playerId = Object.keys(room.players).find(
    (pid) => room.players[pid].socketId === socket.id
  );

  if (room.adminSocketId === socket.id) {
    room.adminSocketId = null;
  }

  if (!playerId) {
    broadcastState(io, room);
    return;
  }

  delete room.players[playerId];
  delete room.answers[playerId];

  if (room.teams.A.captainId === playerId) room.teams.A.captainId = null;
  if (room.teams.B.captainId === playerId) room.teams.B.captainId = null;
  if (room.adminPlayerId === playerId) room.adminPlayerId = null;

  if (room.phase === 'question') {
    const totalPlayers = Object.values(room.players).filter((p) => p.team).length;
    const submitted = Object.keys(room.answers).length;
    if (totalPlayers > 0 && submitted >= totalPlayers) {
      finalizeQuestion(io, room);
      return;
    }
    if (totalPlayers === 0) {
      finalizeQuestion(io, room);
      return;
    }
  }

  broadcastState(io, room);
}

// ===== Setup =====
module.exports = function setupGuessOpponent(io) {
  io.on('connection', (socket) => {

    // ✅ انضمام لاعب (أدمن أو عادي)
    socket.on('guess_join', ({ roomCode, playerId, playerName, isAdmin }) => {
      if (!roomCode || !playerId) return;

      if (!guessRooms[roomCode]) {
        guessRooms[roomCode] = createEmptyRoom(roomCode);
      }
      const room = guessRooms[roomCode];
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

      socket.join(`guess_${roomCode}`);
      socket.data.guessRoomCode = roomCode;
      socket.data.guessPlayerId = playerId;

      socket.emit('guess_joined', { roomCode, playerId });
      broadcastState(io, room);
    });

    // ✅ legacy — للأمان لو حد لسه بيبعت الأدمن القديم
    socket.on('guess_admin_join', ({ roomCode }) => {
      if (!roomCode) return;
      if (!guessRooms[roomCode]) guessRooms[roomCode] = createEmptyRoom(roomCode);
      const room = guessRooms[roomCode];
      room.io = io;
      room.adminSocketId = socket.id;
      socket.join(`guess_${roomCode}`);
      socket.data.guessRoomCode = roomCode;
      broadcastState(io, room);
    });

    // ✅ مزامنة قائمة اللاعبين من الأدمن
    socket.on('guess_sync_players', ({ roomCode, players }) => {
      const room = guessRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      let changed = false;
      (players || []).forEach((p) => {
        if (!p || !p.id) return;
        if (!room.playerList[p.id]) {
          room.playerList[p.id] = { id: p.id, name: p.name || 'لاعب' };
          changed = true;
        }
      });
      if (changed) broadcastState(io, room);
    });

    // ===== الأدمن يختار القادة =====
    socket.on('guess_select_captains', ({ roomCode, captainA, captainB }) => {
      const room = guessRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase !== 'lobby') return;

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

    // ===== القائد يغيّر اسم فريقه =====
    socket.on('guess_set_team_name', ({ roomCode, name }) => {
      const room = guessRooms[roomCode];
      if (!room || room.phase !== 'lobby') return;

      const playerId = socket.data.guessPlayerId;
      if (!playerId) return;

      let teamKey = null;
      if (room.teams.A.captainId === playerId) teamKey = 'A';
      else if (room.teams.B.captainId === playerId) teamKey = 'B';
      if (!teamKey) return;

      const clean = (name || '').toString().trim().slice(0, 30);
      if (!clean) {
        socket.emit('guess_error', { message: 'اسم الفريق لا يمكن أن يكون فارغاً' });
        return;
      }

      room.teams[teamKey].name = clean;
      broadcastState(io, room);
    });

    // ===== لاعب ينضم لفريق =====
    socket.on('guess_join_team', ({ roomCode, team }) => {
      const room = guessRooms[roomCode];
      if (!room || room.phase !== 'lobby') return;
      if (team !== 'A' && team !== 'B') return;

      if (!room.teams.A.captainId || !room.teams.B.captainId) {
        socket.emit('guess_error', { message: 'لازم المُيسّر يختار القادة أولاً' });
        return;
      }

      const playerId = socket.data.guessPlayerId;
      if (!playerId || !room.players[playerId]) return;

      if (
        room.teams.A.captainId === playerId ||
        room.teams.B.captainId === playerId
      )
        return;

      room.players[playerId].team = team;
      broadcastState(io, room);
    });

    // ===== لاعب يخرج من الفريق =====
    socket.on('guess_leave_team', ({ roomCode }) => {
      const room = guessRooms[roomCode];
      if (!room || room.phase !== 'lobby') return;

      const playerId = socket.data.guessPlayerId;
      if (!playerId || !room.players[playerId]) return;

      if (
        room.teams.A.captainId === playerId ||
        room.teams.B.captainId === playerId
      )
        return;

      room.players[playerId].team = null;
      broadcastState(io, room);
    });

    // ===== الأدمن يبدأ اللعبة =====
    socket.on('guess_start_game', ({ roomCode }) => {
      const room = guessRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id || room.phase !== 'lobby')
        return;

      const capA = room.teams.A.captainId;
      const capB = room.teams.B.captainId;
      if (!capA || !capB) {
        socket.emit('guess_error', { message: 'لازم تحدد قائدين للفريقين أولاً' });
        return;
      }
      if (getTeamPlayers(room, 'A').length === 0) {
        socket.emit('guess_error', { message: 'الفريق أ لسه فاضي!' });
        return;
      }
      if (getTeamPlayers(room, 'B').length === 0) {
        socket.emit('guess_error', { message: 'الفريق ب لسه فاضي!' });
        return;
      }

      const onlinePlayers = Object.values(room.players);
      const unassigned = onlinePlayers.filter((p) => !p.team);
      if (unassigned.length > 0) {
        socket.emit('guess_error', {
          message: `في ${unassigned.length} لاعب لسه ما انضمش لفريق`,
        });
        return;
      }

      room.roundNumber = 0;
      room.answeringTeam = 'A';
      room.winnerTeam = null;
      room.teams.A.score = 0;
      room.teams.B.score = 0;
      room.usedQuestionIds = [];

      startReady(io, room);
    });

    // ===== إرسال إجابة =====
    socket.on('guess_submit_answer', ({ roomCode, text }) => {
      const room = guessRooms[roomCode];
      if (!room || room.phase !== 'question') return;

      const playerId = socket.data.guessPlayerId;
      if (!playerId || !room.players[playerId]) return;
      const player = room.players[playerId];
      if (!player.team) return;

      if (room.answers[playerId]) return;

      const clean = (text || '').toString().trim().slice(0, 120);
      if (!clean) return;

      room.answers[playerId] = clean;
      broadcastState(io, room);

      const totalPlayers = Object.values(room.players).filter((p) => p.team).length;
      const submitted = Object.keys(room.answers).length;

      if (totalPlayers > 0 && submitted >= totalPlayers) {
        finalizeQuestion(io, room);
      }
    });

    // ===== إعادة تعيين =====
    socket.on('guess_reset_game', ({ roomCode }) => {
      const room = guessRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;

      clearRoomTimers(room);
      room.phase = 'lobby';
      room.phaseStartedAt = Date.now();
      room.roundNumber = 0;
      room.answeringTeam = 'A';
      room.currentQuestion = null;
      room.answers = {};
      room.roundResults = null;
      room.winnerTeam = null;
      room.usedQuestionIds = [];
      room.teams.A.score = 0;
      room.teams.B.score = 0;

      broadcastState(io, room);
    });

    socket.on('guess_leave', ({ roomCode }) => handleLeave(io, socket, roomCode));
    socket.on('disconnect', () => {
      const roomCode = socket.data?.guessRoomCode;
      if (roomCode) handleLeave(io, socket, roomCode);
    });

    // ✅ ✅ ✅ جديد: تنظيف الغرفة لما الأدمن يقفل اللعبة
    socket.on('close_game', ({ roomCode }) => {
      const room = guessRooms[roomCode];
      if (!room) return;
      clearRoomTimers(room);
      delete guessRooms[roomCode];
    });
  });

  console.log('🎭 Guess Opponent Server loaded');
};