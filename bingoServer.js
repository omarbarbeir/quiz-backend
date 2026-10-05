// bingoServer.js
// 🎯 بينجو – منطق السيرفر
// signature: (socket, io, rooms)

module.exports = function setupBingoServer(socket, io, rooms) {

  // ---------- INIT ----------
  socket.on('bingo_init', ({ roomCode, playerId }) => {
    if (!rooms[roomCode]) return;
    if (!rooms[roomCode].bingoGames) {
      rooms[roomCode].bingoGames = {};
    }
    if (!rooms[roomCode].bingoGames[playerId]) {
      rooms[roomCode].bingoGames[playerId] = {
        grid: Array.from({ length: 5 }, () => Array(5).fill('')),
        marks: Array.from({ length: 5 }, () => Array(5).fill(false)),
      };
    }
    socket.emit('bingo_state', rooms[roomCode].bingoGames[playerId]);
  });

  // ---------- CELL UPDATE ----------
  socket.on('bingo_cell_update', ({ roomCode, playerId, row, col, value }) => {
    if (!rooms[roomCode] || !rooms[roomCode].bingoGames) return;
    if (!rooms[roomCode].bingoGames[playerId]) {
      rooms[roomCode].bingoGames[playerId] = {
        grid: Array.from({ length: 5 }, () => Array(5).fill('')),
        marks: Array.from({ length: 5 }, () => Array(5).fill(false)),
      };
    }
    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      rooms[roomCode].bingoGames[playerId].grid[row][col] = value;
      socket.emit('bingo_state', rooms[roomCode].bingoGames[playerId]);
    }
  });

  // ---------- MARK UPDATE ----------
  socket.on('bingo_mark_update', ({ roomCode, playerId, row, col, marked }) => {
    if (!rooms[roomCode] || !rooms[roomCode].bingoGames) return;
    if (!rooms[roomCode].bingoGames[playerId]) {
      rooms[roomCode].bingoGames[playerId] = {
        grid: Array.from({ length: 5 }, () => Array(5).fill('')),
        marks: Array.from({ length: 5 }, () => Array(5).fill(false)),
      };
    }
    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      rooms[roomCode].bingoGames[playerId].marks[row][col] = marked;
      socket.emit('bingo_state', rooms[roomCode].bingoGames[playerId]);
    }
  });

  // ---------- RESET (player) ----------
  socket.on('bingo_reset', ({ roomCode, playerId }) => {
    if (!rooms[roomCode] || !rooms[roomCode].bingoGames) return;
    if (rooms[roomCode].bingoGames[playerId]) {
      rooms[roomCode].bingoGames[playerId] = {
        grid: Array.from({ length: 5 }, () => Array(5).fill('')),
        marks: Array.from({ length: 5 }, () => Array(5).fill(false)),
      };

      // ★ Clear shared called numbers
      if (rooms[roomCode].bingoCalled) {
        rooms[roomCode].bingoCalled = [];
        io.to(roomCode).emit('bingo_called_numbers', []);
      }
      socket.emit('bingo_state', rooms[roomCode].bingoGames[playerId]);
    }
  });

  // ---------- CALL NUMBER ----------
  socket.on('bingo_call_number', ({ roomCode }) => {
    if (!rooms[roomCode]) return;
    if (!rooms[roomCode].bingoCalled) {
      rooms[roomCode].bingoCalled = [];
    }
    const called = rooms[roomCode].bingoCalled;
    // Generate random number 1-25 not already called
    if (called.length >= 25) return; // all called
    let num;
    do {
      num = Math.floor(Math.random() * 25) + 1;
    } while (called.includes(num));
    called.push(num);
    io.to(roomCode).emit('bingo_called_numbers', called);
  });

  // ---------- CLEANUP ----------
  socket.on('bingo_cleanup', ({ roomCode, playerId }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const isAdmin = room.admin === socket.id;

    if (isAdmin) {
      // ✅ الأدمن خرج — صفّر كل شيء، ثم أخرج الباقين
      if (room.bingoGames) room.bingoGames = {};
      room.bingoCalled = [];

      io.to(roomCode).emit('bingo_called_numbers', []);
      io.to(roomCode).emit('bingo_admin_left');
    } else {
      // ✅ لاعب عادي خرج — امسح لوحته فقط
      if (room.bingoGames) delete room.bingoGames[playerId];
    }
  });
};