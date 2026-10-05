/**
 * ============================================================
 *  solitaireServer.js — Klondike Solitaire (فردية)
 *  ✅ الأدمن بقى لاعب كامل في players[]
 *  ✅ + close_game listener لتنظيف الغرفة
 * ============================================================
 */

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const solitaireRooms = {};
if (typeof global !== 'undefined') global.solitaireRooms = solitaireRooms;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rankValue(rank) {
  if (rank === 'A') return 1;
  if (rank === 'J') return 11;
  if (rank === 'Q') return 12;
  if (rank === 'K') return 13;
  return parseInt(rank, 10);
}

function isRed(suit) {
  return suit === 'hearts' || suit === 'diamonds';
}

function getSuitIndex(suit) {
  return SUITS.indexOf(suit);
}

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${suit}_${rank}`, suit, rank, faceUp: false });
    }
  }
  return deck;
}

function dealNewGame() {
  const deck = shuffle(createDeck());
  const tableau = [[], [], [], [], [], [], []];
  for (let col = 0; col < 7; col++) {
    for (let i = 0; i <= col; i++) {
      const card = deck.pop();
      card.faceUp = (i === col);
      tableau[col].push(card);
    }
  }
  const stock = deck.map(c => ({ ...c, faceUp: false }));
  return {
    tableau,
    foundations: [[], [], [], []],
    stock,
    waste: [],
    moves: 0,
    startTime: Date.now(),
    gameWon: false,
  };
}

function canStackOnTableau(card, targetCard) {
  if (!targetCard) return card.rank === 'K';
  if (rankValue(card.rank) !== rankValue(targetCard.rank) - 1) return false;
  if (isRed(card.suit) === isRed(targetCard.suit)) return false;
  return true;
}

function canGoToFoundation(card, foundationPile) {
  if (foundationPile.length === 0) return card.rank === 'A';
  const top = foundationPile[foundationPile.length - 1];
  if (top.suit !== card.suit) return false;
  return rankValue(card.rank) === rankValue(top.rank) + 1;
}

function checkWin(game) {
  return game.foundations.every(f => f.length === 13);
}

function flipTopCard(col) {
  if (col.length > 0 && !col[col.length - 1].faceUp) {
    col[col.length - 1].faceUp = true;
  }
}

function createRoom(roomCode) {
  return {
    roomCode,
    adminSocketId: null,
    adminPlayerId: null,   // ✅ جديد
    players: {},
    playerOrder: [],
  };
}

function buildState(room, socketId) {
  const me = Object.values(room.players).find(p => p.socketId === socketId);
  const isAdmin = !!(me && me.isAdmin) || room.adminSocketId === socketId;

  return {
    roomCode: room.roomCode,
    isAdmin,
    me: me ? {
      id: me.id,
      name: me.name,
      game: me.game,
      isAdmin: !!me.isAdmin,
    } : null,
    players: room.playerOrder.map(id => {
      const p = room.players[id];
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        moves: p.game?.moves || 0,
        gameWon: p.game?.gameWon || false,
        foundationCount: p.game ? p.game.foundations.reduce((s, f) => s + f.length, 0) : 0,
        elapsed: p.game ? Math.floor((Date.now() - p.game.startTime) / 1000) : 0,
        isAdmin: !!p.isAdmin,
      };
    }).filter(Boolean),
  };
}

function broadcast(io, room) {
  const sent = new Set();
  room.playerOrder.forEach(id => {
    const p = room.players[id];
    if (!p || sent.has(p.socketId)) return;
    const s = io.sockets.sockets.get(p.socketId);
    if (s) {
      s.emit('solitaire_state', buildState(room, p.socketId));
      sent.add(p.socketId);
    }
  });
  // Fallback للأدمن لو مش موجود في players (legacy)
  if (room.adminSocketId && !sent.has(room.adminSocketId)) {
    const s = io.sockets.sockets.get(room.adminSocketId);
    if (s) s.emit('solitaire_state', buildState(room, room.adminSocketId));
  }
}

function handleLeave(io, socket, roomCode) {
  const room = solitaireRooms[roomCode];
  if (!room) return;

  // ✅ لو الأدمن خرج، نشيل adminSocketId
  if (room.adminSocketId === socket.id) {
    room.adminSocketId = null;
  }

  const playerId = socket.data.solitairePlayerId
    || Object.keys(room.players).find(id => room.players[id].socketId === socket.id);

  if (playerId && room.players[playerId]) {
    delete room.players[playerId];
    room.playerOrder = room.playerOrder.filter(id => id !== playerId);
    if (room.adminPlayerId === playerId) room.adminPlayerId = null;
  }

  if (room.playerOrder.length === 0 && !room.adminSocketId) {
    delete solitaireRooms[roomCode];
    return;
  }

  broadcast(io, room);
}

module.exports = function setupSolitaire(io) {
  io.on('connection', (socket) => {

    // ✅ انضمام لاعب (أدمن أو عادي) — بنفس الحدث
    socket.on('solitaire_join', ({ roomCode, playerId, playerName, isAdmin }) => {
      if (!roomCode || !playerId) return;
      if (!solitaireRooms[roomCode]) solitaireRooms[roomCode] = createRoom(roomCode);
      const room = solitaireRooms[roomCode];

      if (isAdmin) {
        room.adminSocketId = socket.id;
        room.adminPlayerId = playerId;
      }

      const existing = room.players[playerId];
      if (existing) {
        existing.socketId = socket.id;
        existing.name = playerName || existing.name;
        existing.isAdmin = !!isAdmin;
      } else {
        room.players[playerId] = {
          id: playerId,
          socketId: socket.id,
          name: playerName || 'لاعب',
          game: dealNewGame(),
          isAdmin: !!isAdmin,
        };
        room.playerOrder.push(playerId);
      }
      socket.join(`solitaire_${roomCode}`);
      socket.data.solitaireRoomCode = roomCode;
      socket.data.solitairePlayerId = playerId;
      broadcast(io, room);
    });

    // ✅ legacy — للأمان
    socket.on('solitaire_admin_join', ({ roomCode }) => {
      if (!roomCode) return;
      if (!solitaireRooms[roomCode]) solitaireRooms[roomCode] = createRoom(roomCode);
      const room = solitaireRooms[roomCode];
      room.adminSocketId = socket.id;
      socket.join(`solitaire_${roomCode}`);
      socket.data.solitaireRoomCode = roomCode;
      broadcast(io, room);
    });

    socket.on('solitaire_new_game', ({ roomCode }) => {
      const room = solitaireRooms[roomCode];
      if (!room) return;
      const playerId = socket.data.solitairePlayerId;
      const player = room.players[playerId];
      if (!player) return;
      player.game = dealNewGame();
      broadcast(io, room);
    });

    socket.on('solitaire_draw', ({ roomCode }) => {
      const room = solitaireRooms[roomCode];
      if (!room) return;
      const playerId = socket.data.solitairePlayerId;
      const player = room.players[playerId];
      if (!player || !player.game) return;
      const game = player.game;
      if (game.gameWon) return;

      if (game.stock.length === 0) {
        if (game.waste.length === 0) return;
        game.stock = game.waste
          .slice()
          .reverse()
          .map(c => ({ ...c, faceUp: false }));
        game.waste = [];
      } else {
        const card = game.stock.pop();
        card.faceUp = true;
        game.waste.push(card);
      }
      game.moves++;
      broadcast(io, room);
    });

    socket.on('solitaire_move', ({ roomCode, fromType, fromCol, cardIndex, toType, toCol }) => {
      const room = solitaireRooms[roomCode];
      if (!room) return;
      const playerId = socket.data.solitairePlayerId;
      const player = room.players[playerId];
      if (!player || !player.game) return;
      const game = player.game;
      if (game.gameWon) return;

      let movingCards = [];

      if (fromType === 'waste') {
        if (cardIndex !== game.waste.length - 1) return;
        movingCards = [game.waste[game.waste.length - 1]];
      } else if (fromType === 'tableau') {
        if (fromCol < 0 || fromCol > 6) return;
        const col = game.tableau[fromCol];
        if (cardIndex < 0 || cardIndex >= col.length) return;
        for (let i = cardIndex; i < col.length; i++) {
          if (!col[i].faceUp) return;
        }
        movingCards = col.slice(cardIndex);
      } else {
        return;
      }

      if (movingCards.length === 0) return;
      const firstCard = movingCards[0];

      if (toType === 'foundation' && movingCards.length > 1) return;

      let destinationValid = false;
      let targetCol = null;

      if (toType === 'foundation') {
        const suitIdx = getSuitIndex(firstCard.suit);
        const foundation = game.foundations[suitIdx];
        if (canGoToFoundation(firstCard, foundation)) {
          destinationValid = true;
          targetCol = suitIdx;
        }
      } else if (toType === 'tableau') {
        if (toCol < 0 || toCol > 6) return;
        if (fromType === 'tableau' && toCol === fromCol) return;
        const destCol = game.tableau[toCol];
        const destTop = destCol[destCol.length - 1];
        if (canStackOnTableau(firstCard, destTop)) {
          destinationValid = true;
          targetCol = toCol;
        }
      }

      if (!destinationValid) return;

      if (fromType === 'waste') {
        game.waste.pop();
      } else if (fromType === 'tableau') {
        game.tableau[fromCol] = game.tableau[fromCol].slice(0, cardIndex);
        flipTopCard(game.tableau[fromCol]);
      }

      if (toType === 'foundation') {
        game.foundations[targetCol].push(...movingCards);
      } else if (toType === 'tableau') {
        game.tableau[targetCol].push(...movingCards);
      }

      game.moves++;

      if (checkWin(game)) {
        game.gameWon = true;
      }

      broadcast(io, room);
    });

    socket.on('solitaire_leave', ({ roomCode }) => handleLeave(io, socket, roomCode));
    socket.on('disconnect', () => {
      const roomCode = socket.data?.solitaireRoomCode;
      if (roomCode) handleLeave(io, socket, roomCode);
    });

    // ✅ تنظيف الغرفة عند إغلاق اللعبة
    socket.on('close_game', ({ roomCode }) => {
      const room = solitaireRooms[roomCode];
      if (!room) return;
      delete solitaireRooms[roomCode];
    });
  });
  console.log('🃏 Solitaire Server loaded');
};