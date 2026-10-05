// musicServer.js
const musicData = require('./data/musicData');

function pickRandomSong(room) {
  if (!room.musicPlayedIds) room.musicPlayedIds = [];
  let available = musicData.filter(s => !room.musicPlayedIds.includes(s.id));
  if (available.length === 0) {
    room.musicPlayedIds = [];
    available = musicData;
  }
  const song = available[Math.floor(Math.random() * available.length)];
  room.musicPlayedIds.push(song.id);
  return song;
}

function toQuestion(song) {
  return {
    id: `music_${song.id}`,
    category: 'music',
    text: song.text,
    answer: song.answer,
    audio: song.audio,
    audio2: song.audio2,
  };
}

function setupMusicServer(socket, io, rooms) {

  // ═══════════════════════════════════════════
  //  بدء لعبة الأغاني المعكوسة
  // ═══════════════════════════════════════════
  socket.on('music_start', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

      const player = room.players.find(p => p.socketId === socket.id);
  if (!player?.isAdmin) return;   // ✅

    room.musicPlayedIds = [];
    const song = pickRandomSong(room);
    const question = toQuestion(song);
    room.currentQuestion = question;
    io.to(roomCode).emit('question_changed', question);
  });

  // أغنية جديدة
  socket.on('music_next', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
  if (!player?.isAdmin) return;   // ✅

    const song = pickRandomSong(room);
    const question = toQuestion(song);
    room.currentQuestion = question;
    io.to(roomCode).emit('question_changed', question);
  });

  // إعادة تعيين
  socket.on('music_reset', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

     const player = room.players.find(p => p.socketId === socket.id);
  if (!player?.isAdmin) return;   // ✅

    room.musicPlayedIds = [];
  });

  // ═══════════════════════════════════════════
  //  ✅ مزامنة الصوت — reversed (المعكوسة)
  // ═══════════════════════════════════════════
  // (play_audio / pause_audio / continue_audio موجودين في index.js)
  
  socket.on('stop_audio', (roomCode) => {
    io.to(roomCode).emit('stop_audio');
  });

  // ═══════════════════════════════════════════
  //  ✅ مزامنة الصوت — normal (الأصلية / audio2)
  // ═══════════════════════════════════════════
  socket.on('play_audio2', (roomCode) => {
    io.to(roomCode).emit('play_audio2');
  });
  socket.on('pause_audio2', (roomCode) => {
    io.to(roomCode).emit('pause_audio2');
  });
  socket.on('continue_audio2', (roomCode, time) => {
    io.to(roomCode).emit('continue_audio2', time);
  });
  socket.on('stop_audio2', (roomCode) => {
    io.to(roomCode).emit('stop_audio2');
  });

    socket.on('close_game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    room.currentQuestion = null;
    room.activePlayer = null;
    room.buzzerLocked = false;
    room.musicPlayedIds = [];
  });
}

module.exports = setupMusicServer;