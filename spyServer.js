// spyServer.js
// ═══════════════════════════════════════════════════════════════
//  لعبة الجاسوس — الأدمن بقى لاعب عادي (عنده id حقيقي + بيتحسب)
// ═══════════════════════════════════════════════════════════════

const spyWords = require('./data/spyWords');

function getDecoyWord(original) {
  const pool = spyWords.filter(w => w !== original);
  return pool[Math.floor(Math.random() * pool.length)];
}

function setupSpyServer(socket, io, rooms) {

  // ══════════════════════════════════════════════════════════
  //  spy_start — السيرفر يختار الكلمة والجاسوس من كل اللاعبين
  // ══════════════════════════════════════════════════════════
  socket.on('spy_start', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player?.isAdmin) return;

    room.spyVotes = {};

    const randomWord = spyWords[Math.floor(Math.random() * spyWords.length)];
    const decoyWord  = getDecoyWord(randomWord);

    // ✅ كل اللاعبين بما فيهم الأدمن
    const allPlayers = room.players;
    if (allPlayers.length === 0) return;

    const spyPlayer = allPlayers[Math.floor(Math.random() * allPlayers.length)];
    room.spyId   = spyPlayer.id;
    room.spyWord = randomWord;

    console.log(`🕵️ SPY START | room: ${roomCode} | word: "${randomWord}" | decoy: "${decoyWord}" | spy: ${spyPlayer.id}`);

    // ✅ توزيع الكلمات على الكل (بما فيهم الأدمن)
    allPlayers.forEach(player => {
      const wordForPlayer = player.id === spyPlayer.id ? decoyWord : randomWord;
      io.to(player.socketId).emit('player_photo_question', {
        playerId: player.id,
        question: {
          id:       'spy',
          category: 'spy',
          text:     wordForPlayer,
          answer:   '',
          isSpy:    player.id === spyPlayer.id,
        },
      });
    });

    io.to(roomCode).emit('update_players', room.players);
  });

  // ══════════════════════════════════════════════════════════
  //  start_spy_voting — أي لاعب يقدر يفتحه
  // ══════════════════════════════════════════════════════════
  socket.on('start_spy_voting', (roomCode) => {
    io.to(roomCode).emit('open_spy_voting');
  });

  // ══════════════════════════════════════════════════════════
  //  submit_spy_vote — مع broadcast لعدد الأصوات لحظيًا
  // ══════════════════════════════════════════════════════════
  socket.on('submit_spy_vote', ({ roomCode, voterId, votedForId }) => {
    const room = rooms[roomCode];
    if (!room) return;

    room.spyVotes = room.spyVotes || {};
    room.spyVotes[voterId] = votedForId;

    // ✅ كل اللاعبين (بما فيهم الأدمن) بيتحسبوا في التصويت
    const votersCount = room.players.length;
    const votedCount  = Object.keys(room.spyVotes).length;

    io.to(roomCode).emit('spy_vote_progress', {
      voted: votedCount,
      total: votersCount,
      allVoted: votedCount >= votersCount,
    });
  });

  // ══════════════════════════════════════════════════════════
  //  end_spy_voting — مايتنفذش غير لما الكل يصوّت
  // ══════════════════════════════════════════════════════════
  socket.on('end_spy_voting', (roomCode) => {
    const room = rooms[roomCode];
    if (!room || !room.spyId) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player?.isAdmin) return;

    // حماية إضافية من السيرفر
    const votersCount = room.players.length;
    const votedCount  = Object.keys(room.spyVotes || {}).length;
    if (votedCount < votersCount) return;

    const votes     = room.spyVotes || {};
    const spyId     = room.spyId;
    const spyCaught = Object.values(votes).includes(spyId);

    // ✅ كل اللاعبين (بما فيهم الأدمن) بياخدوا نقاط
    const roundScores = room.players.map(player => {
      let pointsEarned = 0;
      if (spyCaught) {
        if (votes[player.id] === spyId) pointsEarned = 1;
      } else {
        if (player.id === spyId) pointsEarned = 1;
      }
      if (pointsEarned > 0) player.score = (player.score || 0) + 1;
      return {
        name: player.name,
        pointsEarned,
        isSpy: player.id === spyId,
        isAdmin: !!player.isAdmin,
      };
    });

    console.log(`🏁 SPY VOTING ENDED | room: ${roomCode} | caught: ${spyCaught}`);

    io.to(roomCode).emit('spy_voting_results', {
      spyCaught,
      spyId,
      players: room.players,
      roundScores,
    });

    io.to(roomCode).emit('update_players', room.players);
  });

}

module.exports = setupSpyServer;