/**
 * ============================================================
 *  codenamesServer.js — لعبة "كلمة السر"
 *  ✅ الأدمن بقى لاعب كامل في players[]
 *  ✅ + close_game listener لتنظيف الغرفة
 * ============================================================
 */

const WORDS = require('./data/codenamesWords');

const STARTING_TEAM_WORDS = 9;
const OTHER_TEAM_WORDS = 8;
const NEUTRAL_WORDS = 7;
const ASSASSIN = 1;
const MAX_CHAT = 200;

// ✅ Helper — احسب عدد كلمات فريق معين
function getTeamWordCount(room, team) {
  if (!room.firstTeam) return OTHER_TEAM_WORDS;
  return room.firstTeam === team ? STARTING_TEAM_WORDS : OTHER_TEAM_WORDS;
}

const codenamesRooms = {};

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

function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ًٌٍَُِّْـ]/g, '')
    .replace(/[^\w\s\u0600-\u06FF]/g, '')
    .replace(/\s+/g, ' ');
}

function createEmptyRoom(roomCode) {
  return {
    roomCode,
    adminSocketId: null,
    adminPlayerId: null,   // ✅ جديد
    players: {},
    phase: 'lobby',
    phaseStartedAt: Date.now(),
    board: [],
    teams: {
      red:  { captainId: null },
      blue: { captainId: null },
    },
    currentTeam: null,
    hint: null,
    guessesLeft: 0,
    firstTeam: null,
    winner: null,
    chat: [],
  };
}

function generateBoard(firstTeam) {
  const words = shuffle(WORDS).slice(0, 25);
  const redCount  = firstTeam === 'red'  ? STARTING_TEAM_WORDS : OTHER_TEAM_WORDS;
  const blueCount = firstTeam === 'blue' ? STARTING_TEAM_WORDS : OTHER_TEAM_WORDS;
  const colors = [
    ...Array(redCount).fill('red'),
    ...Array(blueCount).fill('blue'),
    ...Array(NEUTRAL_WORDS).fill('neutral'),
    ...Array(ASSASSIN).fill('assassin'),
  ];
  const shuffledColors = shuffle(colors);
  return words.map((word, i) => ({
    word,
    color: shuffledColors[i],
    revealed: false,
  }));
}

function getPlayerBySocket(room, socketId) {
  return Object.values(room.players).find((p) => p.socketId === socketId);
}

function countWordsLeft(room, team) {
  return room.board.filter((c) => c.color === team && !c.revealed).length;
}

function buildPublicState(room, forSocketId) {
  const me = getPlayerBySocket(room, forSocketId);
  const isAdmin = !!(me && me.isAdmin) || room.adminSocketId === forSocketId;

  // ✅ الأدمن مش بيشوف الألوان تلقائيًا — زي أي لاعب، الكابتن بس هو اللي يشوف
  const canSeeColors = !!(me && me.isCaptain);

  const state = {
    roomCode: room.roomCode,
    phase: room.phase,
    phaseStartedAt: room.phaseStartedAt,
    players: Object.values(room.players).map((p) => ({
      id: p.id,
      name: p.name,
      team: p.team,
      isCaptain: p.isCaptain,
      isAdmin: !!p.isAdmin,
    })),
    board: room.board.map((cell, i) => ({
      index: i,
      word: cell.word,
      color: canSeeColors || cell.revealed ? cell.color : null,
      revealed: cell.revealed,
    })),
    currentTeam: room.currentTeam,
    firstTeam: room.firstTeam,
    hint: room.hint,
    guessesLeft: room.guessesLeft,

    teams: {
      red: {
        captainId: room.teams.red.captainId,
        wordsLeft: countWordsLeft(room, 'red'),
        totalWords: getTeamWordCount(room, 'red'),
      },
      blue: {
        captainId: room.teams.blue.captainId,
        wordsLeft: countWordsLeft(room, 'blue'),
        totalWords: getTeamWordCount(room, 'blue'),
      },
    },

    winner: room.winner,
    chat: room.chat.slice(-MAX_CHAT).filter((m) => {
      if (m.channel === 'general') return true;
      if (isAdmin) return true;
      if (!me) return false;
      return m.channel === me.team;
    }),
  };

  // ✅ me — الأدمن بقى جزء من players
  if (me) {
    state.me = {
      id: me.id,
      name: me.name,
      isAdmin: !!me.isAdmin,
      isCaptain: !!me.isCaptain,
      team: me.team,
      canSeeColors: !!me.isCaptain,
    };
  } else {
    state.me = {
      id: null,
      name: 'Spectator',
      isAdmin: false,
      isCaptain: false,
      team: null,
      canSeeColors: false,
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
      s.emit('cn_state', buildPublicState(room, p.socketId));
      sent.add(p.socketId);
    }
  });
  // Fallback للأدمن لو مش موجود في players (legacy)
  if (room.adminSocketId && !sent.has(room.adminSocketId)) {
    const s = io.sockets.sockets.get(room.adminSocketId);
    if (s) s.emit('cn_state', buildPublicState(room, room.adminSocketId));
  }
}

function switchTurn(room) {
  room.currentTeam = room.currentTeam === 'red' ? 'blue' : 'red';
  room.hint = null;
  room.guessesLeft = 0;
}

function handleLeave(io, socket, roomCode) {
  const room = codenamesRooms[roomCode];
  if (!room) return;

  let changed = false;

  // ✅ لو الأدمن خرج، نشيل adminSocketId
  if (room.adminSocketId === socket.id) {
    room.adminSocketId = null;
    changed = true;
  }

  // ✅ نشيل اللاعب (سواء أدمن أو عادي) من players
  const playerId = Object.keys(room.players).find(
    (pid) => room.players[pid].socketId === socket.id
  );
  if (playerId) {
    const player = room.players[playerId];

    // لو كان كابتن، شيل الكابتنية
    if (room.teams.red.captainId === playerId) room.teams.red.captainId = null;
    if (room.teams.blue.captainId === playerId) room.teams.blue.captainId = null;

    delete room.players[playerId];
    if (room.adminPlayerId === playerId) room.adminPlayerId = null;
    changed = true;

    // لو كان دوره الحالي، اقلب الدور
    if (room.phase === 'playing' && player.team === room.currentTeam) {
      const teamCount = Object.values(room.players).filter((p) => p.team === player.team).length;
      if (teamCount === 0) {
        switchTurn(room);
      }
    }
  }

  // لو الغرفة فضيت
  if (Object.keys(room.players).length === 0 && !room.adminSocketId) {
    delete codenamesRooms[roomCode];
    return;
  }

  if (changed) broadcastState(io, room);
}

// ============================================================
// Setup
// ============================================================
module.exports = function setupCodenames(io) {
  io.on('connection', (socket) => {

    // ✅ انضمام لاعب (أدمن أو عادي) — بنفس الحدث
    socket.on('cn_join', ({ roomCode, playerId, playerName, isAdmin }) => {
      if (!roomCode || !playerId) return;
      if (!codenamesRooms[roomCode]) codenamesRooms[roomCode] = createEmptyRoom(roomCode);
      const room = codenamesRooms[roomCode];

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
          isCaptain: false,
          isAdmin: !!isAdmin,
        };
      }

      socket.join(`cn_${roomCode}`);
      socket.data.cnRoomCode = roomCode;
      socket.data.cnPlayerId = playerId;

      socket.emit('cn_joined', { roomCode, playerId });
      broadcastState(io, room);
    });

    // ✅ legacy — للأمان
    socket.on('cn_admin_join', ({ roomCode }) => {
      if (!roomCode) return;
      if (!codenamesRooms[roomCode]) codenamesRooms[roomCode] = createEmptyRoom(roomCode);
      const room = codenamesRooms[roomCode];
      room.adminSocketId = socket.id;
      socket.join(`cn_${roomCode}`);
      socket.data.cnRoomCode = roomCode;
      socket.data.cnIsAdmin = true;
      broadcastState(io, room);
    });

    // ===== اختيار الفريق =====
    socket.on('cn_select_team', ({ roomCode, team }) => {
      const room = codenamesRooms[roomCode];
      if (!room || room.phase !== 'lobby') return;
      if (team !== 'red' && team !== 'blue') return;

      const playerId = socket.data.cnPlayerId;
      const player = room.players[playerId];
      if (!player) return;

      // لو كان كابتن في فريق تاني، شيله
      if (room.teams.red.captainId === playerId && team !== 'red') {
        room.teams.red.captainId = null;
        player.isCaptain = false;
      }
      if (room.teams.blue.captainId === playerId && team !== 'blue') {
        room.teams.blue.captainId = null;
        player.isCaptain = false;
      }

      player.team = team;
      broadcastState(io, room);
    });

    // ===== خروج من فريق =====
    socket.on('cn_leave_team', ({ roomCode }) => {
      const room = codenamesRooms[roomCode];
      if (!room || room.phase !== 'lobby') return;
      const playerId = socket.data.cnPlayerId;
      const player = room.players[playerId];
      if (!player) return;

      if (room.teams.red.captainId === playerId) room.teams.red.captainId = null;
      if (room.teams.blue.captainId === playerId) room.teams.blue.captainId = null;

      player.team = null;
      player.isCaptain = false;
      broadcastState(io, room);
    });

    // ===== تعيين كابتن (الأدمن) =====
    socket.on('cn_set_captain', ({ roomCode, playerId, team }) => {
      const room = codenamesRooms[roomCode];
      if (!room || room.phase !== 'lobby') return;
      if (room.adminSocketId !== socket.id) return;
      if (team !== 'red' && team !== 'blue') return;

      const player = room.players[playerId];
      if (!player) return;
      if (player.team !== team) return;

      const oldCaptainId = room.teams[team].captainId;
      if (oldCaptainId && room.players[oldCaptainId]) {
        room.players[oldCaptainId].isCaptain = false;
      }

      player.isCaptain = true;
      room.teams[team].captainId = playerId;

      broadcastState(io, room);
    });

    // ===== إزالة كابتن =====
    socket.on('cn_remove_captain', ({ roomCode, team }) => {
      const room = codenamesRooms[roomCode];
      if (!room || room.phase !== 'lobby') return;
      if (room.adminSocketId !== socket.id) return;

      const captainId = room.teams[team].captainId;
      if (captainId && room.players[captainId]) {
        room.players[captainId].isCaptain = false;
      }
      room.teams[team].captainId = null;
      broadcastState(io, room);
    });

    // ===== بدء اللعبة (الأدمن) =====
    socket.on('cn_start', ({ roomCode }) => {
      const room = codenamesRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase !== 'lobby') return;

      const redTeam = Object.values(room.players).filter((p) => p.team === 'red');
      const blueTeam = Object.values(room.players).filter((p) => p.team === 'blue');

      if (redTeam.length < 2) {
        socket.emit('cn_error', { message: 'الفريق الأحمر لازم يكون فيه كابتن + لاعب على الأقل' });
        return;
      }
      if (blueTeam.length < 2) {
        socket.emit('cn_error', { message: 'الفريق الأزرق لازم يكون فيه كابتن + لاعب على الأقل' });
        return;
      }
      if (!room.teams.red.captainId || !room.teams.blue.captainId) {
        socket.emit('cn_error', { message: 'لازم تحدد كابتن لكل فريق' });
        return;
      }

      const firstTeam = Math.random() < 0.5 ? 'red' : 'blue';
      room.firstTeam = firstTeam;
      room.currentTeam = firstTeam;
      room.board = generateBoard(firstTeam);

      room.phase = 'playing';
      room.phaseStartedAt = Date.now();
      room.hint = null;
      room.guessesLeft = 0;
      room.winner = null;

      console.log(`🎲 First team: ${firstTeam} (red: ${firstTeam === 'red' ? 9 : 8}, blue: ${firstTeam === 'blue' ? 9 : 8})`);

      broadcastState(io, room);
    });

    // ===== إرسال تلميح (الكابتن بس) =====
    socket.on('cn_submit_hint', ({ roomCode, word, number }) => {
      const room = codenamesRooms[roomCode];
      if (!room || room.phase !== 'playing') return;

      const playerId = socket.data.cnPlayerId;
      const player = room.players[playerId];
      if (!player || !player.isCaptain) return;
      if (player.team !== room.currentTeam) return;
      if (room.hint) return;

      const clean = (word || '').toString().trim().slice(0, 30);
      if (!clean) return;

      const num = Math.max(1, Math.min(9, parseInt(number) || 1));

      const wordExists = room.board.some(
        (c) => normalize(c.word) === normalize(clean)
      );
      if (wordExists) {
        socket.emit('cn_error', { message: 'الكلمة موجودة على اللوحة — اختار كلمة تانية' });
        return;
      }

      room.hint = { word: clean, number: num, byTeam: room.currentTeam };
      room.guessesLeft = num + 1;

      broadcastState(io, room);
    });

    // ===== تخمين كلمة (لاعب عادي — مش الكابتن) =====
    socket.on('cn_guess', ({ roomCode, index }) => {
      const room = codenamesRooms[roomCode];
      if (!room || room.phase !== 'playing') return;
      if (!room.hint) {
        socket.emit('cn_error', { message: 'مستني تلميح من الكابتن' });
        return;
      }

      const playerId = socket.data.cnPlayerId;
      const player = room.players[playerId];
      if (!player) return;
      if (player.team !== room.currentTeam) return;
      if (player.isCaptain) return;

      if (room.guessesLeft <= 0) {
        socket.emit('cn_error', { message: 'خلصت التخمينات' });
        return;
      }

      const idx = parseInt(index, 10);
      if (isNaN(idx) || idx < 0 || idx >= room.board.length) return;

      const cell = room.board[idx];
      if (cell.revealed) return;

      cell.revealed = true;
      room.guessesLeft--;

      if (cell.color === room.currentTeam) {
        const remaining = countWordsLeft(room, room.currentTeam);
        if (remaining === 0) {
          room.winner = room.currentTeam;
          room.phase = 'ended';
          room.phaseStartedAt = Date.now();
          broadcastState(io, room);
          return;
        }
        if (room.guessesLeft <= 0) {
          switchTurn(room);
        }
      } else if (cell.color === 'assassin') {
        room.winner = room.currentTeam === 'red' ? 'blue' : 'red';
        room.phase = 'ended';
        room.phaseStartedAt = Date.now();
        broadcastState(io, room);
        return;
      } else {
        switchTurn(room);
      }

      broadcastState(io, room);
    });

    // ===== إنهاء الدور يدويًا =====
    socket.on('cn_end_turn', ({ roomCode }) => {
      const room = codenamesRooms[roomCode];
      if (!room || room.phase !== 'playing') return;
      if (!room.hint) return;

      const playerId = socket.data.cnPlayerId;
      const player = room.players[playerId];
      if (!player) return;
      if (player.team !== room.currentTeam) return;
      if (player.isCaptain) return;

      switchTurn(room);
      broadcastState(io, room);
    });

    // ===== الشات =====
    socket.on('cn_chat_send', ({ roomCode, text, channel }) => {
      const room = codenamesRooms[roomCode];
      if (!room) return;

      const player = getPlayerBySocket(room, socket.id);
      if (!player) return;

      const isAdmin = room.adminSocketId === socket.id;

      const clean = (text || '').toString().trim().slice(0, 200);
      if (!clean) return;

      const validChannels = ['general', 'red', 'blue'];
      if (!validChannels.includes(channel)) return;

      // فحص الصلاحيات — الأدمن عنده صلاحية يبعت في أي قناة
      if (channel === 'red' && !isAdmin && player.team !== 'red') return;
      if (channel === 'blue' && !isAdmin && player.team !== 'blue') return;

      const msg = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        playerId: player.id,
        playerName: player.name,
        team: player.team,
        isCaptain: player.isCaptain,
        isAdmin: !!player.isAdmin,
        text: clean,
        channel,
        timestamp: Date.now(),
      };

      room.chat.push(msg);
      if (room.chat.length > MAX_CHAT) {
        room.chat = room.chat.slice(-MAX_CHAT);
      }

      broadcastState(io, room);
    });

    // ===== إعادة تعيين =====
    socket.on('cn_reset', ({ roomCode }) => {
      const room = codenamesRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;

      room.phase = 'lobby';
      room.phaseStartedAt = Date.now();
      room.board = [];
      room.hint = null;
      room.guessesLeft = 0;
      room.winner = null;
      room.currentTeam = null;
      room.firstTeam = null;
      room.chat = [];

      broadcastState(io, room);
    });

    socket.on('cn_leave', ({ roomCode }) => handleLeave(io, socket, roomCode));
    socket.on('disconnect', () => {
      const roomCode = socket.data?.cnRoomCode;
      if (roomCode) handleLeave(io, socket, roomCode);
    });

    // ✅ تنظيف الغرفة عند إغلاق اللعبة
    socket.on('close_game', ({ roomCode }) => {
      const room = codenamesRooms[roomCode];
      if (!room) return;
      delete codenamesRooms[roomCode];
    });
  });

  console.log('🎯 Codenames Server loaded');
};