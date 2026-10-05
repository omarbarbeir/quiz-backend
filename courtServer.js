/**
 * ================================================
 * courtServer.js — سيرفر لعبة المحكمة
 * ================================================
 * الاستخدام في السيرفر الرئيسي:
 * require('./courtServer')(io);
 * ================================================
 */

const courtCases = require('./data/courtCases');

// ══════════════════════════════════════════════
// State
// ══════════════════════════════════════════════
const courtRooms = {};
// courtRooms[roomCode] = {
//   roomCode, caseId, caseData,
//   phase: 'waiting' | 'reading' | 'trial' | 'voting' | 'verdict' | 'debrief',
//   mode: 'solo' | 'multi',
//   players: { [playerId]: { id, name, socketId, role, team, ready, score, vote } },
//   roles: { judge, prosecution, defense, accused, jury[] },
//   timer: { seconds, intervalId },
//   tensionLevel: 0-10,
//   votes: { [playerId]: verdict },
//   verdict: null,
//   chatLogs: { defense: [], prosecution: [] },
//   readyCount: 0,
// }

// ══════════════════════════════════════════════
// الأدوار المتاحة
// ══════════════════════════════════════════════
const ROLES = {
  JUDGE: 'judge',
  PROSECUTION: 'prosecution',
  DEFENSE: 'defense',
  ACCUSED: 'accused',
  JURY: 'jury',
};

const TEAM = {
  COURT: 'court',   // القاضي + النيابة + المحلفين
  DEFENSE: 'defense', // المحامي + المتهم
};

// نقاط الجلسة
const PHASE = {
  WAITING: 'waiting',
  READING: 'reading',
  TRIAL: 'trial',
  VOTING: 'voting',
  VERDICT: 'verdict',
  DEBRIEF: 'debrief',
};

const READING_TIME = 180;  // 3 دقائق — التايمر الوحيد في اللعبة

// ══════════════════════════════════════════════
// توزيع الأدوار حسب عدد اللاعبين
// ══════════════════════════════════════════════
function assignRoles(players) {
  const ids = Object.keys(players);
  const shuffled = [...ids].sort(() => Math.random() - 0.5);
  const count = shuffled.length;

  const roleMap = {};

  if (count === 1) {
    // solo
    roleMap[shuffled[0]] = ROLES.JUDGE;
  } else if (count === 2) {
    roleMap[shuffled[0]] = ROLES.JUDGE;
    roleMap[shuffled[1]] = ROLES.ACCUSED;
  } else if (count === 3) {
    roleMap[shuffled[0]] = ROLES.JUDGE;
    roleMap[shuffled[1]] = ROLES.PROSECUTION;
    roleMap[shuffled[2]] = ROLES.ACCUSED;
  } else if (count === 4) {
    roleMap[shuffled[0]] = ROLES.JUDGE;
    roleMap[shuffled[1]] = ROLES.PROSECUTION;
    roleMap[shuffled[2]] = ROLES.DEFENSE;
    roleMap[shuffled[3]] = ROLES.ACCUSED;
  } else {
    // 5+ لاعبين — الزيادة محلفين
    roleMap[shuffled[0]] = ROLES.JUDGE;
    roleMap[shuffled[1]] = ROLES.PROSECUTION;
    roleMap[shuffled[2]] = ROLES.DEFENSE;
    roleMap[shuffled[3]] = ROLES.ACCUSED;
    for (let i = 4; i < count; i++) {
      roleMap[shuffled[i]] = ROLES.JURY;
    }
  }

  return roleMap;
}

// تحديد الفريق بناءً على الدور
function getTeam(role) {
  if (role === ROLES.DEFENSE || role === ROLES.ACCUSED) return TEAM.DEFENSE;
  return TEAM.COURT;
}

// ══════════════════════════════════════════════
// بناء ملف كل لاعب حسب دوره
// ══════════════════════════════════════════════
function buildPlayerFile(role, caseData, isSolo = false) {
  if (isSolo || role === ROLES.JUDGE) {
    return {
      role: ROLES.JUDGE,
      file: caseData.judgeFile,
      secret: null,
    };
  }

  switch (role) {
    case ROLES.PROSECUTION:
      return { role, file: caseData.prosecutionFile, secret: null };

    case ROLES.DEFENSE:
      return { role, file: caseData.defenseFile, secret: null };

    case ROLES.ACCUSED:
      return {
        role,
        file: {
          summary: `أنت المتهم. استمع للمرافعات وردّ على أسئلة القاضي.`,
          accusedName: caseData.interrogationDialogues.accused.name,
          openingStatement: caseData.interrogationDialogues.accused.openingStatement,
        },
        secret: caseData.truth.secretToAccused,
      };

    case ROLES.JURY:
      return {
        role,
        file: {
          summary: 'أنت عضو في هيئة المحلفين. استمع للمرافعات وصوّت في النهاية.',
          hint: 'بطاقة تدخل واحدة — يمكنك طرح سؤال واحد فقط خلال الجلسة.',
        },
        secret: null,
      };

    default:
      return { role, file: {}, secret: null };
  }
}

// ══════════════════════════════════════════════
// التايمر
// ══════════════════════════════════════════════
function startTimer(io, roomCode, seconds, onEnd) {
  const room = courtRooms[roomCode];
  if (!room) return;

  clearTimer(room);

  room.timer.seconds = seconds;
  io.to(`court_${roomCode}`).emit('court_timer_update', { seconds });

  room.timer.intervalId = setInterval(() => {
    const r = courtRooms[roomCode];
    if (!r) { clearInterval(room.timer.intervalId); return; }

    r.timer.seconds -= 1;
    io.to(`court_${roomCode}`).emit('court_timer_update', { seconds: r.timer.seconds });

    if (r.timer.seconds <= 0) {
      clearInterval(r.timer.intervalId);
      r.timer.intervalId = null;
      if (typeof onEnd === 'function') onEnd();
    }
  }, 1000);
}

function clearTimer(room) {
  if (room?.timer?.intervalId) {
    clearInterval(room.timer.intervalId);
    room.timer.intervalId = null;
  }
}

// ══════════════════════════════════════════════
// حساب النتيجة النهائية
// ══════════════════════════════════════════════
function calculateScores(room) {
  const { caseData, verdict, players } = room;
  const isGuilty = caseData.truth.isGuilty;
  const correctVerdict = caseData.judgeFile.correctVerdict;
  const judgeCorrect = verdict === correctVerdict;
  const scoring = caseData.scoring;

  const results = {};

  Object.values(players).forEach(player => {
    let points = 0;
    let outcome = '';

    switch (player.role) {
      case ROLES.JUDGE:
        if (judgeCorrect) {
          points = scoring.correctVerdictPoints + (scoring.justiceBonus || 0);
          outcome = 'حكم عادل';
        } else {
          points = isGuilty && verdict !== correctVerdict ? -20 : 0;
          outcome = 'حكم خاطئ';
        }
        break;

      case ROLES.PROSECUTION:
        if (isGuilty && judgeCorrect) {
          points = scoring.correctVerdictPoints;
          outcome = 'أدنت المذنب';
        } else if (!isGuilty && judgeCorrect) {
          points = 20;
          outcome = 'الحكم الصحيح';
        } else {
          points = 0;
          outcome = 'فشل في الإدانة';
        }
        break;

      case ROLES.DEFENSE:
        if (isGuilty && !judgeCorrect) {
          points = scoring.defenseWinPoints;
          outcome = 'أنقذ المذنب — Deception Bonus!';
        } else if (!isGuilty && judgeCorrect) {
          points = scoring.correctVerdictPoints;
          outcome = 'أثبت البراءة';
        } else {
          points = 0;
          outcome = 'لم يُحسم لصالحك';
        }
        break;

      case ROLES.ACCUSED:
        if (isGuilty && !judgeCorrect) {
          points = scoring.defenseWinPoints;
          outcome = 'أفلت من العقاب!';
        } else if (!isGuilty && judgeCorrect) {
          points = scoring.correctVerdictPoints;
          outcome = 'أُثبتت براءتك';
        } else if (isGuilty && judgeCorrect) {
          points = 0;
          outcome = 'صدر الحكم بإدانتك';
        } else {
          points = -30;
          outcome = 'ظُلمت — لم يُدافع عنك أحد';
        }
        break;

      case ROLES.JURY:
        const jurorVote = room.votes[player.id];
        if (jurorVote === correctVerdict) {
          points = 40;
          outcome = 'صوّت بشكل صحيح';
        } else {
          points = 0;
          outcome = 'صوّت بشكل خاطئ';
        }
        break;
    }

    results[player.id] = {
      playerId: player.id,
      playerName: player.name,
      role: player.role,
      team: player.team,
      points,
      outcome,
    };
  });

  return results;
}

// ══════════════════════════════════════════════
// الكشف عن الحقيقة
// ══════════════════════════════════════════════
function buildDebriefPayload(room) {
  const { caseData, verdict, players } = room;
  const correctVerdict = caseData.judgeFile.correctVerdict;
  const courtWon = verdict === correctVerdict;
  const isGuilty = caseData.truth.isGuilty;

  let resultLabel = '';
  let resultType = '';

  if (isGuilty && verdict === 'guilty') {
    resultLabel = '⚖️ حكم عدل — المذنب أُدين';
    resultType = 'justice';
  } else if (isGuilty && verdict !== 'guilty') {
    resultLabel = '🔴 انخدعت المحكمة — المذنب أفلت!';
    resultType = 'deceived';
  } else if (!isGuilty && verdict === 'not_guilty') {
    resultLabel = '✅ العدالة انتصرت — البريء أُعلنت براءته';
    resultType = 'justice';
  } else {
    resultLabel = '🔴 ظلم — بريء أُدين';
    resultType = 'injustice';
  }

  return {
    verdict,
    correctVerdict,
    resultLabel,
    resultType,
    truth: caseData.truth,
    debriefReport: caseData.debriefReport,
    scores: calculateScores(room),
  };
}

// ══════════════════════════════════════════════
// نقل مرحلة اللعبة
// ══════════════════════════════════════════════
function transitionPhase(io, roomCode, newPhase) {
  const room = courtRooms[roomCode];
  if (!room) return;

  clearTimer(room);
  room.phase = newPhase;
  io.to(`court_${roomCode}`).emit('court_phase_changed', { phase: newPhase });

  switch (newPhase) {
    case PHASE.READING:
      startTimer(io, roomCode, READING_TIME, () => {
        transitionPhase(io, roomCode, PHASE.TRIAL);
      });
      break;

    case PHASE.TRIAL:
      // مفيش تايمر — الجلسة مفتوحة لحد ما القاضي يقرر ينهيها
      if (room.mode === 'solo') {
        io.to(`court_${roomCode}`).emit('court_solo_trial_start', {
          dialogues: room.caseData.interrogationDialogues,
          tensionSystem: room.caseData.tensionSystem,
        });
      }
      break;

    case PHASE.VOTING:
      // مفيش تايمر — التصويت مفتوح لحد ما الكل يصوت
      room.votes = {};
      break;

    case PHASE.VERDICT:
      break;

    case PHASE.DEBRIEF:
      io.to(`court_${roomCode}`).emit('court_debrief', buildDebriefPayload(room));
      break;
  }
}

// ══════════════════════════════════════════════
// حسم التصويت
// ══════════════════════════════════════════════
function resolveVoting(io, roomCode) {
  const room = courtRooms[roomCode];
  if (!room) return;

  clearTimer(room);

  // في الطور الفردي — القاضي هو الحكم
  if (room.mode === 'solo') {
    const judgePlayer = Object.values(room.players).find(p => p.role === ROLES.JUDGE);
    const verdict = judgePlayer ? (room.votes[judgePlayer.id] || 'not_guilty') : 'not_guilty';
    room.verdict = verdict;
    room.phase = PHASE.VERDICT;
    io.to(`court_${roomCode}`).emit('court_verdict_announced', { verdict });
    setTimeout(() => transitionPhase(io, roomCode, PHASE.DEBRIEF), 3000);
    return;
  }

  // الملتي — القاضي + النيابة + المحلفين يصوتون
  const voters = Object.values(room.players).filter(p =>
    [ROLES.JUDGE, ROLES.PROSECUTION, ROLES.JURY].includes(p.role)
  );

  // عد الأصوات
  const tally = {};
  voters.forEach(p => {
    const v = room.votes[p.id];
    if (v) tally[v] = (tally[v] || 0) + 1;
  });

  // الأغلبية تفوز — لو تعادل القاضي يحسم
  let verdict = 'not_guilty';
  let maxVotes = 0;
  Object.entries(tally).forEach(([v, count]) => {
    if (count > maxVotes) { maxVotes = count; verdict = v; }
  });

  // تحكيم القاضي في حال التعادل
  const judge = Object.values(room.players).find(p => p.role === ROLES.JUDGE);
  if (judge && room.votes[judge.id] && maxVotes === 0) {
    verdict = room.votes[judge.id];
  }

  room.verdict = verdict;
  room.phase = PHASE.VERDICT;
  io.to(`court_${roomCode}`).emit('court_verdict_announced', { verdict, tally });
  setTimeout(() => transitionPhase(io, roomCode, PHASE.DEBRIEF), 3000);
}

// ══════════════════════════════════════════════
// التهيئة الرئيسية
// ══════════════════════════════════════════════
function setupCourtServer(socket, io) {

  // ── إنشاء غرفة محكمة أو الانضمام إليها ──
  socket.on('court_join', ({ roomCode, playerId, playerName, mode, caseId }) => {
    try {
      const resolvedMode = mode || 'multi';

      // إنشاء الغرفة لو مش موجودة
      if (!courtRooms[roomCode]) {
        const resolvedCaseId = caseId || courtCases[Math.floor(Math.random() * courtCases.length)].id;
        const caseData = courtCases.find(c => c.id === resolvedCaseId) || courtCases[0];

        courtRooms[roomCode] = {
          roomCode,
          caseId: resolvedCaseId,
          caseData,
          mode: resolvedMode,
          phase: PHASE.WAITING,
          players: {},
          roles: {},
          timer: { seconds: 0, intervalId: null },
          tensionLevel: 0,
          votes: {},
          verdict: null,
          chatLogs: { defense: [], prosecution: [] },
          juryQuestionUsed: {},
          readyPlayers: new Set(),
          hostId: playerId,
        };
        console.log(`[Court] Room ${roomCode} created. Case: ${resolvedCaseId}`);
      }

      const room = courtRooms[roomCode];

      // إضافة اللاعب
      room.players[playerId] = {
        id: playerId,
        name: playerName || 'محقق',
        socketId: socket.id,
        role: null,
        team: null,
        ready: false,
        score: 0,
        vote: null,
      };

      socket.join(`court_${roomCode}`);
      socket.data = { ...socket.data, courtRoomCode: roomCode, courtPlayerId: playerId };

      socket.emit('court_joined', {
        roomCode,
        playerId,
        mode: room.mode,
        caseInfo: {
          id: room.caseData.id,
          title: room.caseData.title,
          category: room.caseData.category,
          difficulty: room.caseData.difficulty,
          estimatedTime: room.caseData.estimatedTime,
        },
        isHost: room.hostId === playerId,
        players: Object.values(room.players).map(p => ({ id: p.id, name: p.name, role: p.role })),
      });

      // إبلاغ باقي اللاعبين
      socket.to(`court_${roomCode}`).emit('court_player_joined', {
        playerId,
        playerName: playerName || 'محقق',
      });

      console.log(`[Court] ${playerName} joined room ${roomCode}`);
    } catch (err) {
      console.error('[Court] court_join error:', err);
      socket.emit('court_error', { message: 'خطأ في الانضمام للغرفة' });
    }
  });

  // ── بدء اللعبة وتوزيع الأدوار ──
  socket.on('court_start_game', ({ roomCode, playerId }) => {
    try {
      const room = courtRooms[roomCode];
      if (!room) { socket.emit('court_error', { message: 'الغرفة غير موجودة' }); return; }
      if (room.hostId !== playerId) { socket.emit('court_error', { message: 'فقط المضيف يقدر يبدأ اللعبة' }); return; }
      if (room.phase !== PHASE.WAITING) { socket.emit('court_error', { message: 'اللعبة بدأت بالفعل' }); return; }

      // توزيع الأدوار
      const roleMap = assignRoles(room.players);
      room.roles = roleMap;

      Object.keys(room.players).forEach(pid => {
        const role = roleMap[pid];
        room.players[pid].role = role;
        room.players[pid].team = getTeam(role);
      });

      // إرسال ملف كل لاعب على حدة
      Object.values(room.players).forEach(player => {
        const isSolo = room.mode === 'solo';
        const playerFile = buildPlayerFile(player.role, room.caseData, isSolo);
        const playerSocket = io.sockets.sockets.get(player.socketId);

        if (playerSocket) {
          playerSocket.emit('court_role_assigned', {
            role: player.role,
            team: player.team,
            file: playerFile.file,
            secret: playerFile.secret,
            caseData: room.caseData,
            allRoles: Object.fromEntries(
              Object.entries(roleMap).map(([pid, r]) => [pid, {
                role: r,
                name: room.players[pid].name,
              }])
            ),
          });
        }
      });

      // انتقل لمرحلة القراءة
      transitionPhase(io, roomCode, PHASE.READING);

      console.log(`[Court] Game started in room ${roomCode}. Roles assigned to ${Object.keys(room.players).length} players.`);
    } catch (err) {
      console.error('[Court] court_start_game error:', err);
      socket.emit('court_error', { message: 'خطأ في بدء اللعبة' });
    }
  });

  // ── اللاعب جاهز (تخطي التايمر) ──
  socket.on('court_player_ready', ({ roomCode, playerId }) => {
    try {
      const room = courtRooms[roomCode];
      if (!room || room.phase !== PHASE.READING) return;

      room.readyPlayers.add(playerId);
      const totalPlayers = Object.keys(room.players).length;

      io.to(`court_${roomCode}`).emit('court_ready_update', {
        readyCount: room.readyPlayers.size,
        totalPlayers,
      });

      // لو الكل جاهز — تخطي التايمر
      if (room.readyPlayers.size >= totalPlayers) {
        transitionPhase(io, roomCode, PHASE.TRIAL);
      }
    } catch (err) {
      console.error('[Court] court_player_ready error:', err);
    }
  });

  // ── رسالة الشات الداخلي للفريق ──
  socket.on('court_team_message', ({ roomCode, playerId, message }) => {
    try {
      const room = courtRooms[roomCode];
      if (!room) return;

      const player = room.players[playerId];
      if (!player) return;

      const team = player.team;
      const logEntry = {
        playerId,
        playerName: player.name,
        message,
        timestamp: Date.now(),
      };

      // حفظ في اللوج
      if (team === TEAM.DEFENSE) {
        room.chatLogs.defense.push(logEntry);
      } else {
        room.chatLogs.prosecution.push(logEntry);
      }

      // إرسال فقط لأعضاء نفس الفريق
      Object.values(room.players).forEach(p => {
        if (p.team === team) {
          const s = io.sockets.sockets.get(p.socketId);
          if (s) s.emit('court_team_message', logEntry);
        }
      });
    } catch (err) {
      console.error('[Court] court_team_message error:', err);
    }
  });

  // ── رسالة عامة في قاعة المحكمة ──
  socket.on('court_public_message', ({ roomCode, playerId, message }) => {
    try {
      const room = courtRooms[roomCode];
      if (!room || room.phase !== PHASE.TRIAL) return;

      const player = room.players[playerId];
      if (!player) return;

      io.to(`court_${roomCode}`).emit('court_public_message', {
        playerId,
        playerName: player.name,
        role: player.role,
        message,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('[Court] court_public_message error:', err);
    }
  });

  // ── استجواب المتهم (طور فردي) ──
  socket.on('court_interrogate', ({ roomCode, playerId, question }) => {
    try {
      const room = courtRooms[roomCode];
      if (!room || room.mode !== 'solo') return;
      if (room.phase !== PHASE.TRIAL) return;

      const dialogues = room.caseData.interrogationDialogues.accused;
      const lowerQ = question.toLowerCase();

      // بحث عن رد مناسب
      let matchedResponse = null;
      let tensionIncrease = 0;
      let reveal = null;

      for (const resp of dialogues.responses) {
        const matched = resp.keywords.some(kw => lowerQ.includes(kw));
        if (matched) {
          matchedResponse = resp.response;
          tensionIncrease = resp.tensionIncrease || 0;
          reveal = resp.reveal || null;
          break;
        }
      }

      // رد افتراضي لو ما فيش match
      if (!matchedResponse) {
        matchedResponse = 'أنا مش فاهم سؤالك. ممكن توضّح أكتر؟';
        tensionIncrease = 0;
      }

      // تحديث مستوى التوتر
      room.tensionLevel = Math.max(0, Math.min(10, room.tensionLevel + tensionIncrease));

      // هل وصل للانهيار؟
      const breakdown = room.tensionLevel >= room.caseData.tensionSystem.breakingPoint;
      const breakdownResponse = breakdown ? room.caseData.tensionSystem.breakdownResponse : null;

      socket.emit('court_interrogation_response', {
        response: breakdownResponse || matchedResponse,
        tensionLevel: room.tensionLevel,
        reveal: breakdown ? null : reveal,
        breakdown,
        breakdownText: breakdownResponse,
      });

      // بث مستوى التوتر للجميع (في الملتي)
      io.to(`court_${roomCode}`).emit('court_tension_update', {
        tensionLevel: room.tensionLevel,
      });
    } catch (err) {
      console.error('[Court] court_interrogate error:', err);
    }
  });

  // ── بطاقة تدخل المحلفين ──
  socket.on('court_jury_question', ({ roomCode, playerId, question }) => {
    try {
      const room = courtRooms[roomCode];
      if (!room) return;

      const player = room.players[playerId];
      if (!player || player.role !== ROLES.JURY) {
        socket.emit('court_error', { message: 'فقط المحلفين يمكنهم استخدام بطاقة التدخل' });
        return;
      }

      if (room.juryQuestionUsed[playerId]) {
        socket.emit('court_error', { message: 'استخدمت بطاقة التدخل من قبل — محلف واحد سؤال واحد فقط' });
        return;
      }

      room.juryQuestionUsed[playerId] = true;

      io.to(`court_${roomCode}`).emit('court_jury_question', {
        jurorId: playerId,
        jurorName: player.name,
        question,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('[Court] court_jury_question error:', err);
    }
  });

  // ── إنهاء مرحلة المرافعة يدوياً (القاضي فقط) ──
  socket.on('court_end_trial', ({ roomCode, playerId }) => {
    try {
      const room = courtRooms[roomCode];
      if (!room) return;

      const player = room.players[playerId];
      if (!player || player.role !== ROLES.JUDGE) {
        socket.emit('court_error', { message: 'فقط القاضي يمكنه إنهاء المرافعة' });
        return;
      }

      if (room.phase !== PHASE.TRIAL) return;
      transitionPhase(io, roomCode, PHASE.VOTING);
    } catch (err) {
      console.error('[Court] court_end_trial error:', err);
    }
  });

  // ── تصويت ──
  socket.on('court_vote', ({ roomCode, playerId, verdict }) => {
    try {
      const room = courtRooms[roomCode];
      if (!room || room.phase !== PHASE.VOTING) return;

      const player = room.players[playerId];
      if (!player) return;

      // المتهم والمحامي لا يصوتون
      if (player.role === ROLES.ACCUSED || player.role === ROLES.DEFENSE) {
        socket.emit('court_error', { message: 'فريق الدفاع لا يصوت — هدفكم إقناع المحكمة' });
        return;
      }

      room.votes[playerId] = verdict;

      io.to(`court_${roomCode}`).emit('court_vote_cast', {
        playerId,
        playerName: player.name,
        role: player.role,
        // إخفاء الصوت الفعلي لحين الإعلان
        voted: true,
      });

      // هل صوّت الكل؟
      const voters = Object.values(room.players).filter(p =>
        [ROLES.JUDGE, ROLES.PROSECUTION, ROLES.JURY].includes(p.role)
      );
      const allVoted = voters.every(p => room.votes[p.id]);

      if (allVoted) {
        resolveVoting(io, roomCode);
      }
    } catch (err) {
      console.error('[Court] court_vote error:', err);
    }
  });

  // ── طلب قضايا متاحة ──
  socket.on('court_get_cases', ({ roomCode }) => {
    try {
      const casesList = courtCases.map(c => ({
        id: c.id,
        title: c.title,
        category: c.category,
        difficulty: c.difficulty,
        estimatedTime: c.estimatedTime,
      }));
      socket.emit('court_cases_list', { cases: casesList });
    } catch (err) {
      console.error('[Court] court_get_cases error:', err);
    }
  });

  // ── تغيير القضية (قبل البدء) ──
  socket.on('court_change_case', ({ roomCode, playerId, caseId }) => {
    try {
      const room = courtRooms[roomCode];
      if (!room || room.hostId !== playerId) return;
      if (room.phase !== PHASE.WAITING) {
        socket.emit('court_error', { message: 'لا يمكن تغيير القضية بعد بدء اللعبة' });
        return;
      }

      const newCase = courtCases.find(c => c.id === caseId);
      if (!newCase) { socket.emit('court_error', { message: 'القضية غير موجودة' }); return; }

      room.caseId = caseId;
      room.caseData = newCase;

      io.to(`court_${roomCode}`).emit('court_case_changed', {
        caseInfo: {
          id: newCase.id,
          title: newCase.title,
          category: newCase.category,
          difficulty: newCase.difficulty,
          estimatedTime: newCase.estimatedTime,
        },
      });
    } catch (err) {
      console.error('[Court] court_change_case error:', err);
    }
  });

  // ── إعادة اللعبة ──
  socket.on('court_restart', ({ roomCode, playerId }) => {
    try {
      const room = courtRooms[roomCode];
      if (!room || room.hostId !== playerId) return;

      clearTimer(room);

      room.phase = PHASE.WAITING;
      room.votes = {};
      room.verdict = null;
      room.tensionLevel = 0;
      room.readyPlayers = new Set();
      room.juryQuestionUsed = {};
      room.chatLogs = { defense: [], prosecution: [] };

      Object.values(room.players).forEach(p => {
        p.role = null;
        p.team = null;
        p.ready = false;
        p.vote = null;
      });

      io.to(`court_${roomCode}`).emit('court_restarted', {
        phase: PHASE.WAITING,
        players: Object.values(room.players).map(p => ({ id: p.id, name: p.name })),
      });
    } catch (err) {
      console.error('[Court] court_restart error:', err);
    }
  });

  // ── مغادرة الغرفة ──
  socket.on('court_leave', ({ roomCode, playerId }) => {
    try {
      handlePlayerLeave(io, socket, roomCode, playerId);
    } catch (err) {
      console.error('[Court] court_leave error:', err);
    }
  });
}

// ══════════════════════════════════════════════
// مغادرة / انقطاع
// ══════════════════════════════════════════════
function handlePlayerLeave(io, socket, roomCode, playerId) {
  const room = courtRooms[roomCode];
  if (!room) return;

  const player = room.players[playerId];
  if (player) {
    delete room.players[playerId];
    room.readyPlayers?.delete(playerId);

    io.to(`court_${roomCode}`).emit('court_player_left', {
      playerId,
      playerName: player.name,
    });

    console.log(`[Court] ${player.name} left room ${roomCode}`);
  }

  // لو مفيش لاعبين — امسح الغرفة
  if (Object.keys(room.players).length === 0) {
    clearTimer(room);
    delete courtRooms[roomCode];
    console.log(`[Court] Room ${roomCode} deleted (empty)`);
  } else if (room.hostId === playerId) {
    // نقل الهوست لأول لاعب
    const newHost = Object.values(room.players)[0];
    room.hostId = newHost.id;
    io.to(`court_${roomCode}`).emit('court_host_changed', {
      newHostId: newHost.id,
      newHostName: newHost.name,
    });
  }

  socket.leave(`court_${roomCode}`);
}

// ══════════════════════════════════════════════
// التصدير
// ══════════════════════════════════════════════
module.exports = function (io) {
  io.on('connection', (socket) => {
    setupCourtServer(socket, io);

    socket.on('disconnect', () => {
      const roomCode = socket.data?.courtRoomCode;
      const playerId = socket.data?.courtPlayerId;
      if (roomCode && playerId) {
        handlePlayerLeave(io, socket, roomCode, playerId);
      }
    });
  });

  console.log('⚖️ Court Game Server loaded');
};