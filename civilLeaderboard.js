/**
 * civilLeaderboard.js
 * نظام حفظ بيانات اللعبة في ملف JSON
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR  = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'civilLeaderboard.json');

// تأكد إن الـ data folder موجود
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '{}', 'utf8');

// ─── Read / Write ─────────────────────────────────────────────────────────────
function readDB() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return {}; }
}

function writeDB(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
}

// ─── Player ID ────────────────────────────────────────────────────────────────
function makePlayerId(name, pin) {
  return `${name.trim()}_${pin.trim()}`;
}

// ─── Room Operations ──────────────────────────────────────────────────────────

/** جيب أو أنشئ room record */
function getRoom(roomCode) {
  const db   = readDB();
  const room = db[roomCode];
  if (!room) return null;
  return room;
}

function initRoom(roomCode) {
  const db = readDB();
  if (!db[roomCode]) {
    db[roomCode] = {
      created:    new Date().toISOString().split('T')[0],
      lastPlayed: new Date().toISOString().split('T')[0],
      currentDay: 1,
      teamScore:  0,
      players:    {},
    };
    writeDB(db);
  }
  return db[roomCode];
}

/** سجّل أو حدّث لاعب في الغرفة */
function upsertPlayer(roomCode, playerId, name) {
  const db = readDB();
  if (!db[roomCode]) initRoom(roomCode);
  if (!db[roomCode].players[playerId]) {
    db[roomCode].players[playerId] = {
      name,
      totalScore:    0,
      daysPlayed:    0,
      bestDayScore:  0,
      stats: {
        correct:       0,
        wrong:         0,
        wantedCaught:  0,
        forgeCaught:   0,
        bribesRefused: 0,
        bribesAccepted:0,
      },
      history: [],   // [ {day, score, accuracy} ]
    };
  } else {
    // حدّث الاسم لو اتغير
    db[roomCode].players[playerId].name = name;
  }
  writeDB(db);
  return db[roomCode].players[playerId];
}

/** تحقق من لاعب موجود */
function verifyPlayer(roomCode, playerId) {
  const db = readDB();
  return db[roomCode]?.players?.[playerId] || null;
}

/** حفظ نتائج نهاية اليوم */
function saveShiftResult(roomCode, day, playerResults, teamScore) {
  const db = readDB();
  if (!db[roomCode]) return;

  db[roomCode].lastPlayed = new Date().toISOString().split('T')[0];
  db[roomCode].currentDay = day + 1;
  db[roomCode].teamScore  = teamScore;

  playerResults.forEach(({ playerId, name, score, stats, accuracy }) => {
    if (!db[roomCode].players[playerId]) upsertPlayer(roomCode, playerId, name);
    const p = db[roomCode].players[playerId];

    p.totalScore     += score;
    p.daysPlayed     += 1;
    p.bestDayScore    = Math.max(p.bestDayScore, score);

    // دمج الإحصائيات
    Object.keys(stats || {}).forEach(k => {
      p.stats[k] = (p.stats[k] || 0) + (stats[k] || 0);
    });

    // سجل اليوم
    p.history.push({ day, score, accuracy: accuracy || 0 });
    if (p.history.length > 30) p.history.shift(); // احتفظ بآخر 30 يوم بس
  });

  writeDB(db);
}

/** جيب ترتيب اللاعبين في الغرفة */
function getRoomLeaderboard(roomCode) {
  const db   = readDB();
  const room = db[roomCode];
  if (!room) return null;

  const players = Object.entries(room.players).map(([id, p]) => ({
    id,
    name:          p.name,
    totalScore:    p.totalScore,
    daysPlayed:    p.daysPlayed,
    bestDayScore:  p.bestDayScore,
    stats:         p.stats,
    history:       p.history,
    avgScore:      p.daysPlayed > 0 ? Math.round(p.totalScore / p.daysPlayed) : 0,
  }));

  players.sort((a, b) => b.totalScore - a.totalScore);

  return {
    roomCode,
    created:    room.created,
    lastPlayed: room.lastPlayed,
    currentDay: room.currentDay,
    teamScore:  room.teamScore,
    players,
  };
}

/** جيب السيف اللي ممكن يكمّل منه */
function getSaveData(roomCode) {
  const db   = readDB();
  const room = db[roomCode];
  if (!room) return null;
  return {
    currentDay: room.currentDay || 1,
    teamScore:  room.teamScore  || 0,
    lastPlayed: room.lastPlayed,
  };
}

module.exports = {
  makePlayerId,
  initRoom,
  upsertPlayer,
  verifyPlayer,
  saveShiftResult,
  getRoomLeaderboard,
  getSaveData,
  getRoom,
};