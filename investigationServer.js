/**
 * ============================================================
 *  investigationServer.js — "المحققون" مع Crime Board
 *  ✅ الأدمن بقى لاعب كامل في players[]
 *  ✅ + close_game listener لتنظيف الغرفة
 * ============================================================
 */

const CASES = require('./data/investigationCases');

const ACCUSATION_TIME_MS = 120 * 1000;

const investigationRooms = {};

// ============================================================
function createRoom(roomCode) {
  return {
    roomCode,
    adminSocketId: null,
    adminPlayerId: null,   // ✅ جديد
    players: {},
    phase: 'intro', // intro | lobby | investigation | accusation | reveal
    phaseStartedAt: Date.now(),
    caseData: null,
    availableQuestions: {},
    askedQuestions: [],
    questionsLeft: 0,
    boardItems: [],
    boardConnections: [],
    collectedEvidence: [],
    votes: {},
    solution: null,
    teamWon: null,
    _accusationTimer: null,
  };
}

function buildAvailableFromInitial(suspects) {
  const avail = {};
  suspects.forEach((s) => {
    avail[s.id] = new Set(s.initialQuestions || []);
  });
  return avail;
}

function serializeAvailable(room) {
  const out = {};
  const avail = room.availableQuestions;
  Object.entries(avail).forEach(([sid, set]) => {
    const suspect = room.caseData.suspects.find((s) => s.id === sid);
    if (!suspect) { out[sid] = []; return; }
    out[sid] = Array.from(set).map((qid) => ({
      id: qid,
      text: suspect.questions[qid]?.text || '?',
    }));
  });
  return out;
}

function buildState(room, forSocketId) {
  const me = Object.values(room.players).find((p) => p.socketId === forSocketId);
  const isAdmin = !!(me && me.isAdmin) || room.adminSocketId === forSocketId;

  const state = {
    roomCode: room.roomCode,
    phase: room.phase,
    phaseStartedAt: room.phaseStartedAt,
    accusationTime: ACCUSATION_TIME_MS,
    caseInfo: room.caseData
      ? {
          id: room.caseData.id,
          title: room.caseData.title,
          subtitle: room.caseData.subtitle,
          description: room.caseData.description,
          victim: room.caseData.victim,
          location: room.caseData.location,
          timeOfDeath: room.caseData.timeOfDeath,
          causeOfDeath: room.caseData.causeOfDeath,
          weaponOptions: room.caseData.weaponOptions,
          motiveOptions: room.caseData.motiveOptions,
          totalQuestions: room.caseData.totalQuestions,
          suspects: room.caseData.suspects.map((s) => ({
            id: s.id, name: s.name, role: s.role, age: s.age,
            avatar: s.avatar, photo: s.photo,
            publicMotive: s.publicMotive, bio: s.bio,
          })),
          evidence: room.caseData.evidence.map((e) => {
            const collected = room.collectedEvidence.includes(e.id);
            return collected
              ? e
              : { id: e.id, icon: '?', name: 'مقفول', description: 'لازم تكتشفه', hidden: true };
          }),
        }
      : null,
    availableQuestions: room.caseData ? serializeAvailable(room) : {},
    askedQuestions: room.askedQuestions,
    questionsLeft: room.questionsLeft,
    players: Object.values(room.players).map((p) => ({
      id: p.id, name: p.name, isAdmin: !!p.isAdmin,
    })),
    votesCount: Object.keys(room.votes).length,
    boardItems: room.boardItems,
    boardConnections: room.boardConnections,
    collectedEvidence: room.collectedEvidence,
  };

  if (room.phase === 'reveal' && room.solution) {
    state.solution = room.solution;
    state.teamWon = room.teamWon;
  }

  // ✅ me — الأدمن بقى جزء من players
  if (me) {
    state.me = {
      id: me.id,
      name: me.name,
      isAdmin: !!me.isAdmin,
      hasVoted: !!room.votes[me.id],
    };
  } else {
    state.me = { id: null, name: 'Spectator', isAdmin: false, hasVoted: false };
  }

  return state;
}

function broadcast(io, room) {
  const sent = new Set();
  Object.values(room.players).forEach((p) => {
    if (sent.has(p.socketId)) return;
    const s = io.sockets.sockets.get(p.socketId);
    if (s) {
      s.emit('inv_state', buildState(room, p.socketId));
      sent.add(p.socketId);
    }
  });
  // Fallback للأدمن لو مش موجود في players (legacy)
  if (room.adminSocketId && !sent.has(room.adminSocketId)) {
    const s = io.sockets.sockets.get(room.adminSocketId);
    if (s) s.emit('inv_state', buildState(room, room.adminSocketId));
  }
}

function clearTimers(room) {
  if (room._accusationTimer) { clearTimeout(room._accusationTimer); room._accusationTimer = null; }
}

function tallyVotes(room) {
  const counts = { culprit: {}, weapon: {}, motive: {} };
  Object.values(room.votes).forEach((v) => {
    counts.culprit[v.culpritId] = (counts.culprit[v.culpritId] || 0) + 1;
    counts.weapon[v.weapon] = (counts.weapon[v.weapon] || 0) + 1;
    counts.motive[v.motive] = (counts.motive[v.motive] || 0) + 1;
  });
  const pick = (obj) => {
    let best = null, max = -1;
    Object.entries(obj).forEach(([k, c]) => { if (c > max) { max = c; best = k; } });
    return best;
  };
  return { culpritId: pick(counts.culprit), weapon: pick(counts.weapon), motive: pick(counts.motive) };
}

function goToReveal(io, room) {
  clearTimers(room);
  const pick = tallyVotes(room);
  const sol = room.caseData.solution;
  const culpritCorrect = pick.culpritId === sol.culpritId;
  const weaponCorrect = pick.weapon === sol.weapon;
  const motiveCorrect = pick.motive === sol.motive;
  room.teamWon = culpritCorrect && weaponCorrect && motiveCorrect;
  room.solution = {
    ...sol,
    culpritName: room.caseData.suspects.find((s) => s.id === sol.culpritId)?.name || '?',
    teamPicks: pick,
    culpritCorrect, weaponCorrect, motiveCorrect,
  };
  room.phase = 'reveal';
  room.phaseStartedAt = Date.now();
  broadcast(io, room);
}

function handleLeave(io, socket, roomCode) {
  const room = investigationRooms[roomCode];
  if (!room) return;

  // ✅ لو الأدمن خرج، نشيل adminSocketId
  if (room.adminSocketId === socket.id) {
    room.adminSocketId = null;
  }

  // ✅ نشيل اللاعب (سواء أدمن أو عادي) من players
  const playerId = Object.keys(room.players).find(
    (pid) => room.players[pid].socketId === socket.id
  );
  if (playerId) {
    delete room.players[playerId];
    delete room.votes[playerId];
    if (room.adminPlayerId === playerId) room.adminPlayerId = null;
  }

  if (Object.keys(room.players).length === 0 && !room.adminSocketId) {
    clearTimers(room);
    delete investigationRooms[roomCode];
    return;
  }
  broadcast(io, room);
}

// ============================================================
module.exports = function setupInvestigation(io) {
  io.on('connection', (socket) => {

    // ✅ انضمام لاعب (أدمن أو عادي) — بنفس الحدث
    socket.on('inv_join', ({ roomCode, playerId, playerName, isAdmin }) => {
      if (!roomCode || !playerId) return;
      if (!investigationRooms[roomCode]) investigationRooms[roomCode] = createRoom(roomCode);
      const room = investigationRooms[roomCode];

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
          name: playerName || 'محقق',
          isAdmin: !!isAdmin,
        };
      }

      socket.join(`inv_${roomCode}`);
      socket.data.invRoomCode = roomCode;
      socket.data.invPlayerId = playerId;
      broadcast(io, room);
    });

    // ✅ legacy — للأمان
    socket.on('inv_admin_join', ({ roomCode }) => {
      if (!roomCode) return;
      if (!investigationRooms[roomCode]) investigationRooms[roomCode] = createRoom(roomCode);
      const room = investigationRooms[roomCode];
      room.adminSocketId = socket.id;
      socket.join(`inv_${roomCode}`);
      socket.data.invRoomCode = roomCode;
      broadcast(io, room);
    });

    // ===== Main Menu → Lobby =====
    socket.on('inv_enter_lobby', ({ roomCode }) => {
      const room = investigationRooms[roomCode];
      if (!room) return;
      if (room.phase !== 'intro') return;
      room.phase = 'lobby';
      room.phaseStartedAt = Date.now();
      broadcast(io, room);
    });

    // ===== Start =====
    socket.on('inv_start', ({ roomCode }) => {
      const room = investigationRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase !== 'lobby') return;
      if (Object.keys(room.players).length === 0) {
        socket.emit('inv_error', { message: 'مفيش محققين' }); return;
      }
      const caseData = CASES[Math.floor(Math.random() * CASES.length)];
      room.caseData = caseData;
      room.availableQuestions = buildAvailableFromInitial(caseData.suspects);
      room.askedQuestions = [];
      room.questionsLeft = caseData.totalQuestions;
      room.collectedEvidence = [];
      room.boardConnections = [];
      const items = [];
      caseData.suspects.forEach((s, i) => {
        items.push({
          id: `item_${s.id}`, type: 'suspect', refId: s.id,
          x: 5 + (i % 2) * 6, y: 8 + i * 17,
        });
      });
      caseData.evidence.forEach((e, i) => {
        items.push({
          id: `item_${e.id}`, type: 'evidence', refId: e.id,
          x: 75 + (i % 2) * 6, y: 5 + Math.floor(i / 2) * 20,
        });
      });
      room.boardItems = items;
      room.votes = {};
      room.solution = null;
      room.teamWon = null;
      room.phase = 'investigation';
      room.phaseStartedAt = Date.now();
      broadcast(io, room);
    });

    // ===== Ask a question =====
    socket.on('inv_ask', ({ roomCode, suspectId, questionId }) => {
      const room = investigationRooms[roomCode];
      if (!room || room.phase !== 'investigation') return;
      if (room.questionsLeft <= 0) { socket.emit('inv_error', { message: 'خلصت الأسئلة!' }); return; }
      const avail = room.availableQuestions[suspectId];
      if (!avail || !avail.has(questionId)) { socket.emit('inv_error', { message: 'السؤال مش متاح' }); return; }
      const suspect = room.caseData.suspects.find((s) => s.id === suspectId);
      if (!suspect) return;
      const q = suspect.questions[questionId];
      if (!q) return;
      avail.delete(questionId);
      room.questionsLeft -= 1;
      const askedBy = room.players[socket.data.invPlayerId]?.name || 'محقق';
      (q.unlockSelf || []).forEach((qid) => { if (suspect.questions[qid]) avail.add(qid); });
      (q.unlockOthers || []).forEach(({ suspectId: sid, questionIds }) => {
        if (!room.availableQuestions[sid]) room.availableQuestions[sid] = new Set();
        questionIds.forEach((qid) => room.availableQuestions[sid].add(qid));
      });
      room.askedQuestions.push({
        suspectId, suspectName: suspect.name, suspectAvatar: suspect.avatar,
        questionId, questionText: q.text, answer: q.answer, askedBy,
        askedById: socket.data.invPlayerId,
        at: Date.now(),
      });
      broadcast(io, room);
    });

    // ===== Collect evidence =====
    socket.on('inv_collect_evidence', ({ roomCode, evidenceId }) => {
      const room = investigationRooms[roomCode];
      if (!room || room.phase !== 'investigation') return;
      if (!room.collectedEvidence.includes(evidenceId)) {
        room.collectedEvidence.push(evidenceId);
        broadcast(io, room);
      }
    });

    // ===== Board: add connection =====
    socket.on('inv_board_connect', ({ roomCode, fromItem, fromAnchor, toItem, toAnchor }) => {
      const room = investigationRooms[roomCode];
      if (!room || room.phase !== 'investigation') return;
      if (!fromItem || !toItem || fromItem === toItem) return;
      const existing = room.boardConnections.find(
        (c) => c.fromItem === fromItem && c.toItem === toItem && c.fromAnchor === fromAnchor && c.toAnchor === toAnchor
      );
      if (existing) return;
      const conn = {
        id: `conn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        fromItem, fromAnchor, toItem, toAnchor,
        by: room.players[socket.data.invPlayerId]?.name || 'محقق',
      };
      room.boardConnections.push(conn);
      broadcast(io, room);
    });

    // ===== Board: move item =====
    socket.on('inv_board_move', ({ roomCode, itemId, x, y }) => {
      const room = investigationRooms[roomCode];
      if (!room || room.phase !== 'investigation') return;
      const item = room.boardItems.find((it) => it.id === itemId);
      if (!item) return;
      item.x = Math.max(0, Math.min(95, x));
      item.y = Math.max(0, Math.min(92, y));
      broadcast(io, room);
    });

    // ===== Board: remove connection =====
    socket.on('inv_board_disconnect', ({ roomCode, connectionId }) => {
      const room = investigationRooms[roomCode];
      if (!room || room.phase !== 'investigation') return;
      room.boardConnections = room.boardConnections.filter((c) => c.id !== connectionId);
      broadcast(io, room);
    });

    // ===== Move to accusation =====
    socket.on('inv_to_accusation', ({ roomCode }) => {
      const room = investigationRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      if (room.phase !== 'investigation') return;
      room.phase = 'accusation';
      room.phaseStartedAt = Date.now();
      room.votes = {};
      broadcast(io, room);
      clearTimers(room);
      room._accusationTimer = setTimeout(() => {
        if (room.phase === 'accusation') goToReveal(io, room);
      }, ACCUSATION_TIME_MS);
    });

    // ===== Vote =====
    socket.on('inv_vote', ({ roomCode, culpritId, weapon, motive }) => {
      const room = investigationRooms[roomCode];
      if (!room || room.phase !== 'accusation') return;
      const playerId = socket.data.invPlayerId;
      if (!playerId || !room.players[playerId]) return;
      if (room.votes[playerId]) return;
      room.votes[playerId] = { culpritId, weapon, motive };
      broadcast(io, room);
      const total = Object.keys(room.players).length;
      if (Object.keys(room.votes).length >= total && total > 0) goToReveal(io, room);
    });

    // ===== Reset =====
    socket.on('inv_reset', ({ roomCode }) => {
      const room = investigationRooms[roomCode];
      if (!room || room.adminSocketId !== socket.id) return;
      clearTimers(room);
      room.phase = 'lobby';
      room.phaseStartedAt = Date.now();
      room.caseData = null;
      room.availableQuestions = {};
      room.askedQuestions = [];
      room.questionsLeft = 0;
      room.collectedEvidence = [];
      room.boardItems = [];
      room.boardConnections = [];
      room.votes = {};
      room.solution = null;
      room.teamWon = null;
      broadcast(io, room);
    });

    socket.on('inv_leave', ({ roomCode }) => handleLeave(io, socket, roomCode));
    socket.on('disconnect', () => {
      const roomCode = socket.data?.invRoomCode;
      if (roomCode) handleLeave(io, socket, roomCode);
    });

    // ✅ تنظيف الغرفة عند إغلاق اللعبة
    socket.on('close_game', ({ roomCode }) => {
      const room = investigationRooms[roomCode];
      if (!room) return;
      clearTimers(room);
      delete investigationRooms[roomCode];
    });
  });

  console.log('🕵️ Investigation Server loaded');
};