/**
 * civilRegistryNamespace.js — سيرفر لعبة السجل المدني
 * Socket.io namespace /civil
 */

const crypto = require('crypto');
const D  = require('./civilRegistryData');
const LB = require('./civilLeaderboard');

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getRequiredDocs(requestTypeId, gender) {
  const rt = D.REQUEST_TYPES.find(r => r.id === requestTypeId);
  if (!rt) return [];
  return rt.docs.filter(d => gender === 'M' || !rt.docsMaleOnly.includes(d));
}

function getMissingDocs(citizen) {
  return citizen.required_docs.filter(d => !citizen.available_docs.includes(d));
}

function generateNationalId(birthDate, gender, govCode) {
  const year = birthDate.getFullYear();
  const c    = year >= 2000 ? '3' : '2';
  const yy   = String(year).slice(2);
  const mm   = String(birthDate.getMonth() + 1).padStart(2, '0');
  const dd   = String(birthDate.getDate()).padStart(2, '0');
  const seq  = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  const gd   = gender === 'M' ? '1' : '2';
  const chk  = String(Math.floor(Math.random() * 9) + 1);
  return `${c}${yy}${mm}${dd}${govCode}${seq}${gd}${chk}`;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function removeRandomChar(str) {
  const parts = str.split(' ');
  const wi    = Math.floor(Math.random() * parts.length);
  const w     = parts[wi];
  if (w.length > 2) {
    const ci  = 1 + Math.floor(Math.random() * (w.length - 2));
    parts[wi] = w.slice(0, ci) + w.slice(ci + 1);
  }
  return parts.join(' ');
}

// ─── Citizen Generator ────────────────────────────────────────────────────────
function generateCitizen(day, opts = {}) {
  const gender    = opts.gender || (Math.random() > 0.5 ? 'M' : 'F');
  const fullName  = D.pickFullName(gender);
  const gov       = D.pickGov();
  const birthDate = randomDate(new Date(1960, 0, 1), new Date(2003, 11, 31));

  const specialType = opts.specialType || (
    Math.random() < 0.18 ? pick(['elderly', 'proxy', 'foreigner', 'disabled']) : 'normal'
  );

  const forgeChance = Math.min(0.15 + day * 0.05, 0.55);
  const isForged    = opts.isForced !== undefined ? opts.isForced : Math.random() < forgeChance;
  const isWanted    = day >= 3 && Math.random() < 0.10;
  const hasBribe    = day >= 2 && Math.random() < 0.18;

  let nationalId    = generateNationalId(birthDate, gender, gov.code);
  let declaredName  = fullName;
  let personSeed    = null;
  let expiresAt     = new Date(2027, 5, 1).toISOString().split('T')[0];
  let forgeReason   = null;
  let forgedDocName = null;

  const rtData       = D.pickRequestType(gender);
  const requiredDocs = rtData.requiredDocs;

  if (specialType === 'elderly')
    expiresAt = randomDate(new Date(2017, 0, 1), new Date(2022, 11, 31)).toISOString().split('T')[0];

  if (isForged) {
    forgeReason = pick(D.FORGE_TYPES);
    switch (forgeReason) {
      case 'invalid_national_id_birthdate': {
        const fd = randomDate(new Date(1948, 0, 1), new Date(1962, 11, 31));
        nationalId = generateNationalId(fd, gender, gov.code); break;
      }
      case 'wrong_governorate_code': {
        const wg = pick(D.GOVERNORATES.filter(g => g.code !== gov.code));
        nationalId = generateNationalId(birthDate, gender, wg.code); break;
      }
      case 'name_mismatch_form':  declaredName = removeRandomChar(fullName); break;
      case 'name_mismatch_doc':
        forgedDocName = requiredDocs.length ? pick(requiredDocs) : null;
        if (!forgedDocName) { declaredName = removeRandomChar(fullName); forgeReason = 'name_mismatch_form'; }
        break;
      case 'expired_id':
        expiresAt = randomDate(new Date(2020, 0, 1), new Date(2023, 11, 31)).toISOString().split('T')[0]; break;
      case 'photo_mismatch':  personSeed = crypto.randomUUID(); break;
      case 'wrong_gender_digit':
        nationalId = nationalId.slice(0, 13) + (gender === 'M' ? '2' : '1') + nationalId.slice(14); break;
      case 'future_birthdate': {
        const fd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 2);
        nationalId = generateNationalId(fd, gender, gov.code); break;
      }
    }
  }

  const idPhotoSeed = nationalId;
  if (!personSeed) personSeed = idPhotoSeed;
  const wantedData = isWanted ? D.pickWanted() : null;

  let availableDocs;
  if (opts.isReturning) {
    availableDocs = [...requiredDocs];
  } else {
    const haveProb = Math.max(0.35, 0.85 - day * 0.04);
    availableDocs  = requiredDocs.filter(() => Math.random() < haveProb);
    if (forgedDocName && !availableDocs.includes(forgedDocName)) availableDocs.push(forgedDocName);
  }

  const docContents = {};
  availableDocs.forEach(docName => {
    docContents[docName] = {
      printed_name:        forgedDocName === docName ? removeRandomChar(fullName) : fullName,
      printed_governorate: gov.name,
      issue_date: randomDate(new Date(2015, 0, 1), new Date(2024, 11, 31)).toISOString().split('T')[0],
    };
  });

  // حوار مناسب للنوع
  const dlgType = hasBribe ? 'bribe' : isForged ? 'forged' : isWanted ? 'wanted'
    : specialType === 'elderly' ? 'elderly' : specialType === 'proxy' ? 'proxy'
    : specialType === 'foreigner' ? 'foreigner' : 'normal';

  // مواطن nervous لو اليوم متأخر وفيه تزوير
  const isNervous = isForged && day >= 4 && Math.random() < 0.4;

  return {
    id: `cit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    full_name: fullName, declared_name: declaredName,
    national_id: nationalId,
    birth_date:  birthDate.toISOString().split('T')[0],
    governorate: gov.name, governorate_code: gov.code, gender,
    special_type: specialType, is_nervous: isNervous,
    request_type_id: rtData.id, request_type: rtData.name,
    required_docs: requiredDocs, available_docs: availableDocs, doc_contents: docContents,
    is_wanted: isWanted, wanted_data: wantedData,
    has_bribe: hasBribe, bribe_amount: hasBribe ? (Math.floor(Math.random() * 18) + 1) * 50 : 0,
    expires_at: expiresAt, id_photo_seed: idPhotoSeed, person_seed: personSeed,
    dialogue: D.pickDialogue(dlgType),
    is_returning: !!opts.isReturning,
    wife_name: gender === 'M' ? D.generateWifeName(nationalId) : null,
    proxy_data: specialType === 'proxy' ? (() => {
      const pg     = Math.random() > 0.5 ? 'M' : 'F'
      const pName  = D.pickFullName(pg)
      const pGov   = D.pickGov()
      const pBirth = randomDate(new Date(1975, 0, 1), new Date(2000, 11, 31))
      const pNid   = generateNationalId(pBirth, pg, pGov.code)
      return {
        name:        pName,
        gender:      pg,
        national_id: pNid,
        birth_date:  pBirth.toISOString().split('T')[0],
        governorate: pGov.name,
        poa_number:  `${1000 + Math.floor(Math.random() * 9000)}/${new Date().getFullYear()}`,
        id_photo_seed: pNid,
      }
    })() : null,
    _secret: { isForged, forgeReason, isWanted, wantedData, forgedDocName, specialType, isNervous },
  };
}

function generateShift(day, deferred = []) {
  const citizens = [];
  const ready    = deferred.filter(d => d.returnDay <= day);
  const notReady = deferred.filter(d => d.returnDay > day);

  ready.forEach(d => citizens.push(generateCitizen(day, { gender: d.gender, isReturning: true })));

  const targetCount = Math.min(6 + day * 3, 30);
  const remaining   = Math.max(0, targetCount - citizens.length);
  const forgedIdx   = remaining > 0 ? Math.floor(Math.random() * remaining) : -1;

  for (let i = 0; i < remaining; i++) {
    citizens.push(generateCitizen(day, { isForced: i === forgedIdx ? true : undefined }));
  }
  for (let i = citizens.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [citizens[i], citizens[j]] = [citizens[j], citizens[i]];
  }
  return { citizens, stillWaiting: notReady };
}

// ─── Room State ───────────────────────────────────────────────────────────────
const civilRooms = {};

function newPlayerData(playerId, playerName) {
  return {
    id: playerId, name: playerName, role: null, score: 0, isReady: false,
    stats: { correct:0, wrong:0, detected:0, missed:0, bribesRefused:0, bribesAccepted:0, mistakes:0, wantedCaught:0, forgeCaught:0 },
  };
}

function createRoom(roomCode, adminSocketId) {
  LB.initRoom(roomCode);
  civilRooms[roomCode] = {
    code: roomCode, adminSocketId,
    players: new Map(),
    deferred: [], totalMistakesEver: 0,
    gameState: {
      status: 'lobby', day: 1, score: 0,
      citizens: [], currentCitizenIndex: 0,
      events: [], dayMistakes: 0, queuePressure: 'low',
    },
    // Pressure timer
    pressureInterval: null,
    pressureSeconds: 0,
  };
  return civilRooms[roomCode];
}

function getRoomState(room) {
  const players = [];
  room.players.forEach((p, sid) => {
    players.push({ id:p.id, name:p.name, role:p.role, score:p.score, isAdmin:sid===room.adminSocketId, isReady:p.isReady, stats:p.stats });
  });
  const gs = room.gameState;
  const citizens = gs.citizens.map((c, i) => {
    if (i < gs.currentCitizenIndex)   return { id:c.id, _resolved:true };
    if (i === gs.currentCitizenIndex) { const { _secret, ...pub } = c; return pub; }
    return { id:c.id, _pending:true };
  });
  return {
    status:gs.status, day:gs.day, score:gs.score,
    currentCitizenIndex:gs.currentCitizenIndex,
    totalCitizens:gs.citizens.length,
    events:gs.events.slice(-5), citizens, players,
    waitingCount:room.deferred.length, queuePressure:gs.queuePressure,
  };
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function computeBadge(p) {
  const s = p.stats;
  if ((s.wantedCaught||0) >= 3) return '🦅 صائد المطلوبين';
  if ((s.forgeCaught ||0) >= 3) return '🔍 كاشف التزوير';
  if ((s.bribesRefused||0)>= 3) return '🧱 الصخرة النظيفة';
  if (s.correct >= 10)          return '👑 موظف الوردية';
  if ((s.bribesAccepted||0)>=2) return '😅 المرتشي';
  if (s.wrong >= 5)             return '😬 محتاج تدريب';
  return '⚡ نشيط';
}

function buildDailyReport(room) {
  const gs = room.gameState;
  const players = [];
  room.players.forEach(p => {
    const total    = p.stats.correct + p.stats.wrong;
    const accuracy = total > 0 ? Math.round((p.stats.correct / total) * 100) : 100;
    const badge    = computeBadge(p);
    const msgPool  = D.getReportMessage(accuracy / 100);
    players.push({ id:p.id, name:p.name, role:p.role, score:p.score, stats:p.stats, accuracy, badge, message:msgPool });
  });
  players.sort((a, b) => b.score - a.score);
  return {
    day:gs.day, teamScore:gs.score,
    totalProcessed:gs.currentCitizenIndex, totalCitizens:gs.citizens.length,
    waitingCount:room.deferred.length,
    teamAccuracy:players.length ? Math.round(players.reduce((s,p)=>s+p.accuracy,0)/players.length) : 0,
    players, dayMistakes:gs.dayMistakes,
  };
}

// ─── Pressure Timer (disabled) ───────────────────────────────────────────────
function startPressureTimer(room, civil) {}
function stopPressureTimer(room) {
  if (room.pressureInterval) { clearInterval(room.pressureInterval); room.pressureInterval = null; }
}

// ─── Game Logic ───────────────────────────────────────────────────────────────
function startGame(room, civil) {
  const gs = room.gameState;
  gs.status = 'playing';
  const saveData = LB.getSaveData(room.code);
  if (saveData) { gs.day = saveData.currentDay; gs.score = 0; }

  const { citizens, stillWaiting } = generateShift(gs.day, room.deferred);
  // شبكة تزوير في الـ namespace
  if (gs.day >= 4 && Math.random() < 0.20 && citizens.length >= 5) {
    const networkIdx = []
    while (networkIdx.length < 3) {
      const i = Math.floor(Math.random() * citizens.length)
      if (!networkIdx.includes(i)) networkIdx.push(i)
    }
    const addresses = ['شارع الجمهورية، مبنى 7','شارع النيل، شقة 12','ميدان التحرير، عمارة النيل']
    const lawyers   = ['المحامي أحمد سالم','المحامي خالد عوض','المحامية نور إبراهيم']
    const sharedAddr   = pick(addresses)
    const sharedLawyer = pick(lawyers)
    networkIdx.forEach(i => {
      if (!citizens[i]._secret.isForged) {
        citizens[i]._secret.isForged = true
        citizens[i]._secret.forgeReason = 'name_mismatch_form'
        const parts = citizens[i].full_name.split(' ')
        citizens[i].declared_name = parts[0] + ' ' + (parts[2]||parts[1])
      }
      citizens[i]._networkMember  = true
      citizens[i]._networkAddress = sharedAddr
      citizens[i]._networkLawyer  = sharedLawyer
    })
    room.crimeNetwork = { indices: networkIdx, address: sharedAddr, lawyer: sharedLawyer, detected: 0 }
  }
  gs.citizens = citizens; room.deferred = stillWaiting;
  gs.currentCitizenIndex = 0; gs.events = []; gs.dayMistakes = 0;

  civil.to(room.code).emit('GAME_STARTED', { state: getRoomState(room) });

  // تلميحات الأدوار للمواطن الأول
  setTimeout(() => sendRoleHints(room, gs.citizens[0], civil), 500);
  startPressureTimer(room, civil);
}

function endShift(room, civil) {
  stopPressureTimer(room);
  const gs     = room.gameState;
  gs.status    = 'ended';
  const report = buildDailyReport(room);

  // حفظ في الـ JSON
  const playerResults = [];
  room.players.forEach(p => {
    const total    = p.stats.correct + p.stats.wrong;
    const accuracy = total > 0 ? Math.round((p.stats.correct / total) * 100) : 100;
    playerResults.push({ playerId: p.id, name: p.name, score: p.score, stats: p.stats, accuracy });
  });
  LB.saveShiftResult(room.code, gs.day, playerResults, gs.score);

  civil.to(room.code).emit('SHIFT_ENDED', { summary: report });
}

function checkManagerWarning(room, playerName, civil) {
  const gs = room.gameState;
  let level = null;
  if      (gs.dayMistakes >= 6) level = 'critical';
  else if (gs.dayMistakes >= 4) level = 'danger';
  else if (gs.dayMistakes >= 2) level = 'warning';
  if (!level) return;
  civil.to(room.code).emit('MANAGER_WARNING', { level, message: D.pickManagerWarning(level) });
}

function updateQueuePressure(room, civil) {
  const gs        = room.gameState;
  const remaining = gs.citizens.length - gs.currentCitizenIndex;
  gs.queuePressure = remaining > 15 ? 'high' : remaining > 8 ? 'medium' : 'low';
  civil.to(room.code).emit('QUEUE_UPDATE', { remaining, pressure: gs.queuePressure, waitingCount: room.deferred.length });
}

function sendRoleHints(room, citizen, civil) {
  if (!citizen) return;
  const secret = citizen._secret;
  room.players.forEach((player, sid) => {
    const socket = [...civil.sockets.values()].find(s => s.id === sid);
    if (!socket) return;
    const perm = D.ROLE_PERMISSIONS[player.role];
    if (!perm) return;
    const hints = [];
    if (perm.canSeeForge && secret.isForged)
      hints.push({ type:'forge_hint', message:`🔍 [مدقق] في شيء مش تمام — ${D.formatForgeReason(secret.forgeReason)}`, level:'warning' });
    if (perm.canSeeWanted && secret.isWanted)
      hints.push({ type:'wanted_hint', message:`🚨 [أمن] هذا المواطن مطلوب! التهمة: ${secret.wantedData?.crime||''}`, level:'danger' });
    if (secret.isNervous && (player.role === 'checker' || player.role === 'manager'))
      hints.push({ type:'nervous_hint', message:`👁️ المواطن ده nervous بشكل غير طبيعي...`, level:'warning' });
    if (hints.length > 0) socket.emit('ROLE_HINT', { hints, citizenId: citizen.id });
  });
}

function handleDecision(room, socket, player, data, civil) {
  const gs = room.gameState;
  if (gs.status !== 'playing') return;
  const citizen = gs.citizens[gs.currentCitizenIndex];
  if (!citizen || citizen.id !== data.citizenId) return;

  const perm = D.ROLE_PERMISSIONS[player.role] || D.ROLE_PERMISSIONS['desk'];
  if (!perm.canDecide) {
    socket.emit('ERROR', { message: `دورك (${perm.name}) مش بيخليك تاخد القرار — كلم موظف الشباك!` });
    return;
  }

  const secret     = citizen._secret;
  const hasAllDocs = getMissingDocs(citizen).length === 0;
  let pointsDelta = 0, correct = false, resultMsg = '', isMistake = false;

  switch (data.decision) {
    case 'APPROVE':
      if (secret.isWanted)      { pointsDelta=-30; isMistake=true; resultMsg=`🚨 خطأ! مطلوب بتهمة: ${secret.wantedData?.crime||''}!`; player.stats.missed++; }
      else if (secret.isForged) { pointsDelta=-15; isMistake=true; resultMsg=`❌ خطأ! تزوير: ${D.formatForgeReason(secret.forgeReason)}`; }
      else if (!hasAllDocs)     { pointsDelta=-10; isMistake=true; resultMsg='❌ وافقت على ملف ناقص!'; }
      else                      { pointsDelta=10;  correct=true;   resultMsg='✅ صح — مواطن سليم!'; player.stats.correct++; }
      break;
    case 'REJECT':
      if (secret.isForged || !hasAllDocs) {
        pointsDelta=secret.isForged?20:12; correct=true;
        resultMsg=secret.isForged?`✅ كشفت تزوير: ${D.formatForgeReason(secret.forgeReason)}`:'✅ رفضت ملف ناقص';
        if (secret.isForged) { player.stats.detected++; player.stats.forgeCaught++; }
        player.stats.correct++;
      } else if (secret.isWanted) {
        pointsDelta=5; correct=true; resultMsg=`✅ رفضت مطلوب — كان لازم تبلغ!`; player.stats.correct++;
      } else {
        pointsDelta=-10; isMistake=true; resultMsg='❌ رفضت مواطن سليم!'; player.stats.wrong++;
      }
      break;
    case 'REPORT':
      if (secret.isWanted) {
        pointsDelta=50; correct=true; resultMsg=`🚨 مسكت مطلوب! التهمة: ${secret.wantedData?.crime||''}!`;
        player.stats.detected++; player.stats.wantedCaught++; player.stats.correct++;
      } else {
        pointsDelta=-20; isMistake=true; resultMsg='❌ مش مطلوب — بلاغ كاذب!'; player.stats.wrong++;
      }
      break;
    case 'ACCEPT_BRIBE':
      if (citizen.has_bribe) {
        player.stats.bribesAccepted++;
        if (Math.random() < 0.35) { pointsDelta=-50; isMistake=true; resultMsg='🚔 اتكشفت! مفتشية مفاجئة!'; player.stats.wrong++; }
        else { pointsDelta=Math.max(5,Math.floor(citizen.bribe_amount/50)); resultMsg=`💰 قبلت ${citizen.bribe_amount} جنيه...`; }
      }
      break;
    case 'REFUSE_BRIBE':
      if (citizen.has_bribe) { pointsDelta=15; correct=true; player.stats.bribesRefused++; player.stats.correct++; resultMsg='🧱 رفضت الرشوة!'; }
      break;
  }

  gs.score     = Math.max(0, gs.score + pointsDelta);
  player.score = Math.max(0, player.score + pointsDelta);
  if (isMistake) { player.stats.mistakes++; gs.dayMistakes++; room.totalMistakesEver++; }

  gs.currentCitizenIndex++;
  const hasMore = gs.currentCitizenIndex < gs.citizens.length;

  civil.to(room.code).emit('DECISION_RESULT', {
    citizenId:data.citizenId, decision:data.decision,
    playerId:player.id, playerName:player.name,
    correct, pointsDelta, message:resultMsg, secret,
    newTeamScore:gs.score, state:getRoomState(room),
  });

  if (isMistake) checkManagerWarning(room, player.name, civil);
  updateQueuePressure(room, civil);

  // reset pressure timer
  startPressureTimer(room, civil);

  // حدث عشوائي
  if (Math.random() < 0.12) {
    const ev = D.pickGameEvent();
    gs.events.push({ ...ev, timestamp: Date.now() });
    civil.to(room.code).emit('GAME_EVENT', { event: ev });
  }

  if (!hasMore) setTimeout(() => endShift(room, civil), 1200);
  else setTimeout(() => sendRoleHints(room, gs.citizens[gs.currentCitizenIndex], civil), 300);
}

function handleRequestPapers(room, player, data, civil) {
  const gs = room.gameState;
  if (gs.status !== 'playing') return;
  const citizen = gs.citizens[gs.currentCitizenIndex];
  if (!citizen || citizen.id !== data.citizenId) return;
  if (!Array.isArray(data.docNames) || data.docNames.length === 0) return;
  const missing = getMissingDocs(citizen);
  if (!data.docNames.every(d => missing.includes(d))) return;

  const delays    = data.docNames.map(d => D.DOC_RETURN_DAYS[d] || 1);
  const returnDay = gs.day + Math.max(...delays) + (data.docNames.length - 1);
  room.deferred.push({ gender: citizen.gender, returnDay });

  gs.currentCitizenIndex++;
  const hasMore = gs.currentCitizenIndex < gs.citizens.length;

  civil.to(room.code).emit('CITIZEN_LEFT', {
    citizenId:data.citizenId, docNames:data.docNames,
    playerId:player?.id, playerName:player?.name,
    message:`📋 مشى يجيب (${data.docNames.join('، ')}) — يرجع يوم ${returnDay}`,
    state:getRoomState(room),
  });

  updateQueuePressure(room, civil);
  startPressureTimer(room, civil);
  if (!hasMore) setTimeout(() => endShift(room, civil), 1200);
  else setTimeout(() => sendRoleHints(room, gs.citizens[gs.currentCitizenIndex], civil), 300);
}

// ─── Main Export ──────────────────────────────────────────────────────────────
module.exports = function setupCivilRegistry(io) {
  const civil = io.of('/civil');

  civil.on('connection', (socket) => {
    console.log(`🏛️ [Civil] connected: ${socket.id}`);
    const sessionId = crypto.randomUUID();
    socket.emit('CONNECTED', { sessionId, requestTypes:D.REQUEST_TYPES, governorates:D.GOVERNORATES, docReturnDays:D.DOC_RETURN_DAYS, rolePermissions:D.ROLE_PERMISSIONS });

    // ── Create Room ──────────────────────────────────────────────────────────
    socket.on('CREATE_ROOM', ({ roomCode, playerName, pin }) => {
      if (!roomCode || !playerName || !pin) return;
      if (civilRooms[roomCode]) { socket.emit('ERROR', { message:'الغرفة موجودة بالفعل' }); return; }
      const playerId = LB.makePlayerId(playerName, pin);
      const room     = createRoom(roomCode, socket.id);
      LB.upsertPlayer(roomCode, playerId, playerName);
      socket.join(roomCode);
      socket.data.civilRoom     = roomCode;
      socket.data.civilPlayerId = playerId;
      room.players.set(socket.id, { ...newPlayerData(playerId, playerName), isAdmin: true });
      const saveData = LB.getSaveData(roomCode);
      socket.emit('ROOM_CREATED', { roomCode, state:getRoomState(room), saveData });
    });

    // ── Join Room ────────────────────────────────────────────────────────────
    socket.on('JOIN_ROOM', ({ roomCode, playerName, pin }) => {
      const room = civilRooms[roomCode];
      if (!room)                 { socket.emit('ERROR', { message:'الغرفة مش موجودة' }); return; }
      if (room.players.size >= 6){ socket.emit('ERROR', { message:'الغرفة ممتلئة' });    return; }
      const playerId = LB.makePlayerId(playerName, pin);
      LB.upsertPlayer(roomCode, playerId, playerName);
      socket.join(roomCode);
      socket.data.civilRoom     = roomCode;
      socket.data.civilPlayerId = playerId;
      room.players.set(socket.id, newPlayerData(playerId, playerName));
      const saveData = LB.getSaveData(roomCode);
      socket.emit('ROOM_JOINED', { roomCode, state:getRoomState(room), saveData });
      socket.to(roomCode).emit('PLAYER_JOINED', { playerName, state:getRoomState(room) });
    });

    // ── Select Role ──────────────────────────────────────────────────────────
    socket.on('SELECT_ROLE', ({ role }) => {
      const room = civilRooms[socket.data.civilRoom]; if (!room) return;
      const player = room.players.get(socket.id);     if (!player) return;
      const taken = new Set(); room.players.forEach((p,sid)=>{ if(sid!==socket.id) taken.add(p.role); });
      if (taken.has(role)) { socket.emit('ERROR', { message:'الوظيفة محجوزة' }); return; }
      player.role = role;
      socket.emit('ROLE_ASSIGNED', { role, perm: D.ROLE_PERMISSIONS[role] });
      civil.to(socket.data.civilRoom).emit('ROLE_SELECTED', { playerId:player.id, playerName:player.name, role, state:getRoomState(room) });
    });

    // ── Set Ready ────────────────────────────────────────────────────────────
    socket.on('SET_READY', ({ ready }) => {
      const room = civilRooms[socket.data.civilRoom]; if (!room) return;
      const player = room.players.get(socket.id);     if (!player) return;
      player.isReady = ready;
      civil.to(socket.data.civilRoom).emit('PLAYER_READY', { playerId:player.id, ready, state:getRoomState(room) });
    });

    // ── Start Game ───────────────────────────────────────────────────────────
    socket.on('START_GAME', () => {
      const room = civilRooms[socket.data.civilRoom];
      if (!room || socket.id !== room.adminSocketId) { socket.emit('ERROR', { message:'بس الـ Admin يبدأ' }); return; }
      if (room.gameState.status !== 'lobby') return;
      startGame(room, civil);
    });

    // ── Decision ─────────────────────────────────────────────────────────────
    socket.on('DECISION', (data) => {
      const room = civilRooms[socket.data.civilRoom]; if (!room) return;
      const player = room.players.get(socket.id);     if (!player) return;
      handleDecision(room, socket, player, data, civil);
    });

    // ── Request Papers ───────────────────────────────────────────────────────
    socket.on('REQUEST_PAPERS', (data) => {
      const room = civilRooms[socket.data.civilRoom]; if (!room) return;
      const player = room.players.get(socket.id);
      handleRequestPapers(room, player, data, civil);
    });

    // ── Next Day ─────────────────────────────────────────────────────────────
    socket.on('NEXT_DAY', () => {
      const room = civilRooms[socket.data.civilRoom];
      if (!room || socket.id !== room.adminSocketId) return;
      if (room.gameState.status !== 'ended') return;
      room.gameState.status = 'lobby'; room.gameState.day++;
      room.gameState.currentCitizenIndex = 0; room.gameState.citizens = [];
      room.gameState.queuePressure = 'low';
      civil.to(socket.data.civilRoom).emit('NEXT_DAY_READY', { day:room.gameState.day, state:getRoomState(room) });
    });

    // ── Chat ─────────────────────────────────────────────────────────────────
    socket.on('SEND_CHAT', ({ roomCode, message }) => {
      const room = civilRooms[roomCode]; if (!room) return;
      const player = room.players.get(socket.id); if (!player) return;
      const roleData = D.ROLE_PERMISSIONS[player.role];
      civil.to(roomCode).emit('CHAT_MESSAGE', {
        playerId:   player.id,
        playerName: player.name,
        role:       player.role,
        roleIcon:   roleData?.icon || '👤',
        message:    message.slice(0, 100), // حد أقصى
        timestamp:  Date.now(),
      });
    });

    // ── Quick Alert (إبلاغ سريع) ─────────────────────────────────────────────
    socket.on('SEND_ALERT', ({ roomCode, alertType }) => {
      const room = civilRooms[roomCode]; if (!room) return;
      const player = room.players.get(socket.id); if (!player) return;
      const alerts = {
        forge:  `🔍 ${player.name}: في تزوير محتمل!`,
        wanted: `🚨 ${player.name}: المواطن ده مطلوب!`,
        missing:`📋 ${player.name}: أوراق ناقصة!`,
        bribe:  `💰 ${player.name}: في رشوة!`,
        ok:     `✅ ${player.name}: كل حاجة تمام`,
      };
      civil.to(roomCode).emit('QUICK_ALERT', {
        playerId:   player.id,
        playerName: player.name,
        alertType,
        message:    alerts[alertType] || `${player.name}: تنبيه!`,
        timestamp:  Date.now(),
      });
    });

    // ── Get Leaderboard ──────────────────────────────────────────────────────
    socket.on('GET_LEADERBOARD', ({ roomCode }) => {
      const lb = LB.getRoomLeaderboard(roomCode);
      socket.emit('LEADERBOARD_DATA', lb);
    });

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const roomCode = socket.data.civilRoom;
      const room     = civilRooms[roomCode]; if (!room) return;
      const player   = room.players.get(socket.id);
      room.players.delete(socket.id);
      console.log(`🏛️ [Civil] ${player?.name||socket.id} left ${roomCode}`);
      civil.to(roomCode).emit('PLAYER_LEFT', { playerId:player?.id, state:getRoomState(room) });
      if (room.players.size === 0) { stopPressureTimer(room); delete civilRooms[roomCode]; }
    });

    socket.on('PING', () => socket.emit('PONG'));
  });

  console.log('🏛️ Civil Registry namespace ready at /civil');
};