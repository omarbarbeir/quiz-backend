const path = require('path');

const escapeRooms = {};
const MAX_HINTS_PER_PUZZLE = 3;

const storyCache = {};

function loadStory(storyId) {
  if (!storyId) storyId = 'hospital';
  if (storyCache[storyId]) return storyCache[storyId];

  const folderMap = {
    hospital: 'story1_hospital',
  };

  const folder = folderMap[storyId];
  if (!folder) {
    console.error(`[EscapeRoom] Unknown storyId: ${storyId}`);
    return { roomsData: {}, puzzlesData: {}, storyData: {}, config: {} };
  }

  try {
    const basePath = path.join(__dirname, 'data', 'stories', folder);
    const roomsData = require(path.join(basePath, 'roomsData'));
    const puzzlesData = require(path.join(basePath, 'puzzlesData'));
    const storyData = require(path.join(basePath, 'storyData'));
    const config = require(path.join(basePath, 'config'));

    const loaded = { roomsData, puzzlesData, storyData, config };
    storyCache[storyId] = loaded;
    console.log(`[EscapeRoom] Story loaded: ${storyId} (${folder})`);
    return loaded;
  } catch (e) {
    console.error(`[EscapeRoom] Failed to load story: ${storyId}`, e.message);
    return { roomsData: {}, puzzlesData: {}, storyData: {}, config: {} };
  }
}

function createGame(roomCode) {
  return {
    roomCode,
    phase: 'lobby',
    storyId: 'hospital',
    startedAt: null,
    currentRoomId: 'karim_apartment',
    players: {},
    adminSocketId: null,
    inventory: [],
    solvedPuzzles: {},
    unlockedHotspots: {},
    openedContainers: {},
    collectedItems: {},
    hintsUsed: {},
    revealedHints: {},
    lightsState: {},
    roomsData: {},
    puzzlesData: {},
    storyData: {},
    config: {},
  };
}

function publicStateFor(room, playerId) {
  const me = room.players[playerId];
  return {
    roomCode: room.roomCode,
    phase: room.phase,
    storyId: room.storyId,
    startedAt: room.startedAt,
    currentRoomId: room.currentRoomId,
    inventory: room.inventory,
    solvedPuzzles: room.solvedPuzzles,
    unlockedHotspots: room.unlockedHotspots,
    openedContainers: room.openedContainers,
    collectedItems: room.collectedItems,
    hintsUsed: room.hintsUsed,
    lightsState: room.lightsState,
    players: Object.values(room.players).map((p) => ({
      id: p.id,
      name: p.name,
      roomId: p.roomId,
      isAdmin: !!p.isAdmin,
    })),
    me: me
      ? {
          id: playerId,
          name: me.name,
          roomId: me.roomId,
          isAdmin: !!me.isAdmin,
        }
      : null,
  };
}

function broadcastState(io, room) {
  Object.values(room.players).forEach((p) => {
    const s = io.sockets.sockets.get(p.socketId);
    if (!s) return;
    s.emit('er_state', publicStateFor(room, p.id));
  });
}

function getPlayerBySocket(room, socketId) {
  return Object.values(room.players).find((p) => p.socketId === socketId);
}

function playersInRoom(io, room, roomId) {
  return Object.values(room.players).filter((p) => p.roomId === roomId);
}

function emitToPlayersInRoom(io, room, roomId, event, payload) {
  playersInRoom(io, room, roomId).forEach((p) => {
    const s = io.sockets.sockets.get(p.socketId);
    if (s) s.emit(event, payload);
  });
}

module.exports = function setupEscapeRoom(io) {
  io.on('connection', (socket) => {
    // ---------------------------------------------------------
    // Admin Join
    // ---------------------------------------------------------
    socket.on('er_admin_join', ({ roomCode, playerId, playerName, storyId }) => {
      if (!roomCode) return;
      if (!escapeRooms[roomCode]) escapeRooms[roomCode] = createGame(roomCode);
      const room = escapeRooms[roomCode];
      room.adminSocketId = socket.id;
      if (storyId) room.storyId = storyId;

      Object.keys(room.players).forEach((pid) => {
        if (room.players[pid].socketId === socket.id) {
          delete room.players[pid];
        }
      });

      const adminId = playerId || `admin_${socket.id}`;
      room.players[adminId] = {
        id: adminId,
        name: playerName || 'Quiz Master',
        socketId: socket.id,
        roomId: room.currentRoomId,
        isAdmin: true,
      };

      socket.join(`er_${roomCode}`);
      socket.data.erRoomCode = roomCode;
      socket.data.erIsAdmin = true;
      socket.data.erPlayerId = adminId;

      broadcastState(io, room);
    });

    // ---------------------------------------------------------
    // Player Join
    // ---------------------------------------------------------
    socket.on('er_join', ({ roomCode, playerId, playerName }) => {
      if (!roomCode || !playerId) return;
      if (!escapeRooms[roomCode]) escapeRooms[roomCode] = createGame(roomCode);
      const room = escapeRooms[roomCode];

      const existing = room.players[playerId];
      if (existing) {
        existing.socketId = socket.id;
        existing.name = playerName || existing.name;
      } else {
        room.players[playerId] = {
          id: playerId,
          name: playerName || 'محقق',
          socketId: socket.id,
          roomId: room.currentRoomId,
        };
      }

      socket.join(`er_${roomCode}`);
      socket.data.erRoomCode = roomCode;
      socket.data.erPlayerId = playerId;

      socket.emit('er_joined', { roomCode, playerId });
      broadcastState(io, room);
    });

    // ---------------------------------------------------------
    // Start Game
    // ---------------------------------------------------------
    socket.on('er_start', ({ roomCode, startRoomId, storyId }) => {
      const room = escapeRooms[roomCode];
      if (!room) return;
      if (room.phase === 'playing') return;

      const effectiveStoryId = storyId || room.storyId || 'hospital';
      const story = loadStory(effectiveStoryId);

      room.storyId = effectiveStoryId;
      room.roomsData = story.roomsData;
      room.puzzlesData = story.puzzlesData;
      room.storyData = story.storyData;
      room.config = story.config;

      const defaultStart =
        story.config?.startRoom ||
        Object.keys(story.roomsData)[0] ||
        'karim_apartment';
      room.currentRoomId = startRoomId || defaultStart;

      room.phase = 'playing';
      room.startedAt = Date.now();
      room.inventory = [];
      room.solvedPuzzles = {};
      room.unlockedHotspots = {};
      room.openedContainers = {};
      room.collectedItems = {};
      room.hintsUsed = {};
      room.revealedHints = {};
      room.lightsState = {};

      Object.values(room.players).forEach((p) => {
        p.roomId = room.currentRoomId;
      });

      io.to(`er_${roomCode}`).emit('er_started', { roomCode });
      broadcastState(io, room);

      // ✅ Schedule power cut for hospital story
      if (effectiveStoryId === 'hospital') {
        const delay = 180 * 1000;
        setTimeout(() => {
          const r = escapeRooms[roomCode];
          if (!r || r.phase !== 'playing') return;
          io.to(`er_${roomCode}`).emit('er_power_cut', {
            roomId: 'karim_apartment',
          });
        }, delay);
      }
    });

    // ---------------------------------------------------------
    // Change Room
    // ---------------------------------------------------------
    socket.on('er_change_room', ({ roomCode, targetRoomId }) => {
      const room = escapeRooms[roomCode];
      if (!room || room.phase !== 'playing') return;
      const player = getPlayerBySocket(room, socket.id);
      if (!player) return;
      if (!room.roomsData[targetRoomId]) return;

      player.roomId = targetRoomId;
      const allInOne = Object.values(room.players).every(
        (p) => p.roomId === targetRoomId
      );
      if (allInOne) room.currentRoomId = targetRoomId;

      broadcastState(io, room);
    });

    // ---------------------------------------------------------
    // Toggle Lights
    // ---------------------------------------------------------
    socket.on('er_toggle_lights', ({ roomCode, roomId }) => {
      const room = escapeRooms[roomCode];
      if (!room) return;

      const current = room.lightsState[roomId] || false;
      room.lightsState[roomId] = !current;

      emitToPlayersInRoom(io, room, roomId, 'er_lights_toggled', {
        roomId,
        lightsOn: room.lightsState[roomId],
      });

      broadcastState(io, room);
    });

    // ---------------------------------------------------------
    // TV Remote (Forced Video)
    // ---------------------------------------------------------
    socket.on('er_tv_remote', ({ roomCode }) => {
      const room = escapeRooms[roomCode];
      if (!room || room.phase !== 'playing') return;

      io.to(`er_${roomCode}`).emit('er_forced_video', {
        videoUrl: '/videos/haunted_tape.mp4',
      });

      // After 30 seconds → send end + scream
      setTimeout(() => {
        io.to(`er_${roomCode}`).emit('er_forced_video_ended', {
          nextEvent: 'scream',
        });
      }, 30000);
    });

    // ---------------------------------------------------------
    // Interact with Hotspot
    // ---------------------------------------------------------
    socket.on('er_interact', ({ roomCode, roomId, hotspotId, itemId }) => {
      const room = escapeRooms[roomCode];
      if (!room || room.phase !== 'playing') return;

      const player = getPlayerBySocket(room, socket.id);
      if (!player) return;

      const roomDef = room.roomsData[roomId];
      if (!roomDef) return;
      const hotspot = roomDef.hotspots.find((h) => h.id === hotspotId);
      if (!hotspot) return;

      // light_switch handled separately
      if (hotspot.type === 'light_switch') return;
      if (hotspot.type === 'tv_remote') return;

      if (
        hotspot.requiredItem &&
        !room.inventory.includes(hotspot.requiredItem)
      ) {
        socket.emit('er_error', { message: 'محتاج أداة معيّنة' });
        return;
      }

      if (itemId && !room.inventory.includes(itemId)) {
        socket.emit('er_error', { message: 'الأداة غير موجودة في الحقيبة' });
        return;
      }

      if (
        hotspot.requiresPuzzle &&
        !room.solvedPuzzles[hotspot.requiresPuzzle]
      ) {
        socket.emit('er_error', { message: 'مقفول. لازم تحلوا لغز قبله.' });
        return;
      }

      if (hotspot.puzzleId && !room.solvedPuzzles[hotspot.puzzleId]) {
        socket.emit('er_open_puzzle', {
          puzzleId: hotspot.puzzleId,
          hotspotId,
        });
        return;
      }

      if (
        hotspot.lockedByPuzzle &&
        !room.solvedPuzzles[hotspot.lockedByPuzzle]
      ) {
        socket.emit('er_error', { message: 'مقفول. لازم تحلوا لغز قبله.' });
        return;
      }

      // Win
      if (hotspot.isWin) {
        room.phase = 'won';
        room.wonAt = Date.now();
        io.to(`er_${roomCode}`).emit('er_sfx', { sfx: 'door_open' });
        io.to(`er_${roomCode}`).emit('er_won', {
          byPlayer: player.id,
          byPlayerName: player.name,
          at: room.wonAt,
        });
        broadcastState(io, room);
        return;
      }

      // Normal
      switch (hotspot.type) {
        case 'open_container': {
          room.openedContainers[hotspotId] = true;
          if (
            hotspot.givesItem &&
            !room.inventory.includes(hotspot.givesItem)
          ) {
            room.inventory.push(hotspot.givesItem);
            room.collectedItems[hotspot.givesItem] = true;
          }
          // ✅ Sound only to players in same room
          emitToPlayersInRoom(io, room, roomId, 'er_sfx', {
            sfx: hotspot.sfx || 'drawer_open',
            roomId,
          });
          break;
        }
        case 'inspect': {
          // ✅ Sound only to players in same room
          emitToPlayersInRoom(io, room, roomId, 'er_sfx', {
            sfx: hotspot.sfx || 'paper',
            roomId,
          });
          break;
        }
        case 'exit':
          break;
        default:
          break;
      }

      broadcastState(io, room);
      socket.emit('er_interact_result', { hotspotId, hotspot });
    });

    // ---------------------------------------------------------
    // Puzzle Submit
    // ---------------------------------------------------------
    socket.on('er_puzzle_submit', ({ roomCode, puzzleId, answer }) => {
      const room = escapeRooms[roomCode];
      if (!room || room.phase !== 'playing') return;

      if (room.solvedPuzzles[puzzleId]) {
        socket.emit('er_puzzle_result', { puzzleId, correct: true });
        return;
      }

      const puzzle = room.puzzlesData[puzzleId];
      if (!puzzle) return;

      const correct =
        String(answer).trim() === String(puzzle.solution).trim();

      if (correct) {
        room.solvedPuzzles[puzzleId] = true;

        if (puzzle.reward && !room.inventory.includes(puzzle.reward)) {
          room.inventory.push(puzzle.reward);
        }
        if (puzzle.unlocksHotspots) {
          puzzle.unlocksHotspots.forEach((hid) => {
            room.unlockedHotspots[hid] = true;
          });
        }
        io.to(`er_${roomCode}`).emit('er_sfx', { sfx: 'puzzle_solved' });
      } else {
        io.to(`er_${roomCode}`).emit('er_sfx', { sfx: 'puzzle_failed' });
        io.to(`er_${roomCode}`).emit('er_infrasound_pulse', {
          duration: 800,
          freq: 16,
        });
      }

      socket.emit('er_puzzle_result', { puzzleId, correct });
      broadcastState(io, room);
    });

    // ---------------------------------------------------------
    // Hint
    // ---------------------------------------------------------
    socket.on('er_request_hint', ({ roomCode, puzzleId }) => {
      const room = escapeRooms[roomCode];
      if (!room) return;
      const puzzle = room.puzzlesData[puzzleId];
      if (!puzzle || !puzzle.hints) return;

      const used = room.hintsUsed[puzzleId] || 0;
      const maxAllowed = Math.min(puzzle.hints.length, MAX_HINTS_PER_PUZZLE);
      if (used >= maxAllowed) return;

      room.hintsUsed[puzzleId] = used + 1;
      if (!room.revealedHints[puzzleId]) room.revealedHints[puzzleId] = [];
      room.revealedHints[puzzleId].push(puzzle.hints[used]);

      socket.emit('er_hint', {
        puzzleId,
        hint: puzzle.hints[used],
        level: used + 1,
        total: maxAllowed,
      });

      broadcastState(io, room);
    });

    // ---------------------------------------------------------
    // Leave / Disconnect
    // ---------------------------------------------------------
    socket.on('er_leave', ({ roomCode }) => {
      const room = escapeRooms[roomCode];
      if (!room) return;
      const player = getPlayerBySocket(room, socket.id);
      if (player) delete room.players[player.id];
      if (Object.keys(room.players).length === 0) {
        delete escapeRooms[roomCode];
      } else {
        broadcastState(io, room);
      }
    });

    socket.on('disconnect', () => {
      const roomCode = socket.data?.erRoomCode;
      if (!roomCode) return;
      const room = escapeRooms[roomCode];
      if (!room) return;

      if (socket.data?.erIsAdmin && room.adminSocketId === socket.id) {
        room.adminSocketId = null;
      }

      const player = getPlayerBySocket(room, socket.id);
      if (player) {
        delete room.players[player.id];
        if (Object.keys(room.players).length === 0) {
          delete escapeRooms[roomCode];
        } else {
          broadcastState(io, room);
        }
      }
    });
  });

  console.log('🚪 Escape Room Server loaded (Hospital Story)');
};