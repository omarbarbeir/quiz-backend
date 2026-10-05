// bracketServer.js
// 🏆 دور الـ 16 – منطق السيرفر
// signature: (socket, io, rooms)

const MAX_ROUNDS = 4; // 16 → 8 → 4 → 2

function makeEmptyBracket() {
  return {
    rounds: Array.from({ length: MAX_ROUNDS }, () => ({ matches: [] })),
    currentRoundIndex: 0,
    winner: null,
  };
}

module.exports = function setupBracketServer(socket, io, rooms) {

  // ---------- INIT ----------
  socket.on('bracket_init', ({ roomCode }) => {
    if (!roomCode) return;
    const room = rooms[roomCode];
    if (!room) return;

    if (room.bracket) {
      socket.emit('bracket_state', room.bracket);
      return;
    }
    room.bracket = makeEmptyBracket();
    socket.emit('bracket_state', room.bracket);
  });

  // ---------- RANDOMIZE (admin only) ----------
  socket.on('bracket_randomize', ({ roomCode, names }) => {
    if (!roomCode) return;
    const room = rooms[roomCode];
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player?.isAdmin) return;
    if (!Array.isArray(names) || names.length === 0) return;

    const shuffled = [...names].sort(() => Math.random() - 0.5);
    const matches = [];
    for (let i = 0; i < 8; i++) {
      matches.push({
        team1: shuffled[i * 2] || `فريق ${i * 2 + 1}`,
        team2: shuffled[i * 2 + 1] || `فريق ${i * 2 + 2}`,
        votes: {},
        voters: [],
        winner: null,
      });
    }
    room.bracket = makeEmptyBracket();
    room.bracket.rounds[0].matches = matches;
    io.to(roomCode).emit('bracket_state', room.bracket);
  });

  // ---------- VOTE (الكل) ----------
  socket.on('bracket_vote', ({ roomCode, roundIndex, matchIndex, choice, playerId }) => {
    if (!roomCode) return;
    const room = rooms[roomCode];
    if (!room?.bracket) return;
    const round = room.bracket.rounds[roundIndex];
    if (!round || !round.matches[matchIndex]) return;
    const match = round.matches[matchIndex];
    if (match.winner) return;
    if (!match.votes) match.votes = {};
    if (!match.voters) match.voters = [];
    if (match.voters.includes(playerId)) return;
    match.votes[choice] = (match.votes[choice] || 0) + 1;
    match.voters.push(playerId);
    io.to(roomCode).emit('bracket_state', room.bracket);
  });

  // ---------- NEXT ROUND (admin only) ----------
  socket.on('bracket_next_round', ({ roomCode }) => {
    if (!roomCode) return;
    const room = rooms[roomCode];
    if (!room?.bracket) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player?.isAdmin) return;

    const bracket = room.bracket;
    const currentRound = bracket.rounds[bracket.currentRoundIndex];
    if (!currentRound) return;

    // احسم الفائزين
    currentRound.matches.forEach(match => {
      if (!match.winner) {
        const votes = match.votes || {};
        const t1 = votes[match.team1] || 0;
        const t2 = votes[match.team2] || 0;
        match.winner = t1 >= t2 ? match.team1 : match.team2;
      }
    });

    const winners = currentRound.matches.map(m => m.winner);
    const nextRoundIndex = bracket.currentRoundIndex + 1;

    if (nextRoundIndex >= MAX_ROUNDS) {
      // خلصت — الفائز النهائي
      if (winners.length === 1) bracket.winner = winners[0];
      bracket.currentRoundIndex = MAX_ROUNDS;
    } else {
      const nextRound = bracket.rounds[nextRoundIndex];
      nextRound.matches = [];
      for (let i = 0; i < winners.length; i += 2) {
        nextRound.matches.push({
          team1: winners[i],
          team2: winners[i + 1],
          votes: {},
          voters: [],
          winner: null,
        });
      }
      bracket.currentRoundIndex = nextRoundIndex;
    }
    io.to(roomCode).emit('bracket_state', bracket);
  });

  // ---------- RESET (admin only) ----------
  socket.on('bracket_reset', ({ roomCode }) => {
    if (!roomCode) return;
    const room = rooms[roomCode];
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player?.isAdmin) return;
    room.bracket = makeEmptyBracket();
    io.to(roomCode).emit('bracket_state', room.bracket);
  });

  // ---------- CLEANUP ----------
  socket.on('bracket_cleanup', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room?.bracket) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player?.isAdmin) return;   // ✅
    room.bracket = null;
  });
};