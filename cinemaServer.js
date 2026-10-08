// cinemaServer.js
const cinemaData = require('./data/cinemaData');

function pickRandomItem(room, subcategory) {
  if (!room.cinemaPlayedIds) room.cinemaPlayedIds = { history: [], cinema: [] };
  if (!room.cinemaPlayedIds[subcategory]) room.cinemaPlayedIds[subcategory] = [];

  const pool = cinemaData[subcategory] || [];
  if (pool.length === 0) return null;

  let available = pool
    .map((item, i) => ({ ...item, _idx: i }))
    .filter(item => !room.cinemaPlayedIds[subcategory].includes(item._idx));

  if (available.length === 0) {
    room.cinemaPlayedIds[subcategory] = [];
    available = pool.map((item, i) => ({ ...item, _idx: i }));
  }

  const pick = available[Math.floor(Math.random() * available.length)];
  room.cinemaPlayedIds[subcategory].push(pick._idx);
  return { text: pick.text, answer: pick.answer, bounc: pick.bounc };
}

// ✅ نُعدّ قائمة كل الإجابات المحتملة لاستخدامها في autocomplete
function buildQuestion(item, subcategory, allItems) {
  return {
    id: `cinema_${Date.now()}`,
    category: 'cinema-game',
    subcategory,
    text: item.text,
    answer: item.answer,
    bounc: item.bounc,
    allAnswers: allItems.map(i => i.answer),
    actorsRevealed: false,
    hintRevealed: false,
    answerRevealed: false,
    answeredCorrectly: false,
  };
}

// ✅ تطبيع للإجابة — يتجاهل المسافات والتشكيل وحالة الأحرف
function normalizeAnswer(s) {
  if (!s) return '';
  let str = s.toString().replace(/[\u064B-\u065F\u0670\u0640]/g, '');
  return str.trim().replace(/\s+/g, ' ').toLowerCase();
}

function setupCinemaServer(socket, io, rooms) {

  // ═══════════════════════════════════════════
  //  بدء اللعبة
  // ═══════════════════════════════════════════
  socket.on('cinema_start', ({ roomCode, subcategory }) => {
    const room = rooms[roomCode];
    if (!room) return;

    if (room.currentQuestion?.category === 'cinema-game' &&
        room.currentQuestion.subcategory === subcategory) {
      io.to(roomCode).emit('question_changed', room.currentQuestion);
      io.to(roomCode).emit('reset_buzzer');
      return;
    }

    if (!room.cinemaPlayedIds) room.cinemaPlayedIds = { history: [], cinema: [] };
    room.cinemaPlayedIds[subcategory] = [];
    room.activePlayer = null;
    room.buzzerLocked = false;

    const item = pickRandomItem(room, subcategory);
    if (!item) return;

    const allItems = cinemaData[subcategory] || [];
    room.currentQuestion = buildQuestion(item, subcategory, allItems);
    io.to(roomCode).emit('question_changed', room.currentQuestion);
    io.to(roomCode).emit('reset_buzzer');
  });

  // ═══════════════════════════════════════════
  //  التالي
  // ═══════════════════════════════════════════
  socket.on('cinema_next', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || !room.currentQuestion) return;

    const subcategory = room.currentQuestion.subcategory;
    room.activePlayer = null;
    room.buzzerLocked = false;

    const item = pickRandomItem(room, subcategory);
    if (!item) return;

    const allItems = cinemaData[subcategory] || [];
    room.currentQuestion = buildQuestion(item, subcategory, allItems);
    io.to(roomCode).emit('question_changed', room.currentQuestion);
    io.to(roomCode).emit('reset_buzzer');
  });

  // ═══════════════════════════════════════════
  //  كشف الممثلين
  // ═══════════════════════════════════════════
  socket.on('cinema_reveal_actors', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || !room.currentQuestion) return;
    room.currentQuestion = { ...room.currentQuestion, actorsRevealed: true };
    io.to(roomCode).emit('question_changed', room.currentQuestion);
  });

  // ═══════════════════════════════════════════
  //  كشف التلميح
  // ═══════════════════════════════════════════
  socket.on('cinema_reveal_hint', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || !room.currentQuestion) return;
    room.currentQuestion = { ...room.currentQuestion, hintRevealed: true };
    io.to(roomCode).emit('question_changed', room.currentQuestion);
  });

  // ═══════════════════════════════════════════
  //  كشف الإجابة
  // ═══════════════════════════════════════════
  socket.on('cinema_reveal_answer', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || !room.currentQuestion) return;
    room.currentQuestion = { ...room.currentQuestion, answerRevealed: true };
    room.activePlayer = null;
    room.buzzerLocked = false;
    io.to(roomCode).emit('question_changed', room.currentQuestion);
    io.to(roomCode).emit('reset_buzzer');
  });

  // ═══════════════════════════════════════════
  //  ✅ إرسال إجابة اللاعب الذي ضغط البازر
  // ═══════════════════════════════════════════
  socket.on('cinema_submit', ({ roomCode, playerId, answer }) => {
    const room = rooms[roomCode];
    if (!room || !room.currentQuestion) return;
    if (room.activePlayer !== playerId) return;
    if (room.currentQuestion.answeredCorrectly) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    const correct = normalizeAnswer(room.currentQuestion.answer);
    const submitted = normalizeAnswer(answer);
    const isCorrect = submitted === correct;

    if (isCorrect) {
      player.score = (player.score || 0) + 1;

      room.currentQuestion = {
        ...room.currentQuestion,
        answeredCorrectly: true,
      };

      io.to(roomCode).emit('cinema_correct', {
        playerId,
        playerName: player.name,
        answer,
      });

      room.activePlayer = null;
      room.buzzerLocked = false;
      io.to(roomCode).emit('question_changed', room.currentQuestion);
      io.to(roomCode).emit('reset_buzzer');
      io.to(roomCode).emit('update_players', room.players);
    } else {
      player.score = Math.max(0, (player.score || 0) - 1);

      io.to(roomCode).emit('cinema_wrong', {
        playerId,
        playerName: player.name,
        answer,
      });

      room.activePlayer = null;
      room.buzzerLocked = false;
      io.to(roomCode).emit('reset_buzzer');
      io.to(roomCode).emit('update_players', room.players);
    }
  });

  // ═══════════════════════════════════════════
  //  تنظيف
  // ═══════════════════════════════════════════
  socket.on('close_game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    room.currentQuestion = null;
    room.activePlayer = null;
    room.buzzerLocked = false;
    room.cinemaPlayedIds = { history: [], cinema: [] };
  });
}

module.exports = setupCinemaServer;