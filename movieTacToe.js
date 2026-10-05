// ============================================================
// movieTacToe.js - لعبة X O + Connect 4 (سينما / كورة)
// ============================================================

// كل نوع لعبة وفئة ليهم ملف داتا منفصل
// كل مجموعة لازم يكون فيها id فريد — بيستخدمه السيرفر فقط
// عشان يتجنب تكرار نفس المجموعة في نفس الجلسة
const cinemaTTT   = require('./data/cinemaTTT');
const cinemaC4    = require('./data/cinemaC4');
const footballTTT = require('./data/footballTTT');
const footballC4  = require('./data/footballC4');

const gameGroups = {
  cinema:   { ttt: cinemaTTT,   c4: cinemaC4   },
  football: { ttt: footballTTT, c4: footballC4  },
};

const MTTT_ANSWER_SECONDS = 45;
const MTTT_VOTE_SECONDS = 20;

// ---- Tic Tac Toe: 3×3 = 9 خانة ----
const TTT_WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

// ---- Connect 4: 6 صفوف × 7 أعمدة = 42 خانة ----
// index = row * 7 + col  (row 0 = أعلى، row 5 = أسفل)
const C4_ROWS = 6;
const C4_COLS = 7;

function c4Index(row, col) { return row * C4_COLS + col; }

function c4CheckWinner(cells) {
  const check = (r, c) => cells[c4Index(r, c)];
  const sameTeam = (a, b) => a && b && a.team === b.team;

  for (let r = 0; r < C4_ROWS; r++) {
    for (let c = 0; c < C4_COLS; c++) {
      const cell = check(r, c);
      if (!cell) continue;
      // أفقي
      if (c + 3 < C4_COLS &&
          sameTeam(cell, check(r, c+1)) &&
          sameTeam(cell, check(r, c+2)) &&
          sameTeam(cell, check(r, c+3)))
        return { team: cell.team, line: [c4Index(r,c), c4Index(r,c+1), c4Index(r,c+2), c4Index(r,c+3)] };
      // رأسي
      if (r + 3 < C4_ROWS &&
          sameTeam(cell, check(r+1, c)) &&
          sameTeam(cell, check(r+2, c)) &&
          sameTeam(cell, check(r+3, c)))
        return { team: cell.team, line: [c4Index(r,c), c4Index(r+1,c), c4Index(r+2,c), c4Index(r+3,c)] };
      // قطري ↘
      if (r + 3 < C4_ROWS && c + 3 < C4_COLS &&
          sameTeam(cell, check(r+1, c+1)) &&
          sameTeam(cell, check(r+2, c+2)) &&
          sameTeam(cell, check(r+3, c+3)))
        return { team: cell.team, line: [c4Index(r,c), c4Index(r+1,c+1), c4Index(r+2,c+2), c4Index(r+3,c+3)] };
      // قطري ↙
      if (r + 3 < C4_ROWS && c - 3 >= 0 &&
          sameTeam(cell, check(r+1, c-1)) &&
          sameTeam(cell, check(r+2, c-2)) &&
          sameTeam(cell, check(r+3, c-3)))
        return { team: cell.team, line: [c4Index(r,c), c4Index(r+1,c-1), c4Index(r+2,c-2), c4Index(r+3,c-3)] };
    }
  }
  return null;
}

// في Connect 4: بيرجع أدنى صف فاضي في العمود (أو -1 لو العمود مليان)
function c4DropRow(cells, col) {
  for (let r = C4_ROWS - 1; r >= 0; r--) {
    if (!cells[c4Index(r, col)]) return r;
  }
  return -1;
}

function tttCheckWinner(cells) {
  for (const line of TTT_WIN_LINES) {
    const [a, b, c] = line;
    if (cells[a] && cells[b] && cells[c] &&
        cells[a].team === cells[b].team &&
        cells[b].team === cells[c].team)
      return { team: cells[a].team, line };
  }
  return null;
}

function tttCheckMajority(cells) {
  const filled = cells.filter(Boolean);
  if (filled.length < 9) return null;
  const c1 = filled.filter(c => c.team === 1).length;
  const c2 = filled.filter(c => c.team === 2).length;
  if (c1 > c2) return { team: 1, line: null, byMajority: true };
  if (c2 > c1) return { team: 2, line: null, byMajority: true };
  return { team: null, line: null, byMajority: true, draw: true };
}

function c4CheckMajority(cells) {
  const filled = cells.filter(Boolean);
  if (filled.length < C4_ROWS * C4_COLS) return null;
  const c1 = filled.filter(c => c.team === 1).length;
  const c2 = filled.filter(c => c.team === 2).length;
  if (c1 > c2) return { team: 1, line: null, byMajority: true };
  if (c2 > c1) return { team: 2, line: null, byMajority: true };
  return { team: null, line: null, byMajority: true, draw: true };
}

function otherTeam(t) { return t === 1 ? 2 : 1; }

function pickRandomGroup(game) {
  const pool0 = gameGroups[game.category]?.[game.gameType];
  if (!pool0 || pool0.length === 0) {
    console.warn(`[MovieTTT] لا توجد مجموعات للفئة "${game.category}" ونوع "${game.gameType}"`);
    return null;
  }
  let pool = pool0.filter(g => !game.usedGroupIds.includes(g.id));
  if (pool.length === 0) { game.usedGroupIds = []; pool = pool0; }
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  game.usedGroupIds.push(chosen.id);
  return chosen;
}

function activeMembersCount(room, game, teamNum) {
  const members = teamNum === 1 ? game.team1.memberIds : game.team2.memberIds;
  return members.filter(id => room.players.some(p => p.id === id)).length;
}

function createMovieTacToeModule(io, rooms) {
  function getGame(roomCode) {
    return rooms[roomCode] ? rooms[roomCode].movieTTT : null;
  }

  function publicState(game) {
    if (!game) return null;
    const { chat1, chat2, timerInterval, votes, ...rest } = game;
    return rest;
  }

  function broadcastState(roomCode) {
    const game = rooms[roomCode] && rooms[roomCode].movieTTT;
    if (!game) return;
    io.to(roomCode).emit('mttt_state', publicState(game));
  }

  function playerTeam(roomCode, playerId) {
    const game = getGame(roomCode);
    if (!game) return null;
    if (game.team1.memberIds.includes(playerId)) return 1;
    if (game.team2.memberIds.includes(playerId)) return 2;
    return null;
  }

  function clearTimer(game) {
    if (game.timerInterval) { clearInterval(game.timerInterval); game.timerInterval = null; }
  }

  function stopTimer(roomCode) {
    const game = getGame(roomCode);
    if (game) clearTimer(game);
  }

  function startTimer(roomCode, seconds, onExpire) {
    const game = getGame(roomCode);
    if (!game) return;
    clearTimer(game);
    game.timeLeft = seconds;
    game.timerKind = seconds === MTTT_VOTE_SECONDS ? 'vote' : 'answer';
    io.to(roomCode).emit('mttt_timer', { timeLeft: game.timeLeft, kind: game.timerKind });
    game.timerInterval = setInterval(() => {
      const g = getGame(roomCode);
      if (!g) return;
      g.timeLeft -= 1;
      io.to(roomCode).emit('mttt_timer', { timeLeft: g.timeLeft, kind: g.timerKind });
      if (g.timeLeft <= 0) { clearTimer(g); onExpire(); }
    }, 1000);
  }

  function endGame(roomCode, winner) {
    const game = getGame(roomCode);
    if (!game) return;
    game.winner = winner;
    game.phase = 'ended';
    game.pendingAnswer = null;
    clearTimer(game);
    broadcastState(roomCode);
  }

  function beginMatch(roomCode) {
    const game = getGame(roomCode);
    if (!game) return;
    const group = pickRandomGroup(game);
    const isTTT = game.gameType === 'ttt';

    game.groupId = group ? group.id : null;
    if (group) {
      // كل نوع لعبة عنده ملف داتا خاص بيه بالأحجام الصح:
      // TTT: rowItems.length=3, colItems.length=3
      // C4:  rowItems.length=6, colItems.length=7
      game.rowItems = group.rowItems;
      game.colItems = group.colItems;
    } else {
      // fallback لو مفيش داتا — عشان اللعبة ماتوقفش
      if (isTTT) {
        game.rowItems = [
          { label: 'الصف الأول', image: '' },
          { label: 'الصف الثاني', image: '' },
          { label: 'الصف الثالث', image: '' },
        ];
        game.colItems = [
          { label: 'العمود الأول', image: '' },
          { label: 'العمود الثاني', image: '' },
          { label: 'العمود الثالث', image: '' },
        ];
      } else {
        game.rowItems = Array.from({ length: 6 }, (_, i) => ({ label: `الصف ${i+1}`, image: '' }));
        game.colItems = Array.from({ length: 7 }, (_, i) => ({ label: `العمود ${i+1}`, image: '' }));
      }
    }

    const totalCells = isTTT ? 9 : C4_ROWS * C4_COLS;
    game.cells = Array(totalCells).fill(null);
    game.activeTeam = 1;
    game.selectedCell = null;  // للـ TTT
    game.selectedCol = null;   // للـ C4
    game.pendingAnswer = null;
    game.winner = null;
    game.votes = {};
    game.voteCount = 0;
    game.voteNeeded = 0;
    game.phase = 'playing';
    broadcastState(roomCode);
    startTimer(roomCode, MTTT_ANSWER_SECONDS, () => passTurnEmpty(roomCode));
  }

  function maybeAutoStartTeamGame(roomCode) {
    const game = getGame(roomCode);
    if (!game || game.phase !== 'team_setup') return;
    const draftDone = game.draftPool.length === 0;
    const infoDone = game.team1.name && game.team1.color &&
                     game.team2.name && game.team2.color &&
                     game.team1.color !== game.team2.color;
    if (draftDone && infoDone) beginMatch(roomCode);
  }

  function passTurnEmpty(roomCode) {
    const game = getGame(roomCode);
    if (!game || game.phase !== 'playing') return;
    game.activeTeam = otherTeam(game.activeTeam);
    game.selectedCell = null;
    game.selectedCol = null;
    game.pendingAnswer = null;
    game.votes = {};
    game.voteCount = 0;
    game.voteNeeded = 0;
    broadcastState(roomCode);
    startTimer(roomCode, MTTT_ANSWER_SECONDS, () => passTurnEmpty(roomCode));
  }

  function resolveAnswer(roomCode, correct) {
    const game = getGame(roomCode);
    if (!game || !game.pendingAnswer) return;
    const pending = game.pendingAnswer;
    const isTTT = game.gameType === 'ttt';

    if (correct) {
      game.cells[pending.cellIndex] = { team: pending.team, text: pending.text };

      if (isTTT) {
        const lineWin = tttCheckWinner(game.cells);
        if (lineWin) { endGame(roomCode, lineWin); return; }
        const maj = tttCheckMajority(game.cells);
        if (maj) { endGame(roomCode, maj); return; }
      } else {
        const lineWin = c4CheckWinner(game.cells);
        if (lineWin) { endGame(roomCode, lineWin); return; }
        const maj = c4CheckMajority(game.cells);
        if (maj) { endGame(roomCode, maj); return; }
      }
    }

    game.activeTeam = otherTeam(pending.team);
    game.pendingAnswer = null;
    game.selectedCell = null;
    game.selectedCol = null;
    game.votes = {};
    game.voteCount = 0;
    game.voteNeeded = 0;
    broadcastState(roomCode);
    startTimer(roomCode, MTTT_ANSWER_SECONDS, () => passTurnEmpty(roomCode));
  }

  function handlePlayerDisconnect(roomCode, playerId) {
    const room = rooms[roomCode];
    const game = getGame(roomCode);
    if (!room || !game || game.phase === 'ended' || game.phase === 'mode') return;
    const team = playerTeam(roomCode, playerId);
    if (!team) return;
    if (team === 1) game.team1.memberIds = game.team1.memberIds.filter(id => id !== playerId);
    else game.team2.memberIds = game.team2.memberIds.filter(id => id !== playerId);
    const r1 = activeMembersCount(room, game, 1);
    const r2 = activeMembersCount(room, game, 2);
    if (r1 === 0) { endGame(roomCode, { team: 2, line: null, byDisconnect: true }); return; }
    if (r2 === 0) { endGame(roomCode, { team: 1, line: null, byDisconnect: true }); return; }
    if (game.phase === 'playing' && game.activeTeam === team && !game.pendingAnswer) {
      clearTimer(game);
      passTurnEmpty(roomCode);
      return;
    }
    if (game.pendingAnswer) {
      const votingTeam = otherTeam(game.pendingAnswer.team);
      if (team === votingTeam) {
        const newNeeded = activeMembersCount(room, game, votingTeam);
        game.voteNeeded = newNeeded;
        if (game.voteCount >= newNeeded) {
          clearTimer(game);
          const yes = Object.values(game.votes).filter(Boolean).length;
          resolveAnswer(roomCode, yes > newNeeded / 2);
          return;
        }
      }
    }
    broadcastState(roomCode);
  }

  function makeFreshGame() {
    return {
      phase: 'mode',
      mode: null,
      category: null,
      gameType: null, // 'ttt' | 'c4'
      team1: { name: '', color: '', captainId: null, memberIds: [] },
      team2: { name: '', color: '', captainId: null, memberIds: [] },
      draftPool: [], draftTurn: 1,
      groupId: null, rowItems: [], colItems: [],
      usedGroupIds: [],
      cells: Array(9).fill(null),
      activeTeam: 1,
      selectedCell: null,
      selectedCol: null,
      pendingAnswer: null,
      winner: null,
      votes: {}, voteCount: 0, voteNeeded: 0,
      timeLeft: 0, timerKind: 'answer',
      timerInterval: null,
      chat1: [], chat2: [],
    };
  }

  function registerSocket(socket) {

    socket.on('mttt_init', ({ roomCode, playerId }) => {
      const room = rooms[roomCode];
      if (!room) return;
      if (!room.movieTTT) room.movieTTT = makeFreshGame();
      socket.emit('mttt_state', publicState(room.movieTTT));
      const team = playerId ? playerTeam(roomCode, playerId) : null;
      if (team) {
        const msgs = team === 1 ? room.movieTTT.chat1 : room.movieTTT.chat2;
        socket.emit('mttt_chat_history', { team, messages: msgs || [] });
      }
    });

    socket.on('mttt_admin_set_mode', ({ roomCode, mode }) => {
      const game = getGame(roomCode);
      if (!game || game.phase !== 'mode') return;
      game.mode = mode === 'solo' ? 'solo' : 'team';
      game.phase = 'category';
      broadcastState(roomCode);
    });

    socket.on('mttt_admin_set_category', ({ roomCode, category }) => {
      const game = getGame(roomCode);
      if (!game || game.phase !== 'category') return;
      if (category !== 'cinema' && category !== 'football') return;
      game.category = category;
      game.phase = 'gameType'; // مرحلة جديدة: اختيار XO أو Connect4
      broadcastState(roomCode);
    });

    // مرحلة جديدة: اختيار نوع اللعبة
    socket.on('mttt_admin_set_gametype', ({ roomCode, gameType }) => {
      const game = getGame(roomCode);
      if (!game || game.phase !== 'gameType') return;
      if (gameType !== 'ttt' && gameType !== 'c4') return;
      game.gameType = gameType;
      game.phase = game.mode === 'solo' ? 'solo_slots' : 'captains';
      broadcastState(roomCode);
    });

    socket.on('mttt_set_captains', ({ roomCode, captain1Id, captain2Id }) => {
      const room = rooms[roomCode];
      const game = getGame(roomCode);
      if (!room || !game || game.phase !== 'captains') return;
      if (!captain1Id || !captain2Id || captain1Id === captain2Id) return;
      game.team1.captainId = captain1Id;
      game.team1.memberIds = [captain1Id];
      game.team2.captainId = captain2Id;
      game.team2.memberIds = [captain2Id];
      const assigned = new Set([captain1Id, captain2Id]);
      game.draftPool = room.players.filter(p => !p.isAdmin && !assigned.has(p.id)).map(p => p.id);
      game.draftTurn = 1;
      game.phase = 'team_setup';
      broadcastState(roomCode);
      maybeAutoStartTeamGame(roomCode);
    });

    socket.on('mttt_set_team_info', ({ roomCode, playerId, team, name, color }) => {
      const game = getGame(roomCode);
      if (!game || (team !== 1 && team !== 2) || game.phase !== 'team_setup') return;
      const t = team === 1 ? game.team1 : game.team2;
      if (playerId !== t.captainId) return;
      if (typeof name === 'string') t.name = name.trim().slice(0, 40);
      if (typeof color === 'string') t.color = color;
      broadcastState(roomCode);
      maybeAutoStartTeamGame(roomCode);
    });

    socket.on('mttt_draft_pick', ({ roomCode, playerId, pickedId }) => {
      const game = getGame(roomCode);
      if (!game || game.phase !== 'team_setup') return;
      const captainId = game.draftTurn === 1 ? game.team1.captainId : game.team2.captainId;
      if (playerId !== captainId || !game.draftPool.includes(pickedId)) return;
      const t = game.draftTurn === 1 ? game.team1 : game.team2;
      t.memberIds.push(pickedId);
      game.draftPool = game.draftPool.filter(id => id !== pickedId);
      if (game.draftPool.length > 0) game.draftTurn = otherTeam(game.draftTurn);
      broadcastState(roomCode);
      maybeAutoStartTeamGame(roomCode);
    });

    socket.on('mttt_claim_solo_slot', ({ roomCode, playerId, slot, name, color }) => {
      const game = getGame(roomCode);
      if (!game || game.phase !== 'solo_slots' || (slot !== 1 && slot !== 2)) return;
      if (!playerId || !name || !name.trim() || !color) return;
      const mine = slot === 1 ? game.team1 : game.team2;
      const theirs = slot === 1 ? game.team2 : game.team1;
      if (mine.captainId && mine.captainId !== playerId) return;
      if (theirs.captainId === playerId) return;
      if (theirs.color === color) return;
      mine.captainId = playerId;
      mine.memberIds = [playerId];
      mine.name = name.trim().slice(0, 40);
      mine.color = color;
      broadcastState(roomCode);
      const bothReady = game.team1.captainId && game.team2.captainId &&
        game.team1.name && game.team2.name && game.team1.color && game.team2.color;
      if (bothReady) beginMatch(roomCode);
    });

    // ---- TTT: اختيار خانة ----
    socket.on('mttt_select_cell', ({ roomCode, playerId, cellIndex }) => {
      const game = getGame(roomCode);
      if (!game || game.phase !== 'playing' || game.gameType !== 'ttt') return;
      if (game.winner || game.pendingAnswer) return;
      if (cellIndex < 0 || cellIndex > 8 || game.cells[cellIndex]) return;
      if (playerTeam(roomCode, playerId) !== game.activeTeam) return;
      game.selectedCell = cellIndex;
      broadcastState(roomCode);
    });

    // ---- C4: اختيار عمود ----
    socket.on('mttt_select_col', ({ roomCode, playerId, col }) => {
      const game = getGame(roomCode);
      if (!game || game.phase !== 'playing' || game.gameType !== 'c4') return;
      if (game.winner || game.pendingAnswer) return;
      if (col < 0 || col >= C4_COLS) return;
      if (playerTeam(roomCode, playerId) !== game.activeTeam) return;
      const dropRow = c4DropRow(game.cells, col);
      if (dropRow === -1) return; // العمود مليان
      game.selectedCol = col;
      game.selectedCell = c4Index(dropRow, col); // الخانة اللي القطعة هتقع فيها
      broadcastState(roomCode);
    });

    // ---- اعتماد الإجابة (مشترك بين TTT وC4) ----
    socket.on('mttt_submit_answer', ({ roomCode, playerId, text }) => {
      const game = getGame(roomCode);
      if (!game || game.phase !== 'playing' || game.winner || game.pendingAnswer) return;
      if (playerTeam(roomCode, playerId) !== game.activeTeam) return;
      if (game.selectedCell === null || !text || !text.trim()) return;
      const room = rooms[roomCode];
      const votingTeam = otherTeam(game.activeTeam);
      const needed = activeMembersCount(room, game, votingTeam);
      game.pendingAnswer = { cellIndex: game.selectedCell, team: game.activeTeam, text: text.trim().slice(0, 120) };
      game.votes = {};
      game.voteCount = 0;
      game.voteNeeded = needed;
      broadcastState(roomCode);
      startTimer(roomCode, MTTT_VOTE_SECONDS, () => resolveAnswer(roomCode, false));
    });

    socket.on('mttt_vote', ({ roomCode, playerId, correct }) => {
      const game = getGame(roomCode);
      if (!game || !game.pendingAnswer) return;
      const team = playerTeam(roomCode, playerId);
      if (!team || team !== otherTeam(game.pendingAnswer.team)) return;
      if (game.votes[playerId] !== undefined) return;
      game.votes[playerId] = !!correct;
      game.voteCount = Object.keys(game.votes).length;
      broadcastState(roomCode);
      if (game.voteCount >= game.voteNeeded) {
        clearTimer(game);
        const yes = Object.values(game.votes).filter(Boolean).length;
        resolveAnswer(roomCode, yes > game.voteNeeded / 2);
      }
    });

    socket.on('mttt_chat_send', ({ roomCode, playerId, text }) => {
      const room = rooms[roomCode];
      const game = getGame(roomCode);
      if (!room || !game || !text || !text.trim()) return;
      const team = playerTeam(roomCode, playerId);
      if (!team) return;
      const player = room.players.find(p => p.id === playerId);
      const entry = { who: (player && player.name) || 'لاعب', text: text.trim().slice(0, 300), ts: Date.now() };
      const key = team === 1 ? 'chat1' : 'chat2';
      game[key].push(entry);
      if (game[key].length > 200) game[key].shift();
      const memberIds = team === 1 ? game.team1.memberIds : game.team2.memberIds;
      room.players.forEach(p => {
        if (memberIds.includes(p.id)) io.to(p.socketId).emit('mttt_chat_message', { team, entry });
      });
    });

    socket.on('mttt_new_round', ({ roomCode }) => {
      const game = getGame(roomCode);
      if (!game || (game.phase !== 'ended' && game.phase !== 'playing')) return;
      beginMatch(roomCode);
    });

    socket.on('mttt_reset', ({ roomCode }) => {
      const room = rooms[roomCode];
      if (!room) return;
      stopTimer(roomCode);
      room.movieTTT = makeFreshGame();
      io.to(roomCode).emit('mttt_state', publicState(room.movieTTT));
    });

    socket.on('mttt_player_left', ({ roomCode, playerId }) => {
      handlePlayerDisconnect(roomCode, playerId);
    });

    socket.on('close_game', ({ roomCode }) => {
      const room = rooms[roomCode];
      if (!room) return;
      stopTimer(roomCode);
      room.movieTTT = null;
    });
  }

  return { registerSocket, stopTimer, handlePlayerDisconnect };
}

module.exports = { createMovieTacToeModule };