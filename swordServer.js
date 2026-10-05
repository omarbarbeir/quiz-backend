// swordServer.js
// ⚔️ Sword of Knowledge – منطق السيرفر الكامل
// signature: (socket, io, rooms)

const {
  SOK_REALMS, SOK_CONFIG, SOK_PLAYER_COLORS,
  getClaimRoundsForPlayers,   // ✅ جديد
} = require('./data/swordData');
// ============ تحميل الأسئلة بشكل دفاعي ============
let swordOfKnowledgeQuestions = [];
try {
  const mod = require('./data/swordOfKnowledgeQuestions');
  if (Array.isArray(mod)) swordOfKnowledgeQuestions = mod;
  else if (Array.isArray(mod?.questions)) swordOfKnowledgeQuestions = mod.questions;
  else if (Array.isArray(mod?.default)) swordOfKnowledgeQuestions = mod.default;
  else console.error('❌ swordOfKnowledgeQuestions: شكل غير متوقع');
} catch (e) {
  console.error('❌ فشل تحميل الأسئلة:', e.message);
}

if (swordOfKnowledgeQuestions.length === 0) console.warn('⚠️ مفيش أسئلة محمّلة');
else console.log(`✅ SOK: تم تحميل ${swordOfKnowledgeQuestions.length} سؤال`);

const REALMS = SOK_REALMS;

// ==================== Helpers ====================
function getRandomQuestion() {
  if (!swordOfKnowledgeQuestions?.length) return null;
  return swordOfKnowledgeQuestions[Math.floor(Math.random() * swordOfKnowledgeQuestions.length)];
}

// ✅ تقييم موحد (MCQ + رقمي بالتقريب)
function evaluateAnswers(question, answersArray) {
  if (!question || !answersArray?.length) {
    return (answersArray || []).map(a => ({ ...a, isCorrect: false }));
  }

  // MCQ
  if (question.type === 'mcq') {
    const correct = question.answer;
    return answersArray.map(a => ({
      ...a,
      isCorrect: parseInt(String(a.answer).trim(), 10) === correct,
    }));
  }

  // رقمي
  if (question.type === 'numeric') {
    const correctValue = parseFloat(question.answer);
    if (isNaN(correctValue)) {
      return answersArray.map(a => ({ ...a, isCorrect: false }));
    }

    const parsed = answersArray
      .map(a => ({ ...a, num: parseFloat(a.answer) }))
      .filter(a => !isNaN(a.num));

    if (parsed.length === 0) {
      return answersArray.map(a => ({ ...a, isCorrect: false }));
    }

    // 1) إجابة مطابقة تمامًا
    const exact = parsed.filter(a => a.num === correctValue);
    if (exact.length > 0) {
      return answersArray.map(a => ({
        ...a,
        isCorrect: exact.some(x => x.playerId === a.playerId),
      }));
    }

    // 2) الأقرب
    const diffs = parsed.map(a => Math.abs(a.num - correctValue));
    const minDiff = Math.min(...diffs);
    return answersArray.map(a => {
      const p = parsed.find(x => x.playerId === a.playerId);
      if (!p) return { ...a, isCorrect: false };
      return { ...a, isCorrect: Math.abs(p.num - correctValue) === minDiff };
    });
  }

  return answersArray.map(a => ({ ...a, isCorrect: false }));
}

// ✅ اختيار الأسرع من "الصح"
function pickFastest(answersEvaluated) {
  const correct = answersEvaluated
    .filter(a => a.isCorrect)
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  return correct[0]?.playerId || null;
}

function sanitizeSOK(game) {
  if (!game) return null;
  const copy = { ...game };
  delete copy.timer;
  delete copy.currentQuestion;
  delete copy.pendingAction;
  delete copy.answersArray;
  if (copy.duel) {
    copy.duel = { ...copy.duel };
    delete copy.duel.question;
    delete copy.duel.answers;
    delete copy.duel.answerTimestamps;
  }
  if (!copy.ownership) copy.ownership = {};
  if (!copy.players) copy.players = [];
  return copy;
}

function getNextPlayerSOK(roomCode, currentPlayerId, rooms) {
  const room = rooms[roomCode];
  if (!room) return null;
  const alive = room.players.filter(p => !p.eliminated);
  if (alive.length === 0) return null;
  const idx = alive.findIndex(p => p.id === currentPlayerId);
  let nextIdx = (idx + 1) % alive.length;
  let nextPlayer = alive[nextIdx];
  const game = room.sok;
  if (game && game.skippedPlayers) {
    let loop = 0;
    while (game.skippedPlayers[nextPlayer.id] && loop < alive.length) {
      delete game.skippedPlayers[nextPlayer.id];
      nextIdx = (nextIdx + 1) % alive.length;
      nextPlayer = alive[nextIdx];
      loop++;
    }
  }
  return nextPlayer.id;
}

function getPlayerSocketSOK(roomCode, playerId, rooms, io) {
  const room = rooms[roomCode];
  if (!room) return null;
  const player = room.players.find(p => p.id === playerId);
  if (!player) return null;
  return io.sockets.sockets.get(player.socketId);
}

// ==================== Init ====================
function initSOKGame(room) {
  const allPlayers = room.players;
  if (allPlayers.length === 0) return null;

  const n = allPlayers.length;
  const shuffledRealms = [...REALMS].sort(() => Math.random() - 0.5).slice(0, n);
  const shuffledPlayers = [...allPlayers].sort(() => Math.random() - 0.5);

  const ownership = {};
  shuffledRealms.forEach(realm => {
    ownership[realm.id] = {};
    realm.regions.forEach(r => { ownership[realm.id][r.id] = null; });
  });

  shuffledPlayers.forEach((player, i) => {
    if (i >= shuffledRealms.length) return;
    const realm = shuffledRealms[i];
    ownership[realm.id][realm.base.id] = player.id;
  });

  const gamePlayers = allPlayers.map((p, i) => ({
    id: p.id,
    name: p.name,
    color: SOK_PLAYER_COLORS[i % SOK_PLAYER_COLORS.length],
    isAdmin: !!p.isAdmin,
    eliminated: false,
  }));

  return {
    phase: 'claiming',
    ownership,
    turn: shuffledPlayers[0].id,
    scores: {},
    players: gamePlayers,
    duel: null,
    timer: null,
    pendingAction: null,
    currentQuestion: null,
    answersArray: [],
    roundCount: 0,
    playedInRound: [],
    skippedPlayers: {},
    maxClaimRounds: getClaimRoundsForPlayers(n),
  };
}

// ==================== Module ====================
module.exports = function setupSwordServer(socket, io, rooms) {
  let resolveClaim, askDuelQuestion, resolveDuelRound;

  // ---------- INIT / RESET ----------
  socket.on('sok_init', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

    if (room.sok) {
      room.sok.players = room.players.map((p, i) => ({
        id: p.id, name: p.name,
        color: SOK_PLAYER_COLORS[i % SOK_PLAYER_COLORS.length],
        isAdmin: !!p.isAdmin,
        eliminated: p.eliminated || false,
      }));
      socket.emit('sok_state', sanitizeSOK(room.sok));
      return;
    }

    const game = initSOKGame(room);
    if (!game) { socket.emit('sok_error', { message: 'Could not initialize game' }); return; }
    room.sok = game;
    io.to(roomCode).emit('sok_state', sanitizeSOK(room.sok));
  });

  socket.on('sok_reset', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player?.isAdmin) return;
    room.players.forEach(p => { p.eliminated = false; });
    if (room.sok?.timer) clearTimeout(room.sok.timer);
    const game = initSOKGame(room);
    if (game) {
      room.sok = game;
      io.to(roomCode).emit('sok_state', sanitizeSOK(game));
    }
  });

  // ---------- CLAIM ----------
  socket.on('sok_claim', ({ roomCode, continentId, regionName, playerId }) => {
    const game = rooms[roomCode]?.sok;
    if (!game) return;
    if ((game.phase !== 'claiming' && game.phase !== 'attacking') || game.turn !== playerId) return;
    const cont = REALMS.find(c => c.id === continentId);
    if (!cont) return;
    const region = cont.regions.find(r => r.id === regionName);
    if (!region || game.ownership[continentId][regionName] !== null) return;

    const question = getRandomQuestion();
    if (!question) return;

    game.currentQuestion = question;
    game.answersArray = [];
    game.pendingAction = { type: 'claim', continentId, regionName, playerId };

    const playerName = rooms[roomCode].players.find(p => p.id === playerId)?.name || '???';
    io.to(roomCode).emit('sok_claim_start', {
      playerName, regionName: region.name,
      continentName: cont.name, isEmpty: true,
    });

    clearTimeout(game.timer);
    game.timer = setTimeout(() => {
      if (rooms[roomCode]?.sok?.currentQuestion === question) {
        io.to(roomCode).emit('sok_question', question);
        clearTimeout(rooms[roomCode].sok.timer);
        rooms[roomCode].sok.timer = setTimeout(() => {
          resolveClaim(roomCode, continentId, regionName);
        }, SOK_CONFIG.questionTimer * 1000);
      }
    }, SOK_CONFIG.preQuestionDelayMs);

    io.to(roomCode).emit('sok_state', sanitizeSOK(game));
  });

  // ---------- ATTACK HUB ----------
  socket.on('sok_attack_hub', ({ roomCode, continentId, regionName, attackerId }) => {
    const game = rooms[roomCode]?.sok;
    if (!game || game.phase !== 'attacking' || game.turn !== attackerId) return;
    const cont = REALMS.find(c => c.id === continentId);
    if (!cont) return;
    const region = cont.regions.find(r => r.id === regionName);
    if (!region) return;
    const currentOwner = game.ownership[continentId][regionName];
    if (!currentOwner || currentOwner === attackerId) return;

    const question = getRandomQuestion();
    if (!question) return;

    game.phase = 'duel';
    game.duel = {
      attackerId, defenderId: currentOwner,
      scores: { [attackerId]: 0, [currentOwner]: 0 },
      round: 1, question: null, answers: {}, answerTimestamps: {},
    };
    game.pendingAction = { type: 'attack_hub', continentId, regionName, attackerId, defenderId: currentOwner };

    const attackerName = rooms[roomCode].players.find(p => p.id === attackerId)?.name || '???';
    const defenderName = rooms[roomCode].players.find(p => p.id === currentOwner)?.name || '???';
    io.to(roomCode).emit('sok_duel_start', {
      attackerName, defenderName,
      regionName: region.name, continentName: cont.name, ownerName: defenderName,
    });

    askDuelQuestion(roomCode, question, SOK_CONFIG.preQuestionDelayMs);
    io.to(roomCode).emit('sok_state', sanitizeSOK(game));
  });

  // ---------- ATTACK BASE ----------
  socket.on('sok_attack_base', ({ roomCode, continentId, attackerId }) => {
    const game = rooms[roomCode]?.sok;
    if (!game || game.phase !== 'attacking' || game.turn !== attackerId) return;
    const cont = REALMS.find(c => c.id === continentId);
    if (!cont) return;
    const baseRegionId = cont.regions[0].id;
    const defenderId = game.ownership[continentId][baseRegionId];
    if (!defenderId || defenderId === attackerId) return;

    // ✅ شرط: المدافع عنده أقل من 3 أقاليم في مملكته
    const defenderHubsOwned = cont.regions
      .slice(1, 7)
      .filter(r => game.ownership[continentId][r.id] === defenderId).length;

    if (defenderHubsOwned >= 3) return;

    const question = getRandomQuestion();
    if (!question) return;

    game.phase = 'duel';
    game.duel = {
      attackerId, defenderId,
      scores: { [attackerId]: 0, [defenderId]: 0 },
      round: 1, question: null, answers: {}, answerTimestamps: {},
    };
    game.pendingAction = { type: 'attack_base', continentId, attackerId, defenderId };

    const attackerName = rooms[roomCode].players.find(p => p.id === attackerId)?.name || '???';
    const defenderName = rooms[roomCode].players.find(p => p.id === defenderId)?.name || '???';
    io.to(roomCode).emit('sok_duel_start', {
      attackerName, defenderName,
      regionName: cont.regions[0].name, continentName: cont.name, ownerName: defenderName,
    });

    askDuelQuestion(roomCode, question, 0);
    io.to(roomCode).emit('sok_state', sanitizeSOK(game));
  });

  // ---------- ANSWERS ----------
  socket.on('sok_claim_answer', ({ roomCode, playerId, answer }) => {
    const game = rooms[roomCode]?.sok;
    if (!game || !game.currentQuestion) return;
    if (game.phase !== 'claiming' && game.phase !== 'attacking') return;
    if (!game.pendingAction || game.pendingAction.type !== 'claim') return;
    if (game.answersArray.some(a => a.playerId === playerId)) return;
    game.answersArray.push({ playerId, answer, timestamp: Date.now() });

    const alive = rooms[roomCode].players.filter(p => !p.eliminated);
    const allAnswered = alive.every(p => game.answersArray.some(a => a.playerId === p.id));
    if (allAnswered) {
      clearTimeout(game.timer);
      resolveClaim(roomCode, game.pendingAction.continentId, game.pendingAction.regionName);
    }
  });

  socket.on('sok_duel_answer', ({ roomCode, playerId, answer }) => {
    const game = rooms[roomCode]?.sok;
    if (!game || game.phase !== 'duel' || !game.duel) return;
    if (playerId !== game.duel.attackerId && playerId !== game.duel.defenderId) return;
    if (game.duel.answers[playerId] !== undefined) return;
    game.duel.answers[playerId] = answer;
    if (!game.duel.answerTimestamps) game.duel.answerTimestamps = {};
    game.duel.answerTimestamps[playerId] = Date.now();
    if (Object.keys(game.duel.answers).length === 2) {
      clearTimeout(game.timer);
      resolveDuelRound(roomCode);
    }
  });

  socket.on('sok_provide_duel_question', ({ roomCode }) => {
    const game = rooms[roomCode]?.sok;
    if (!game || game.phase !== 'duel' || !game.duel) return;
    const question = getRandomQuestion();
    if (!question) return;
    askDuelQuestion(roomCode, question, 0);
  });

  // ---------- RESOLVE CLAIM ----------
  resolveClaim = (roomCode, continentId, regionName) => {
    const game = rooms[roomCode]?.sok;
    if (!game || !game.currentQuestion) return;
    if (game.timer) { clearTimeout(game.timer); game.timer = null; }

    const q = game.currentQuestion;
    const initiatorId = game.pendingAction?.playerId;

    // ✅ تقييم كل الإجابات
    const evaluated = evaluateAnswers(q, game.answersArray);

    const initiatorEval = evaluated.find(e => e.playerId === initiatorId);
    const initiatorCorrect = !!initiatorEval?.isCorrect;

    // ✅ الإقليم يُمنح فقط لو صاحب الدور جاوب صح
    //    لو غلط → الإقليم يفضل فاضي (متاح لأي حد في أي دور)
    let winner = null;
    if (initiatorCorrect) {
      winner = initiatorId;
      game.ownership[continentId][regionName] = winner;
      game.scores[winner] = (game.scores[winner] || 0) + 1;
    } else if (game.phase === 'attacking' && initiatorId) {
      // في مرحلة الهجوم بس: صاحب الدور اللي بيغلط يُتخطى
      game.skippedPlayers[initiatorId] = true;
    }

    const results = {
      questionText: q.text,
      questionType: q.type,
      questionOptions: q.options || null,
      correctAnswer: q.type === 'numeric' ? q.answer : q.options?.[q.answer],
      correctIndex: q.type === 'mcq' ? q.answer : null,
      initiatorId,
      initiatorCorrect,
      claimed: !!winner,
      winner,
      answers: evaluated.map(e => {
        const p = rooms[roomCode].players.find(pl => pl.id === e.playerId);
        return {
          playerId: e.playerId,
          playerName: p?.name || '???',
          answer: e.answer,
          color: p?.color || '#fff',
          isCorrect: e.isCorrect,
          isInitiator: e.playerId === initiatorId,
        };
      }),
    };
    io.to(roomCode).emit('sok_results', results);

    game.currentQuestion = null;
    game.pendingAction = null;
    game.answersArray = [];

    if (game.phase === 'claiming') {
      game.turn = getNextPlayerSOK(roomCode, game.turn, rooms);
      if (!game.playedInRound) game.playedInRound = [];
      if (initiatorId && !game.playedInRound.includes(initiatorId)) {
        game.playedInRound.push(initiatorId);
      }
      const alive = rooms[roomCode].players.filter(p => !p.eliminated).map(p => p.id);
      const allPlayed = alive.every(pid => game.playedInRound.includes(pid));
      if (allPlayed) {
        game.roundCount++;
        game.playedInRound = [];
        let allClaimed = true;
        for (const realm of REALMS) {
          for (const r of realm.regions) {
            if (game.ownership[realm.id]?.[r.id] === null) { allClaimed = false; break; }
          }
          if (!allClaimed) break;
        }
        const maxRounds = game.maxClaimRounds || SOK_CONFIG.maxClaimRounds || 8;
        if (game.roundCount >= maxRounds || allClaimed) {
          game.phase = 'attacking';
          io.to(roomCode).emit('sok_stage_changed', { stage: 'attacking' });
        }
      }
    } else if (game.phase === 'attacking') {
      game.turn = getNextPlayerSOK(roomCode, game.turn, rooms);
    }

    io.to(roomCode).emit('sok_state', sanitizeSOK(game));
    io.to(roomCode).emit('sok_clear_question');
  };

  // ---------- DUEL QUESTION ----------
  askDuelQuestion = (roomCode, question, delay = 0) => {
    const game = rooms[roomCode]?.sok;
    if (!game || !game.duel) return;

    const broadcast = () => {
      const g = rooms[roomCode]?.sok;
      if (!g || !g.duel) return;
      g.duel.question = question;
      g.duel.answers = {};
      g.duel.answerTimestamps = {};
      const aSock = getPlayerSocketSOK(roomCode, g.duel.attackerId, rooms, io);
      const dSock = getPlayerSocketSOK(roomCode, g.duel.defenderId, rooms, io);
      if (aSock) aSock.emit('sok_duel_question', question);
      if (dSock) dSock.emit('sok_duel_question', question);
      io.to(roomCode).emit('sok_duel_status', {
        attacker: g.duel.attackerId, defender: g.duel.defenderId,
        round: g.duel.round, scores: g.duel.scores,
      });
      clearTimeout(g.timer);
      g.timer = setTimeout(() => {
        const gg = rooms[roomCode]?.sok;
        if (gg && gg.phase === 'duel' && gg.duel) resolveDuelRound(roomCode);
      }, SOK_CONFIG.duelTimer * 1000);
    };

    if (delay > 0) {
      clearTimeout(game.timer);
      game.timer = setTimeout(broadcast, delay);
    } else broadcast();
  };

  // ---------- RESOLVE DUEL ROUND ----------
  resolveDuelRound = (roomCode) => {
    const game = rooms[roomCode]?.sok;
    if (!game || !game.duel) return;
    if (game.timer) { clearTimeout(game.timer); game.timer = null; }

    const { attackerId, defenderId, question, answers, answerTimestamps = {}, round } = game.duel;

    // ✅ استخدم evaluateAnswers بدل isAnswerCorrect
    const arr = [];
    if (answers[attackerId] !== undefined) {
      arr.push({
        playerId: attackerId,
        answer: answers[attackerId],
        timestamp: answerTimestamps[attackerId] || 0,
      });
    }
    if (answers[defenderId] !== undefined) {
      arr.push({
        playerId: defenderId,
        answer: answers[defenderId],
        timestamp: answerTimestamps[defenderId] || 0,
      });
    }

    const evaluated = evaluateAnswers(question, arr);
    const attackerEval = evaluated.find(e => e.playerId === attackerId);
    const defenderEval = evaluated.find(e => e.playerId === defenderId);
    const attackerCorrect = !!attackerEval?.isCorrect;
    const defenderCorrect = !!defenderEval?.isCorrect;

    // ✅ فائز الجولة: الأسرع من "الصح"
    let roundWinner = null;
    const corrects = evaluated
      .filter(e => e.isCorrect)
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    if (corrects.length > 0) roundWinner = corrects[0].playerId;

    if (roundWinner) game.duel.scores[roundWinner]++;

    const roundWinnerName = roundWinner
      ? rooms[roomCode].players.find(p => p.id === roundWinner)?.name || '???'
      : null;

    io.to(roomCode).emit('sok_duel_round_result', {
      round,
      winner: roundWinner,
      winnerName: roundWinnerName,
      scores: game.duel.scores,
      correctAnswer: question.type === 'numeric' ? question.answer : question.options[question.answer],
      attackerCorrect, defenderCorrect,
    });

    const attackerScore = game.duel.scores[attackerId];
    const defenderScore = game.duel.scores[defenderId];

    // ✅ قواعد الفوز:
    // 1) حد وصل 2 → يخلص فوراً وهو الفائز
    // 2) محدش وصل 2 والجولة >= 3 → اللي عنده أكتر يكسب (تعادل → المدافع)
    // 3) غير كده → جولة تالية
    let duelWinner = null;
    let endDuel = false;

    if (attackerScore >= 2) {
      endDuel = true;
      duelWinner = attackerId;
    } else if (defenderScore >= 2) {
      endDuel = true;
      duelWinner = defenderId;
    } else if (round >= 3) {
      endDuel = true;
      duelWinner = attackerScore > defenderScore ? attackerId : defenderId;
    }

    if (endDuel) {
      const duelLoser = duelWinner === attackerId ? defenderId : attackerId;

      if (game.pendingAction.type === 'attack_hub') {
        if (duelWinner === attackerId) {
          game.ownership[game.pendingAction.continentId][game.pendingAction.regionName] = attackerId;
          game.scores[attackerId] = (game.scores[attackerId] || 0) + 1;
          game.scores[defenderId] = Math.max(0, (game.scores[defenderId] || 1) - 1);
        }
      } else if (game.pendingAction.type === 'attack_base') {
        if (duelWinner === attackerId) {
          for (const realm of REALMS) {
            for (const r of realm.regions) {
              if (game.ownership[realm.id][r.id] === duelLoser) {
                game.ownership[realm.id][r.id] = duelWinner;
                game.scores[duelWinner] = (game.scores[duelWinner] || 0) + 1;
                game.scores[duelLoser] = Math.max(0, (game.scores[duelLoser] || 1) - 1);
              }
            }
          }
          const room = rooms[roomCode];
          const loser = room.players.find(p => p.id === duelLoser);
          if (loser) loser.eliminated = true;
          game.players = room.players.map((p, i) => ({
            id: p.id, name: p.name,
            color: SOK_PLAYER_COLORS[i % SOK_PLAYER_COLORS.length],
            isAdmin: !!p.isAdmin,
            eliminated: p.eliminated || false,
          }));
        }
      }

      game.duel = null;
      game.pendingAction = null;
      game.phase = 'attacking';
      game.turn = getNextPlayerSOK(roomCode, attackerId, rooms);

      const activePlayers = game.players.filter(p => !p.eliminated);
      if (activePlayers.length === 1) {
        game.phase = 'ended';
        io.to(roomCode).emit('sok_game_over', {
          winner: activePlayers[0].id, name: activePlayers[0].name,
        });
      }
    } else {
      game.duel.round++;
      game.duel.question = null;
      game.duel.answers = {};
      game.duel.answerTimestamps = {};
      const aSock = getPlayerSocketSOK(roomCode, attackerId, rooms, io);
      if (aSock) aSock.emit('sok_request_duel_question');
    }
    io.to(roomCode).emit('sok_state', sanitizeSOK(game));
  };


  // ---------- PLAYER LEAVE (graceful) ----------
  socket.on('sok_cleanup', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || !room.sok) return;

    const game = room.sok;

    // لو اللعبة خلصت خلاص — بس نوقف التايمر
    if (game.phase === 'ended') {
      if (game.timer) clearTimeout(game.timer);
      return;
    }

    // 1) دور على اللاعب اللي بيخرج
    const leavingPlayer = room.players.find(p => p.socketId === socket.id);
    if (!leavingPlayer) return;
    const playerId = leavingPlayer.id;

    // 2) حرر كل الأقاليم بتاعته
    let releasedRegions = 0;
    Object.keys(game.ownership || {}).forEach(realmId => {
      const realmRegions = game.ownership[realmId] || {};
      Object.keys(realmRegions).forEach(regionId => {
        if (realmRegions[regionId] === playerId) {
          realmRegions[regionId] = null;
          releasedRegions++;
        }
      });
    });

    // 3) لو كان في مبارزة — ألغها (اللي فضل ماكسبش حاجة)
    let duelCancelled = false;
    if (game.duel && (game.duel.attackerId === playerId || game.duel.defenderId === playerId)) {
      if (game.timer) { clearTimeout(game.timer); game.timer = null; }
      game.duel = null;
      game.pendingAction = null;
      game.phase = 'attacking';
      duelCancelled = true;
    }

    // 4) لو كان في نص سؤال (claim) — اقفل السؤال
    if (game.currentQuestion) {
      if (game.timer) { clearTimeout(game.timer); game.timer = null; }
      game.currentQuestion = null;
      game.pendingAction = null;
      game.answersArray = [];
    }

    // 5) علّم عليه إنه خارج (في المكانين عشان الاتساق)
    const gp = game.players.find(p => p.id === playerId);
    if (gp) gp.eliminated = true;
    leavingPlayer.eliminated = true;

    // 6) شيل نقاطه
    delete game.scores[playerId];

    // 7) لو كان دوره — انقله للي بعده
    if (game.turn === playerId) {
      const next = getNextPlayerSOK(roomCode, playerId, rooms);
      game.turn = next;
    }

    // 8) افحص شرط النهاية — لو فاضل لاعب واحد بس
    const alive = game.players.filter(p => !p.eliminated);
    if (alive.length <= 1) {
      game.phase = 'ended';
      if (alive.length === 1) {
        io.to(roomCode).emit('sok_game_over', {
          winner: alive[0].id,
          name: alive[0].name,
        });
      }
    }

    // 9) بلّغ الكل + ابعت الحالة الجديدة
    io.to(roomCode).emit('sok_player_left', {
      playerId,
      playerName: leavingPlayer.name,
      releasedRegions,
      duelCancelled,
    });
    io.to(roomCode).emit('sok_state', sanitizeSOK(game));
  });
};