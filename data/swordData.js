// data/swordData.js
// ⚔️ Sword of Knowledge – بيانات + إعدادات + خريطة ديناميكية

const SOK_THEME = {
  colors: {
    gold: '#d4af37', goldLight: '#f4e5a1', goldDark: '#8b6914',
    royalPurple: '#4a1e6f', royalCrimson: '#8b0000', royalNavy: '#0a1929',
    parchment: '#f4e5c3', blood: '#5c0000', glow: '#ffd700',
    emerald: '#10b981', sky: '#06b6d4', iron: '#708090',
  },
};


const SOK_CONFIG = {
  // maxClaimRounds: 10,        // جولات السيطرة (كل جولة = دورة كاملة لكل اللاعبين)
  questionTimer: 15,         // ثواني سؤال
  duelTimer: 15,
  resultsDisplayMs: 8000,
  msgDisplayMs: 4000,
  preQuestionDelayMs: 2500,
  minPlayers: 2,
  maxPlayers: 12,
  hubsPerRealm: 6,
  numericTolerance: 0.20,    // 20% tolerance للأرقام
  denyBonusPerDuel: 1,       // كل نقطة حرمان تعطي +1 نقطة بداية في المبارزة
};

const SOK_PLAYER_COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
  '#06b6d4', '#84cc16', '#d946ef', '#f43f5e',
];

const HUB_POS = [
  { cx: 100, cy: 20  }, { cx: 170, cy: 60  }, { cx: 170, cy: 140 },
  { cx: 100, cy: 180 }, { cx: 30,  cy: 140 }, { cx: 30,  cy: 60  },
];

const makeRealm = (id, name, icon, baseName, hubNames) => ({
  id, name, icon,
  base: { id: `${id}0`, name: baseName, cx: 100, cy: 100 },
  regions: [
    { id: `${id}0`, name: baseName, cx: 100, cy: 100 },
    ...hubNames.slice(0, 6).map((n, i) => ({
      id: `${id}${i + 1}`, name: n, cx: HUB_POS[i].cx, cy: HUB_POS[i].cy,
    })),
  ],
});

const SOK_REALMS = [
  makeRealm('egypt', 'مصر الفرعونية', '🏜️', 'القاهرة',
    ['الإسكندرية', 'أسوان', 'الأقصر', 'سيناء', 'الفيوم', 'طنطا']),
  makeRealm('arabia', 'الجزيرة العربية', '🕌', 'مكة',
    ['الرياض', 'دبي', 'الدوحة', 'مسقط', 'صنعاء', 'المنامة']),
  makeRealm('persia', 'بلاد فارس', '🦁', 'طهران',
    ['أصفهان', 'شيراز', 'بابل', 'بغداد', 'دمشق', 'حلب']),
  makeRealm('rome', 'الإمبراطورية الرومانية', '🦅', 'روما',
    ['أثينا', 'بيزنطة', 'قرطاج', 'ميلانو', 'نابولي', 'صقلية']),
  makeRealm('andalusia', 'الأندلس', '🌙', 'قرطبة',
    ['غرناطة', 'إشبيلية', 'طليطلة', 'بلنسية', 'ملقة', 'سرقسطة']),
  makeRealm('china', 'الصين', '🐉', 'بكين',
    ['شنغهاي', 'هونغ كونغ', 'شيان', 'التبت', 'منشوريا', 'يونان']),
  makeRealm('japan', 'اليابان', '🗾', 'طوكيو',
    ['كيوتو', 'أوساكا', 'ناغويا', 'سابورو', 'هيروشيما', 'أوكيناوا']),
  makeRealm('india', 'الهند', '🕉️', 'دلهي',
    ['مومباي', 'بنغالور', 'كلكتا', 'تاميل نادو', 'كشمير', 'غوا']),
  makeRealm('russia', 'روسيا', '❄️', 'موسكو',
    ['سانت بطرسبرغ', 'كازان', 'سيبيريا', 'فلاديفوستوك', 'أوفا', 'سوتشي']),
  makeRealm('americas', 'الأمريكتان', '🗽', 'واشنطن',
    ['نيويورك', 'كاليفورنيا', 'تكساس', 'كندا', 'المكسيك', 'البرازيل']),
  makeRealm('africa', 'أفريقيا السمراء', '🦒', 'أديس أبابا',
    ['لاغوس', 'نيروبي', 'كيب تاون', 'الدار البيضاء', 'أكرا', 'كمبالا']),
  makeRealm('australia', 'أستراليا', '🦘', 'سيدني',
    ['ملبورن', 'بريزبن', 'برث', 'أديلايد', 'كانبيرا', 'داروين']),
];

// ============ الخريطة الديناميكية ============
const MAP_W = 1600;
const MAP_H = 900;

function getMapLayout(count) {
  // نصف قطر المملكة يعتمد على عدد اللاعبين (3 = 150px، 12 = 87px)
  const realmR = Math.max(85, 150 - (count - 3) * 7);
  const cx = MAP_W / 2, cy = MAP_H / 2;
  const rx = MAP_W / 2 - 50 - realmR;
  const ry = MAP_H / 2 - 50 - realmR;
  const startAngle = -Math.PI / 2;

  const positions = [];
  for (let i = 0; i < count; i++) {
    const angle = startAngle + (i / count) * Math.PI * 2;
    positions.push({
      x: Math.round(cx + Math.cos(angle) * rx),
      y: Math.round(cy + Math.sin(angle) * ry),
      r: Math.round(realmR),
    });
  }
  return positions;
}

const SOK_SOUND_PATHS = {
  swordClash:  '/audio/sok/sword_clash.mp3',
  victory:     '/audio/sok/victory.mp3',
  defeat:      '/audio/sok/defeat.mp3',
  claim:       '/audio/sok/claim.mp3',
  attack:      '/audio/sok/attack.mp3',
  tick:        '/audio/sok/tick.mp3',
  turn:        '/audio/sok/turn.mp3',
  phaseChange: '/audio/sok/phase_change.mp3',
  correct:     '/audio/sok/correct.mp3',
  wrong:       '/audio/sok/wrong.mp3',
  deny:        '/audio/sok/deny.mp3',
};

// في نهاية الملف، قبل الـ module.exports:
function getClaimRoundsForPlayers(numPlayers) {
  // جولات السيطرة حسب عدد اللاعبين
  const map = {
    2: 6, 3: 7, 4: 8, 5: 8, 6: 9,
    7: 9, 8: 10, 9: 10, 10: 10, 11: 11, 12: 11,
  };
  return map[numPlayers] || Math.min(12, numPlayers + 4);
}

module.exports = {
  SOK_THEME, SOK_CONFIG, SOK_PLAYER_COLORS,
  SOK_REALMS, SOK_SOUND_PATHS,
  MAP_W, MAP_H, getMapLayout,
  getClaimRoundsForPlayers,
  SOK_CONTINENTS: SOK_REALMS,
};