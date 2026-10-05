/**
 * ============================================================
 *  trapOpponentServer.js — لعبة "البس خصمك"
 *  ✅ الأدمن بقى لاعب كامل — يقدر يكون قائد أو عضو فريق عادي
 * ============================================================
 */

const QUESTIONS = require('./data/trapOpponentQuestions');

const TARGET_SCORE     = 10;
const READY_TIME_MS    = 1800;
const PREVIEW_TIME_MS  = 7000;
const WRITING_TIME_MS  = 20000;
const REVEAL_TIME_MS   = 5000;
const DICE_RESULT_MS   = 2000;

const trapRooms = {};

// ===== Helpers =====
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getTeamPlayers(room, team) {
  return Object.values(room.players).filter((p) => p.team === team);
}

function getRandomQuestion(room) {
  const available = QUESTIONS.filter((q) => !room.usedQuestionIds.includes(q.id));
  const pool = available.length > 0 ? available : QUESTIONS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function clearRoomTimers(room) {
  ['readyTimer', 'previewTimer', 'writingTimer', 'revealTimer', 'diceTimer'].forEach((k) => {
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
    phase: 'lobby',
    phaseStartedAt: Date.now(),
    roundNumber: 0,
    currentAnsweringTeam: null,
    currentQuestion: null,
    currentAnswers: null,
    correctIndex: null,
    chosenAnswerIndex: null,
    roundWinnerTeam: null,
    winnerTeam: null,
    dice: { A: null, B: null },
    diceResultRevealed: false,
    playerAnswers: {},
    usedQuestionIds: [],
    readyTimer: null,
    previewTimer: null,
    writingTimer: null,
    revealTimer: null,
    diceTimer: null,
  };
}

function buildPublicState(room, forSocketId) {
  const isAdmin = room.adminSocketId === forSocketId;
  const me = isAdmin
    ? Object.values(room.players).find((p) => p.socketId === forSocketId)
    : Object.values(room.players).find((p) => p.socketId === forSocketId);
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
      preview: PREVIEW_TIME_MS,
      writing: WRITING_TIME_MS,
      reveal: REVEAL_TIME_MS,
      dice: DICE_RESULT_MS,
    },
    targetScore: TARGET_SCORE,
    currentAnsweringTeam: room.currentAnsweringTeam,
    winnerTeam: room.winnerTeam,
    roundNumber: room.roundNumber || 0,
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
    dice: { A: room.dice.A, B: room.dice.B },
    diceResultRevealed: !!room.diceResultRevealed,
    allPlayers: Object.values(room.playerList).map((p) => {
      const online = Object.values(room.players).find((rp) => rp.id === p.id);
      return {
        id: p.id,
        name: p.name,
        team: online?.team || null,
        isCaptain:
          p.id === room.teams.A.captainId || p.id === room.teams.B.captainId,
        isOnline: !!online,
        isAdmin: p.id === room.adminPlayerId,   // ✅ جديد
      };
    }),
  };

  if (room.currentQuestion) {
    state.currentQuestion = {
      id: room.currentQuestion.id,
      question: room.currentQuestion.question,
    };
  }

  if (
    (room.phase === 'choosing' ||
      room.phase === 'reveal' ||
      room.phase === 'gameover') &&
    Array.isArray(room.currentAnswers)
  ) {
    state.currentAnswers = room.currentAnswers.map((a) => ({
      text: a.text,
      authorName:
        room.phase === 'reveal' || room.phase === 'gameover'
          ? a.authorName
          : null,
      isSystem: a.authorName === 'النظام',
    }));
  }

  if (room.phase === 'reveal' || room.phase === 'gameover') {
    state.correctIndex = room.correctIndex;
    state.chosenAnswerIndex = room.chosenAnswerIndex;
    state.roundWinnerTeam = room.roundWinnerTeam;
  }

  if (room.phase === 'writing') {
    const answeringTeam = room.currentAnsweringTeam;
    const otherTeam = answeringTeam === 'A' ? 'B' : 'A';
    const otherPlayers = getTeamPlayers(room, otherTeam);
    const submitted = otherPlayers.filter((p) => room.playerAnswers[p.id]).length;
    state.submissionProgress = { submitted, total: otherPlayers.length };
  }

  // ✅ me — لو الأدمن داخل كلاعب، بنديه بيانات اللاعب + فلاج الأدمن
  if (myPlayerId) {
    const myPlayer = room.players[myPlayerId];
    const myTeamObj = myPlayer?.team ? room.teams[myPlayer.team] : null;
    state.me = {
      id: myPlayerId,
      name: myPlayer.name,
      team: myPlayer.team,
      isAdmin: isAdmin,   // ✅ الأدمن لسه أدمن وكمان لاعب
      isCaptain: !!(myTeamObj && myTeamObj.captainId === myPlayerId),
      hasSubmittedAnswer: !!room.playerAnswers[myPlayerId],
    };
  } else if (isAdmin) {
    // أدمن قديم — لسه مش في players (fallback)
    state.me = {
      id: null,
      name: 'Quiz Master',
      team: null,
      isAdmin: true,
      isCaptain: false,
      hasSubmittedAnswer: false,
    };
  } else {
    state.me = {
      id: null,
      name: 'Spectator',
      team: null,
      isAdmin: false,
      isCaptain: false,
      hasSubmittedAnswer: false,
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
      s.emit('trap_state', buildPublicState(room, p.socketId));
      sent.add(p.socketId);
    }
  });
  if (room.adminSocketId && !sent.has(room.adminSocketId)) {
    const s = io.sockets.sockets.get(room.adminSocketId);
    if (s) s.emit('trap_state', buildPublicState(room, room.adminSocketId));
  }
}

// ===== Transitions (same as before) =====
function startReady(io, room) {
  clearRoomTimers(room);
  room.phase = 'ready';
  room.phaseStartedAt = Date.now();
  room.roundNumber = (room.roundNumber || 0) + 1;
  room.dice = { A: null, B: null };
  room.diceResultRevealed = false;
  broadcastState(io, room);
  room.readyTimer = setTimeout(() => startPreview(io, room), READY_TIME_MS);
}

function startPreview(io, room) {
  clearRoomTimers(room);
  room.phase = 'preview';
  room.phaseStartedAt = Date.now();
  room.currentQuestion = getRandomQuestion(room);
  if (!room.usedQuestionIds.includes(room.currentQuestion.id)) {
    room.usedQuestionIds.push(room.currentQuestion.id);
  }
  room.currentAnswers = null;
  room.correctIndex = null;
  room.chosenAnswerIndex = null;
  room.roundWinnerTeam = null;
  room.playerAnswers = {};

  broadcastState(io, room);
  room.previewTimer = setTimeout(() => startWriting(io, room), PREVIEW_TIME_MS);
}

function startWriting(io, room) {
  clearRoomTimers(room);
  room.phase = 'writing';
  room.phaseStartedAt = Date.now();
  room.playerAnswers = {};
  broadcastState(io, room);
  room.writingTimer = setTimeout(() => finalizeWriting(io, room), WRITING_TIME_MS);
}

function finalizeWriting(io, room) {
  if (room.phase !== 'writing') return;
  clearRoomTimers(room);

  const answeringTeam = room.currentAnsweringTeam;
  const otherTeam = answeringTeam === 'A' ? 'B' : 'A';
  const otherPlayers = getTeamPlayers(room, otherTeam);
  const correctText = room.currentQuestion.correctAnswer;
  const correctKey = correctText.toLowerCase().trim();

  const seen = new Set();
  const misleading = [];

  for (const p of otherPlayers) {
    const text = (room.playerAnswers[p.id] || '').trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (key === correctKey) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    misleading.push({
      text,
      authorId: p.id,
      authorName: p.name,
      isCorrect: false,
    });
  }

  const correctOption = {
    text: correctText,
    authorId: null,
    authorName: null,
    isCorrect: true,
  };

  if (misleading.length === 0) {
    room.currentAnswers = [correctOption];
    room.correctIndex = 0;
    room.chosenAnswerIndex = 0;
    room.roundWinnerTeam = answeringTeam;
    room.teams[answeringTeam].score += 1;
    room.phase = 'reveal';
    room.phaseStartedAt = Date.now();

    if (room.teams[answeringTeam].score >= TARGET_SCORE) {
      room.winnerTeam = answeringTeam;
      room.phase = 'gameover';
      broadcastState(io, room);
      return;
    }

    broadcastState(io, room);
    room.revealTimer = setTimeout(() => {
      room.currentAnsweringTeam = answeringTeam === 'A' ? 'B' : 'A';
      startReady(io, room);
    }, REVEAL_TIME_MS);
    return;
  }

  const allOptions = [...misleading, correctOption];
  const shuffled = shuffle(allOptions);
  room.currentAnswers = shuffled;
  room.correctIndex = shuffled.findIndex((a) => a.isCorrect === true);
  room.chosenAnswerIndex = null;
  room.phase = 'choosing';
  room.phaseStartedAt = Date.now();

  broadcastState(io, room);
}

function handleAnswerChoice(io, room, chosenIndex) {
  if (room.phase !== 'choosing') return;
  if (chosenIndex < 0 || chosenIndex >= room.currentAnswers.length) return;

  room.chosenAnswerIndex = chosenIndex;
  room.phase = 'reveal';
  room.phaseStartedAt = Date.now();

  const isCorrect = chosenIndex === room.correctIndex;
  const answeringTeam = room.currentAnsweringTeam;

  if (isCorrect) {
    room.teams[answeringTeam].score += 1;
    room.roundWinnerTeam = answeringTeam;
  } else {
    room.roundWinnerTeam = null;
  }

  if (room.teams[answeringTeam].score >= TARGET_SCORE) {
    room.winnerTeam = answeringTeam;
    room.phase = 'gameover';
    broadcastState(io, room);
    return;
  }

  broadcastState(io, room);

  room.revealTimer = setTimeout(() => {
    room.currentAnsweringTeam = room.currentAnsweringTeam === 'A' ? 'B' : 'A';
    startReady(io, room);
  }, REVEAL_TIME_MS);
}

function handleLeave(io, socket, roomCode) {
  const room = trapRooms[roomCode];
  if (!room) return;

  const playerId = Object.keys(room.players).find(
    (pid) => room.players[pid].socketId === socket.id
  );

  // ✅ لو الأدمن خرج، نشيل adminSocketId (بس مش نوقف)
  if (room.adminSocketId === socket.id) {
    room.adminSocketId = null;
  }

  if (!playerId) {
    broadcastState(io, room);
    return;
  }

  // ✅ شيل اللاعب (سواء أدمن أو عادي)
  delete room.players[playerId];
  delete room.playerAnswers[playerId];

  if (room.teams.A.captainId === playerId) room.teams.A.captainId = null;
  if (room.teams.B.captainId === playerId) room.teams.B.captainId = null;
  if (room.adminPlayerId === playerId) room.adminPlayerId = null;

  if (room.phase === 'writing') {
    const answeringTeam = room.currentAnsweringTeam;
    const otherTeam = answeringTeam === 'A' ? 'B' : 'A';
    const otherPlayers = getTeamPlayers(room, otherTeam);
    const allDone =
      otherPlayers.length > 0 &&
      otherPlayers.every((p) => room.playerAnswers[p.id]);
    if (allDone || otherPlayers.length === 0) {
      finalizeWriting(io, room);
      return;
    }
  }

  broadcastState(io, room);
}

// ===== Setup =====
module.exports = function setupTrapOpponent(io) {
  io.on('connection', (socket) => {

    // ✅ انضمام لاعب (أدمن أو عادي)
    socket.on('trap_join', ({ roomCode, playerId, playerName, isAdmin }) => {
      if (!roomCode || !playerId) return;

      if (!trapRooms[roomCode]) {
        trapRooms[roomCode] = createEmptyRoom(roomCode);
      }
      const room = trapRooms[roomCode];
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

      socket.join(`trap_${roomCode}`);
      socket.data.trapRoomCode = roomCode;
      socket.data.trapPlayerId = playerId;

      socket.emit('trap_joined', { roomCode, playerId });
      broadcastState(io, room);
    });

    // ✅ legacy — للأمان لو حد لسه بيبعت الأدمن القديم
    socket.on('trap_admin_join', ({ roomCode }) => {
      if (!roomCode) return;
      if (!trapRooms[roomCode]) trapRooms[roomCode] = createEmptyRoom(roomCode);
      const room = trapRooms[roomCode];
      room.io = io;
      room.adminSocketId = socket.id;
      socket.join(`trap_${roomCode}`);
      socket.data.trapRoomCode = roomCode;
      broadcastState(io, room);
    });

    // ✅ مزامنة قائمة اللاعبين من الأدمن (بس معلومات)
    socket.on('trap_sync_players', ({ roomCode, players }) => {
      const room = trapRooms[roomCode];
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
    socket.on('trap_select_captains', ({ roomCode, captainA, captainB }) => {
      const room = trapRooms[roomCode];
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

    // ===== لاعب ينضم لفريق =====
    socket.on('trap_join_team', ({ roomCode, team }) => {
      const room = trapRooms[roomCode];
      if (!room || room.phase !== 'lobby') return;
      if (team !== 'A' && team !== 'B') return;

      if (!room.teams.A.captainId || !room.teams.B.captainId) {
        socket.emit('trap_error', { message: 'لازم المُيسّر يختار القادة أولاً' });
        return;
      }

      const playerId = socket.data.trapPlayerId;
      if (!playerId || !room.players[playerId]) return;

      if (
        room.teams.A.captainId === playerId ||
        room.teams.B.captainId === playerId
      )
        return;

      room.players[playerId].team = team;
      broadcastState(io, room);
    });

    // ===== القائد يغيّر اسم فريقه =====
    socket.on('trap_set_team_name', ({ roomCode, name }) => {
      const room = trapRooms[roomCode];
      if (!room || room.phase !== 'lobby') return;

      const playerId = socket.data.trapPlayerId;
      if (!playerId) return;

      let teamKey = null;
      if (room.teams.A.captainId === playerId) teamKey = 'A';
      else if (room.teams.B.captainId === playerId) teamKey = 'B';
      if (!teamKey) return;

      const clean = (name || '').toString().trim().slice(0, 30);
      if (!clean) {
        socket.emit('trap_error', { message: 'اسم الفريق لا يمكن أن يكون فارغاً' });
        return;
      }

      room.teams[teamKey].name = clean;
      broadcastState(io, room);
    });

    // ===== لاعب يخرج من الفريق =====
    socket.on('trap_leave_team', ({ roomCode }) => {
      const room = trapRooms[roomCode];
      if (!room || room.phase !== 'lobby') return;

      const playerId = socket.data.trapPlayerId;
      if (!playerId || !room.players[playerId]) return;

      if (
        room.teams.A.captainId === playerId ||
        room.teams.B.captainId === playerId
      )
        return;

      room.players[playerId].team = null;
      broadcastState(io, room);
    });

    // ===== الأدمن يبدأ النرد =====
    socket.on('trap_start_dice', ({ roomCode }) => {
      const room = trapRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id || room.phase !== 'lobby')
        return;

      const capA = room.teams.A.captainId;
      const capB = room.teams.B.captainId;
      if (!capA || !capB) {
        socket.emit('trap_error', { message: 'لازم تحدد قائدين للفريقين أولاً' });
        return;
      }
      if (getTeamPlayers(room, 'A').length === 0) {
        socket.emit('trap_error', { message: 'الفريق أ لسه فاضي!' });
        return;
      }
      if (getTeamPlayers(room, 'B').length === 0) {
        socket.emit('trap_error', { message: 'الفريق ب لسه فاضي!' });
        return;
      }

      const onlinePlayers = Object.values(room.players);
      const unassigned = onlinePlayers.filter((p) => !p.team);
      if (unassigned.length > 0) {
        socket.emit('trap_error', {
          message: `في ${unassigned.length} لاعب لسه ما انضمش لفريق`,
        });
        return;
      }

      room.phase = 'dice';
      room.phaseStartedAt = Date.now();
      room.dice = { A: null, B: null };
      room.diceResultRevealed = false;
      broadcastState(io, room);
    });

    // ===== القائد يرمي النرد =====
    socket.on('trap_roll_dice', ({ roomCode }) => {
      const room = trapRooms[roomCode];
      if (!room || room.phase !== 'dice') return;

      const playerId = socket.data.trapPlayerId;
      if (!playerId) return;

      let team = null;
      if (room.teams.A.captainId === playerId) team = 'A';
      else if (room.teams.B.captainId === playerId) team = 'B';
      if (!team) return;
      if (room.dice[team] !== null) return;

      const value = Math.floor(Math.random() * 6) + 1;
      room.dice[team] = value;

      io.to(`trap_${roomCode}`).emit('trap_dice_rolling', { team, value });

      broadcastState(io, room);

      if (room.dice.A !== null && room.dice.B !== null) {
        clearTimeout(room.diceTimer);

        const ANIMATION_MS = 1200;

        room.diceTimer = setTimeout(() => {
          if (room.phase !== 'dice') return;

          if (room.dice.A === room.dice.B) {
            room.diceResultRevealed = true;
            broadcastState(io, room);

            room.diceTimer = setTimeout(() => {
              if (room.phase !== 'dice') return;
              room.dice = { A: null, B: null };
              room.diceResultRevealed = false;
              broadcastState(io, room);
            }, 1800);
          } else {
            const startingTeam = room.dice.A > room.dice.B ? 'A' : 'B';
            room.currentAnsweringTeam = startingTeam;
            room.diceResultRevealed = true;
            broadcastState(io, room);

            room.diceTimer = setTimeout(() => {
              if (room.phase !== 'dice') return;
              startReady(io, room);
            }, 2200);
          }
        }, ANIMATION_MS);
      }
    });

    // ===== الفريق الخصم يبعت إجابة =====
    socket.on('trap_submit_answer', ({ roomCode, text }) => {
      const room = trapRooms[roomCode];
      if (!room || room.phase !== 'writing') return;

      const playerId = socket.data.trapPlayerId;
      if (!playerId || !room.players[playerId]) return;
      const player = room.players[playerId];

      const answeringTeam = room.currentAnsweringTeam;
      const otherTeam = answeringTeam === 'A' ? 'B' : 'A';
      if (player.team !== otherTeam) return;

      const clean = (text || '').toString().trim().slice(0, 100);
      if (!clean) return;

      room.playerAnswers[playerId] = clean;
      broadcastState(io, room);

      const otherPlayers = getTeamPlayers(room, otherTeam);
      const submittedCount = otherPlayers.filter(
        (p) => room.playerAnswers[p.id]
      ).length;

      if (otherPlayers.length > 0 && submittedCount >= otherPlayers.length) {
        finalizeWriting(io, room);
      }
    });

    // ===== قائد الفريق اللي بيجاوب يختار =====
    socket.on('trap_choose_answer', ({ roomCode, answerIndex }) => {
      const room = trapRooms[roomCode];
      if (!room || room.phase !== 'choosing') return;

      const playerId = socket.data.trapPlayerId;
      if (!playerId || !room.players[playerId]) return;
      const player = room.players[playerId];

      const answeringTeam = room.currentAnsweringTeam;
      if (player.team !== answeringTeam) return;

      const teamPlayers = getTeamPlayers(room, answeringTeam);
      const captainId = room.teams[answeringTeam].captainId;

      const captainPlayer = room.players[captainId];
      const captainOnline =
        captainPlayer && io.sockets.sockets.get(captainPlayer.socketId);

      const isCaptain = captainId === playerId;
      const isFallback = !captainOnline && teamPlayers[0]?.id === playerId;
      const isOnlyOne = teamPlayers.length === 1;

      if (!isCaptain && !isFallback && !isOnlyOne) {
        socket.emit('trap_error', {
          message: 'فقط قائد الفريق يمكنه اختيار الإجابة',
        });
        return;
      }

      handleAnswerChoice(io, room, answerIndex);
    });

    // ===== إعادة تعيين =====
    socket.on('trap_reset_game', ({ roomCode }) => {
      const room = trapRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;

      clearRoomTimers(room);
      room.phase = 'lobby';
      room.phaseStartedAt = Date.now();
      room.roundNumber = 0;
      room.currentAnsweringTeam = null;
      room.currentQuestion = null;
      room.currentAnswers = null;
      room.correctIndex = null;
      room.chosenAnswerIndex = null;
      room.roundWinnerTeam = null;
      room.winnerTeam = null;
      room.dice = { A: null, B: null };
      room.diceResultRevealed = false;
      room.playerAnswers = {};
      room.usedQuestionIds = [];
      room.teams.A.score = 0;
      room.teams.B.score = 0;

      broadcastState(io, room);
    });

    socket.on('trap_leave', ({ roomCode }) => handleLeave(io, socket, roomCode));
    socket.on('disconnect', () => {
      const roomCode = socket.data?.trapRoomCode;
      if (roomCode) handleLeave(io, socket, roomCode);
    });

    // ✅ ضيف ده هنا
    socket.on('close_game', ({ roomCode }) => {
      const room = trapRooms[roomCode];
      if (!room) return;
      clearRoomTimers(room);
      delete trapRooms[roomCode];
    });
  });

  console.log('🎯 Trap Opponent Server loaded');
};