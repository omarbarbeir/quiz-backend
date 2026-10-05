/**
 * ============================================================
 *  chessServer.js — لعبة شطرنج
 *  الأدمن بقى لاعب عادي + يتحكم في البدء والإعادة
 * ============================================================
 */

const chessRooms = {};
if (typeof global !== 'undefined') global.chessRooms = chessRooms;

// =====================================================
// Helpers
// =====================================================
function initBoard() {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  const backRank = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: backRank[c], color: 'b' };
    board[1][c] = { type: 'p', color: 'b' };
    board[6][c] = { type: 'p', color: 'w' };
    board[7][c] = { type: backRank[c], color: 'w' };
  }
  return board;
}

function cloneBoard(board) {
  return board.map(row => row.map(cell => (cell ? { ...cell } : null)));
}

function findKing(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'k' && p.color === color) return { row: r, col: c };
    }
  }
  return null;
}

function clearPath(board, fr, fc, tr, tc) {
  const dr = Math.sign(tr - fr);
  const dc = Math.sign(tc - fc);
  let r = fr + dr, c = fc + dc;
  while (r !== tr || c !== tc) {
    if (board[r][c]) return false;
    r += dr; c += dc;
  }
  return true;
}

function isSquareAttacked(board, row, col, byColor) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== byColor) continue;
      const dr = row - r, dc = col - c;
      const adr = Math.abs(dr), adc = Math.abs(dc);
      if (p.type === 'p') {
        const dir = p.color === 'w' ? -1 : 1;
        if (dr === dir && adc === 1) return true;
      } else if (p.type === 'n') {
        if ((adr === 2 && adc === 1) || (adr === 1 && adc === 2)) return true;
      } else if (p.type === 'b') {
        if (adr === adc && adr > 0 && clearPath(board, r, c, row, col)) return true;
      } else if (p.type === 'r') {
        if ((dr === 0 || dc === 0) && (adr + adc > 0) && clearPath(board, r, c, row, col)) return true;
      } else if (p.type === 'q') {
        if ((adr === adc || dr === 0 || dc === 0) && (adr + adc > 0) && clearPath(board, r, c, row, col)) return true;
      } else if (p.type === 'k') {
        if (adr <= 1 && adc <= 1 && adr + adc > 0) return true;
      }
    }
  }
  return false;
}

function generateMoves(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  const moves = [];
  const color = piece.color;
  const opponent = color === 'w' ? 'b' : 'w';
  const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const isFriend = (r, c) => board[r][c] && board[r][c].color === color;
  const isEnemy = (r, c) => board[r][c] && board[r][c].color === opponent;

  if (piece.type === 'p') {
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;
    if (inBounds(row + dir, col) && !board[row + dir][col]) {
      moves.push({ row: row + dir, col });
      if (row === startRow && !board[row + 2 * dir][col]) {
        moves.push({ row: row + 2 * dir, col });
      }
    }
    for (const dc of [-1, 1]) {
      const r = row + dir, c = col + dc;
      if (inBounds(r, c) && isEnemy(r, c)) moves.push({ row: r, col: c });
    }
  } else if (piece.type === 'n') {
    const deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, dc] of deltas) {
      const r = row + dr, c = col + dc;
      if (inBounds(r, c) && !isFriend(r, c)) moves.push({ row: r, col: c });
    }
  } else if (piece.type === 'b' || piece.type === 'r' || piece.type === 'q') {
    const dirs = [];
    if (piece.type === 'b' || piece.type === 'q') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
    if (piece.type === 'r' || piece.type === 'q') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
    for (const [dr, dc] of dirs) {
      let r = row + dr, c = col + dc;
      while (inBounds(r, c)) {
        if (!board[r][c]) moves.push({ row: r, col: c });
        else {
          if (board[r][c].color === opponent) moves.push({ row: r, col: c });
          break;
        }
        r += dr; c += dc;
      }
    }
  } else if (piece.type === 'k') {
    const deltas = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (const [dr, dc] of deltas) {
      const r = row + dr, c = col + dc;
      if (inBounds(r, c) && !isFriend(r, c)) moves.push({ row: r, col: c });
    }
  }

  return moves;
}

function applyMoveToBoard(board, from, to, promotion) {
  const piece = board[from.row][from.col];
  const captured = board[to.row][to.col];

  board[to.row][to.col] = piece;
  board[from.row][from.col] = null;

  if (piece.type === 'p' && (to.row === 0 || to.row === 7)) {
    piece.type = promotion || 'q';
  }

  return { captured };
}

function getLegalMoves(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  const pseudo = generateMoves(board, row, col);
  const legal = [];
  const color = piece.color;
  const opponent = color === 'w' ? 'b' : 'w';
  for (const m of pseudo) {
    const b2 = cloneBoard(board);
    applyMoveToBoard(b2, { row, col }, m, m.promotion);
    const kingPos = findKing(b2, color);
    if (kingPos && !isSquareAttacked(b2, kingPos.row, kingPos.col, opponent)) {
      legal.push(m);
    }
  }
  return legal;
}

function getAllLegalMovesForColor(board, color) {
  const all = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== color) continue;
      const moves = getLegalMoves(board, r, c);
      for (const m of moves) all.push({ from: { row: r, col: c }, to: m });
    }
  }
  return all;
}

function computeStatus(board, turn) {
  const color = turn;
  const opponent = color === 'w' ? 'b' : 'w';
  const kingPos = findKing(board, color);
  const inCheck = kingPos ? isSquareAttacked(board, kingPos.row, kingPos.col, opponent) : false;
  const anyLegal = getAllLegalMovesForColor(board, color);
  if (anyLegal.length === 0) {
    if (inCheck) return { status: 'checkmate', winner: opponent };
    return { status: 'stalemate', winner: null };
  }
  if (inCheck) return { status: 'check', winner: null };

  const pieces = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) pieces.push(p);
    }
  }
  if (pieces.length === 2) return { status: 'draw', winner: null };
  if (pieces.length === 3) {
    const nonKing = pieces.find(p => p.type !== 'k');
    if (nonKing && (nonKing.type === 'b' || nonKing.type === 'n')) {
      return { status: 'draw', winner: null };
    }
  }
  return { status: 'playing', winner: null };
}

function createRoom(roomCode) {
  return {
    roomCode,
    adminSocketId: null,
    adminPlayerId: null,
    players: {},
    playerOrder: [],
    preferredOrder: [],
    phase: 'waiting',
    board: null,
    turn: 'w',
    status: 'playing',
    winner: null,
    moveHistory: [],
    whiteId: null,
    blackId: null,
    lastMove: null,
    pendingPromotion: null,
  };
}

function getPlayerBySocket(room, socketId) {
  return Object.values(room.players).find(p => p.socketId === socketId);
}

function reorderPlayers(room) {
  if (!room.preferredOrder || room.preferredOrder.length === 0) return;
  const newOrder = [];
  for (const id of room.preferredOrder) {
    if (room.players[id] && !newOrder.includes(id)) newOrder.push(id);
  }
  for (const id of room.playerOrder) {
    if (!newOrder.includes(id)) newOrder.push(id);
  }
  room.playerOrder = newOrder;
}

function buildState(room, forSocketId) {
  const me = getPlayerBySocket(room, forSocketId);
  const isAdmin = room.adminSocketId === forSocketId;

  let myColor = null;
  if (me) {
    if (me.id === room.whiteId) myColor = 'w';
    else if (me.id === room.blackId) myColor = 'b';
  }

  let legalMoves = {};
  if (room.phase === 'playing' && room.board &&
      room.status !== 'checkmate' && room.status !== 'stalemate' &&
      room.status !== 'draw' && !room.pendingPromotion) {
    if (myColor === room.turn) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = room.board[r][c];
          if (!p || p.color !== room.turn) continue;
          const moves = getLegalMoves(room.board, r, c);
          if (moves.length > 0) {
            legalMoves[`${r},${c}`] = moves.map(m => ({ row: m.row, col: m.col }));
          }
        }
      }
    }
  }

  return {
    roomCode: room.roomCode,
    phase: room.phase,
    isAdmin,
    board: room.board,
    turn: room.turn,
    status: room.status,
    winner: room.winner,
    lastMove: room.lastMove,
    myColor,
    legalMoves,
    whiteId: room.whiteId,
    blackId: room.blackId,
    moveHistory: room.moveHistory,
    pendingPromotion: (room.pendingPromotion && me && room.pendingPromotion.playerId === me.id)
      ? room.pendingPromotion : null,
    players: room.playerOrder.map(id => {
      const p = room.players[id];
      if (!p) return null;
      let color = null;
      if (id === room.whiteId) color = 'w';
      else if (id === room.blackId) color = 'b';
      return {
        id: p.id,
        name: p.name,
        color,
        isMe: me && me.id === id,
        isAdmin: p.isAdmin || false,
      };
    }).filter(Boolean),
  };
}

function broadcast(io, room) {
  const sent = new Set();
  Object.values(room.players).forEach(p => {
    if (sent.has(p.socketId)) return;
    const s = io.sockets.sockets.get(p.socketId);
    if (s) {
      s.emit('chess_state', buildState(room, p.socketId));
      sent.add(p.socketId);
    }
  });
  // fallback: لو الأدمن مش موجود في players لأي سبب
  if (room.adminSocketId && !sent.has(room.adminSocketId)) {
    const s = io.sockets.sockets.get(room.adminSocketId);
    if (s) s.emit('chess_state', buildState(room, room.adminSocketId));
  }
}

function squareName(row, col) {
  return String.fromCharCode(97 + col) + (8 - row);
}

function pieceLetter(p) {
  const letters = { p: '', n: 'N', b: 'B', r: 'R', q: 'Q', k: 'K' };
  const letter = letters[p.type] || '?';
  return p.color === 'w' ? (letter || 'P') : (letter || 'p').toLowerCase();
}

// =====================================================
// Setup
// =====================================================
module.exports = function setupChess(io) {
  io.on('connection', (socket) => {

    // ✅ الأدمن دلوقتي بيدخل عن طريق chess_join بالظبط زي اللاعب
    socket.on('chess_join', ({ roomCode, playerId, playerName, isAdmin }) => {
      if (!roomCode || !playerId) return;
      if (!chessRooms[roomCode]) chessRooms[roomCode] = createRoom(roomCode);
      const room = chessRooms[roomCode];

      const existing = room.players[playerId];
      if (existing) {
        existing.socketId = socket.id;
        existing.name = playerName || existing.name;
        if (isAdmin) existing.isAdmin = true;
      } else {
        room.players[playerId] = {
          id: playerId,
          socketId: socket.id,
          name: playerName || 'لاعب',
          isAdmin: !!isAdmin,
        };
        room.playerOrder.push(playerId);
      }

      if (isAdmin) {
        room.adminSocketId = socket.id;
        room.adminPlayerId = playerId;   // ✅ جديد
      }

      reorderPlayers(room);
      socket.join(`chess_${roomCode}`);
      socket.data.chessRoomCode = roomCode;
      socket.data.chessPlayerId = playerId;
      socket.data.chessIsAdmin = !!isAdmin;
      broadcast(io, room);
    });

    // legacy — لو حد لسه بيستخدمه
    socket.on('chess_admin_join', ({ roomCode }) => {
      if (!roomCode) return;
      if (!chessRooms[roomCode]) chessRooms[roomCode] = createRoom(roomCode);
      const room = chessRooms[roomCode];
      room.adminSocketId = socket.id;
      socket.join(`chess_${roomCode}`);
      socket.data.chessRoomCode = roomCode;
      socket.data.chessIsAdmin = true;
      broadcast(io, room);
    });

    socket.on('chess_set_order', ({ roomCode, playerIds }) => {
      const room = chessRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (!Array.isArray(playerIds)) return;
      room.preferredOrder = playerIds;
      reorderPlayers(room);
      broadcast(io, room);
    });

    socket.on('chess_start', ({ roomCode, whiteId, blackId }) => {
      const room = chessRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase === 'playing') return;
      if (room.playerOrder.length < 2) {
        socket.emit('chess_error', { message: 'محتاج لاعبين على الأقل (2)' });
        return;
      }

      reorderPlayers(room);

      const w = whiteId && room.players[whiteId] ? whiteId : room.playerOrder[0];
      let b = blackId && room.players[blackId] ? blackId : room.playerOrder.find(id => id !== w);
      if (!b) {
        socket.emit('chess_error', { message: 'محتاج لاعبين مختلفين' });
        return;
      }

      room.whiteId = w;
      room.blackId = b;
      room.board = initBoard();
      room.turn = 'w';
      room.status = 'playing';
      room.winner = null;
      room.moveHistory = [];
      room.lastMove = null;
      room.pendingPromotion = null;
      room.phase = 'playing';

      broadcast(io, room);
    });

    socket.on('chess_move', ({ roomCode, fromRow, fromCol, toRow, toCol, promotion }) => {
      const room = chessRooms[roomCode];
      if (!room || room.phase !== 'playing') return;
      if (room.status === 'checkmate' || room.status === 'stalemate' || room.status === 'draw') return;
      if (room.pendingPromotion) return;

      const playerId = socket.data.chessPlayerId;
      if (!playerId) return;

      let myColor = null;
      if (playerId === room.whiteId) myColor = 'w';
      else if (playerId === room.blackId) myColor = 'b';
      else return;

      if (myColor !== room.turn) return;

      const piece = room.board[fromRow]?.[fromCol];
      if (!piece || piece.color !== myColor) return;

      const legal = getLegalMoves(room.board, fromRow, fromCol);
      const move = legal.find(m => m.row === toRow && m.col === toCol);
      if (!move) return;

      const isPromotion = piece.type === 'p' && (toRow === 0 || toRow === 7);
      if (isPromotion && !promotion) {
        room.pendingPromotion = {
          playerId, fromRow, fromCol, toRow, toCol, color: myColor,
        };
        broadcast(io, room);
        return;
      }

      const from = { row: fromRow, col: fromCol };
      const to = { row: toRow, col: toCol };
      const capturedPiece = room.board[toRow][toCol];
      const notationBefore = pieceLetter(piece);
      const isCapture = !!capturedPiece;

      applyMoveToBoard(room.board, from, to, promotion || 'q');

      room.moveHistory.push({
        from: squareName(fromRow, fromCol),
        to: squareName(toRow, toCol),
        notation: `${notationBefore}${isCapture ? 'x' : ''}${squareName(toRow, toCol)}`,
        color: myColor,
      });

      room.lastMove = { from, to };
      room.turn = room.turn === 'w' ? 'b' : 'w';

      const st = computeStatus(room.board, room.turn);
      room.status = st.status;
      if (st.winner) room.winner = st.winner;

      broadcast(io, room);
    });

    socket.on('chess_promote', ({ roomCode, promotion }) => {
      const room = chessRooms[roomCode];
      if (!room || !room.pendingPromotion) return;
      const playerId = socket.data.chessPlayerId;
      if (playerId !== room.pendingPromotion.playerId) return;
      if (!['q', 'r', 'b', 'n'].includes(promotion)) return;

      const { fromRow, fromCol, toRow, toCol, color } = room.pendingPromotion;
      room.pendingPromotion = null;

      const piece = room.board[fromRow][fromCol];
      const from = { row: fromRow, col: fromCol };
      const to = { row: toRow, col: toCol };
      const capturedPiece = room.board[toRow][toCol];
      const notationBefore = pieceLetter(piece);
      const isCapture = !!capturedPiece;

      applyMoveToBoard(room.board, from, to, promotion);

      room.moveHistory.push({
        from: squareName(fromRow, fromCol),
        to: squareName(toRow, toCol),
        notation: `${notationBefore}${isCapture ? 'x' : ''}${squareName(toRow, toCol)}=${promotion.toUpperCase()}`,
        color,
      });

      room.lastMove = { from, to };
      room.turn = room.turn === 'w' ? 'b' : 'w';

      const st = computeStatus(room.board, room.turn);
      room.status = st.status;
      if (st.winner) room.winner = st.winner;

      broadcast(io, room);
    });

    socket.on('chess_reset', ({ roomCode }) => {
      const room = chessRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      room.board = null;
      room.turn = 'w';
      room.status = 'playing';
      room.winner = null;
      room.moveHistory = [];
      room.lastMove = null;
      room.pendingPromotion = null;
      room.whiteId = null;
      room.blackId = null;
      room.phase = 'waiting';
      broadcast(io, room);
    });

    function handleLeave(socket) {
      const roomCode = socket.data?.chessRoomCode;
      if (!roomCode) return;
      const room = chessRooms[roomCode];
      if (!room) return;

      // 1) حدّد اللاعب اللي خارج
      const playerId = socket.data.chessPlayerId
        || Object.keys(room.players).find(id => room.players[id].socketId === socket.id);

      // 2) شيله من قائمة اللاعبين
      if (playerId && room.players[playerId]) {
        delete room.players[playerId];
        room.playerOrder = room.playerOrder.filter(id => id !== playerId);

        if (room.whiteId === playerId) room.whiteId = null;
        if (room.blackId === playerId) room.blackId = null;
      }

      // 3) لو الأدمن نفسه خرج — شيل الفلاج واختر أدمن جديد
      if (room.adminSocketId === socket.id) {
        room.adminSocketId = null;
        room.adminPlayerId = null;

        const remaining = Object.values(room.players);
        if (remaining.length > 0) {
          const newAdmin = remaining[0];
          room.adminSocketId = newAdmin.socketId;
          room.adminPlayerId = newAdmin.id;   // ✅ السطر الجديد
          newAdmin.isAdmin = true;
        }
      }

      // 4) لو الغرفة فضيت — امسحها
      if (room.playerOrder.length === 0 && !room.adminSocketId) {
        delete chessRooms[roomCode];
        return;
      }
      broadcast(io, room);
    }

    socket.on('close_game', ({ roomCode }) => {
      const room = chessRooms[roomCode];
      if (!room) return;
      delete chessRooms[roomCode];
    });

    socket.on('chess_leave', () => handleLeave(socket));
    socket.on('disconnect', () => handleLeave(socket));
  });

  console.log('♟️ Chess Server loaded');
};