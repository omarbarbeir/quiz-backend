// ============================================================
// data/footballC4.js — مجموعات كورة 6×7 (Connect 4)
// كل مجموعة: rowItems (6 عناصر) + colItems (7 عناصر)
// id لازم يكون فريد — بيستخدمه السيرفر عشان يتجنب التكرار
// ============================================================

module.exports = [
  {
    id: 'football_c4_001',
    rowItems: [
      { label: 'لاعب لعب في الأهلي', image: './Tic/Football/man city.webp' },
      { label: 'لاعب لعب في الزمالك', image: './Tic/Football/world cup.webp' },
      { label: 'لاعب لعب في ريال مدريد', image: './Tic/Football/seria a.webp' },
      { label: 'لاعب لعب في برشلونة', image: './Tic/Football/la liga.webp' },
      { label: 'لاعب لعب في ليفربول', image: './Tic/Football/' },
      { label: 'لاعب لعب في مانشستر سيتي', image: './Tic/Football/' },
    ],
    colItems: [
      { label: 'نادٍ لعب له محمد صلاح', image: './Tic/Football/' },
      { label: 'نادٍ لعب له رونالدو', image: './Tic/Football/' },
      { label: 'نادٍ لعب له ميسي', image: './Tic/Football/' },
      { label: 'نادٍ لعب له مبابي', image: './Tic/Football/' },
      { label: 'نادٍ لعب له رياض محرز', image: './Tic/Football/' },
      { label: 'نادٍ لعب له محمد النني', image: './Tic/Football/' },
      { label: 'لاعب فاز بدوري أبطال أوروبا', image: './Tic/Football/' },
    ],
  },
  // {
  //   id: 'football_c4_001',
  //   rowItems: [
  //     { label: 'لاعب لعب في الأهلي', image: './Tic/Football/' },
  //     { label: 'لاعب لعب في الزمالك', image: './Tic/Football/' },
  //     { label: 'لاعب لعب في ريال مدريد', image: './Tic/Football/' },
  //     { label: 'لاعب لعب في برشلونة', image: './Tic/Football/' },
  //     { label: 'لاعب لعب في ليفربول', image: './Tic/Football/' },
  //     { label: 'لاعب لعب في مانشستر سيتي', image: './Tic/Football/' },
  //   ],
  //   colItems: [
  //     { label: 'نادٍ لعب له محمد صلاح', image: './Tic/Football/' },
  //     { label: 'نادٍ لعب له رونالدو', image: './Tic/Football/' },
  //     { label: 'نادٍ لعب له ميسي', image: './Tic/Football/' },
  //     { label: 'نادٍ لعب له مبابي', image: './Tic/Football/' },
  //     { label: 'نادٍ لعب له رياض محرز', image: './Tic/Football/' },
  //     { label: 'نادٍ لعب له محمد النني', image: './Tic/Football/' },
  //     { label: 'لاعب فاز بدوري أبطال أوروبا', image: './Tic/Football/' },
  //   ],
  // },
  // 👇 كمّل هنا — كل مجموعة: 6 rowItems + 7 colItems + id فريد
];