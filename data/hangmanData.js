// data/hangmanData.js
// 🔠 بيانات وإعدادات لعبة الرجل المشنوق – إصدار liquid glass
// ⚠️ نفس المحتوى في server/data و src/data

const HANGMAN_CONFIG = {
  maxAttempts: 6,
  letters: 'أإآاابتثجحخدذرزسشصضطظعغفقكلمنهويةىؤئء'.split(''),
  numbers: '٠١٢٣٤٥٦٧٨٩'.split(''),
};

const HANGMAN_THEME = {
  colors: {
    // خلفيات دافية (بني داكن، بدون بنفسجي/سيان)
    bgDeep:   '#0a0705',
    bgMid:    '#150d08',
    bgLight:  '#1f150c',

    // نص
    text:     '#fef3c7',   // كريمي
    textDim:  '#d6c4a0',   // كريمي داكن
    textMuted:'#8a7653',

    // حدود
    border:   'rgba(212,175,55,0.25)',  // ذهبي شفاف

    // ألوان أساسية (rgba string)
    lettersGlass: '245,158,11',   // amber (#f59e0b)
    numbersGlass: '16,185,129',   // emerald (#10b981)

    // نجاح/خطأ
    success:  '#10b981',
    error:    '#dc2626',
    accent:   '#f59e0b',
    gold:     '#d4af37',

    // خشب المشنقة
    wood:      '#7c4a1e',
    woodDark:  '#3f2410',
    woodLight: '#a87142',
    rope:      '#a16207',
    ropeDark:  '#78350f',
  },
};

const HANGMAN_SOUND_PATHS = {
  click:   '/audio/hangman/click.mp3',
  correct: '/audio/hangman/correct.mp3',
  wrong:   '/audio/hangman/wrong.mp3',
  win:     '/audio/hangman/win.mp3',
  lose:    '/audio/hangman/lose.mp3',
  reset:   '/audio/hangman/reset.mp3',
};

module.exports = {
  HANGMAN_CONFIG,
  HANGMAN_THEME,
  HANGMAN_SOUND_PATHS,
};