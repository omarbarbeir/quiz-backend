const roomsData = {
  // ============================================================
  // 1. شقة كريم
  // ============================================================
  karim_apartment: {
    id: 'karim_apartment',
    title: 'شقة كريم',
    chapter: 'chapter1_apartment',
    isDark: false,
    theme: 'warm',
    panorama: '/panoramas/karim_apartment_night.webp',
    ambient: '/audio/ambient/karim_apt.ogg',
    ambientVolume: 0.3,
    infrasound: { freq: 8, gain: 0.01 },
    events: [
      { id: 'clock_tick', sound: '/audio/events/clock_tick.ogg', min: 8, max: 20 },
      { id: 'city_noise', sound: '/audio/events/city_distant.ogg', min: 15, max: 40 },
    ],
    connections: [{ to: 'building_hallway', label: 'ممر العمارة' }],
    hotspots: [
      // ✅ درج الكشاف — كل لاعب ياخد واحد
      {
        id: 'karim_drawer_flashlight',
        type: 'inspect',
        position: { theta: 45, phi: 100 },
        givesFlashlight: true,
        sfx: 'drawer_open',
        popup: { type: 'text_document' },
        focusFov: 50,
      },
      // ✅ ريموت التلفزيون — يشغل الفيديو الإجباري
      {
        id: 'karim_tv_remote',
        type: 'tv_remote',
        position: { theta: 270, phi: 95 },
        sfx: 'tv_static',
        focusFov: 50,
      },
      {
        id: 'karim_window',
        type: 'inspect',
        position: { theta: 285, phi: 80 },
        popup: { type: 'document', content: '/docs/karim_window.jpg' },
        sfx: 'curtain',
        focusFov: 55,
      },
      {
        id: 'karim_photo',
        type: 'inspect',
        position: { theta: 180, phi: 95 },
        popup: { type: 'document', content: '/docs/karim_friends.jpg' },
        sfx: 'paper',
        focusFov: 45,
      },
    ],
  },

  // ============================================================
  // 2. ممر العمارة
  // ============================================================
  building_hallway: {
    id: 'building_hallway',
    title: 'ممر العمارة',
    chapter: 'chapter1_apartment',
    isDark: true,
    theme: 'tense',
    panorama: '/panoramas/building_hallway_night.webp',
    ambient: '/audio/ambient/hallway.ogg',
    ambientVolume: 0.35,
    infrasound: { freq: 10, gain: 0.04 },
    events: [
      { id: 'door_creak', sound: '/audio/events/door_creak.ogg', min: 10, max: 30 },
      { id: 'distant_step', sound: '/audio/events/steps_far.ogg', min: 20, max: 45 },
    ],
    connections: [
      { to: 'karim_apartment', label: 'شقة كريم' },
      { to: 'neighbor_apartment', label: 'شقة ٥' },
      { to: 'sami_apartment', label: 'شقة ٤' },
      { to: 'building_rooftop', label: 'السطح' },
    ],
    hotspots: [
      // ✅ مفتاح النور
      {
        id: 'hallway_light_switch',
        type: 'light_switch',
        position: { theta: 0, phi: 90 },
        sfx: 'switch_click',
        focusFov: 45,
      },
      {
        id: 'hallway_door_5',
        type: 'inspect',
        position: { theta: 30, phi: 92 },
        popup: { type: 'document', content: '/docs/door_5.jpg' },
        sfx: 'door_creak',
        focusFov: 50,
      },
      {
        id: 'hallway_door_4',
        type: 'inspect',
        position: { theta: 90, phi: 92 },
        popup: { type: 'document', content: '/docs/door_4.jpg' },
        sfx: 'paper',
        focusFov: 50,
      },
    ],
  },

  // ============================================================
  // 3. شقة الأستاذ مجدي
  // ============================================================
  neighbor_apartment: {
    id: 'neighbor_apartment',
    title: 'شقة الأستاذ مجدي',
    chapter: 'chapter2_neighbor',
    isDark: true,
    theme: 'horror',
    panorama: '/panoramas/neighbor_apartment_night.webp',
    ambient: '/audio/ambient/neighbor_apt.ogg',
    ambientVolume: 0.4,
    infrasound: { freq: 12, gain: 0.08 },
    events: [
      { id: 'whisper', sound: '/audio/events/whispers.ogg', min: 15, max: 35 },
      { id: 'clock_tick', sound: '/audio/events/clock_tick.ogg', min: 10, max: 25 },
    ],
    connections: [{ to: 'building_hallway', label: 'ممر العمارة' }],
    hotspots: [
      {
        id: 'neighbor_light_switch',
        type: 'light_switch',
        position: { theta: 0, phi: 90 },
        sfx: 'switch_click',
        focusFov: 45,
      },
      {
        id: 'magdy_body',
        type: 'inspect',
        position: { theta: 180, phi: 95 },
        givesItem: 'sami_phone',
        popup: { type: 'text_document' },
        sfx: 'paper',
        focusFov: 40,
      },
      {
        id: 'magdy_tea',
        type: 'inspect',
        position: { theta: 160, phi: 100 },
        popup: { type: 'document', content: '/docs/magdy_tea.jpg' },
        sfx: 'glass_tap',
        focusFov: 50,
      },
      {
        id: 'magdy_radio',
        type: 'inspect',
        position: { theta: 45, phi: 90 },
        popup: { type: 'document', content: '/docs/magdy_radio.jpg' },
        sfx: 'radio_click',
        focusFov: 50,
      },
    ],
  },

  // ============================================================
  // 4. شقة سامي
  // ============================================================
  sami_apartment: {
    id: 'sami_apartment',
    title: 'شقة سامي',
    chapter: 'chapter3_sami_apartment',
    isDark: true,
    theme: 'horror',
    panorama: '/panoramas/sami_apartment_night.webp',
    ambient: '/audio/ambient/sami_apt.ogg',
    ambientVolume: 0.4,
    infrasound: { freq: 14, gain: 0.1 },
    events: [
      { id: 'paper_shift', sound: '/audio/events/paper_shift.ogg', min: 15, max: 40 },
      { id: 'footstep', sound: '/audio/events/footstep.ogg', min: 20, max: 50 },
    ],
    connections: [
      { to: 'building_hallway', label: 'ممر العمارة' },
      { to: 'sami_bedroom', label: 'أوضة سامي' },
    ],
    hotspots: [
      {
        id: 'sami_light_switch',
        type: 'light_switch',
        position: { theta: 0, phi: 90 },
        sfx: 'switch_click',
        focusFov: 45,
      },
      {
        id: 'sami_desk_nokia',
        type: 'inspect',
        position: { theta: 180, phi: 100 },
        givesItem: 'sami_nokia',
        popup: { type: 'text_document' },
        sfx: 'phone_notify',
        focusFov: 45,
      },
      {
        id: 'sami_notebook',
        type: 'inspect',
        position: { theta: 195, phi: 100 },
        givesItem: 'sami_diary',
        popup: { type: 'text_document' },
        sfx: 'paper',
        focusFov: 45,
      },
      {
        id: 'sami_bedroom_door',
        type: 'inspect',
        position: { theta: 90, phi: 92 },
        popup: { type: 'document', content: '/docs/sami_room_door.jpg' },
        sfx: 'wood_creak',
        focusFov: 50,
      },
    ],
  },

  // ============================================================
  // 5. أوضة سامي
  // ============================================================
  sami_bedroom: {
    id: 'sami_bedroom',
    title: 'أوضة سامي',
    chapter: 'chapter3_sami_apartment',
    isDark: true,
    theme: 'horror',
    panorama: '/panoramas/sami_bedroom_night.webp',
    ambient: '/audio/ambient/sami_room.ogg',
    ambientVolume: 0.35,
    infrasound: { freq: 13, gain: 0.08 },
    events: [
      { id: 'whisper', sound: '/audio/events/whispers.ogg', min: 20, max: 50 },
    ],
    connections: [{ to: 'sami_apartment', label: 'الصالة' }],
    hotspots: [
      {
        id: 'sami_room_light_switch',
        type: 'light_switch',
        position: { theta: 0, phi: 90 },
        sfx: 'switch_click',
        focusFov: 45,
      },
      {
        id: 'sami_map',
        type: 'inspect',
        position: { theta: 180, phi: 100 },
        givesItem: 'hospital_map',
        popup: { type: 'text_document' },
        sfx: 'paper',
        focusFov: 45,
      },
      {
        id: 'sami_bag',
        type: 'open_container',
        position: { theta: 200, phi: 105 },
        givesItem: 'sami_photo',
        popup: { type: 'text_document' },
        sfx: 'bag_zip',
        focusFov: 50,
      },
    ],
  },

  // ============================================================
  // 6. سطح العمارة
  // ============================================================
  building_rooftop: {
    id: 'building_rooftop',
    title: 'سطح العمارة',
    chapter: 'chapter3_sami_apartment',
    isDark: true,
    theme: 'tense',
    panorama: '/panoramas/building_rooftop_night.webp',
    ambient: '/audio/ambient/rooftop.ogg',
    ambientVolume: 0.4,
    infrasound: { freq: 11, gain: 0.05 },
    events: [
      { id: 'wind', sound: '/audio/events/wind_soft.ogg', min: 10, max: 30 },
      { id: 'distant_dog', sound: '/audio/events/dog_far.ogg', min: 25, max: 55 },
    ],
    connections: [
      { to: 'building_hallway', label: 'ممر العمارة' },
      { to: 'backstreet', label: 'شارع جانبي' },
    ],
    hotspots: [
      {
        id: 'rooftop_ladder',
        type: 'inspect',
        position: { theta: 90, phi: 95 },
        popup: { type: 'document', content: '/docs/rooftop_ladder.jpg' },
        sfx: 'metal_clink',
        focusFov: 50,
      },
      {
        id: 'rooftop_chalk',
        type: 'inspect',
        position: { theta: 180, phi: 85 },
        popup: { type: 'text_document' },
        sfx: 'paper',
        focusFov: 45,
      },
    ],
  },

  // ============================================================
  // 7. شارع جانبي
  // ============================================================
  backstreet: {
    id: 'backstreet',
    title: 'شارع جانبي',
    chapter: 'chapter4_hospital',
    isDark: true,
    theme: 'tense',
    panorama: '/panoramas/backstreet_night.webp',
    ambient: '/audio/ambient/street.ogg',
    ambientVolume: 0.4,
    infrasound: { freq: 10, gain: 0.04 },
    events: [
      { id: 'cat', sound: '/audio/events/cat.ogg', min: 15, max: 40 },
      { id: 'bottle', sound: '/audio/events/bottle.ogg', min: 25, max: 55 },
    ],
    connections: [
      { to: 'building_rooftop', label: 'السطح' },
      { to: 'hospital_reception', label: 'المشفى' },
    ],
    hotspots: [
      {
        id: 'street_gate',
        type: 'inspect',
        position: { theta: 180, phi: 90 },
        popup: { type: 'document', content: '/docs/hospital_gate.jpg' },
        sfx: 'metal_clink',
        focusFov: 50,
      },
    ],
  },

  // ============================================================
  // 8. استقبال المشفى
  // ============================================================
  hospital_reception: {
    id: 'hospital_reception',
    title: 'استقبال المشفى',
    chapter: 'chapter4_hospital',
    isDark: true,
    theme: 'horror',
    panorama: '/panoramas/hospital_reception_night.webp',
    ambient: '/audio/ambient/hospital_reception.ogg',
    ambientVolume: 0.4,
    infrasound: { freq: 14, gain: 0.1 },
    events: [
      { id: 'drip', sound: '/audio/events/water_drip.ogg', min: 5, max: 15 },
      { id: 'metal_creak', sound: '/audio/events/metal_creak.ogg', min: 15, max: 35 },
    ],
    connections: [
      { to: 'backstreet', label: 'شارع جانبي' },
      { to: 'hospital_corridor', label: 'ممر المشفى' },
    ],
    hotspots: [
      {
        id: 'reception_light_switch',
        type: 'light_switch',
        position: { theta: 0, phi: 90 },
        sfx: 'switch_click',
        focusFov: 45,
      },
      {
        id: 'reception_calendar',
        type: 'inspect',
        position: { theta: 180, phi: 90 },
        popup: { type: 'text_document' },
        sfx: 'paper',
        focusFov: 40,
      },
      {
        id: 'reception_desk',
        type: 'open_container',
        position: { theta: 200, phi: 100 },
        givesItem: 'reception_key',
        popup: { type: 'text_document' },
        sfx: 'drawer_open',
        focusFov: 50,
      },
      {
        id: 'reception_corridor_door',
        type: 'open_container',
        position: { theta: 90, phi: 92 },
        puzzleId: 'corridor_code',
        sfx: 'door_metal',
        focusFov: 50,
      },
    ],
  },

  // ============================================================
  // 9. ممر المشفى
  // ============================================================
  hospital_corridor: {
    id: 'hospital_corridor',
    title: 'ممر المشفى',
    chapter: 'chapter4_hospital',
    isDark: true,
    theme: 'horror',
    panorama: '/panoramas/hospital_corridor_night.webp',
    ambient: '/audio/ambient/hospital_corridor.ogg',
    ambientVolume: 0.45,
    infrasound: { freq: 16, gain: 0.13 },
    events: [
      { id: 'distant_scream', sound: '/audio/events/distant_scream.ogg', min: 20, max: 45 },
      { id: 'gurney_roll', sound: '/audio/events/gurney.ogg', min: 25, max: 60 },
      { id: 'drip', sound: '/audio/events/water_drip.ogg', min: 8, max: 20 },
    ],
    connections: [
      { to: 'hospital_reception', label: 'الاستقبال' },
      { to: 'hospital_morgue', label: 'المشرحة' },
      { to: 'hospital_security', label: 'غرفة الأمن' },
    ],
    hotspots: [
      {
        id: 'corridor_light_switch',
        type: 'light_switch',
        position: { theta: 0, phi: 90 },
        sfx: 'switch_click',
        focusFov: 45,
      },
      {
        id: 'corridor_gurney',
        type: 'inspect',
        position: { theta: 90, phi: 100 },
        popup: { type: 'document', content: '/docs/gurney.jpg' },
        sfx: 'metal_creak',
        focusFov: 50,
      },
      {
        id: 'corridor_labcoat',
        type: 'inspect',
        position: { theta: 200, phi: 90 },
        popup: { type: 'document', content: '/docs/labcoat.jpg' },
        sfx: 'paper',
        focusFov: 50,
      },
      {
        id: 'corridor_morgue_door',
        type: 'open_container',
        position: { theta: 30, phi: 92 },
        puzzleId: 'morgue_code',
        sfx: 'door_metal',
        focusFov: 50,
      },
    ],
  },

  // ============================================================
  // 10. المشرحة
  // ============================================================
  hospital_morgue: {
    id: 'hospital_morgue',
    title: 'المشرحة',
    chapter: 'chapter4_hospital',
    isDark: true,
    theme: 'horror',
    panorama: '/panoramas/hospital_morgue_night.webp',
    ambient: '/audio/ambient/morgue.ogg',
    ambientVolume: 0.45,
    infrasound: { freq: 18, gain: 0.16 },
    events: [
      { id: 'metal_creak', sound: '/audio/events/metal_creak.ogg', min: 15, max: 35 },
      { id: 'breath', sound: '/audio/events/breath.ogg', min: 25, max: 55 },
      { id: 'drip', sound: '/audio/events/water_drip.ogg', min: 5, max: 15 },
    ],
    connections: [
      { to: 'hospital_corridor', label: 'الممر' },
      { to: 'hospital_storage', label: 'المخزن' },
    ],
    hotspots: [
      {
        id: 'morgue_light_switch',
        type: 'light_switch',
        position: { theta: 0, phi: 90 },
        sfx: 'switch_click',
        focusFov: 45,
      },
      {
        id: 'morgue_body',
        type: 'inspect',
        position: { theta: 180, phi: 100 },
        givesItem: 'sami_flashdrive',
        popup: { type: 'text_document' },
        sfx: 'paper',
        focusFov: 40,
      },
      {
        id: 'morgue_photo',
        type: 'inspect',
        position: { theta: 180, phi: 105 },
        givesItem: 'sami_photo_body',
        popup: { type: 'text_document' },
        sfx: 'paper',
        focusFov: 40,
      },
      {
        id: 'morgue_key',
        type: 'inspect',
        position: { theta: 160, phi: 110 },
        givesItem: 'storage_key',
        popup: { type: 'text_document' },
        sfx: 'metal_clink',
        focusFov: 45,
      },
      {
        id: 'morgue_mirror',
        type: 'inspect',
        position: { theta: 45, phi: 85 },
        popup: { type: 'document', content: '/docs/morgue_mirror.jpg' },
        sfx: 'glass_tap',
        focusFov: 45,
      },
      {
        id: 'morgue_storage_door',
        type: 'exit',
        position: { theta: 90, phi: 92 },
        target: 'hospital_storage',
        sfx: 'door_metal',
      },
    ],
  },

  // ============================================================
  // 11. المخزن
  // ============================================================
  hospital_storage: {
    id: 'hospital_storage',
    title: 'المخزن',
    chapter: 'chapter4_hospital',
    isDark: true,
    theme: 'horror',
    panorama: '/panoramas/hospital_storage_night.webp',
    ambient: '/audio/ambient/storage.ogg',
    ambientVolume: 0.4,
    infrasound: { freq: 15, gain: 0.11 },
    events: [
      { id: 'drip', sound: '/audio/events/water_drip.ogg', min: 8, max: 20 },
      { id: 'metal_creak', sound: '/audio/events/metal_creak.ogg', min: 20, max: 50 },
    ],
    connections: [
      { to: 'hospital_morgue', label: 'المشرحة' },
      { to: 'hospital_security', label: 'غرفة الأمن' },
    ],
    hotspots: [
      {
        id: 'storage_light_switch',
        type: 'light_switch',
        position: { theta: 0, phi: 90 },
        sfx: 'switch_click',
        focusFov: 45,
      },
      {
        id: 'storage_barrels',
        type: 'inspect',
        position: { theta: 180, phi: 100 },
        popup: { type: 'document', content: '/docs/barrels.jpg' },
        sfx: 'metal_clink',
        focusFov: 50,
      },
      {
        id: 'storage_security_door',
        type: 'open_container',
        position: { theta: 90, phi: 92 },
        puzzleId: 'security_code',
        sfx: 'door_metal',
        focusFov: 50,
      },
    ],
  },

  // ============================================================
  // 12. غرفة الأمن
  // ============================================================
  hospital_security: {
    id: 'hospital_security',
    title: 'غرفة الأمن',
    chapter: 'chapter5_truth',
    isDark: true,
    theme: 'horror',
    panorama: '/panoramas/hospital_security_night.webp',
    ambient: '/audio/ambient/security_room.ogg',
    ambientVolume: 0.4,
    infrasound: { freq: 15, gain: 0.11 },
    events: [
      { id: 'static', sound: '/audio/events/static.ogg', min: 10, max: 25 },
      { id: 'phone_ring', sound: '/audio/events/phone_ring.ogg', min: 30, max: 60 },
    ],
    connections: [
      { to: 'hospital_storage', label: 'المخزن' },
      { to: 'hospital_corridor', label: 'الممر' },
      { to: 'autopsy_room', label: 'غرفة التشريح' },
    ],
    hotspots: [
      {
        id: 'security_light_switch',
        type: 'light_switch',
        position: { theta: 0, phi: 90 },
        sfx: 'switch_click',
        focusFov: 45,
      },
      {
        id: 'security_computer',
        type: 'inspect',
        position: { theta: 180, phi: 100 },
        givesItem: 'fuad_confession',
        popup: { type: 'text_document' },
        sfx: 'keyboard',
        focusFov: 45,
      },
      {
        id: 'security_monitors',
        type: 'inspect',
        position: { theta: 200, phi: 90 },
        popup: { type: 'document', content: '/docs/monitors.jpg' },
        sfx: 'static',
        focusFov: 50,
      },
      {
        id: 'security_autopsy_door',
        type: 'open_container',
        position: { theta: 60, phi: 92 },
        puzzleId: 'autopsy_code',
        sfx: 'door_metal',
        focusFov: 50,
      },
    ],
  },

  // ============================================================
  // 13. غرفة التشريح
  // ============================================================
  autopsy_room: {
    id: 'autopsy_room',
    title: 'غرفة التشريح',
    chapter: 'chapter5_truth',
    isDark: true,
    theme: 'horror',
    panorama: '/panoramas/autopsy_room_night.webp',
    ambient: '/audio/ambient/autopsy.ogg',
    ambientVolume: 0.45,
    infrasound: { freq: 18, gain: 0.18 },
    events: [
      { id: 'breath', sound: '/audio/events/breath.ogg', min: 20, max: 40 },
      { id: 'drip', sound: '/audio/events/water_drip.ogg', min: 5, max: 12 },
      { id: 'metal_creak', sound: '/audio/events/metal_creak.ogg', min: 25, max: 50 },
    ],
    connections: [{ to: 'hospital_security', label: 'غرفة الأمن' }],
    hotspots: [
      {
        id: 'autopsy_light_switch',
        type: 'light_switch',
        position: { theta: 0, phi: 90 },
        sfx: 'switch_click',
        focusFov: 45,
      },
      {
        id: 'autopsy_body',
        type: 'inspect',
        position: { theta: 180, phi: 100 },
        givesItem: 'fuad_final_letter',
        popup: { type: 'text_document' },
        sfx: 'paper',
        focusFov: 40,
      },
      {
        id: 'autopsy_blackboard',
        type: 'inspect',
        position: { theta: 270, phi: 85 },
        popup: { type: 'text_document' },
        sfx: 'chalk',
        focusFov: 45,
      },
      {
        id: 'autopsy_mirror',
        type: 'inspect',
        position: { theta: 90, phi: 85 },
        givesItem: 'nagwa_final',
        popup: { type: 'text_document' },
        sfx: 'glass_tap',
        focusFov: 45,
      },
      {
        id: 'autopsy_exit_door',
        type: 'exit',
        position: { theta: 0, phi: 92 },
        target: 'WIN',
        sfx: 'door_open',
        isWin: true,
      },
    ],
  },
};

module.exports = roomsData;