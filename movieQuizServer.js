/**
 * ============================================================
 *  movieQuizServer.js — لعبة "فيلم إيه"
 *  ✅ الأدمن بقى لاعب كامل في players[]
 *  ✅ + close_game listener لتنظيف الغرفة
 * ============================================================
 */

const MOVIES = require('./data/movieQuizVideos');

const WATCH_TIME_MS   = 5 * 60 * 1000;
const BUZZ_TIME_MS    = 15000;
const TARGET_SCORE    = 10;
const RESUME_DELAY_MS = 2500;
const CORRECT_HOLD_MS = 5000;

const movieRooms = {};

function createEmptyRoom(roomCode) {
  return {
    roomCode,
    adminSocketId: null,
    adminPlayerId: null,   // ✅ جديد
    players: {},
    phase: 'lobby',
    phaseStartedAt: Date.now(),
    currentVideo: null,
    videoStarted: false,
    usedVideoIds: [],
    buzzerId: null,
    buzzerAnswer: null,
    buzzerResult: null,
    revealedAt: null,
    roundEndsAt: null,
    roundTimeLeft: null,
    buzzStartedAt: null,
    winnerId: null,
    _roundTimer: null,
    _buzzTimer: null,
    _revealTimer: null,
  };
}

function pickVideo(room) {
  let available = MOVIES.filter((m) => !room.usedVideoIds.includes(m.id));
  if (available.length === 0) {
    room.usedVideoIds = [];
    available = MOVIES;
  }
  const video = available[Math.floor(Math.random() * available.length)];
  room.usedVideoIds.push(video.id);
  return video;
}

function clearTimers(room) {
  ['_roundTimer', '_buzzTimer', '_revealTimer'].forEach((k) => {
    if (room[k]) { clearTimeout(room[k]); room[k] = null; }
  });
}

function buildPublicState(room, forSocketId) {
  const me = Object.values(room.players).find((p) => p.socketId === forSocketId);
  const isAdmin = !!(me && me.isAdmin) || room.adminSocketId === forSocketId;

  const showTitle =
    room.buzzerResult === 'revealed' ||
    !!room.revealedAt ||
    (room.phase === 'roundEnd' && room.buzzerResult === 'correct') ||
    room.phase === 'gameover';

  const state = {
    roomCode: room.roomCode,
    phase: room.phase,
    phaseStartedAt: room.phaseStartedAt,
    watchTime: WATCH_TIME_MS,
    buzzTime: BUZZ_TIME_MS,
    targetScore: TARGET_SCORE,
    videoStarted: !!room.videoStarted,
    buzzerId: room.buzzerId,
    buzzerName: room.buzzerId ? room.players[room.buzzerId]?.name || null : null,
    buzzerAnswer: room.buzzerAnswer,
    buzzerResult: room.buzzerResult,
    revealedAt: room.revealedAt,
    roundEndsAt: room.roundEndsAt,
    roundTimeLeft: room.roundTimeLeft,
    buzzStartedAt: room.buzzStartedAt,
    winnerId: room.winnerId,
    winnerName: room.winnerId ? room.players[room.winnerId]?.name || null : null,
    players: Object.values(room.players)
      .map((p) => ({ id: p.id, name: p.name, score: p.score, isAdmin: !!p.isAdmin }))
      .sort((a, b) => b.score - a.score),
    availableMovies: MOVIES.map((m) => ({ id: m.id, title: m.title })),
  };

  if (
    room.currentVideo &&
    (room.phase === 'playing' ||
      room.phase === 'buzzed' ||
      room.phase === 'roundEnd')
  ) {
    state.video = {
      id: room.currentVideo.id,
      videoUrl: room.currentVideo.videoUrl,
      title: showTitle ? room.currentVideo.title : null,
    };
  }

  // ✅ me — الأدمن بقى جزء من players
  if (me) {
    state.me = {
      id: me.id,
      name: me.name,
      isAdmin: !!me.isAdmin,
      score: me.score,
      isBuzzer: room.buzzerId === me.id,
      canReveal: !!me.isAdmin,   // alias للتوافق مع الفرونت
    };
  } else {
    // spectator — نادرًا بيحصل دلوقتي
    state.me = {
      id: null,
      name: 'Spectator',
      isAdmin: false,
      score: 0,
      isBuzzer: false,
      canReveal: false,
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
      s.emit('mq_state', buildPublicState(room, p.socketId));
      sent.add(p.socketId);
    }
  });
  // Fallback للأدمن لو مش موجود في players (legacy)
  if (room.adminSocketId && !sent.has(room.adminSocketId)) {
    const s = io.sockets.sockets.get(room.adminSocketId);
    if (s) s.emit('mq_state', buildPublicState(room, room.adminSocketId));
  }
}

// ============================================================
// Flow
// ============================================================
function startRound(io, room) {
  clearTimers(room);
  room.phase = 'playing';
  room.phaseStartedAt = Date.now();
  room.videoStarted = false;
  room.buzzerId = null;
  room.buzzerAnswer = null;
  room.buzzerResult = null;
  room.revealedAt = null;
  room.roundTimeLeft = null;
  room.roundEndsAt = null;
  room.buzzStartedAt = null;
  room.currentVideo = pickVideo(room);
  broadcastState(io, room);
}

function handlePlayVideo(io, room) {
  if (room.phase !== 'playing') return;
  if (room.videoStarted) return;

  room.videoStarted = true;
  room.phaseStartedAt = Date.now();
  room.roundEndsAt = Date.now() + WATCH_TIME_MS;
  broadcastState(io, room);

  room._roundTimer = setTimeout(() => handleRoundTimeout(io, room), WATCH_TIME_MS);
}

function handleRoundTimeout(io, room) {
  if (room.phase !== 'playing') return;
  if (!room.videoStarted) return;
  clearTimers(room);
  room.phase = 'roundEnd';
  room.phaseStartedAt = Date.now();
  room.roundTimeLeft = 0;
  room.roundEndsAt = null;
  room.buzzerResult = 'timeout';
  broadcastState(io, room);
}

function handleBuzz(io, room, playerId) {
  if (room.phase !== 'playing') return;
  if (!room.videoStarted) return;
  if (!room.players[playerId]) return;

  clearTimers(room);

  const remaining = Math.max(0, (room.roundEndsAt || Date.now()) - Date.now());
  room.roundTimeLeft = remaining;

  room.buzzerId = playerId;
  room.buzzerAnswer = null;
  room.buzzerResult = null;
  room.revealedAt = null;
  room.phase = 'buzzed';
  room.phaseStartedAt = Date.now();
  room.buzzStartedAt = Date.now();

  broadcastState(io, room);
  room._buzzTimer = setTimeout(() => handleBuzzTimeout(io, room), BUZZ_TIME_MS);
}

function handleBuzzTimeout(io, room) {
  if (room.phase !== 'buzzed') return;
  applyAnswer(io, room, null, 'timeout');
}

function handleSubmitAnswer(io, room, movieId, movieTitle) {
  if (room.phase !== 'buzzed') return;
  if (room.buzzerAnswer) return;

  const video = room.currentVideo;
  if (!video) return;

  room.buzzerAnswer = { movieId, movieTitle };

  if (room._buzzTimer) { clearTimeout(room._buzzTimer); room._buzzTimer = null; }

  const isCorrect = movieId === video.id;
  applyAnswer(io, room, room.buzzerAnswer, isCorrect ? 'correct' : 'wrong');
}

function applyAnswer(io, room, answer, result) {
  clearTimers(room);

  const buzzer = room.players[room.buzzerId];
  if (!buzzer) {
    room.buzzerId = null;
    room.buzzerAnswer = null;
    room.buzzerResult = null;
    room.revealedAt = null;
    room.phase = 'playing';
    room.buzzStartedAt = null;
    if (room.roundTimeLeft > 0) {
      room.roundEndsAt = Date.now() + room.roundTimeLeft;
      room._roundTimer = setTimeout(() => handleRoundTimeout(io, room), room.roundTimeLeft);
    }
    broadcastState(io, room);
    return;
  }

  room.buzzerResult = result;

  if (result === 'correct') {
    buzzer.score += 1;

    if (buzzer.score >= TARGET_SCORE) {
      room.winnerId = buzzer.id;
      room.phase = 'gameover';
      room.phaseStartedAt = Date.now();
      room.buzzStartedAt = null;
      broadcastState(io, room);
      return;
    }

    room.phase = 'roundEnd';
    room.phaseStartedAt = Date.now();
    room.buzzStartedAt = null;
    broadcastState(io, room);
    room._revealTimer = setTimeout(() => {
      if (room.phase === 'roundEnd') startRound(io, room);
    }, CORRECT_HOLD_MS);
  } else {
    if (result !== 'skip') buzzer.score -= 1;

    room.phase = 'roundEnd';
    room.phaseStartedAt = Date.now();
    room.buzzStartedAt = null;
    broadcastState(io, room);

    room._revealTimer = setTimeout(() => {
      if (room.phase !== 'roundEnd') return;
      room.buzzerId = null;
      room.buzzerAnswer = null;
      room.buzzerResult = null;
      room.revealedAt = null;
      room.phase = 'playing';
      room.phaseStartedAt = Date.now();
      if (room.roundTimeLeft > 0) {
        room.roundEndsAt = Date.now() + room.roundTimeLeft;
        room._roundTimer = setTimeout(() => handleRoundTimeout(io, room), room.roundTimeLeft);
      } else {
        handleRoundTimeout(io, room);
        return;
      }
      broadcastState(io, room);
    }, RESUME_DELAY_MS);
  }
}

function handleLeave(io, socket, roomCode) {
  const room = movieRooms[roomCode];
  if (!room) return;

  let changed = false;

  // ✅ لو الأدمن خرج، نشيل adminSocketId
  if (room.adminSocketId === socket.id) {
    room.adminSocketId = null;
    changed = true;
  }

  const playerId = Object.keys(room.players).find(
    (pid) => room.players[pid].socketId === socket.id
  );
  if (playerId) {
    if (room.buzzerId === playerId && room.phase === 'buzzed') {
      clearTimers(room);
      room.buzzerId = null;
      room.buzzerAnswer = null;
      room.buzzerResult = null;
      room.phase = 'playing';
      if (room.roundTimeLeft > 0) {
        room.roundEndsAt = Date.now() + room.roundTimeLeft;
        room._roundTimer = setTimeout(() => handleRoundTimeout(io, room), room.roundTimeLeft);
      } else {
        room.phase = 'roundEnd';
      }
    }
    delete room.players[playerId];
    if (room.adminPlayerId === playerId) room.adminPlayerId = null;
    changed = true;
  }

  if (Object.keys(room.players).length === 0 && !room.adminSocketId) {
    clearTimers(room);
    delete movieRooms[roomCode];
    return;
  }

  if (changed) broadcastState(io, room);
}

// ============================================================
// Setup
// ============================================================
module.exports = function setupMovieQuiz(io) {
  io.on('connection', (socket) => {

    // ✅ انضمام لاعب (أدمن أو عادي) — بنفس الحدث
    socket.on('mq_join', ({ roomCode, playerId, playerName, isAdmin }) => {
      if (!roomCode || !playerId) return;
      if (!movieRooms[roomCode]) movieRooms[roomCode] = createEmptyRoom(roomCode);
      const room = movieRooms[roomCode];

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
          id: playerId,
          socketId: socket.id,
          name: playerName || 'لاعب',
          score: 0,
          isAdmin: !!isAdmin,
        };
      }

      socket.join(`mq_${roomCode}`);
      socket.data.mqRoomCode = roomCode;
      socket.data.mqPlayerId = playerId;

      socket.emit('mq_joined', { roomCode, playerId });
      broadcastState(io, room);
    });

    // ✅ legacy — للأمان (لو تاب قديم لسه بستخدمه)
    socket.on('mq_admin_join', ({ roomCode }) => {
      if (!roomCode) return;
      if (!movieRooms[roomCode]) movieRooms[roomCode] = createEmptyRoom(roomCode);
      const room = movieRooms[roomCode];
      room.adminSocketId = socket.id;
      socket.join(`mq_${roomCode}`);
      socket.data.mqRoomCode = roomCode;
      broadcastState(io, room);
    });

    socket.on('mq_start', ({ roomCode }) => {
      const room = movieRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase !== 'lobby') return;
      if (Object.keys(room.players).length === 0) {
        socket.emit('mq_error', { message: 'مفيش لاعبين في الغرفة' });
        return;
      }
      room.usedVideoIds = [];
      Object.values(room.players).forEach((p) => { p.score = 0; });
      room.winnerId = null;
      startRound(io, room);
    });

    // ✅ Play video — أي حد
    socket.on('mq_play_video', ({ roomCode }) => {
      const room = movieRooms[roomCode];
      if (!room) return;
      handlePlayVideo(io, room);
    });

    socket.on('mq_next_round', ({ roomCode }) => {
      const room = movieRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase !== 'roundEnd') return;
      startRound(io, room);
    });

    socket.on('mq_buzz', ({ roomCode }) => {
      const room = movieRooms[roomCode];
      if (!room) return;
      const playerId = socket.data.mqPlayerId;
      if (!playerId) return;
      handleBuzz(io, room, playerId);
    });

    socket.on('mq_submit_answer', ({ roomCode, movieId, movieTitle }) => {
      const room = movieRooms[roomCode];
      if (!room) return;
      const playerId = socket.data.mqPlayerId;
      if (!playerId) return;
      if (playerId !== room.buzzerId) return;
      handleSubmitAnswer(io, room, movieId, movieTitle);
    });

    socket.on('mq_reveal_answer', ({ roomCode }) => {
      const room = movieRooms[roomCode];
      if (!room) return;
      if (room.adminSocketId !== socket.id) return;
      if (room.phase === 'lobby' || room.phase === 'gameover') return;
      if (!room.currentVideo) return;

      clearTimers(room);
      room.revealedAt = Date.now();
      room.buzzerId = null;
      room.buzzerAnswer = null;
      room.buzzerResult = 'revealed';
      room.phase = 'roundEnd';
      room.phaseStartedAt = Date.now();
      room.buzzStartedAt = null;
      broadcastState(io, room);
    });

    socket.on('mq_skip_buzz', ({ roomCode }) => {
      const room = movieRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase !== 'buzzed') return;
      applyAnswer(io, room, null, 'skip');
    });

    socket.on('mq_end_game', ({ roomCode }) => {
      const room = movieRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      clearTimers(room);
      let best = -1;
      let winnerId = null;
      Object.values(room.players).forEach((p) => {
        if (p.score > best) { best = p.score; winnerId = p.id; }
      });
      room.winnerId = winnerId;
      room.phase = 'gameover';
      room.phaseStartedAt = Date.now();
      broadcastState(io, room);
    });

    socket.on('mq_reset', ({ roomCode }) => {
      const room = movieRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      clearTimers(room);
      room.phase = 'lobby';
      room.phaseStartedAt = Date.now();
      room.videoStarted = false;
      room.currentVideo = null;
      room.buzzerId = null;
      room.buzzerAnswer = null;
      room.buzzerResult = null;
      room.revealedAt = null;
      room.roundEndsAt = null;
      room.roundTimeLeft = null;
      room.buzzStartedAt = null;
      room.winnerId = null;
      room.usedVideoIds = [];
      Object.values(room.players).forEach((p) => { p.score = 0; });
      broadcastState(io, room);
    });

    socket.on('mq_leave', ({ roomCode }) => handleLeave(io, socket, roomCode));
    socket.on('disconnect', () => {
      const roomCode = socket.data?.mqRoomCode;
      if (roomCode) handleLeave(io, socket, roomCode);
    });

    // ✅ تنظيف الغرفة عند إغلاق اللعبة
    socket.on('close_game', ({ roomCode }) => {
      const room = movieRooms[roomCode];
      if (!room) return;
      clearTimers(room);
      delete movieRooms[roomCode];
    });
  });

  console.log('🎬 Movie Quiz Server loaded');
};