const puzzlesData = {
  // ============================================================
  // المكتبة
  // ============================================================
  library_desk_code: {
    id: 'library_desk_code',
    type: 'code_lock',
    title: 'قفل درج المكتب',
    digits: 4,
    solution: '1971',
    hints: [
      'الرقم مخبّي في الكتاب. ركّز على السنة اللي على غلاف الكتاب.',
      'السنة دي مهمة جداً في القصة. بتظهر في كل مكان.',
      'الحل: 1971',
    ],
    reward: 'old_key_small',
  },

  library_book_order: {
    id: 'library_book_order',
    type: 'sound_sequence',
    title: 'ترتيب الكتب',
    sequence: [2, 4, 1, 5, 3],
    length: 5,
    solution: '24153',
    hints: [
      'الترتيب مكتوب على اللوحة في المكتبة. شوف الترتيب بعناية.',
      'الترتيب: القمر، الزهرة، الشمس، المطر، النجم.',
      'الحل: 2-4-1-5-3',
    ],
    reward: 'family_photo',
  },

  // ============================================================
  // الصالة
  // ============================================================
  living_clock_code: {
    id: 'living_clock_code',
    type: 'code_lock',
    title: 'قفل الراديو',
    digits: 3,
    solution: '147',
    hints: [
      'الساعة على 3:47. اجمع الأرقام.',
      '3 + 4 + 7 = 14. لكن ده مش الكود.',
      'الكود = 14 + 7 = 21. لأ. فكر تاني. (الساعة + الدقيقة + 100)',
    ],
    reward: 'radio_frequency_note',
  },

  living_music_box: {
    id: 'living_music_box',
    type: 'piano_sequence',
    title: 'صندوق الموسيقى',
    sequence: [3, 1, 4, 2, 5],
    solution: '31425',
    hints: [
      'اسمع اللحن كويس. 5 نغمات.',
      'الترتيب: أصفر، أزرق، أحمر، أخضر، بنفسجي.',
      'الحل: 3-1-4-2-5',
    ],
    reward: 'music_box_key',
  },

  // ============================================================
  // المطبخ
  // ============================================================
  kitchen_recipe_code: {
    id: 'kitchen_recipe_code',
    type: 'code_lock',
    title: 'قفل دفتر الوصفات',
    digits: 3,
    solution: '385',
    hints: [
      'الوصفة الناقصة بتدّي الرقم. دور على المكون الناقص.',
      'المكون الناقص = قرفة. حوّل حروف "قرفة" لأرقام (أبجد هوز).',
      'ق = 100، ر = 200، ف = 80، ة = 5. المجموع = 385',
    ],
    reward: 'recipe_secret',
  },

  kitchen_spice_order: {
    id: 'kitchen_spice_order',
    type: 'sound_sequence',
    title: 'ترتيب التوابل',
    sequence: [5, 2, 4, 1, 3],
    solution: '52413',
    hints: [
      'الترتيب مكتوب على صفحة في دفتر الوصفات.',
      'الترتيب: حبهان، كمون، زنجبيل، قرفة، كركم.',
      'الحل: 5-2-4-1-3',
    ],
    reward: 'spice_note',
  },

  // ============================================================
  // غرفة النوم
  // ============================================================
  bedroom_birthday_code: {
    id: 'bedroom_birthday_code',
    type: 'code_lock',
    title: 'قفل التسريحة',
    digits: 2,
    solution: '48',
    hints: [
      'العمر لما اتجوزوا. اجمع العمرين.',
      'أحمد اتجوز في 26 سنة. سميرة في 22 سنة.',
      '26 + 22 = 48',
    ],
    reward: 'samira_ring',
  },

  bedroom_jewelry_box: {
    id: 'bedroom_jewelry_box',
    type: 'code_lock',
    title: 'صندوق المجوهرات',
    digits: 4,
    solution: '1965',
    hints: [
      'سنة الجواز. مكتوبة على ظهر صورة الفرح.',
      'الصورة على الحيطة. اقلبها.',
      'الحل: 1965',
    ],
    reward: 'love_letter',
  },

  // ============================================================
  // الورشة
  // ============================================================
  workshop_circuit: {
    id: 'workshop_circuit',
    type: 'sound_sequence',
    title: 'لوحة الكهرباء',
    sequence: [1, 4, 6, 3, 5],
    solution: '14635',
    hints: [
      'الترتيب في المخطط. شوف المسار اللي فيه 6.',
      'المفاتيح: 1-4-6-3-5',
      'الحل: 1-4-6-3-5',
    ],
    reward: 'basement_key',
  },

  workshop_toolbox_code: {
    id: 'workshop_toolbox_code',
    type: 'code_lock',
    title: 'قفل صندوق الأدوات',
    digits: 3,
    solution: '314',
    hints: [
      'π = 3.14',
      'اضرب π × 100 = 314',
      'الحل: 314',
    ],
    reward: 'toolbox_note',
  },

  // ============================================================
  // القبو (النهاية)
  // ============================================================
  basement_metal_box: {
    id: 'basement_metal_box',
    type: 'code_lock',
    title: 'الصندوق المعدني',
    digits: 1,
    solution: '7',
    hints: [
      'الرقم هو عدد حروف اسم الجد الأكبر.',
      'اسمه إبراهيم.',
      'الحل: 7',
    ],
    reward: 'ibrahim_memoirs',
  },

  basement_secret_room: {
    id: 'basement_secret_room',
    type: 'code_lock',
    title: 'الغرفة السرية',
    digits: 4,
    solution: '9389',
    hints: [
      'آخر رقم من كل سنة ميلاد.',
      '1939 → 9، 1943 → 3، 1968 → 8، 1999 → 9',
      'الحل: 9389',
    ],
    reward: 'final_ending',
  },

  // ============================================================
  // الحمام
  // ============================================================
  bathroom_cabinet_code: {
    id: 'bathroom_cabinet_code',
    type: 'code_lock',
    title: 'خزانة الأدوية',
    digits: 2,
    solution: '75',
    hints: [
      'السنة اللي راحت فيها سميرة الإسكندرية.',
      'مكتوبة على ظهر صورة على المرآة.',
      'الحل: 75',
    ],
    reward: 'old_razor',
  },

  // ============================================================
  // السطح
  // ============================================================
  rooftop_telescope_code: {
    id: 'rooftop_telescope_code',
    type: 'code_lock',
    title: 'قفل التليسكوب',
    digits: 3,
    solution: '273',
    hints: [
      'الإحداثيات: 27.3°N',
      '27.3 × 10 = 273',
      'الحل: 273',
    ],
    reward: 'telescope_note',
  },

  // ============================================================
  // الجراج
  // ============================================================
  garage_trunk_code: {
    id: 'garage_trunk_code',
    type: 'code_lock',
    title: 'قفل شنطة العربية',
    digits: 4,
    solution: '1999',
    hints: [
      'سنة ميلاد الحفيد (أنت).',
      'مكتوبة على الصورة في غرفة النوم.',
      'الحل: 1999',
    ],
    reward: 'nour_address',
  },
};

module.exports = puzzlesData;