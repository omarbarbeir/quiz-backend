/**
 * ============================================================
 *  tabooServer.js — لعبة "الكلمات الممنوعة"
 *  ✅ الأدمن بقى لاعب كامل في players[]
 *  ✅ + close_game listener لتنظيف الغرفة
 * ============================================================
 */

const WORDS = require('./data/tabooWords');

const TURN_DURATION_MS = 60000;
const REVIEW_DURATION_MS = 5000;
const PASSES_PER_TURN = 2;
const MAX_CHAT = 200;

const CARDS_PER_TURN = {
  easy: 6,
  medium: 4,
  hard: 3,
};

const TURNS = [
  { difficulty: 'easy', team: 'red' },
  { difficulty: 'easy', team: 'blue' },
  { difficulty: 'medium', team: 'red' },
  { difficulty: 'medium', team: 'blue' },
  { difficulty: 'hard', team: 'red' },
  { difficulty: 'hard', team: 'blue' },
];

const DIFFICULTY_LABEL = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب',
};

const tabooRooms = {};

// ============================================================
// Helpers
// ============================================================
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createEmptyRoom(roomCode) {
  return {
    roomCode,
    adminSocketId: null,
    adminPlayerId: null,   // ✅ جديد
    players: {},
    phase: 'lobby',
    phaseStartedAt: Date.now(),
    turnIndex: 0,
    currentTeam: null,
    currentDifficulty: null,
    currentDescriberId: null,
    currentCard: null,
    usedCards: [],
    passesLeft: PASSES_PER_TURN,
    turnCards: [],
    cardsRemainingInTurn: 0,
    cardsTotalInTurn: 0,
    scores: { red: 0, blue: 0 },
    cheatEvents: [],
    chat: [],
    _turnTimer: null,
    _reviewTimer: null,
  };
}

function getPlayer(room, socketId) {
  return Object.values(room.players).find((p) => p.socketId === socketId);
}

function getTeamPlayers(room, team) {
  return Object.values(room.players).filter((p) => p.team === team);
}

function pickRandomCard(room, difficulty) {
  const bank = WORDS[difficulty] || [];
  const available = bank.filter(
    (c) => !room.usedCards.some((u) => u.difficulty === difficulty && u.word === c.word)
  );
  const pool = available.length > 0 ? available : bank;
  const card = pool[Math.floor(Math.random() * pool.length)];
  return { ...card };
}

function pickDescriber(room, team) {
  const teamPlayers = getTeamPlayers(room, team).filter((p) => p.socketId);
  if (teamPlayers.length === 0) return null;
  const chosen = teamPlayers[Math.floor(Math.random() * teamPlayers.length)];
  return chosen.id;
}

function clearTimers(room) {
  if (room._turnTimer) { clearTimeout(room._turnTimer); room._turnTimer = null; }
  if (room._reviewTimer) { clearTimeout(room._reviewTimer); room._reviewTimer = null; }
}

function buildPublicState(room, forSocketId) {
  const me = getPlayer(room, forSocketId);
  const isAdmin = !!(me && me.isAdmin) || room.adminSocketId === forSocketId;
  const isDescriber = !!(me && room.currentDescriberId === me.id);

  // ✅ الكارت بيتشاف للراوي بس — حتى لو أدمن
  const canSeeCard = isDescriber;

  const state = {
    roomCode: room.roomCode,
    phase: room.phase,
    phaseStartedAt: room.phaseStartedAt,
    turnIndex: room.turnIndex,
    totalTurns: TURNS.length,
    currentTeam: room.currentTeam,
    currentDifficulty: room.currentDifficulty,
    currentDifficultyLabel: room.currentDifficulty ? DIFFICULTY_LABEL[room.currentDifficulty] : null,
    currentDescriberId: room.currentDescriberId,
    currentDescriberName: room.currentDescriberId
      ? room.players[room.currentDescriberId]?.name || null
      : null,
    scores: room.scores,
    passesLeft: room.passesLeft,
    turnCards: room.turnCards,
    cardsRemainingInTurn: room.cardsRemainingInTurn,
    cardsTotalInTurn: room.cardsTotalInTurn,
    players: Object.values(room.players).map((p) => ({
      id: p.id,
      name: p.name,
      team: p.team,
      isAdmin: !!p.isAdmin,
    })),
    chat: room.chat.slice(-MAX_CHAT).filter((m) => {
      if (m.channel === 'general') return true;
      if (isAdmin) return true;
      if (!me) return false;
      return m.channel === me.team;
    }),
    cheatEvents: room.cheatEvents.slice(-5),
  };

  if (canSeeCard && room.currentCard) {
    state.currentCard = room.currentCard;
  }

  // ✅ me — الأدمن بقى جزء من players
  if (me) {
    state.me = {
      id: me.id,
      name: me.name,
      isAdmin: !!me.isAdmin,
      team: me.team,
      isDescriber: !!isDescriber,
    };
  } else {
    state.me = { id: null, name: 'Spectator', isAdmin: false, team: null, isDescriber: false };
  }

  return state;
}

function broadcast(io, room) {
  const sent = new Set();
  Object.values(room.players).forEach((p) => {
    if (sent.has(p.socketId)) return;
    const s = io.sockets.sockets.get(p.socketId);
    if (s) {
      s.emit('tb_state', buildPublicState(room, p.socketId));
      sent.add(p.socketId);
    }
  });
  // Fallback للأدمن لو مش موجود في players (legacy)
  if (room.adminSocketId && !sent.has(room.adminSocketId)) {
    const s = io.sockets.sockets.get(room.adminSocketId);
    if (s) s.emit('tb_state', buildPublicState(room, room.adminSocketId));
  }
}

// ============================================================
// Flow
// ============================================================
function startTurn(io, room) {
  clearTimers(room);
  const turn = TURNS[room.turnIndex];
  if (!turn) {
    endGame(io, room);
    return;
  }

  room.currentTeam = turn.team;
  room.currentDifficulty = turn.difficulty;
  room.currentDescriberId = pickDescriber(room, turn.team);
  room.passesLeft = PASSES_PER_TURN;
  room.turnCards = [];

  room.cardsTotalInTurn = CARDS_PER_TURN[turn.difficulty] || 4;
  room.cardsRemainingInTurn = room.cardsTotalInTurn;

  if (!room.currentDescriberId) {
    room.turnIndex++;
    if (room.turnIndex >= TURNS.length) {
      endGame(io, room);
    } else {
      startTurn(io, room);
    }
    return;
  }

  room.currentCard = pickRandomCard(room, turn.difficulty);
  room.usedCards.push({ difficulty: turn.difficulty, word: room.currentCard.word });

  room.phase = 'playing';
  room.phaseStartedAt = Date.now();
  broadcast(io, room);

  room._turnTimer = setTimeout(() => endTurn(io, room), TURN_DURATION_MS);
}

function endTurn(io, room) {
  if (room.phase !== 'playing') return;
  clearTimers(room);
  room.phase = 'reviewing';
  room.phaseStartedAt = Date.now();
  room.currentCard = null;
  broadcast(io, room);

  room._reviewTimer = setTimeout(() => {
    if (room.phase !== 'reviewing') return;
    room.turnIndex++;
    if (room.turnIndex >= TURNS.length) {
      endGame(io, room);
    } else {
      startTurn(io, room);
    }
  }, REVIEW_DURATION_MS);
}

function endGame(io, room) {
  clearTimers(room);
  room.phase = 'gameEnd';
  room.phaseStartedAt = Date.now();
  room.currentCard = null;
  room.currentDescriberId = null;
  broadcast(io, room);
}

function handleCorrect(io, room, playerId) {
  if (room.phase !== 'playing') return;
  if (playerId !== room.currentDescriberId) return;
  if (!room.currentCard) return;

  const now = Date.now();
  if (room._lastCorrectAt && now - room._lastCorrectAt < 500) return;
  room._lastCorrectAt = now;

  const currentWord = room.currentCard.word;
  room.scores[room.currentTeam] += 1;
  room.turnCards.push({ word: currentWord, result: 'correct' });
  room.cardsRemainingInTurn -= 1;

  if (room.cardsRemainingInTurn <= 0) {
    endTurn(io, room);
    return;
  }

  room.currentCard = pickRandomCard(room, room.currentDifficulty);
  room.usedCards.push({ difficulty: room.currentDifficulty, word: room.currentCard.word });

  broadcast(io, room);
}

function handlePass(io, room, playerId) {
  if (room.phase !== 'playing') return;
  if (playerId !== room.currentDescriberId) return;
  if (room.passesLeft <= 0) return;
  if (!room.currentCard) return;

  const now = Date.now();
  if (room._lastPassAt && now - room._lastPassAt < 500) return;
  room._lastPassAt = now;

  const currentWord = room.currentCard.word;
  room.passesLeft -= 1;
  room.turnCards.push({ word: currentWord, result: 'passed' });
  room.cardsRemainingInTurn -= 1;

  if (room.cardsRemainingInTurn <= 0) {
    endTurn(io, room);
    return;
  }

  room.currentCard = pickRandomCard(room, room.currentDifficulty);
  room.usedCards.push({ difficulty: room.currentDifficulty, word: room.currentCard.word });

  broadcast(io, room);
}

function handleCheat(io, room, accuserId) {
  if (room.phase !== 'playing') return;
  const accuser = room.players[accuserId];
  if (!accuser) return;

  // الفريق الخصم (أو لاعب مفيش فريق) بس — لو أدمن في نفس الفريق مش هيقدر يتهم
  if (accuser.team === room.currentTeam) return;

  const describer = room.players[room.currentDescriberId];
  const describerName = describer?.name || '???';
  const accuserName = accuser.name;

  room.scores[room.currentTeam] = Math.max(0, room.scores[room.currentTeam] - 1);

  room.cheatEvents.push({
    accuserName,
    describerName,
    team: room.currentTeam,
    at: Date.now(),
  });

  endTurn(io, room);
}

function handleLeave(io, socket, roomCode) {
  const room = tabooRooms[roomCode];
  if (!room) return;

  // ✅ لو الأدمن خرج، نشيل adminSocketId
  if (room.adminSocketId === socket.id) {
    room.adminSocketId = null;
  }

  const playerId = Object.keys(room.players).find(
    (pid) => room.players[pid].socketId === socket.id
  );
  if (!playerId) {
    broadcast(io, room);
    return;
  }

  if (room.adminPlayerId === playerId) room.adminPlayerId = null;

  if (room.currentDescriberId === playerId && room.phase === 'playing') {
    delete room.players[playerId];
    endTurn(io, room);
  } else {
    delete room.players[playerId];
    broadcast(io, room);
  }

  if (Object.keys(room.players).length === 0 && !room.adminSocketId) {
    clearTimers(room);
    delete tabooRooms[roomCode];
  }
}

// ============================================================
// Setup
// ============================================================
module.exports = function setupTaboo(io) {
  io.on('connection', (socket) => {

    // ✅ انضمام لاعب (أدمن أو عادي) — بنفس الحدث
    socket.on('tb_join', ({ roomCode, playerId, playerName, isAdmin }) => {
      if (!roomCode || !playerId) return;
      if (!tabooRooms[roomCode]) tabooRooms[roomCode] = createEmptyRoom(roomCode);
      const room = tabooRooms[roomCode];

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
          team: null,
          isAdmin: !!isAdmin,
        };
      }

      socket.join(`tb_${roomCode}`);
      socket.data.tbRoomCode = roomCode;
      socket.data.tbPlayerId = playerId;

      socket.emit('tb_joined', { roomCode, playerId });
      broadcast(io, room);
    });

    // ✅ legacy — للأمان
    socket.on('tb_admin_join', ({ roomCode }) => {
      if (!roomCode) return;
      if (!tabooRooms[roomCode]) tabooRooms[roomCode] = createEmptyRoom(roomCode);
      const room = tabooRooms[roomCode];
      room.adminSocketId = socket.id;
      socket.join(`tb_${roomCode}`);
      socket.data.tbRoomCode = roomCode;
      socket.data.tbIsAdmin = true;
      broadcast(io, room);
    });

    socket.on('tb_select_team', ({ roomCode, team }) => {
      const room = tabooRooms[roomCode];
      if (!room || room.phase !== 'lobby') return;
      if (team !== 'red' && team !== 'blue') return;
      const playerId = socket.data.tbPlayerId;
      const player = room.players[playerId];
      if (!player) return;
      player.team = team;
      broadcast(io, room);
    });

    socket.on('tb_leave_team', ({ roomCode }) => {
      const room = tabooRooms[roomCode];
      if (!room || room.phase !== 'lobby') return;
      const playerId = socket.data.tbPlayerId;
      const player = room.players[playerId];
      if (!player) return;
      player.team = null;
      broadcast(io, room);
    });

    socket.on('tb_start', ({ roomCode }) => {
      const room = tabooRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase !== 'lobby') return;

      const redCount = getTeamPlayers(room, 'red').length;
      const blueCount = getTeamPlayers(room, 'blue').length;

      if (redCount < 2) {
        socket.emit('tb_error', { message: 'الفريق الأحمر محتاج لاعبين على الأقل' });
        return;
      }
      if (blueCount < 2) {
        socket.emit('tb_error', { message: 'الفريق الأزرق محتاج لاعبين على الأقل' });
        return;
      }

      room.turnIndex = 0;
      room.scores = { red: 0, blue: 0 };
      room.usedCards = [];
      room.chat = [];
      room.cheatEvents = [];
      startTurn(io, room);
    });

    socket.on('tb_correct', ({ roomCode }) => {
      const room = tabooRooms[roomCode];
      if (!room) return;
      handleCorrect(io, room, socket.data.tbPlayerId);
    });

    socket.on('tb_pass', ({ roomCode }) => {
      const room = tabooRooms[roomCode];
      if (!room) return;
      handlePass(io, room, socket.data.tbPlayerId);
    });

    socket.on('tb_cheat', ({ roomCode }) => {
      const room = tabooRooms[roomCode];
      if (!room) return;
      handleCheat(io, room, socket.data.tbPlayerId);
    });

    socket.on('tb_chat_send', ({ roomCode, text, channel }) => {
      const room = tabooRooms[roomCode];
      if (!room) return;

      const player = getPlayer(room, socket.id);
      if (!player) return;

      const isAdmin = room.adminSocketId === socket.id;

      const clean = (text || '').toString().trim().slice(0, 200);
      if (!clean) return;

      const validChannels = ['general', 'red', 'blue'];
      if (!validChannels.includes(channel)) return;

      // الأدمن عنده صلاحية في أي قناة، باقي اللاعبين في فريقهم بس
      if (channel === 'red' && !isAdmin && player.team !== 'red') return;
      if (channel === 'blue' && !isAdmin && player.team !== 'blue') return;

      const msg = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        playerId: player.id,
        playerName: player.name,
        team: player.team,
        isAdmin: !!player.isAdmin,
        isDescriber: room.currentDescriberId === player.id,
        text: clean,
        channel,
        timestamp: Date.now(),
      };

      room.chat.push(msg);
      if (room.chat.length > MAX_CHAT) room.chat = room.chat.slice(-MAX_CHAT);

      broadcast(io, room);
    });

    socket.on('tb_force_end_turn', ({ roomCode }) => {
      const room = tabooRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase !== 'playing') return;
      endTurn(io, room);
    });

    socket.on('tb_reset', ({ roomCode }) => {
      const room = tabooRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      clearTimers(room);
      room.phase = 'lobby';
      room.phaseStartedAt = Date.now();
      room.turnIndex = 0;
      room.currentTeam = null;
      room.currentDifficulty = null;
      room.currentDescriberId = null;
      room.currentCard = null;
      room.usedCards = [];
      room.passesLeft = PASSES_PER_TURN;
      room.turnCards = [];
      room.cardsRemainingInTurn = 0;
      room.cardsTotalInTurn = 0;
      room.scores = { red: 0, blue: 0 };
      room.cheatEvents = [];
      room.chat = [];
      broadcast(io, room);
    });

    socket.on('tb_leave', ({ roomCode }) => handleLeave(io, socket, roomCode));
    socket.on('disconnect', () => {
      const roomCode = socket.data?.tbRoomCode;
      if (roomCode) handleLeave(io, socket, roomCode);
    });

    // ✅ تنظيف الغرفة عند إغلاق اللعبة
    socket.on('close_game', ({ roomCode }) => {
      const room = tabooRooms[roomCode];
      if (!room) return;
      clearTimers(room);
      delete tabooRooms[roomCode];
    });
  });

  console.log('🚫 Taboo Server loaded');
};