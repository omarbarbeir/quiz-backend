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

function buildQuestion(item, subcategory) {
  return {
    id: `cinema_${Date.now()}`,
    category: 'cinema-game',
    subcategory,
    text: item.text,
    answer: item.answer,
    bounc: item.bounc,
    actorsRevealed: false,
    hintRevealed: false,
    answerRevealed: false,
  };
}

function setupCinemaServer(socket, io, rooms) {

  // ═══════════════════════════════════════════
  //  بدء اللعبة
  // ═══════════════════════════════════════════
  socket.on('cinema_start', ({ roomCode, subcategory }) => {
    const room = rooms[roomCode];
    if (!room) return;

    // ✅ لو نفس الفئة شغالة → رجّع الحالة
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

    room.currentQuestion = buildQuestion(item, subcategory);
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

    room.currentQuestion = buildQuestion(item, subcategory);
    io.to(roomCode).emit('question_changed', room.currentQuestion);
    io.to(roomCode).emit('reset_buzzer');
  });

  // ═══════════════════════════════════════════
  //  ✅ كشف الممثلين
  // ═══════════════════════════════════════════
  socket.on('cinema_reveal_actors', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || !room.currentQuestion) return;
    room.currentQuestion = { ...room.currentQuestion, actorsRevealed: true };
    io.to(roomCode).emit('question_changed', room.currentQuestion);
  });

  // ═══════════════════════════════════════════
  //  ✅ كشف التلميح
  // ═══════════════════════════════════════════
  socket.on('cinema_reveal_hint', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || !room.currentQuestion) return;
    room.currentQuestion = { ...room.currentQuestion, hintRevealed: true };
    io.to(roomCode).emit('question_changed', room.currentQuestion);
  });

  // ═══════════════════════════════════════════
  //  ✅ كشف الإجابة
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