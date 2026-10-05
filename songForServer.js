// songForServer.js
const songForData = require('./data/songForData');

function pickRandomSinger(room) {
  if (!room.songForPlayedIds) room.songForPlayedIds = [];
  let available = songForData
    .map((w, i) => ({ text: w, _idx: i }))
    .filter(w => !room.songForPlayedIds.includes(w._idx));
  if (available.length === 0) {
    room.songForPlayedIds = [];
    available = songForData.map((w, i) => ({ text: w, _idx: i }));
  }
  const pick = available[Math.floor(Math.random() * available.length)];
  room.songForPlayedIds.push(pick._idx);
  return pick;
}

function buildQuestion(item) {
  return {
    id: `songfor_${Date.now()}`,
    category: 'song-for-game',
    text: item.text,
  };
}

function setupSongForServer(socket, io, rooms) {

  // ═══════════════════════════════════════════
  //  بدء اللعبة (أول مرة — بدون مغني)
  // ═══════════════════════════════════════════
  socket.on('song_for_start', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

      const player = room.players.find(p => p.socketId === socket.id);
  if (!player?.isAdmin) return;   // ✅

    // ✅ لو فيه لعبة شغالة بالفعل → رجّع نفس الحالة
    if (room.currentQuestion?.category === 'song-for-game') {
      io.to(roomCode).emit('question_changed', room.currentQuestion);
      io.to(roomCode).emit('reset_buzzer');
      return;
    }

    room.songForPlayedIds = [];
    room.activePlayer = null;
    room.buzzerLocked = false;

    room.currentQuestion = {
      id: `songfor_init_${Date.now()}`,
      category: 'song-for-game',
      text: null,   // ← مفيش مغني لحد ما يدوس "المغني التالي"
    };

    io.to(roomCode).emit('question_changed', room.currentQuestion);
    io.to(roomCode).emit('reset_buzzer');
  });

  // ═══════════════════════════════════════════
  //  ✅ المغني التالي — ده اللي كان ناقص
  // ═══════════════════════════════════════════
  socket.on('song_for_next', ({ roomCode }) => {
    console.log('🎤 [SERVER] song_for_next received for room:', roomCode);
    const room = rooms[roomCode];
    if (!room) {
      console.log('❌ [SERVER] Room not found:', roomCode);
      return;
    }

      const player = room.players.find(p => p.socketId === socket.id);
  if (!player?.isAdmin) return;   // ✅

    room.activePlayer = null;
    room.buzzerLocked = false;

    const item = pickRandomSinger(room);
    console.log('🎤 [SERVER] Picked singer:', item.text);
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
    room.songForPlayedIds = [];
  });
}

module.exports = setupSongForServer;