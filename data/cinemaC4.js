// ============================================================
// data/cinemaC4.js — مجموعات سينما 6×7 (Connect 4)
// كل مجموعة: rowItems (6 عناصر) + colItems (7 عناصر)
// id لازم يكون فريد — بيستخدمه السيرفر عشان يتجنب التكرار
// ============================================================

module.exports = [
  {
    id: 'cinema_c4_001',
    rowItems: [
      { label: 'ممثل مثّل مع عادل إمام', image: '/cinema/adel_emam.jpg' },
      { label: 'ممثل مثّل مع أحمد السقا', image: '/cinema/ahmed_elsakka.jpg' },
      { label: 'ممثل مثّل مع محمد هنيدي', image: '/cinema/henedy.jpg' },
      { label: 'ممثل مثّل مع كريم عبد العزيز', image: '/cinema/karim.jpg' },
      { label: 'ممثل مثّل مع أحمد حلمي', image: '/cinema/helmy.jpg' },
      { label: 'ممثل مثّل مع أحمد عز', image: '/cinema/ahmed_ezz.jpg' },
    ],
    colItems: [
      { label: 'ممثل ظهر في فيلم الجزيرة (2007)', image: '/cinema/movies/elgezira.jpg' },
      { label: 'ممثل ظهر في فيلم عسل إسود (2010)', image: '/cinema/movies/asal_eswed.jpg' },
      { label: 'ممثل ظهر في فيلم الفيل الأزرق (2014)', image: '/cinema/movies/blue_elephant.jpg' },
      { label: 'ممثل ظهر في فيلم تيتو (2004)', image: '/cinema/movies/tito.jpg' },
      { label: 'ممثل ظهر في فيلم عمر وسلمى (2006)', image: '/cinema/movies/omar_salma.jpg' },
      { label: 'ممثل ظهر في فيلم كباريه (2008)', image: '/cinema/movies/cabaret.jpg' },
      { label: 'ممثل ظهر في فيلم حسن ومرقص (2008)', image: '/cinema/movies/hassan_marcus.jpg' },
    ],
  },
  {
    id: 'cinema_c4_002',
    rowItems: [
      { label: 'ممثلة مثّلت مع منى زكي', image: '/cinema/mona_zaki.jpg' },
      { label: 'ممثلة مثّلت مع هند صبري', image: '/cinema/hend_sabry.jpg' },
      { label: 'ممثلة مثّلت مع نيللي كريم', image: '/cinema/nelly_karim.jpg' },
      { label: 'ممثلة مثّلت مع ياسمين عبد العزيز', image: '/cinema/yasmine.jpg' },
      { label: 'ممثلة مثّلت مع درة', image: '/cinema/dorra.jpg' },
      { label: 'ممثلة مثّلت مع منة شلبي', image: '/cinema/menna_shalaby.jpg' },
    ],
    colItems: [
      { label: 'ممثل ظهر في فيلم واحدة بس تكفي (2009)', image: '/cinema/movies/wahda_bas.jpg' },
      { label: 'ممثل ظهر في فيلم أسماء (2011)', image: '/cinema/movies/asmaa.jpg' },
      { label: 'ممثل ظهر في فيلم هيبتا (2016)', image: '/cinema/movies/hepta.jpg' },
      { label: 'ممثل ظهر في فيلم بحب السيما (2004)', image: '/cinema/movies/baheb_alsima.jpg' },
      { label: 'ممثل ظهر في فيلم عمارة يعقوبيان (2006)', image: '/cinema/movies/yaqoubian.jpg' },
      { label: 'ممثل ظهر في فيلم هي فوضى (2007)', image: '/cinema/movies/heya_fawda.jpg' },
      { label: 'ممثل ظهر في فيلم واحد صفر (2009)', image: '/cinema/movies/wahd_sefr.jpg' },
    ],
  },
  // 👇 كمّل هنا — كل مجموعة: 6 rowItems + 7 colItems + id فريد
];