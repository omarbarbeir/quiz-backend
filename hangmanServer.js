// hangmanServer.js
// 🔠 الرجل المشنوق – منطق السيرفر
// signature: (socket, io, rooms)

const { HANGMAN_CONFIG } = require('./data/hangmanData');

// state لكل غرفة
const hangmanState = {};

// تحميل الكلمات بشكل دفاعي
let hangmanWords = [];
try {
  const mod = require('./data/hangmanWords');
  hangmanWords = Array.isArray(mod) ? mod : (mod?.words || mod?.default || []);
} catch (e) {
  console.error('❌ فشل تحميل كلمات المشنوق:', e.message);
}
if (hangmanWords.length === 0) console.warn('⚠️ مفيش كلمات للمشنوق');

function getRandomWordData() {
  if (!hangmanWords.length) return { word: 'غير_متاح', hint: '' };
  const randomItem = hangmanWords[Math.floor(Math.random() * hangmanWords.length)];
  if (typeof randomItem === 'object' && randomItem !== null) {
    return { word: randomItem.word || 'خطأ', hint: randomItem.hint || '' };
  }
  if (typeof randomItem === 'string') return { word: randomItem, hint: '' };
  return { word: 'خطأ_في_الكلمة', hint: '' };
}

function getHangmanState(roomCode) {
  const state = hangmanState[roomCode];
  if (!state || !state.word) return null;

  const word = state.word;
  const guessedLetters = state.guessedLetters;

  const display = word.split('').map(c => {
    if (c === ' ') return ' ';
    return guessedLetters.includes(c) ? c : '_';
  }).join(' ');

  const uniqueRemainingLetters = new Set(word.split('').filter(c => c !== ' '));
  guessedLetters.forEach(g => uniqueRemainingLetters.delete(g));

  return {
    display,
    guessedLetters,
    attempts: state.attempts,
    maxAttempts: state.maxAttempts,
    gameOver: state.gameOver,
    won: state.won,
    word: state.gameOver ? word : '',
    hint: state.hint,
    remaining: uniqueRemainingLetters.size,
  };
}

module.exports = function setupHangmanServer(socket, io, rooms) {

  // ---------- GET STATE ----------
  socket.on('hangman_get_state', ({ roomCode }) => {
    if (!roomCode) return;
    socket.join(roomCode);

    if (hangmanState[roomCode]) {
      socket.emit('hangman_state', getHangmanState(roomCode));
      return;
    }

    const randomData = getRandomWordData();
    hangmanState[roomCode] = {
      word: randomData.word,
      hint: randomData.hint,
      guessedLetters: [],
      attempts: 0,
      maxAttempts: HANGMAN_CONFIG.maxAttempts,
      gameOver: false,
      won: false,
    };
    io.to(roomCode).emit('hangman_state', getHangmanState(roomCode));
  });

  // ---------- GUESS ----------
  socket.on('hangman_guess', ({ roomCode, letter }) => {
    if (!roomCode) return;
    const state = hangmanState[roomCode];
    if (!state || state.gameOver) return;

    const guessed = String(letter || '').trim();
    if (guessed.length !== 1) return;
    if (state.guessedLetters.includes(guessed)) return;

    state.guessedLetters.push(guessed);

    const wordLetters = state.word.split('').filter(c => c !== ' ');

    if (wordLetters.includes(guessed)) {
      // صح
      const guessedSet = new Set(state.guessedLetters);
      const allGuessed = wordLetters.every(c => guessedSet.has(c));
      if (allGuessed) {
        state.won = true;
        state.gameOver = true;
      }
    } else {
      // غلط
      state.attempts += 1;
      if (state.attempts >= state.maxAttempts) {
        state.gameOver = true;
        state.won = false;
      }
    }

    io.to(roomCode).emit('hangman_state', getHangmanState(roomCode));
  });

  // ---------- RESET (admin) ----------
  socket.on('hangman_reset', ({ roomCode }) => {
    if (!roomCode) return;
    const room = rooms[roomCode];
    if (!room) return;

    // ✅ الأدمن بس يقدر يعيد
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player?.isAdmin) return;

    const randomData = getRandomWordData();
    hangmanState[roomCode] = {
      word: randomData.word,
      hint: randomData.hint,
      guessedLetters: [],
      attempts: 0,
      maxAttempts: HANGMAN_CONFIG.maxAttempts,
      gameOver: false,
      won: false,
    };
    io.to(roomCode).emit('hangman_state', getHangmanState(roomCode));
  });

  // ---------- CLEANUP ----------
  socket.on('hangman_cleanup', ({ roomCode }) => {
    if (!roomCode) return;
    const room = rooms[roomCode];
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player?.isAdmin) return;   // ✅
    delete hangmanState[roomCode];
  });
};