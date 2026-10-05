// whoSaidServer.js
const whoSaidData = require('./data/whoSaidData');

const uniqueAnswers = [...new Set(whoSaidData.map(x => x.answer))];

// ═══════════════════════════════════════════════════════════
//  normalize — bulletproof
// ═══════════════════════════════════════════════════════════
function normalize(str) {
  if (!str) return '';
  
  // Step 1: شيل التشكيل والتطويل
  let s = str.toString().replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06ED]/g, '');
  
  // Step 2: loop على كل حرف
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    
    // ====== ألف بأي شكل → ا (0x0627) ======
    // آ أ إ ٱ ٲ ٳ (standard)
    if (code === 0x0622 || code === 0x0623 || code === 0x0625 ||
        code === 0x0671 || code === 0x0672 || code === 0x0673) {
      out += '\u0627';
    }
    // presentation forms: ﺁ ﺂ ﺃ ﺄ ﺇ ﺈ ﺍ ﺎ
    else if (code >= 0xFE81 && code <= 0xFE88) { out += '\u0627'; }
    else if (code === 0xFE8D || code === 0xFE8E) { out += '\u0627'; }
    
    // ====== ى → ي ======
    else if (code === 0x0649) { out += '\u064A'; }
    // presentation: ﻯ ﻰ ﻲ ﻱ
    else if (code === 0xFEEF || code === 0xFEF0 || code === 0xFEF1 || code === 0xFEF2) {
      out += '\u064A';
    }
    
    // ====== ة → ه ======
    else if (code === 0x0629) { out += '\u0647'; }
    // presentation: ﺓ ﺔ
    else if (code === 0xFE93 || code === 0xFE94) { out += '\u0647'; }
    
    // ====== ؤ → و ======
    else if (code === 0x0624) { out += '\u0648'; }
    // presentation: ﺅ ﺆ
    else if (code === 0xFE85 || code === 0xFE86) { out += '\u0648'; }
    
    // ====== ئ ء → تتشال ======
    else if (code === 0x0626 || code === 0x0621) { /* skip */ }
    // presentation: ﺀ ﺉ ﺊ ﺋ ﺌ
    else if (code === 0xFE80 || code === 0xFE89 || code === 0xFE8A ||
             code === 0xFE8B || code === 0xFE8C) { /* skip */ }
    
    // ====== حروف عربية تانية → خليها ======
    else if (code >= 0x0600 && code <= 0x06FF) { out += s[i]; }
    // presentation forms عربية تانية → خليها
    else if (code >= 0xFB50 && code <= 0xFDFF) { out += s[i]; }
    else if (code >= 0xFE70 && code <= 0xFEFF) { out += s[i]; }
    
    // ====== إنجليزي + أرقام → خليها ======
    else if ((code >= 0x0041 && code <= 0x005A) ||
             (code >= 0x0061 && code <= 0x007A) ||
             (code >= 0x0030 && code <= 0x0039)) {
      out += s[i].toLowerCase();
    }
    // أي حاجة تانية (مسافات + ترقيم) → تتشال
  }
  
  return out;
}


// ═══════════════════════════════════════════════════════════
function pickRandomSentence(room) {
  if (!room.whoSaidPlayedIds) room.whoSaidPlayedIds = [];
  let available = whoSaidData
    .map((w, i) => ({ ...w, _idx: i }))
    .filter(w => !room.whoSaidPlayedIds.includes(w._idx));
  if (available.length === 0) {
    room.whoSaidPlayedIds = [];
    available = whoSaidData.map((w, i) => ({ ...w, _idx: i }));
  }
  const pick = available[Math.floor(Math.random() * available.length)];
  room.whoSaidPlayedIds.push(pick._idx);
  return pick;
}

function buildQuestion(item) {
  return {
    id: `whosaid_${Date.now()}`,
    category: 'who-said-game',
    text: item.text,
    answer: item.answer,
    revealed: false,
    answerRevealed: false,
    allAnswers: uniqueAnswers,
  };
}

function setupWhoSaidServer(socket, io, rooms) {

  socket.on('who_said_start', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    room.whoSaidPlayedIds = [];
    room.activePlayer = null;
    room.buzzerLocked = false;

    const item = pickRandomSentence(room);
    room.currentQuestion = buildQuestion(item);

    io.to(roomCode).emit('question_changed', room.currentQuestion);
    io.to(roomCode).emit('reset_buzzer');
  });

  socket.on('who_said_next', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    room.activePlayer = null;
    room.buzzerLocked = false;

    const item = pickRandomSentence(room);
    room.currentQuestion = buildQuestion(item);

    io.to(roomCode).emit('question_changed', room.currentQuestion);
    io.to(roomCode).emit('reset_buzzer');
  });

  socket.on('who_said_reveal', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || !room.currentQuestion) return;
    room.currentQuestion = { ...room.currentQuestion, revealed: true };
    io.to(roomCode).emit('question_changed', room.currentQuestion);
  });

  socket.on('who_said_submit', ({ roomCode, playerId, answer }) => {
    const room = rooms[roomCode];
    if (!room || !room.currentQuestion) return;
    if (room.activePlayer !== playerId) return;
    if (room.currentQuestion.answerRevealed) return;

    const nPlayer = normalize(answer);
    const nAnswer = normalize(room.currentQuestion.answer);
    const correct = nPlayer === nAnswer;

    // 🧪 log واضح في terminal السيرفر
    console.log('═══════════════════════════════════════════');
    console.log('📝 SUBMIT:');
    console.log('   Player raw:  ', JSON.stringify(answer));
    console.log('   Answer raw:  ', JSON.stringify(room.currentQuestion.answer));
    console.log('   Player norm: ', JSON.stringify(nPlayer));
    console.log('   Answer norm: ', JSON.stringify(nAnswer));
    console.log('   MATCH?', correct);
    console.log('═══════════════════════════════════════════');

    const player = room.players.find(p => p.id === playerId);

    room.activePlayer = null;
    room.buzzerLocked = false;
    io.to(roomCode).emit('reset_buzzer');

    if (correct && player) {
      player.score = (player.score || 0) + 1;
      io.to(roomCode).emit('update_score', player);
      io.to(roomCode).emit('update_players', room.players);
      io.to(roomCode).emit('who_said_correct', {
        playerId,
        playerName: player.name,
      });
    } else {
      if (player) {
        player.score = (player.score || 0) - 1;
        io.to(roomCode).emit('update_score', player);
        io.to(roomCode).emit('update_players', room.players);
      }
      io.to(roomCode).emit('who_said_wrong', {
        playerId,
        playerName: player?.name || '',
        submitted: answer,
      });
    }
  });

  socket.on('who_said_reveal_answer', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || !room.currentQuestion) return;
    if (room.currentQuestion.answerRevealed) return;

    room.currentQuestion = { ...room.currentQuestion, answerRevealed: true };
    room.activePlayer = null;
    room.buzzerLocked = false;

    io.to(roomCode).emit('question_changed', room.currentQuestion);
    io.to(roomCode).emit('reset_buzzer');
    io.to(roomCode).emit('who_said_answer_revealed', {
      answer: room.currentQuestion.answer,
    });
  });

  socket.on('close_game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    room.currentQuestion = null;
    room.activePlayer = null;
    room.buzzerLocked = false;
    room.whoSaidPlayedIds = [];
  });
}

module.exports = setupWhoSaidServer;