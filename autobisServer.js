// autobisServer.js

const ROWS = 29;  // 1 header + 28 letters
const COLS = 10;

function setupAutobisServer(socket, io, rooms) {

  // ═══════════════════════════════════════════
  //  تهيئة الجدول للاعب
  // ═══════════════════════════════════════════
  socket.on('autobis_grid_init', ({ roomCode, playerId }) => {
    if (!rooms[roomCode]) return;
    if (!rooms[roomCode].autobisGames) rooms[roomCode].autobisGames = {};
    if (!rooms[roomCode].autobisGames[playerId]) {
      rooms[roomCode].autobisGames[playerId] = Array.from({ length: ROWS }, () => Array(COLS).fill(''));
    }
    socket.emit('autobis_grid_state', { grid: rooms[roomCode].autobisGames[playerId] });
  });

  // ═══════════════════════════════════════════
  //  تحديث خانة
  // ═══════════════════════════════════════════
  socket.on('autobis_cell_update', ({ roomCode, playerId, row, col, value }) => {
    if (!rooms[roomCode]) return;
    if (!rooms[roomCode].autobisGames) rooms[roomCode].autobisGames = {};
    if (!rooms[roomCode].autobisGames[playerId]) {
      rooms[roomCode].autobisGames[playerId] = Array.from({ length: ROWS }, () => Array(COLS).fill(''));
    }
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      rooms[roomCode].autobisGames[playerId][row][col] = value;
      socket.emit('autobis_grid_state', { grid: rooms[roomCode].autobisGames[playerId] });
    }
  });

  // ═══════════════════════════════════════════
  //  مسح الجدول
  // ═══════════════════════════════════════════
  socket.on('autobis_grid_reset', ({ roomCode, playerId }) => {
    if (!rooms[roomCode]?.autobisGames?.[playerId]) return;
    rooms[roomCode].autobisGames[playerId] = Array.from({ length: ROWS }, () => Array(COLS).fill(''));
    socket.emit('autobis_grid_state', { grid: rooms[roomCode].autobisGames[playerId] });
  });
}

module.exports = setupAutobisServer;