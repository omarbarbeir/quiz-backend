/**
 * ============================================================
 *  escapeRoomsData.js
 *  بيانات 9 غرف — مع شبكة التنقل + الـ hotspots
 * ============================================================
 */

const roomsData = {
  // ============================================================
  // الصالة — نقطة البداية (Hub رئيسي)
  // ============================================================
  living: {
    id: 'living',
    title: 'الصالة',
    chapter: 'chapter2_living',
    theme: 'warm',
    panorama: '/panoramas/chapter2_living.webp',
    ambient: '/audio/ambient/living_loop.ogg',
    ambientVolume: 0.35,
    infrasound: { freq: 11, gain: 0.02 },
    events: [
      { id: 'clock_tick', sound: '/audio/events/clock_tick.ogg', min: 8, max: 20 },
      { id: 'radio_static', sound: '/audio/events/radio_static.ogg', min: 25, max: 60 },
    ],
    connections: [
      { to: 'library',  door: 'living_to_library',  label: 'المكتبة' },
      { to: 'kitchen',  door: 'living_to_kitchen',  label: 'المطبخ' },
      { to: 'bedroom',  door: 'living_to_bedroom',  label: 'غرفة النوم' },
      { to: 'workshop', door: 'living_to_workshop', label: 'الورشة' },
      { to: 'rooftop',  door: 'living_to_rooftop',  label: 'السطح' },
    ],
    hotspots: [
      // ترابيزة القهوة — الأوراق + صندوق الموسيقى
      {
        id: 'living_coffee_table',
        type: 'inspect',
        position: { theta: 180, phi: 100 },
        popup: { type: 'flippable_document', front: '/docs/family_photo.jpg', back: '/docs/family_photo_back.jpg' },
        sfx: 'paper',
        focusFov: 50,
      },
      // صندوق الموسيقى
      {
        id: 'living_music_box',
        type: 'open_container',
        position: { theta: 175, phi: 105 },
        puzzleId: 'living_music_box',
        sfx: 'music_box_open',
        focusFov: 45,
        givesItem: 'music_box_key',
      },
      // الساعة على الحيطة
      {
        id: 'living_clock',
        type: 'inspect',
        position: { theta: 320, phi: 80 },
        popup: { type: 'document', content: '/docs/clock_close.jpg' },
        sfx: 'clock_tick',
        focusFov: 40,
      },
      // المرآة الذهبية
      {
        id: 'living_gold_mirror',
        type: 'inspect',
        position: { theta: 350, phi: 85 },
        popup: { type: 'document', content: '/docs/mirror_reflection.jpg' },
        sfx: 'glass_tap',
        focusFov: 55,
      },
      // الراديو القديم — لغز الوقت
      {
        id: 'living_radio',
        type: 'open_container',
        position: { theta: 285, phi: 95 },
        puzzleId: 'living_clock_code',
        sfx: 'radio_click',
        focusFov: 50,
      },
      // المكتبة الصغيرة في الركن
      {
        id: 'living_bookshelf',
        type: 'inspect',
        position: { theta: 15, phi: 92 },
        popup: { type: 'document', content: '/docs/newspaper_1971.jpg' },
        sfx: 'paper',
        focusFov: 50,
      },
      // الباب الرئيسي (خروج مؤقت)
      {
        id: 'living_main_door',
        type: 'exit',
        position: { theta: 90, phi: 92 },
        target: 'library',
        sfx: 'door_open',
      },
      // باب المطبخ
      {
        id: 'living_to_kitchen',
        type: 'exit',
        position: { theta: 135, phi: 92 },
        target: 'kitchen',
        sfx: 'door_open',
      },
      // باب غرفة النوم
      {
        id: 'living_to_bedroom',
        type: 'exit',
        position: { theta: 45, phi: 92 },
        target: 'bedroom',
        sfx: 'door_open',
      },
      // باب الورشة
      {
        id: 'living_to_workshop',
        type: 'exit',
        position: { theta: 210, phi: 92 },
        target: 'workshop',
        sfx: 'door_metal',
      },
      // باب السطح
      {
        id: 'living_to_rooftop',
        type: 'exit',
        position: { theta: 245, phi: 88 },
        target: 'rooftop',
        sfx: 'door_wood',
      },
    ],
  },

  // ============================================================
  // المكتبة — الفصل 1
  // ============================================================
  library: {
    id: 'library',
    title: 'المكتبة',
    chapter: 'chapter1_library',
    theme: 'warm',
    panorama: '/panoramas/chapter1_library.webp',
    ambient: '/audio/ambient/library_loop.ogg',
    ambientVolume: 0.4,
    infrasound: { freq: 11, gain: 0.02 },
    events: [
      { id: 'clock_tick', sound: '/audio/events/clock_tick.ogg', min: 8, max: 20 },
      { id: 'page_turn', sound: '/audio/events/page_turn.ogg', min: 15, max: 35 },
    ],
    connections: [
      { to: 'living', door: 'library_to_living', label: 'الصالة' },
    ],
    hotspots: [
      // الأوراق على المكتب — الجواب
      {
        id: 'library_desk_papers',
        type: 'open_container',
        position: { theta: 180, phi: 102 },
        givesItem: 'ahmed_journal',
        sfx: 'paper',
        popup: { type: 'document', content: '/docs/ahmed_journal.jpg' },
        focusFov: 45,
      },
      // درج المكتب — لغز الكود
      {
        id: 'library_desk_drawer',
        type: 'open_container',
        position: { theta: 178, phi: 108 },
        puzzleId: 'library_desk_code',
        sfx: 'drawer_open',
        focusFov: 50,
      },
      // الرف الشمال
      {
        id: 'library_shelf_left',
        type: 'inspect',
        position: { theta: 305, phi: 95 },
        popup: { type: 'document', content: '/docs/book_spine.jpg' },
        sfx: 'book_pull',
        focusFov: 45,
      },
      // الرف الجنوب
      {
        id: 'library_shelf_right',
        type: 'inspect',
        position: { theta: 55, phi: 92 },
        popup: { type: 'document', content: '/docs/grandfather_photo.jpg' },
        sfx: 'paper',
        focusFov: 45,
      },
      // الرف الوسط — لغز ترتيب الكتب
      {
        id: 'library_shelf_center',
        type: 'inspect',
        position: { theta: 0, phi: 95 },
        puzzleId: 'library_book_order',
        sfx: 'book_pull',
        focusFov: 50,
      },
      // الكرسي الجلدي
      {
        id: 'library_leather_chair',
        type: 'inspect',
        position: { theta: 168, phi: 100 },
        popup: { type: 'document', content: '/docs/under_chair_note.jpg' },
        sfx: 'paper',
        focusFov: 50,
      },
      // الشباك
      {
        id: 'library_window',
        type: 'inspect',
        position: { theta: 285, phi: 80 },
        popup: { type: 'document', content: '/docs/window_note.jpg' },
        sfx: 'curtain',
        focusFov: 55,
      },
      // الباب للصالة
      {
        id: 'library_to_living',
        type: 'exit',
        position: { theta: 90, phi: 92 },
        target: 'living',
        sfx: 'door_open',
      },
    ],
  },

  // ============================================================
  // المطبخ — الفصل 3
  // ============================================================
  kitchen: {
    id: 'kitchen',
    title: 'المطبخ',
    chapter: 'chapter3_kitchen',
    theme: 'warm',
    panorama: '/panoramas/chapter3_kitchen.webp',
    ambient: '/audio/ambient/kitchen_loop.ogg',
    ambientVolume: 0.3,
    infrasound: null,
    events: [
      { id: 'clock_tick', sound: '/audio/events/clock_tick.ogg', min: 15, max: 40 },
      { id: 'water_drip', sound: '/audio/events/water_drip.ogg', min: 8, max: 25 },
    ],
    connections: [
      { to: 'living', door: 'kitchen_to_living', label: 'الصالة' },
    ],
    hotspots: [
      // دفتر الوصفات على الرخام
      {
        id: 'kitchen_recipe_book',
        type: 'open_container',
        position: { theta: 195, phi: 100 },
        givesItem: 'recipe_book',
        sfx: 'paper',
        popup: { type: 'document', content: '/docs/recipe_book.jpg' },
        focusFov: 45,
      },
      // لغز الوصفة الناقصة
      {
        id: 'kitchen_recipe_puzzle',
        type: 'inspect',
        position: { theta: 200, phi: 105 },
        puzzleId: 'kitchen_recipe_code',
        sfx: 'page_turn',
        focusFov: 45,
      },
      // رف التوابل
      {
        id: 'kitchen_spice_rack',
        type: 'inspect',
        position: { theta: 220, phi: 85 },
        puzzleId: 'kitchen_spice_order',
        sfx: 'jar_clink',
        focusFov: 50,
      },
      // الخاتم مدفون في كيس الدقيق
      {
        id: 'kitchen_flour_jar',
        type: 'open_container',
        position: { theta: 285, phi: 95 },
        givesItem: 'wedding_ring',
        sfx: 'jar_open',
        popup: { type: 'document', content: '/docs/wedding_ring.jpg' },
        focusFov: 45,
      },
      // مذكرات سميرة
      {
        id: 'kitchen_samira_diary',
        type: 'open_container',
        position: { theta: 60, phi: 95 },
        givesItem: 'samira_diary',
        sfx: 'paper',
        popup: { type: 'document', content: '/docs/samira_diary.jpg' },
        focusFov: 50,
      },
      // الباب للصالة
      {
        id: 'kitchen_to_living',
        type: 'exit',
        position: { theta: 105, phi: 92 },
        target: 'living',
        sfx: 'door_open',
      },
    ],
  },

  // ============================================================
  // غرفة النوم — Bonus
  // ============================================================
  bedroom: {
    id: 'bedroom',
    title: 'غرفة النوم',
    chapter: 'bonus_bedroom',
    theme: 'warm',
    panorama: '/panoramas/bonus_bedroom.webp',
    ambient: '/audio/ambient/bedroom_loop.ogg',
    ambientVolume: 0.35,
    infrasound: { freq: 10, gain: 0.015 },
    events: [
      { id: 'clock_tick', sound: '/audio/events/clock_tick.ogg', min: 10, max: 25 },
    ],
    connections: [
      { to: 'living', door: 'bedroom_to_living', label: 'الصالة' },
      { to: 'bathroom', door: 'bedroom_to_bathroom', label: 'الحمام' },
    ],
    hotspots: [
      // الصور على الحيطة
      {
        id: 'bedroom_photos',
        type: 'inspect',
        position: { theta: 25, phi: 80 },
        givesItem: 'wedding_photos',
        popup: { type: 'document', content: '/docs/wedding_photos.jpg' },
        sfx: 'paper',
        focusFov: 45,
      },
      // التسريحة — لغز تاريخ الجواز
      {
        id: 'bedroom_dressing_table',
        type: 'open_container',
        position: { theta: 165, phi: 100 },
        puzzleId: 'bedroom_birthday_code',
        sfx: 'drawer_open',
        focusFov: 50,
      },
      // صندوق المجوهرات — لغز
      {
        id: 'bedroom_jewelry_box',
        type: 'open_container',
        position: { theta: 170, phi: 95 },
        puzzleId: 'bedroom_jewelry_box',
        sfx: 'jewelry_box',
        focusFov: 45,
      },
      // الرسالة على السرير
      {
        id: 'bedroom_love_letter',
        type: 'inspect',
        position: { theta: 200, phi: 105 },
        givesItem: 'love_letter',
        popup: { type: 'document', content: '/docs/love_letter.jpg' },
        sfx: 'paper',
        focusFov: 45,
      },
      // الدولاب
      {
        id: 'bedroom_wardrobe',
        type: 'inspect',
        position: { theta: 95, phi: 90 },
        popup: { type: 'document', content: '/docs/wardrobe_mirror.jpg' },
        sfx: 'wood_creak',
        focusFov: 55,
      },
      // الباب للصالة
      {
        id: 'bedroom_to_living',
        type: 'exit',
        position: { theta: 340, phi: 92 },
        target: 'living',
        sfx: 'door_open',
      },
      // الباب للحمام
      {
        id: 'bedroom_to_bathroom',
        type: 'exit',
        position: { theta: 315, phi: 92 },
        target: 'bathroom',
        sfx: 'door_open',
      },
    ],
  },

  // ============================================================
  // الحمام — Bonus
  // ============================================================
  bathroom: {
    id: 'bathroom',
    title: 'الحمام',
    chapter: 'bonus_bathroom',
    theme: 'cool',
    panorama: '/panoramas/bonus_bathroom.webp',
    ambient: '/audio/ambient/bathroom_loop.ogg',
    ambientVolume: 0.3,
    infrasound: null,
    events: [
      { id: 'water_drip', sound: '/audio/events/water_drip.ogg', min: 5, max: 15 },
    ],
    connections: [
      { to: 'bedroom', door: 'bathroom_to_bedroom', label: 'غرفة النوم' },
    ],
    hotspots: [
      // المرآة — رسالة سرية
      {
        id: 'bathroom_mirror',
        type: 'inspect',
        position: { theta: 340, phi: 82 },
        givesItem: 'mirror_message',
        popup: { type: 'document', content: '/docs/mirror_message.jpg' },
        sfx: 'glass_tap',
        focusFov: 45,
      },
      // الخزانة فوق الحوض — لغز
      {
        id: 'bathroom_cabinet',
        type: 'open_container',
        position: { theta: 320, phi: 90 },
        puzzleId: 'bathroom_cabinet_code',
        sfx: 'cabinet_open',
        focusFov: 50,
      },
      // الشفرة الحديدية
      {
        id: 'bathroom_razor',
        type: 'inspect',
        position: { theta: 15, phi: 85 },
        givesItem: 'old_razor',
        popup: { type: 'document', content: '/docs/razor.jpg' },
        sfx: 'metal_clink',
        focusFov: 50,
      },
      // الباب
      {
        id: 'bathroom_to_bedroom',
        type: 'exit',
        position: { theta: 200, phi: 92 },
        target: 'bedroom',
        sfx: 'door_open',
      },
    ],
  },

  // ============================================================
  // الورشة — الفصل 4
  // ============================================================
  workshop: {
    id: 'workshop',
    title: 'الورشة',
    chapter: 'chapter4_workshop',
    theme: 'cool',
    panorama: '/panoramas/chapter4_workshop.webp',
    ambient: '/audio/ambient/workshop_loop.ogg',
    ambientVolume: 0.35,
    infrasound: { freq: 12, gain: 0.03 },
    events: [
      { id: 'metal_clink', sound: '/audio/events/metal_clink.ogg', min: 15, max: 40 },
    ],
    connections: [
      { to: 'living',   door: 'workshop_to_living',   label: 'الصالة' },
      { to: 'basement', door: 'workshop_to_basement', label: 'القبو' },
      { to: 'garage',   door: 'workshop_to_garage',   label: 'الجراج' },
    ],
    hotspots: [
      // الطبلية — المخططات
      {
        id: 'workshop_blueprints',
        type: 'inspect',
        position: { theta: 180, phi: 100 },
        givesItem: 'house_blueprint',
        popup: { type: 'document', content: '/docs/house_blueprint.jpg' },
        sfx: 'paper',
        focusFov: 45,
      },
      // لوحة الكهرباء — لغز
      {
        id: 'workshop_circuit',
        type: 'inspect',
        position: { theta: 60, phi: 95 },
        puzzleId: 'workshop_circuit',
        sfx: 'switch_click',
        focusFov: 50,
      },
      // دفتر ملاحظات أحمد
      {
        id: 'workshop_notes',
        type: 'open_container',
        position: { theta: 195, phi: 105 },
        givesItem: 'ahmed_notes',
        popup: { type: 'document', content: '/docs/ahmed_notes.jpg' },
        sfx: 'paper',
        focusFov: 45,
      },
      // صندوق الأدوات — لغز
      {
        id: 'workshop_toolbox',
        type: 'open_container',
        position: { theta: 30, phi: 100 },
        puzzleId: 'workshop_toolbox_code',
        sfx: 'toolbox_open',
        focusFov: 50,
      },
      // صورة إبراهيم
      {
        id: 'workshop_ibrahim_photo',
        type: 'inspect',
        position: { theta: 100, phi: 85 },
        givesItem: 'ibrahim_photo',
        popup: { type: 'document', content: '/docs/ibrahim_photo.jpg' },
        sfx: 'paper',
        focusFov: 45,
      },
      // الباب للصالة
      {
        id: 'workshop_to_living',
        type: 'exit',
        position: { theta: 270, phi: 92 },
        target: 'living',
        sfx: 'door_open',
      },
      // باب القبو
      {
        id: 'workshop_to_basement',
        type: 'exit',
        position: { theta: 300, phi: 100 },
        target: 'basement',
        sfx: 'door_creak',
      },
      // باب الجراج
      {
        id: 'workshop_to_garage',
        type: 'exit',
        position: { theta: 240, phi: 92 },
        target: 'garage',
        sfx: 'door_metal',
      },
    ],
  },

  // ============================================================
  // القبو — الفصل 5 (النهاية)
  // ============================================================
  basement: {
    id: 'basement',
    title: 'القبو',
    chapter: 'chapter5_basement',
    theme: 'cold',
    panorama: '/panoramas/chapter5_basement.webp',
    ambient: '/audio/ambient/basement_loop.ogg',
    ambientVolume: 0.4,
    infrasound: { freq: 14, gain: 0.06 },
    events: [
      { id: 'drip', sound: '/audio/events/water_drip.ogg', min: 5, max: 15 },
      { id: 'creak', sound: '/audio/events/wood_creak.ogg', min: 20, max: 50 },
    ],
    connections: [
      { to: 'workshop', door: 'basement_to_workshop', label: 'الورشة' },
    ],
    hotspots: [
      // الصندوق المعدني — لغز
      {
        id: 'basement_metal_box',
        type: 'open_container',
        position: { theta: 75, phi: 100 },
        puzzleId: 'basement_metal_box',
        sfx: 'metal_lock',
        focusFov: 45,
      },
      // الصناديق الخشبية — مذكرات إبراهيم
      {
        id: 'basement_wooden_crates',
        type: 'open_container',
        position: { theta: 315, phi: 100 },
        givesItem: 'ibrahim_memoirs',
        popup: { type: 'document', content: '/docs/ibrahim_memoirs.jpg' },
        sfx: 'wood_creak',
        focusFov: 50,
      },
      // الجواب الأخير (بيظهر بعد فتح الصندوق)
      {
        id: 'basement_final_letter',
        type: 'inspect',
        position: { theta: 80, phi: 100 },
        givesItem: 'ahmed_final_letter',
        popup: { type: 'document', content: '/docs/ahmed_final_letter.jpg' },
        sfx: 'paper',
        focusFov: 40,
        requiresPuzzle: 'basement_metal_box',
      },
      // الصورة الأخيرة
      {
        id: 'basement_last_photo',
        type: 'inspect',
        position: { theta: 260, phi: 90 },
        givesItem: 'last_photo',
        popup: { type: 'document', content: '/docs/last_photo.jpg' },
        sfx: 'paper',
        focusFov: 45,
      },
      // الغرفة السرية — اللغز النهائي
      {
        id: 'basement_secret_door',
        type: 'open_container',
        position: { theta: 155, phi: 92 },
        puzzleId: 'basement_secret_room',
        sfx: 'secret_open',
        focusFov: 50,
        requiresPuzzle: 'basement_metal_box',
      },
      // الباب للورشة
      {
        id: 'basement_to_workshop',
        type: 'exit',
        position: { theta: 200, phi: 92 },
        target: 'workshop',
        sfx: 'door_creak',
      },
    ],
  },

  // ============================================================
  // الجراج — Bonus
  // ============================================================
  garage: {
    id: 'garage',
    title: 'الجراج',
    chapter: 'bonus_garage',
    theme: 'cool',
    panorama: '/panoramas/bonus_garage.webp',
    ambient: '/audio/ambient/garage_loop.ogg',
    ambientVolume: 0.3,
    infrasound: null,
    events: [
      { id: 'metal_clink', sound: '/audio/events/metal_clink.ogg', min: 20, max: 50 },
    ],
    connections: [
      { to: 'workshop', door: 'garage_to_workshop', label: 'الورشة' },
    ],
    hotspots: [
      // شنطة العربية — لغز
      {
        id: 'garage_car_trunk',
        type: 'open_container',
        position: { theta: 200, phi: 100 },
        puzzleId: 'garage_trunk_code',
        sfx: 'trunk_open',
        focusFov: 50,
      },
      // الطبلية — المفتاح
      {
        id: 'garage_workbench',
        type: 'inspect',
        position: { theta: 340, phi: 95 },
        givesItem: 'car_trunk_key',
        popup: { type: 'document', content: '/docs/car_key.jpg' },
        sfx: 'metal_clink',
        focusFov: 50,
      },
      // خريطة الإسكندرية
      {
        id: 'garage_alexandria_map',
        type: 'inspect',
        position: { theta: 45, phi: 85 },
        givesItem: 'alexandria_map',
        popup: { type: 'document', content: '/docs/alexandria_map.jpg' },
        sfx: 'paper',
        focusFov: 45,
      },
      // الباب للورشة
      {
        id: 'garage_to_workshop',
        type: 'exit',
        position: { theta: 90, phi: 92 },
        target: 'workshop',
        sfx: 'door_metal',
      },
    ],
  },

  // ============================================================
  // السطح — Bonus
  // ============================================================
  rooftop: {
    id: 'rooftop',
    title: 'السطح',
    chapter: 'bonus_rooftop',
    theme: 'romantic',
    panorama: '/panoramas/bonus_rooftop.webp',
    ambient: '/audio/ambient/rooftop_loop.ogg',
    ambientVolume: 0.35,
    infrasound: null,
    events: [
      { id: 'birds', sound: '/audio/events/birds_distant.ogg', min: 20, max: 45 },
      { id: 'wind', sound: '/audio/events/wind_soft.ogg', min: 15, max: 40 },
    ],
    connections: [
      { to: 'living', door: 'rooftop_to_living', label: 'الصالة' },
    ],
    hotspots: [
      // التليسكوب — لغز
      {
        id: 'rooftop_telescope',
        type: 'inspect',
        position: { theta: 330, phi: 90 },
        puzzleId: 'rooftop_telescope_code',
        sfx: 'telescope_adjust',
        focusFov: 45,
      },
      // الورقة على الترابيزة
      {
        id: 'rooftop_note',
        type: 'open_container',
        position: { theta: 180, phi: 105 },
        givesItem: 'telescope_note',
        popup: { type: 'document', content: '/docs/telescope_note.jpg' },
        sfx: 'paper',
        focusFov: 45,
      },
      // السيجارة الأخيرة
      {
        id: 'rooftop_last_cigarette',
        type: 'inspect',
        position: { theta: 200, phi: 110 },
        givesItem: 'last_cigarette',
        popup: { type: 'document', content: '/docs/cigarette.jpg' },
        sfx: 'paper',
        focusFov: 50,
      },
      // الباب للصالة
      {
        id: 'rooftop_to_living',
        type: 'exit',
        position: { theta: 260, phi: 92 },
        target: 'living',
        sfx: 'door_open',
      },
    ],
  },
}

// للسيرفر: استخدم
module.exports = roomsData;