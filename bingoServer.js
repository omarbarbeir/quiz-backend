// bingoServer.js
module.exports = function setupBingoServer(socket, io, rooms) {

  socket.on('bingo_init', ({ roomCode, playerId }) => {
    const room = rooms[roomCode];
    if (!room) return;

    // ✅ لو الأدمن داخل → ابدأ من الأول خالص
    const isAdmin = room.admin === socket.id;
    if (isAdmin) {
      room.bingoGames = {};
      room.bingoCalled = [];
      io.to(roomCode).emit('bingo_reset_all');
      io.to(roomCode).emit('bingo_called_numbers', []);
    }

    if (!room.bingoGames) room.bingoGames = {};
    if (!room.bingoGames[playerId]) {
      room.bingoGames[playerId] = {
        grid: Array.from({ length: 5 }, () => Array(5).fill('')),
        marks: Array.from({ length: 5 }, () => Array(5).fill(false)),
      };
    }
    socket.emit('bingo_state', room.bingoGames[playerId]);
  });

  socket.on('bingo_cell_update', ({ roomCode, playerId, row, col, value }) => {
    const room = rooms[roomCode];
    if (!room || !room.bingoGames) return;
    if (!room.bingoGames[playerId]) {
      room.bingoGames[playerId] = {
        grid: Array.from({ length: 5 }, () => Array(5).fill('')),
        marks: Array.from({ length: 5 }, () => Array(5).fill(false)),
      };
    }
    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      room.bingoGames[playerId].grid[row][col] = value;
      socket.emit('bingo_state', room.bingoGames[playerId]);
    }
  });

  socket.on('bingo_mark_update', ({ roomCode, playerId, row, col, marked }) => {
    const room = rooms[roomCode];
    if (!room || !room.bingoGames) return;
    if (!room.bingoGames[playerId]) {
      room.bingoGames[playerId] = {
        grid: Array.from({ length: 5 }, () => Array(5).fill('')),
        marks: Array.from({ length: 5 }, () => Array(5).fill(false)),
      };
    }
    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      room.bingoGames[playerId].marks[row][col] = marked;
      socket.emit('bingo_state', room.bingoGames[playerId]);
    }
  });

  socket.on('bingo_reset', ({ roomCode, playerId }) => {
    const room = rooms[roomCode];
    if (!room || !room.bingoGames) return;
    if (room.bingoGames[playerId]) {
      room.bingoGames[playerId] = {
        grid: Array.from({ length: 5 }, () => Array(5).fill('')),
        marks: Array.from({ length: 5 }, () => Array(5).fill(false)),
      };
      if (room.bingoCalled) {
        room.bingoCalled = [];
        io.to(roomCode).emit('bingo_called_numbers', []);
      }
      socket.emit('bingo_state', room.bingoGames[playerId]);
    }
  });

  socket.on('bingo_call_number', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    if (!room.bingoCalled) room.bingoCalled = [];
    const called = room.bingoCalled;
    if (called.length >= 25) return;
    let num;
    do {
      num = Math.floor(Math.random() * 25) + 1;
    } while (called.includes(num));
    called.push(num);
    io.to(roomCode).emit('bingo_called_numbers', called);
  });

  // ✅ عند خروج الأدمن: صفّر اللعبة، وأرجع الجميع للوبي، بدون طرد أحد
  socket.on('bingo_cleanup', ({ roomCode, playerId }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const isAdmin = room.admin === socket.id;

    if (isAdmin) {
      room.bingoGames = {};
      room.bingoCalled = [];
      io.to(roomCode).emit('bingo_called_numbers', []);
      io.to(roomCode).emit('bingo_back_to_lobby');
    } else {
      if (room.bingoGames) delete room.bingoGames[playerId];
    }
  });

  // ✅ عند إغلاق اللعبة: صفّر البينجو فقط، ولا تمسح الغرفة
  socket.on('close_game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    room.bingoGames = {};
    room.bingoCalled = [];
  });
};