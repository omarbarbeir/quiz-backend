// ticTacToeServer.js
// ⭕❌ إكس أو – منطق السيرفر
// signature: (socket, io, rooms)

module.exports = function setupTicTacToeServer(socket, io, rooms) {

  // ---------- GET STATE ----------
  socket.on('tic_tac_toe_get_state', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || !room.ticTacToe) return;
    socket.emit('tic_tac_toe_state', room.ticTacToe);
  });

  // ---------- START (admin) ----------
  socket.on('tic_tac_toe_start', ({ roomCode, playerX, playerO }) => {
    const room = rooms[roomCode];
    if (!room) return;

    // ✅ التحقق من الأدمن حسب النمط
    if (room.admin !== socket.id) return;

    room.ticTacToe = {
      board: Array(9).fill(null),
      turn: 'X',
      winner: null,
      playerX,
      playerO,
      score: room.ticTacToe?.score || { X: 0, O: 0, draw: 0 },
    };
    io.to(roomCode).emit('tic_tac_toe_state', room.ticTacToe);
  });

  // ---------- MOVE (player) ----------
  socket.on('tic_tac_toe_move', ({ roomCode, index, playerId }) => {
    const room = rooms[roomCode];
    if (!room || !room.ticTacToe) return;
    const game = room.ticTacToe;
    if (game.board[index] || game.winner) return;

    const currentPlayer = game.turn === 'X' ? game.playerX : game.playerO;
    if (currentPlayer.id !== playerId) return;

    game.board[index] = game.turn;

    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];
    for (let line of lines) {
      const [a,b,c] = line;
      if (game.board[a] && game.board[a] === game.board[b] && game.board[a] === game.board[c]) {
        game.winner = game.turn;
        break;
      }
    }
    if (!game.winner && game.board.every(cell => cell !== null)) {
      game.winner = 'draw';
    }

    if (game.winner) {
      if (!game.score) game.score = { X: 0, O: 0, draw: 0 };
      game.score[game.winner] = (game.score[game.winner] || 0) + 1;
    }

    game.turn = game.turn === 'X' ? 'O' : 'X';
    io.to(roomCode).emit('tic_tac_toe_state', game);
  });

  // ---------- RESET (admin) ----------
  socket.on('tic_tac_toe_reset', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || !room.ticTacToe) return;

    // ✅ التحقق من الأدمن حسب النمط
    if (room.admin !== socket.id) return;

    room.ticTacToe.board = Array(9).fill(null);
    room.ticTacToe.turn = 'X';
    room.ticTacToe.winner = null;
    io.to(roomCode).emit('tic_tac_toe_state', room.ticTacToe);
  });

  // ---------- CLOSE GAME ----------
  socket.on('close_game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    room.ticTacToe = null;
  });
};