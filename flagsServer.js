// flagsServer.js
const flagsData = require('./data/flagsData');

const uniqueAnswers = [...new Set(flagsData.map(f => f.answer))];

// ═══════════════════════════════════════════
//  normalize + isMatch
// ═══════════════════════════════════════════
function normalize(str) {
  if (!str) return '';
  let s = str.toString().replace(/[\u064B-\u065F\u0670\u0640]/g, '');
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code === 0x0622 || code === 0x0623 || code === 0x0625 ||
        code === 0x0671 || code === 0x0672 || code === 0x0673) {
      out += '\u0627';
    } else if (code === 0x0649) {
      out += '\u064A';
    } else if (code === 0x0629) {
      out += '\u0647';
    } else if (code === 0x0624) {
      out += '\u0648';
    } else if (code === 0x0626 || code === 0x0621) {
      // skip
    } else if (code >= 0x0600 && code <= 0x06FF) {
      out += s[i];
    } else if ((code >= 0x0041 && code <= 0x005A) ||
               (code >= 0x0061 && code <= 0x007A) ||
               (code >= 0x0030 && code <= 0x0039)) {
      out += s[i].toLowerCase();
    }
  }
  return out;
}

function isMatch(playerText, answerText) {
  const nP = normalize(playerText);
  const nA = normalize(answerText);
  if (!nP || !nA) return false;
  if (nP === nA) return true;
  if (nP.length < 3) return false;
  if (nA.includes(nP)) return true;
  return false;
}

function pickRandomFlag(room) {
  if (!room.flagsPlayedIds) room.flagsPlayedIds = [];
  let available = flagsData
    .map((f, i) => ({ ...f, _idx: i }))
    .filter(f => !room.flagsPlayedIds.includes(f._idx));
  if (available.length === 0) {
    room.flagsPlayedIds = [];
    available = flagsData.map((f, i) => ({ ...f, _idx: i }));
  }
  const pick = available[Math.floor(Math.random() * available.length)];
  room.flagsPlayedIds.push(pick._idx);
  return pick;
}

function buildQuestion(item) {
  return {
    id: `flag_${Date.now()}`,
    category: 'flags-game',
    image: item.image,
    answer: item.answer,
    revealed: false,
    answeredCorrectly: false,
    allAnswers: uniqueAnswers,
  };
}

function setupFlagsServer(socket, io, rooms) {

  // ═══════════════════════════════════════════
  //  بدء اللعبة (استعد — بدون علم)
  // ═══════════════════════════════════════════
  socket.on('flags_start', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player?.isAdmin) return;   // ✅

    if (room.currentQuestion?.category === 'flags-game') {
      io.to(roomCode).emit('question_changed', room.currentQuestion);
      io.to(roomCode).emit('reset_buzzer');
      return;
    }

    room.flagsPlayedIds = [];
    room.activePlayer = null;
    room.buzzerLocked = false;

    room.currentQuestion = {
      id: `flags_init_${Date.now()}`,
      category: 'flags-game',
      image: null,
      answer: null,
      revealed: false,
      answeredCorrectly: false,
      allAnswers: uniqueAnswers,
    };

    io.to(roomCode).emit('question_changed', room.currentQuestion);
    io.to(roomCode).emit('reset_buzzer');
  });

  // ═══════════════════════════════════════════
  //  كشف العلم
  // ═══════════════════════════════════════════
  socket.on('flags_reveal', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player?.isAdmin) return;   // ✅

    if (room.currentQuestion?.image) {
      room.currentQuestion = { ...room.currentQuestion, revealed: true };
      io.to(roomCode).emit('question_changed', room.currentQuestion);
      return;
    }

    const item = pickRandomFlag(room);
    room.activePlayer = null;
    room.buzzerLocked = false;
    room.currentQuestion = buildQuestion(item);

    io.to(roomCode).emit('question_changed', room.currentQuestion);
    io.to(roomCode).emit('reset_buzzer');
  });

  // ═══════════════════════════════════════════
  //  العلم التالي → استعد
  // ═══════════════════════════════════════════
  socket.on('flags_next', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player?.isAdmin) return;   // ✅

    room.activePlayer = null;
    room.buzzerLocked = false;

    room.currentQuestion = {
      id: `flags_init_${Date.now()}`,
      category: 'flags-game',
      image: null,
      answer: null,
      revealed: false,
      answeredCorrectly: false,
      allAnswers: uniqueAnswers,
    };

    io.to(roomCode).emit('question_changed', room.currentQuestion);
    io.to(roomCode).emit('reset_buzzer');
  });

  // ═══════════════════════════════════════════
  //  إرسال إجابة
  // ═══════════════════════════════════════════
  socket.on('flags_submit', ({ roomCode, playerId, answer }) => {
    const room = rooms[roomCode];
    if (!room || !room.currentQuestion) return;
    if (room.activePlayer !== playerId) return;
    if (!room.currentQuestion.answer) return;
    if (room.currentQuestion.answeredCorrectly) return; // ✅ مقفول

    const correct = isMatch(answer, room.currentQuestion.answer);
    const player = room.players.find(p => p.id === playerId);

    room.activePlayer = null;
    room.buzzerLocked = false;

    if (correct && player) {
      player.score = (player.score || 0) + 1;
      // ✅ اقفل السؤال
      room.currentQuestion = { ...room.currentQuestion, answeredCorrectly: true };
      io.to(roomCode).emit('question_changed', room.currentQuestion);
      io.to(roomCode).emit('update_score', player);
      io.to(roomCode).emit('update_players', room.players);
      io.to(roomCode).emit('reset_buzzer');
      io.to(roomCode).emit('flags_correct', {
        playerId,
        playerName: player.name,
      });
    } else {
      if (player) {
        player.score = (player.score || 0) - 1;
        io.to(roomCode).emit('update_score', player);
        io.to(roomCode).emit('update_players', room.players);
      }
      io.to(roomCode).emit('reset_buzzer');
      io.to(roomCode).emit('flags_wrong', {
        playerId,
        playerName: player?.name || '',
      });
    }
  });

  // ═══════════════════════════════════════════
  //  كشف الإجابة
  // ═══════════════════════════════════════════
  socket.on('flags_reveal_answer', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || !room.currentQuestion) return;
    if (!room.currentQuestion.answer) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player?.isAdmin) return;   // ✅

    room.activePlayer = null;
    room.buzzerLocked = false;
    // ✅ اقفل السؤال برضه لما الأدمن يكشف الإجابة
    room.currentQuestion = { ...room.currentQuestion, answeredCorrectly: true };

    io.to(roomCode).emit('question_changed', room.currentQuestion);
    io.to(roomCode).emit('reset_buzzer');
    io.to(roomCode).emit('flags_answer_revealed', {
      answer: room.currentQuestion.answer,
    });
  });

  socket.on('close_game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    room.currentQuestion = null;
    room.activePlayer = null;
    room.buzzerLocked = false;
    room.flagsPlayedIds = [];
  });
}

module.exports = setupFlagsServer;