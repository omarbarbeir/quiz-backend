// reverseServer.js
const reverseData = require('./data/reverseData');

function pickRandomWord(room) {
  if (!room.reversePlayedIds) room.reversePlayedIds = [];
  let available = reverseData
    .map((w, i) => ({ ...w, _idx: i }))
    .filter(w => !room.reversePlayedIds.includes(w._idx));
  if (available.length === 0) {
    room.reversePlayedIds = [];
    available = reverseData.map((w, i) => ({ ...w, _idx: i }));
  }
  const pick = available[Math.floor(Math.random() * available.length)];
  room.reversePlayedIds.push(pick._idx);
  return { text: pick.text, answer: pick.answer };
}

function toQuestion(item) {
  return {
    id: `reverse_${Date.now()}`,
    category: 'reverse-word',
    text: item.text,
    answer: item.answer,
  };
}

function setupReverseServer(socket, io, rooms) {

  // بدء لعبة الكلمات المعكوسة من الصفر
  socket.on('reverse_start', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

     const player = room.players.find(p => p.socketId === socket.id);
  if (!player?.isAdmin) return;   // ✅

    room.reversePlayedIds = [];
    const item = pickRandomWord(room);
    const question = toQuestion(item);
    room.currentQuestion = question;
    io.to(roomCode).emit('question_changed', question);
  });

  // كلمة جديدة (بدون تكرار)
  socket.on('reverse_next', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

      const player = room.players.find(p => p.socketId === socket.id);
  if (!player?.isAdmin) return;   // ✅

    const item = pickRandomWord(room);
    const question = toQuestion(item);
    room.currentQuestion = question;
    io.to(roomCode).emit('question_changed', question);
  });

  // إعادة تعيين قائمة الكلمات
  socket.on('reverse_reset', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

      const player = room.players.find(p => p.socketId === socket.id);
  if (!player?.isAdmin) return;   // ✅

    room.reversePlayedIds = [];
  });

  socket.on('close_game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    room.currentQuestion = null;
    room.reversePlayedIds = [];
  });
}

module.exports = setupReverseServer;