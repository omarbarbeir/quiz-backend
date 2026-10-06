// battleshipServer.js
const ROWS = 11, COLS = 11;
const PLAY_ROWS = 10, PLAY_COLS = 10;
const ALL_SHIP_IDS = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer'];

const createEmptyGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

function setupBattleshipServer(socket, io, rooms) {

  socket.on('battleship_start', ({ roomCode, playerX, playerO }) => {
    const room = rooms[roomCode];
    if (!room) return;
    if (room.admin !== socket.id) return;

    const players = {};
    players[playerX.id] = {
      id: playerX.id, name: playerX.name,
      grid: createEmptyGrid(), enemyGrid: createEmptyGrid(),
      ships: [], ready: false,
    };
    players[playerO.id] = {
      id: playerO.id, name: playerO.name,
      grid: createEmptyGrid(), enemyGrid: createEmptyGrid(),
      ships: [], ready: false,
    };

    room.battleship = {
      playerX, playerO, players,
      phase: 'placement',
      turn: playerX.id,
      winner: null,
      lastMove: null,
    };

    emitStateToRoom(io, room, room.battleship);
  });

  socket.on('battleship_place', ({ roomCode, playerId, shipId, positions }) => {
    const room = rooms[roomCode];
    if (!room || !room.battleship) return;
    const game = room.battleship;
    const player = game.players[playerId];
    if (!player || player.ready) return;

    player.ships = player.ships.filter(s => s.shipId !== shipId);
    for (let r = 1; r <= PLAY_ROWS; r++)
      for (let c = 1; c <= PLAY_COLS; c++)
        if (player.grid[r][c] === shipId) player.grid[r][c] = null;

    positions.forEach(({ r, c }) => { player.grid[r][c] = shipId; });
    player.ships.push({ shipId, positions });

    emitStateToRoom(io, room, game);
  });

  socket.on('battleship_remove', ({ roomCode, playerId, shipId }) => {
    const room = rooms[roomCode];
    if (!room || !room.battleship) return;
    const game = room.battleship;
    const player = game.players[playerId];
    if (!player || player.ready) return;

    const ship = player.ships.find(s => s.shipId === shipId);
    if (!ship) return;
    ship.positions.forEach(({ r, c }) => {
      if (player.grid[r][c] === shipId) player.grid[r][c] = null;
    });
    player.ships = player.ships.filter(s => s.shipId !== shipId);

    emitStateToRoom(io, room, game);
  });

  socket.on('battleship_ready', ({ roomCode, playerId }) => {
    const room = rooms[roomCode];
    if (!room || !room.battleship) return;
    const game = room.battleship;
    const player = game.players[playerId];
    if (!player) return;

    if (player.ships.length < ALL_SHIP_IDS.length) {
      socket.emit('battleship_error', { message: 'لازم تضع كل القطع أولاً' });
      return;
    }

    player.ready = true;

    const allReady = Object.values(game.players).every(p => p.ready);
    if (allReady) {
      game.phase = 'battle';
      game.turn = game.playerX.id;
    }

    emitStateToRoom(io, room, game);
  });

  socket.on('battleship_attack', ({ roomCode, playerId, row, col }) => {
    const room = rooms[roomCode];
    if (!room || !room.battleship) return;
    const game = room.battleship;
    if (game.phase !== 'battle' || game.winner) return;
    if (game.turn !== playerId) return;

    const attacker = game.players[playerId];
    const defenderId = Object.keys(game.players).find(id => id !== playerId);
    const defender = game.players[defenderId];
    if (!attacker || !defender) return;

    if (row < 1 || row > PLAY_ROWS || col < 1 || col > PLAY_COLS) return;
    if (attacker.enemyGrid[row][col] !== null) return;

    const cellValue = defender.grid[row][col];
    let soundType;

    if (cellValue === null) {
      attacker.enemyGrid[row][col] = 'miss';
      defender.grid[row][col] = 'miss';
      soundType = 'water';
    } else {
      const shipId = cellValue;
      attacker.enemyGrid[row][col] = `hit-${shipId}`;
      defender.grid[row][col] = `hit-${shipId}`;

      const ship = defender.ships.find(s => s.shipId === shipId);
      const isSunk = ship && ship.positions.every(({ r, c }) =>
        defender.grid[r][c] === `hit-${shipId}`
      );

      if (isSunk) {
        ship.positions.forEach(({ r, c }) => {
          attacker.enemyGrid[r][c] = `sunk-${shipId}`;
        });
        soundType = 'sunk';
      } else {
        soundType = 'explosion';
      }

      const allSunk = defender.ships.every(s =>
        s.positions.every(({ r, c }) => defender.grid[r][c]?.startsWith?.('hit-'))
      );
      if (allSunk) {
        game.winner = playerId;
        game.phase = 'ended';
      }
    }

    if (!game.winner) game.turn = defenderId;
    game.lastMove = { by: playerId, row, col, hit: cellValue !== null, soundType };

    // ✅ التصحيح: io.to بدل socket.to حتى يسمع الطرفان
    io.to(roomCode).emit('battleship_sound', { type: soundType });

    emitStateToRoom(io, room, game);
  });

  socket.on('battleship_reset', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || !room.battleship) return;
    if (room.admin !== socket.id) return;

    const game = room.battleship;
    Object.values(game.players).forEach(p => {
      p.grid = createEmptyGrid();
      p.enemyGrid = createEmptyGrid();
      p.ships = [];
      p.ready = false;
    });
    game.phase = 'placement';
    game.turn = game.playerX.id;
    game.winner = null;
    game.lastMove = null;
    emitStateToRoom(io, room, game);
  });

  socket.on('battleship_init', ({ roomCode, playerId }) => {
    const room = rooms[roomCode];
    if (!room || !room.battleship) return;
    emitStateToPlayer(io, room, room.battleship, playerId);
  });

  socket.on('close_game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    room.battleship = null;
  });
}

function emitStateToRoom(io, room, game) {
  room.players.forEach(p => {
    const data = buildStateFor(game, p.id);
    io.to(p.socketId).emit('battleship_state', data);
  });
}

function emitStateToPlayer(io, room, game, playerId) {
  const p = room.players.find(pl => pl.id === playerId);
  if (!p) return;
  io.to(p.socketId).emit('battleship_state', buildStateFor(game, playerId));
}

function buildStateFor(game, playerId) {
  const me = game.players[playerId];
  const common = {
    phase: game.phase,
    turn: game.turn,
    winner: game.winner,
    lastMove: game.lastMove,
    playerX: game.playerX,
    playerO: game.playerO,
    myId: playerId,
  };

  if (!me) {
    return { ...common, spectator: true };
  }

  return {
    ...common,
    spectator: false,
    ownGrid: me.grid,
    enemyGrid: me.enemyGrid,
    ships: me.ships,
    ready: me.ready,
  };
}

module.exports = setupBattleshipServer;