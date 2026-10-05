// putWordServer.js
const putWordData = require('./data/putWordData');

function pickRandomWord(room) {
  if (!room.putWordPlayedIds) room.putWordPlayedIds = [];
  let available = putWordData
    .map((w, i) => ({ text: w, _idx: i }))
    .filter(w => !room.putWordPlayedIds.includes(w._idx));
  if (available.length === 0) {
    room.putWordPlayedIds = [];
    available = putWordData.map((w, i) => ({ text: w, _idx: i }));
  }
  const pick = available[Math.floor(Math.random() * available.length)];
  room.putWordPlayedIds.push(pick._idx);
  return pick;
}

function buildQuestion(item) {
  return {
    id: `putword_${Date.now()}`,
    category: 'put-word-game',
    text: item.text,
  };
}

function setupPutWordServer(socket, io, rooms) {

  // ═══════════════════════════════════════════
  //  بدء لعبة جديدة
  // ═══════════════════════════════════════════
  socket.on('put_word_start', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

      const player = room.players.find(p => p.socketId === socket.id);
  if (!player?.isAdmin) return;   // ✅

    // ✅ لو فيه لعبة شغالة بالفعل → رجّع نفس الحالة
    if (room.currentQuestion?.category === 'put-word-game') {
      io.to(roomCode).emit('question_changed', room.currentQuestion);
      io.to(roomCode).emit('reset_buzzer');
      return;
    }

    // إعداد أول مرة — بدون كلمة (استعد)
    room.putWordPlayedIds = [];
    room.activePlayer = null;
    room.buzzerLocked = false;

    room.currentQuestion = {
      id: `putword_init_${Date.now()}`,
      category: 'put-word-game',
      text: null,   // ← مفيش كلمة لحد ما يدوس "الكلمة التالية"
    };

    io.to(roomCode).emit('question_changed', room.currentQuestion);
    io.to(roomCode).emit('reset_buzzer');
  });

  // ═══════════════════════════════════════════
  //  الكلمة التالية
  // ═══════════════════════════════════════════
  socket.on('put_word_next', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

      const player = room.players.find(p => p.socketId === socket.id);
  if (!player?.isAdmin) return;   // ✅

    room.activePlayer = null;
    room.buzzerLocked = false;

    const item = pickRandomWord(room);
    room.currentQuestion = buildQuestion(item);

    io.to(roomCode).emit('question_changed', room.currentQuestion);
    io.to(roomCode).emit('reset_buzzer');
  });

  socket.on('close_game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    room.currentQuestion = null;
    room.activePlayer = null;
    room.buzzerLocked = false;
    room.putWordPlayedIds = [];
  });
}

module.exports = setupPutWordServer;