/**
 * ═══════════════════════════════════════════════════════════════
 *  urbexServer.js — سيرفر لعبة المستكشفون
 *  نمط الاستخدام: require('./urbexServer')(io)
 * ═══════════════════════════════════════════════════════════════
 */

// ════════════════════════════════════════════════════════════════
// 📖 بيانات الفصول — القصص والأماكن والألغاز
// ════════════════════════════════════════════════════════════════

const URBEX_CHAPTERS = {

  chapter_forest_01: {
    id: "chapter_forest_01",
    titleAr: "كوخ الغابة السوداء",
    titleEn: "The Black Forest Cabin",

    mythAr:
      "يقول أهل القرية إن غابة الصنوبر السوداء تأكل الذكريات،\n" +
      "ومن يدخلها يخرج بوجه تانية...\n\n" +
      "عائلة كمال اختفت سنة ١٩٩٤ في ليلة واحدة.\n" +
      "لم يجدوا جثثاً. لم يجدوا آثاراً.\n" +
      "وجدوا فقط... الكوخ.",

    mythEn:
      "The villagers say the Black Pine Forest devours memories,\n" +
      "and those who enter emerge as someone else...\n\n" +
      "The Kamal family vanished in 1994 in a single night.\n" +
      "No bodies were found. No traces.\n" +
      "Only... the cabin.",

    // ── Leonardo AI Prompts لكل صورة ──
    imagePrompts: {
      forest_entrance:
        "Abandoned forest entrance at midnight, dense dark pine trees, broken iron gate covered in rust and vines, foggy eerie atmosphere, single dirt path leading into darkness, old wooden warning sign barely visible, photorealistic 360° equirectangular panorama, horror atmosphere, cold moonlight rays through trees, ultra detailed, 8k, no people",
      broken_car:
        "Rusty abandoned 1990s car in a dark forest clearing, broken windows, overgrown with vines and moss, trunk open, personal belongings scattered, thick fog, moonlight, photorealistic 360° equirectangular panorama, horror atmosphere, ultra detailed, 8k, no people",
      forest_path:
        "Dark narrow forest path at night surrounded by towering black pine trees, carved symbols on tree trunks, thick ground fog, moonlight barely breaking through canopy, eerie silence atmosphere, photorealistic 360° equirectangular panorama, ultra detailed, 8k, no people",
      cabin_yard:
        "Abandoned cabin yard at midnight, old stone well in corner, dead overgrown garden, broken fence, flickering lantern, stone owl statue, rusty mailbox, dense forest surrounding, photorealistic 360° equirectangular panorama, horror atmosphere, 8k, no people",
      cabin_well:
        "Deep stone well at night in abandoned garden, old frayed rope hanging, dark water below barely visible, moss covered stones, eerie blue moonlight, close up angle, photorealistic 360° equirectangular panorama, 8k, no people",
      cabin_door:
        "Old wooden cabin door at night, rusty iron lock, peeling paint, cobwebs, dim light from cracks underneath, worn door mat, creepy atmosphere, photorealistic 360° equirectangular panorama, 8k, no people",
      cabin_main_room:
        "Abandoned 1990s cabin interior main room, dusty furniture, old gramophone, family photos on walls with scratched faces, stone fireplace with ash, thick dust, cobwebs, moonlight through broken window, photorealistic 360° equirectangular panorama, horror atmosphere, 8k, no people",
      cabin_kitchen:
        "Abandoned 1990s cabin kitchen interior, old wooden table with scattered papers, rusty cabinet, hanging pots, broken window, calendar on wall, eerie dim light, thick dust, photorealistic 360° equirectangular panorama, 8k, no people",
      cabin_study:
        "Abandoned cabin study room, old wooden desk covered in papers and books, oil lamp, scattered research notes, bookshelves, cracked walls, moonlight, eerie atmosphere, photorealistic 360° equirectangular panorama, 8k, no people",
      cabin_library:
        "Abandoned cabin library, floor to ceiling bookshelves, dusty old books, reading chair, faded wallpaper, spider webs, eerie dark atmosphere with single candle light, photorealistic 360° equirectangular panorama, 8k, no people",
      cabin_stairs:
        "Dark creaky wooden staircase in abandoned cabin, broken banister, old wallpaper peeling, moonlight from above, shadows everywhere, eerie atmosphere, photorealistic 360° equirectangular panorama, 8k, no people",
      cabin_bedroom:
        "Abandoned 1990s cabin master bedroom, dusty bed with old sheets, large wardrobe, broken window with moonlight, scratches on wall near window, mirror on wall, eerie atmosphere, photorealistic 360° equirectangular panorama, 8k, no people",
      cabin_riya_room:
        "Abandoned child's bedroom in cabin, walls covered in disturbing children's drawings showing a woman getting closer to the house, toy chest, small bed, moonlight, deeply eerie and unsettling atmosphere, photorealistic 360° equirectangular panorama, 8k, no people",
      cabin_cellar_door:
        "Dark cabin interior cellar door in kitchen floor, heavy wooden door with symbol lock, old iron hinges, dim light from cracks below, dust and cobwebs, deeply ominous atmosphere, photorealistic 360° equirectangular panorama, 8k, no people",
      cabin_cellar:
        "Dark stone cellar under abandoned cabin, old video camera on tripod with red recording light, scattered research files and papers, large cracked mirror on wall, single bare bulb, deeply disturbing atmosphere, photorealistic 360° equirectangular panorama, horror, 8k, no people",
    },

    // ── خريطة العُقد ──
    nodes: {

      forest_entrance: {
        id: "forest_entrance",
        nameAr: "مدخل الغابة",
        nameEn: "Forest Entrance",
        image: "forest_entrance.jpg",
        ambientSound: "forest_night.mp3",
        infrasound: true,
        connections: ["forest_path", "broken_car"],
        hotspots: [
          { id: "hs_car",      x: 22, y: 68, type: "navigate", target: "broken_car",   icon: "car",     labelAr: "سيارة متوقفة",  labelEn: "Broken Car"    },
          { id: "hs_path",     x: 58, y: 52, type: "navigate", target: "forest_path",  icon: "arrow",   labelAr: "مسار الغابة",   labelEn: "Forest Path"   },
          { id: "hs_sign",     x: 82, y: 46, type: "inspect",  itemId: "item_warning_sign", icon: "inspect", labelAr: "لافتة قديمة", labelEn: "Old Sign" },
        ],
        requiredItems: [],
        puzzle: null,
      },

      broken_car: {
        id: "broken_car",
        nameAr: "السيارة العاطلة",
        nameEn: "The Broken Car",
        image: "broken_car.jpg",
        ambientSound: "wind_metal.mp3",
        infrasound: false,
        connections: ["forest_entrance"],
        hotspots: [
          { id: "hs_trunk",    x: 48, y: 72, type: "inspect", itemId: "item_crowbar",          icon: "inspect", labelAr: "شنطة العربية",   labelEn: "Car Trunk"      },
          { id: "hs_dash",     x: 28, y: 52, type: "inspect", itemId: "item_car_registration", icon: "inspect", labelAr: "داشبورد",        labelEn: "Dashboard"      },
          { id: "hs_backseat", x: 68, y: 58, type: "inspect", itemId: "item_childs_drawing",   icon: "inspect", labelAr: "المقعد الخلفي",  labelEn: "Back Seat"      },
        ],
        requiredItems: [],
        puzzle: null,
      },

      forest_path: {
        id: "forest_path",
        nameAr: "مسار الغابة — المتاهة",
        nameEn: "Forest Path — The Maze",
        image: "forest_path.jpg",
        ambientSound: "deep_forest.mp3",
        infrasound: true,
        connections: ["forest_entrance", "cabin_yard"],
        hotspots: [
          { id: "hs_cabin",      x: 50, y: 48, type: "navigate", target: "cabin_yard",    icon: "arrow",   labelAr: "الكوخ",                 labelEn: "The Cabin"       },
          { id: "hs_carvedtree", x: 18, y: 62, type: "inspect",  itemId: "item_carved_tree", icon: "inspect", labelAr: "شجرة محفور فيها",   labelEn: "Carved Tree"     },
        ],
        requiredItems: [],
        puzzle: {
          id: "compass_maze",
          type: "compass",
          titleAr: "متاهة الغابة",
          titleEn: "Forest Maze",
          descriptionAr: "استخدم البوصلة واتبع الاتجاهات الصح للخروج من المتاهة",
          descriptionEn: "Use the compass and follow the correct directions to exit the maze",
          sequence: ["N", "E", "N", "W", "N"],
          hintAr: "الأشجار المحفور فيها بتديك الاتجاه الصح",
          hintEn: "The carved trees give you the right direction",
        },
      },

      cabin_yard: {
        id: "cabin_yard",
        nameAr: "ساحة الكوخ",
        nameEn: "Cabin Yard",
        image: "cabin_yard.jpg",
        ambientSound: "cabin_night.mp3",
        infrasound: false,
        connections: ["forest_path", "cabin_door", "cabin_well"],
        hotspots: [
          { id: "hs_door",    x: 50, y: 42, type: "navigate", target: "cabin_door", icon: "door",    labelAr: "باب الكوخ",     labelEn: "Cabin Door"    },
          { id: "hs_well",    x: 18, y: 72, type: "navigate", target: "cabin_well", icon: "arrow",   labelAr: "البئر",         labelEn: "The Well"      },
          { id: "hs_owl",     x: 76, y: 68, type: "inspect",  itemId: "item_stone_owl",  icon: "inspect", labelAr: "تمثال حجري", labelEn: "Stone Statue" },
          { id: "hs_mailbox", x: 88, y: 56, type: "inspect",  itemId: "item_old_letter", icon: "inspect", labelAr: "صندوق البريد", labelEn: "Mailbox"   },
        ],
        requiredItems: [],
        puzzle: null,
      },

      cabin_well: {
        id: "cabin_well",
        nameAr: "البئر العميق",
        nameEn: "The Deep Well",
        image: "cabin_well.jpg",
        ambientSound: "water_drip.mp3",
        infrasound: true,
        connections: ["cabin_yard"],
        hotspots: [
          { id: "hs_rope", x: 50, y: 42, type: "puzzle", puzzleId: "well_gyro", icon: "interact", labelAr: "طلع وبص جوه", labelEn: "Look Inside" },
        ],
        requiredItems: [],
        puzzle: {
          id: "well_gyro",
          type: "gyroscope_look",
          titleAr: "قاع البئر",
          titleEn: "Well Bottom",
          descriptionAr: "حوّل التليفون للأسفل وبص جوه البئر",
          descriptionEn: "Tilt your phone downward to look inside the well",
          targetBeta: -45,
          tolerance: 15,
          rewardItemId: "item_well_key",
          hintAr: "حط التليفون على وضع النظر للأسفل تماماً",
          hintEn: "Tilt phone fully downward to look inside",
        },
      },

      cabin_door: {
        id: "cabin_door",
        nameAr: "باب الكوخ",
        nameEn: "Cabin Door",
        image: "cabin_door.jpg",
        imageUnlocked: "cabin_door_open.jpg",
        ambientSound: "wind_creak.mp3",
        infrasound: false,
        connections: ["cabin_yard", "cabin_main_room"],
        hotspots: [
          { id: "hs_lock",   x: 56, y: 52, type: "puzzle", puzzleId: "cabin_door_lock", icon: "lock",    labelAr: "القفل",          labelEn: "The Lock"    },
          { id: "hs_mat",    x: 50, y: 82, type: "inspect", itemId: "item_mat_clue",     icon: "inspect", labelAr: "سجادة الباب",   labelEn: "Door Mat"    },
        ],
        requiredItems: [],
        puzzle: {
          id: "cabin_door_lock",
          type: "number_pad",
          titleAr: "قفل الكوخ",
          titleEn: "Cabin Lock",
          code: "1994",
          descriptionAr: "الباب مقفول برقم سري من ٤ أرقام",
          descriptionEn: "The door is locked with a 4-digit code",
          hintAr: "السنة اللي رحلت فيها العائلة — في التمثال والورقة",
          hintEn: "The year the family disappeared — check the statue and the note",
          unlocksNode: "cabin_main_room",
        },
      },

      cabin_main_room: {
        id: "cabin_main_room",
        nameAr: "الغرفة الرئيسية",
        nameEn: "Main Room",
        image: "cabin_main_room.jpg",
        ambientSound: "indoor_creak.mp3",
        infrasound: true,
        connections: ["cabin_door", "cabin_kitchen", "cabin_stairs", "cabin_study"],
        hotspots: [
          { id: "hs_photo",       x: 38, y: 36, type: "inspect",  itemId: "item_family_photo",  icon: "inspect",  labelAr: "صورة عائلية",    labelEn: "Family Photo"  },
          { id: "hs_gramophone",  x: 72, y: 56, type: "puzzle",   puzzleId: "gramophone_puzzle", icon: "interact", labelAr: "الجراموفون",     labelEn: "Gramophone"    },
          { id: "hs_fireplace",   x: 24, y: 62, type: "inspect",  itemId: "item_burnt_paper",   icon: "flashlight", labelAr: "المدفأة",      labelEn: "Fireplace", requiresTool: "flashlight" },
          { id: "hs_kitchen",     x: 86, y: 52, type: "navigate", target: "cabin_kitchen",      icon: "arrow",    labelAr: "المطبخ",         labelEn: "Kitchen"       },
          { id: "hs_stairs",      x: 14, y: 46, type: "navigate", target: "cabin_stairs",       icon: "arrow",    labelAr: "السلم",          labelEn: "Stairs"        },
          { id: "hs_study",       x: 50, y: 18, type: "navigate", target: "cabin_study",        icon: "arrow",    labelAr: "غرفة الدراسة",   labelEn: "Study Room"    },
        ],
        requiredItems: ["item_crowbar"],
        puzzle: {
          id: "gramophone_puzzle",
          type: "sequence_audio",
          titleAr: "لغز الجراموفون",
          titleEn: "Gramophone Puzzle",
          descriptionAr: "استمع للحن ورتب التماثيل الخمسة حسب ترتيب النغمات",
          descriptionEn: "Listen to the melody and arrange the five statues in the order of the notes",
          sequence: [3, 1, 4, 1, 5],
          statueCount: 5,
          rewardItemId: "item_gramophone_cylinder",
          hintAr: "استمع مرتين قبل ما ترتب — كل تمثال بيمثل نغمة",
          hintEn: "Listen twice before arranging — each statue represents a note",
        },
      },

      cabin_kitchen: {
        id: "cabin_kitchen",
        nameAr: "المطبخ",
        nameEn: "Kitchen",
        image: "cabin_kitchen.jpg",
        ambientSound: "kitchen_drip.mp3",
        infrasound: false,
        connections: ["cabin_main_room", "cabin_cellar_door"],
        hotspots: [
          { id: "hs_table",   x: 50, y: 66, type: "inspect",  itemId: "item_calendar",        icon: "inspect",  labelAr: "الطاولة",        labelEn: "Kitchen Table"  },
          { id: "hs_cabinet", x: 24, y: 46, type: "inspect",  itemId: "item_medicine_bottle", icon: "crowbar",  labelAr: "الخزانة",        labelEn: "Cabinet", requiresTool: "crowbar" },
          { id: "hs_cellar",  x: 76, y: 76, type: "navigate", target: "cabin_cellar_door",    icon: "door",     labelAr: "باب السرداب",    labelEn: "Cellar Door"    },
        ],
        requiredItems: [],
        puzzle: null,
      },

      cabin_cellar_door: {
        id: "cabin_cellar_door",
        nameAr: "باب السرداب",
        nameEn: "Cellar Door",
        image: "cabin_cellar_door.jpg",
        ambientSound: "deep_hum.mp3",
        infrasound: true,
        connections: ["cabin_kitchen", "cabin_cellar"],
        hotspots: [
          { id: "hs_symbolock", x: 50, y: 52, type: "puzzle", puzzleId: "cellar_symbol_lock", icon: "lock", labelAr: "القفل الرمزي", labelEn: "Symbol Lock" },
        ],
        requiredItems: [],
        puzzle: {
          id: "cellar_symbol_lock",
          type: "symbol_combination",
          titleAr: "قفل السرداب",
          titleEn: "Cellar Lock",
          descriptionAr: "قفل عليه رموز — رتبهم بالترتيب الصح",
          descriptionEn: "A symbol lock — arrange them in the correct order",
          symbols: ["🌙", "⭐", "🌿", "🔑", "💀"],
          correctSequence: [2, 0, 3, 1],
          hintAr: "الترتيب مذكور في الورقة السرية في مكتب الأب",
          hintEn: "The order is in the hidden note in the father's study",
          unlocksNode: "cabin_cellar",
        },
      },

      cabin_cellar: {
        id: "cabin_cellar",
        nameAr: "السرداب",
        nameEn: "The Cellar",
        image: "cabin_cellar.jpg",
        ambientSound: "cellar_ambience.mp3",
        infrasound: true,
        connections: ["cabin_cellar_door"],
        hotspots: [
          { id: "hs_camera",  x: 28, y: 56, type: "inspect", itemId: "item_video_camera",   icon: "inspect",   labelAr: "كاميرا فيديو",  labelEn: "Video Camera"     },
          { id: "hs_files",   x: 66, y: 62, type: "inspect", itemId: "item_research_files", icon: "flashlight", labelAr: "ملفات البحث", labelEn: "Research Files", requiresTool: "flashlight" },
          { id: "hs_mirror",  x: 50, y: 34, type: "puzzle",  puzzleId: "mirror_puzzle",     icon: "interact",  labelAr: "المرآة الكبيرة", labelEn: "The Large Mirror" },
        ],
        requiredItems: ["flashlight"],
        puzzle: {
          id: "mirror_puzzle",
          type: "mirror_angle",
          titleAr: "أسرار المرآة",
          titleEn: "Mirror Secrets",
          descriptionAr: "وجّه المرآة بالزاوية الصح تشوف الرسالة المخفية",
          descriptionEn: "Angle the mirror correctly to reveal the hidden message",
          correctAngle: 45,
          tolerance: 8,
          revealedMessage: "التجربة نجحت — لكن مش عليهم",
          revealedMessageEn: "The experiment succeeded — but not on them",
          hintAr: "٤٥ درجة هو الزاوية الصح",
          hintEn: "45 degrees is the correct angle",
        },
      },

      cabin_study: {
        id: "cabin_study",
        nameAr: "غرفة الدراسة",
        nameEn: "Study Room",
        image: "cabin_study.jpg",
        ambientSound: "study_wind.mp3",
        infrasound: false,
        connections: ["cabin_main_room", "cabin_library"],
        hotspots: [
          { id: "hs_desk",    x: 50, y: 62, type: "inspect", itemId: "item_fathers_diary", icon: "inspect", labelAr: "مكتب الأب",    labelEn: "Father's Desk"   },
          { id: "hs_uvpaper", x: 66, y: 46, type: "inspect", itemId: "item_hidden_note",   icon: "uv",      labelAr: "أوراق الكتابة", labelEn: "Writing Paper", requiresTool: "uv_light" },
          { id: "hs_library", x: 14, y: 52, type: "navigate", target: "cabin_library",     icon: "arrow",   labelAr: "المكتبة",       labelEn: "Library"         },
        ],
        requiredItems: [],
        puzzle: null,
      },

      cabin_library: {
        id: "cabin_library",
        nameAr: "المكتبة",
        nameEn: "The Library",
        image: "cabin_library.jpg",
        ambientSound: "library_silence.mp3",
        infrasound: false,
        connections: ["cabin_study"],
        hotspots: [
          { id: "hs_shelf", x: 50, y: 50, type: "puzzle",  puzzleId: "bookshelf_puzzle", icon: "interact", labelAr: "رف الكتب",     labelEn: "Bookshelf"     },
          { id: "hs_chair", x: 24, y: 72, type: "inspect", itemId: "item_torn_page",     icon: "inspect",  labelAr: "كرسي القراءة", labelEn: "Reading Chair" },
        ],
        requiredItems: [],
        puzzle: {
          id: "bookshelf_puzzle",
          type: "book_sequence",
          titleAr: "رف الكتب السري",
          titleEn: "Secret Bookshelf",
          descriptionAr: "اضغط على الكتب بالترتيب الصح لفتح الحجرة السرية",
          descriptionEn: "Press the books in the correct order to open the secret compartment",
          books: [
            { id: "b1", titleAr: "علم النفس والطبيعة",  titleEn: "Psychology & Nature",     correct: true,  order: 1 },
            { id: "b2", titleAr: "تاريخ الغابات السوداء", titleEn: "History of Dark Forests", correct: true,  order: 3 },
            { id: "b3", titleAr: "قاموس اللاتينية",       titleEn: "Latin Dictionary",        correct: false         },
            { id: "b4", titleAr: "أسرار العقل البشري",    titleEn: "Secrets of the Human Mind", correct: true, order: 2 },
            { id: "b5", titleAr: "الكيمياء الطبيعية",     titleEn: "Natural Chemistry",       correct: false         },
          ],
          rewardItemId: "item_uv_light",
          hintAr: "الكتب اللي الأب كتب عنها في يومياته — بالترتيب",
          hintEn: "The books the father mentioned in his diary — in order",
        },
      },

      cabin_stairs: {
        id: "cabin_stairs",
        nameAr: "السلم",
        nameEn: "Staircase",
        image: "cabin_stairs.jpg",
        ambientSound: "stair_creak.mp3",
        infrasound: false,
        connections: ["cabin_main_room", "cabin_bedroom", "cabin_riya_room"],
        hotspots: [
          { id: "hs_bedroom", x: 38, y: 28, type: "navigate", target: "cabin_bedroom",   icon: "arrow", labelAr: "غرفة الوالدين", labelEn: "Parents' Room" },
          { id: "hs_riya",    x: 72, y: 28, type: "navigate", target: "cabin_riya_room", icon: "arrow", labelAr: "غرفة ريا",       labelEn: "Riya's Room"  },
        ],
        requiredItems: [],
        puzzle: null,
      },

      cabin_bedroom: {
        id: "cabin_bedroom",
        nameAr: "غرفة الوالدين",
        nameEn: "Parents' Bedroom",
        image: "cabin_bedroom.jpg",
        ambientSound: "bedroom_wind.mp3",
        infrasound: true,
        connections: ["cabin_stairs"],
        hotspots: [
          { id: "hs_bed",      x: 50, y: 56, type: "inspect", itemId: "item_mothers_journal",  icon: "inspect",   labelAr: "السرير",       labelEn: "The Bed"        },
          { id: "hs_wardrobe", x: 18, y: 46, type: "puzzle",  puzzleId: "shadow_puzzle",       icon: "flashlight", labelAr: "الدولاب",     labelEn: "Wardrobe", requiresTool: "flashlight" },
          { id: "hs_window",   x: 82, y: 36, type: "inspect", itemId: "item_window_scratches", icon: "inspect",   labelAr: "الشباك",       labelEn: "Window"         },
        ],
        requiredItems: ["flashlight"],
        puzzle: {
          id: "shadow_puzzle",
          type: "shadow_angle",
          titleAr: "لغز الظل",
          titleEn: "Shadow Puzzle",
          descriptionAr: "حرك الكشاف لتكوّن الظل الصح على الحيط — الظل هيكشف الكود",
          descriptionEn: "Move the flashlight to cast the correct shadow on the wall — the shadow reveals the code",
          positions: {
            left:   { revealCode: false, labelAr: "يسار",  labelEn: "Left"   },
            center: { revealCode: true,  labelAr: "وسط",   labelEn: "Center"  },
            right:  { revealCode: false, labelAr: "يمين",  labelEn: "Right"  },
          },
          revealedCode: "427",
          rewardItemId: "item_safe_combination",
          hintAr: "الزاوية النصفية هي الجواب",
          hintEn: "The middle angle is the answer",
        },
      },

      cabin_riya_room: {
        id: "cabin_riya_room",
        nameAr: "غرفة ريا",
        nameEn: "Riya's Room",
        image: "cabin_riya_room.jpg",
        ambientSound: "childs_music_box.mp3",
        infrasound: true,
        connections: ["cabin_stairs"],
        hotspots: [
          { id: "hs_drawings",  x: 50, y: 38, type: "inspect", itemId: "item_wall_drawings",  icon: "inspect",   labelAr: "الرسومات على الحيط", labelEn: "Wall Drawings"  },
          { id: "hs_toybox",    x: 22, y: 72, type: "inspect", itemId: "item_music_box",      icon: "inspect",   labelAr: "صندوق الألعاب",     labelEn: "Toy Box"        },
          { id: "hs_underbed",  x: 62, y: 76, type: "inspect", itemId: "item_riya_letter",    icon: "flashlight", labelAr: "تحت السرير",        labelEn: "Under the Bed", requiresTool: "flashlight", isFinalClue: true },
        ],
        requiredItems: [],
        puzzle: null,
      },
    },

    // ── الأغراض ──
    items: {
      item_warning_sign: {
        id: "item_warning_sign",
        nameAr: "لافتة تحذير قديمة",
        nameEn: "Old Warning Sign",
        type: "document",
        icon: "scroll",
        descriptionAr:
          "لافتة خشبية قديمة كتب عليها:\n\"ملكية خاصة — الدخول ممنوع\"\n\nتحت الكتابة الرسمية، بخط يد متزلزل:\n\"لا تدخل. رجاءً.\"",
        descriptionEn:
          "An old wooden sign reading:\n\"Private Property — No Entry\"\n\nBelow in shaking handwriting:\n\"Don't enter. Please.\"",
        isClue: true,
        isTool: false,
      },

      item_crowbar: {
        id: "item_crowbar",
        nameAr: "عتلة حديد",
        nameEn: "Crowbar",
        type: "tool",
        icon: "crowbar",
        descriptionAr: "عتلة حديد صدية من شنطة العربية. هتفيد في فتح الأبواب والخزانات المقفولة.",
        descriptionEn: "A rusty crowbar from the car trunk. Useful for prying open locked doors and cabinets.",
        isClue: false,
        isTool: true,
      },

      item_car_registration: {
        id: "item_car_registration",
        nameAr: "تسجيل السيارة",
        nameEn: "Car Registration",
        type: "document",
        icon: "document",
        descriptionAr:
          "ورقة تسجيل السيارة:\n\nالاسم: كمال يوسف\nالسنة: ١٩٩٤\nالعنوان: كوخ الغابة — طريق الصنوبر الكيلو ١٢",
        descriptionEn:
          "Car registration document:\n\nName: Kamal Yousef\nYear: 1994\nAddress: Forest Cabin — Pine Road Km 12",
        isClue: true,
        isTool: false,
      },

      item_childs_drawing: {
        id: "item_childs_drawing",
        nameAr: "رسمة طفلة",
        nameEn: "Child's Drawing",
        type: "document",
        icon: "image",
        descriptionAr:
          "ورقة رسم على المقعد الخلفي.\nطفلة رسمت عيلة بتبتسم قدام كوخ.\n\nلكن في كل رسمة... في ست واقفة في الخلفية بتبص.\nحواف الورق مرسومة بالأحمر.\n\nوتحت الرسمة الأخيرة بخط صغير:\n\"مش ماما.\"",
        descriptionEn:
          "A drawing on the back seat.\nA child drew a smiling family in front of a cabin.\n\nBut in every drawing... a woman stands in the background watching.\nThe edges are drawn in red.\n\nBelow the last drawing in tiny writing:\n\"Not mama.\"",
        isClue: true,
        isTool: false,
      },

      item_carved_tree: {
        id: "item_carved_tree",
        nameAr: "رسالة الشجرة",
        nameEn: "Tree Message",
        type: "clue",
        icon: "clue",
        descriptionAr:
          "محفور في الشجرة:\n\nش ← م ← ش ← غ ← ش\n\n(شمال، مشرق، شمال، مغرب، شمال)",
        descriptionEn:
          "Carved into the tree:\n\nN → E → N → W → N\n\nThis is the correct path through the maze.",
        isClue: true,
        isTool: false,
      },

      item_stone_owl: {
        id: "item_stone_owl",
        nameAr: "البومة الحجرية",
        nameEn: "Stone Owl",
        type: "clue",
        icon: "clue",
        descriptionAr:
          "بومة حجرية صغيرة في الحديقة.\nفي قاعدتها محفور:\n\n١٩٩٤\n\nنفس السنة.",
        descriptionEn:
          "A small stone owl in the garden.\nOn its base is carved:\n\n1994\n\nThe same year.",
        isClue: true,
        isTool: false,
      },

      item_old_letter: {
        id: "item_old_letter",
        nameAr: "رسالة قديمة",
        nameEn: "Old Letter",
        type: "document",
        icon: "letter",
        descriptionAr:
          "رسالة في صندوق البريد من 'د. إبراهيم — مركز الأبحاث'\n\n\"كمال،\n\nالتجربة خطيرة. أوقف كل شيء.\nالغابة مش مجرد غابة.\n\nأنا بتكلم عن مشروع التكيف ٩٤.\nاللي اكتشفناه أكبر بكتير مما توقعنا.\n\n— إبراهيم\"\n\nالتاريخ: يونيو ١٩٩٤\n\n[يوجد عنوان للمكتبة المركزية في المدينة]",
        descriptionEn:
          "A letter from 'Dr. Ibrahim — Research Center'\n\n\"Kamal,\n\nThe experiment is dangerous. Stop everything.\nThe forest is not just a forest.\n\nI'm talking about Adaptation Project 94.\nWhat we discovered is far bigger than we thought.\n\n— Ibrahim\"\n\nDate: June 1994\n\n[Contains address of the Central City Library]",
        isClue: true,
        isTool: false,
        leadsToChapter: "chapter_library_02",
      },

      item_well_key: {
        id: "item_well_key",
        nameAr: "مفتاح من البئر",
        nameEn: "Key from the Well",
        type: "clue",
        icon: "key",
        descriptionAr:
          "في قاع الدلو كان في مفتاح صغير ومربوط فيه ورقة:\n\n\"للي هييجي بعدنا —\nالكل بيفكر إن البئر عميق.\nالحقيقة إن اللي في البئر مش ميه.\"\n\nالمفتاح مش بيفتح أي حاجة موجودة هنا.",
        descriptionEn:
          "At the bottom of the bucket was a small key with a note attached:\n\n\"For whoever comes after us —\nEveryone thinks the well is deep.\nThe truth is what's in the well isn't water.\"\n\nThe key doesn't open anything here.",
        isClue: true,
        isTool: false,
      },

      item_mat_clue: {
        id: "item_mat_clue",
        nameAr: "ورقة تحت السجادة",
        nameEn: "Note Under the Mat",
        type: "clue",
        icon: "clue",
        descriptionAr: "ورقة صغيرة تحت سجادة الباب:\n\n\"١٩٩٤ — هو الجواب دايماً.\"\n\nتحتها بخط رفيع: 'كمال كتبه.'",
        descriptionEn: "A small note under the door mat:\n\n\"1994 — is always the answer.\"\n\nBelow in thin writing: 'Kamal wrote this.'",
        isClue: true,
        isTool: false,
      },

      item_family_photo: {
        id: "item_family_photo",
        nameAr: "صور العائلة",
        nameEn: "Family Photos",
        type: "document",
        icon: "image",
        descriptionAr:
          "صورة جماعية سعيدة أمام الكوخ — كمال وسلمى وريا.\n\nلكن في الصور التانية اللي جنبيها...\nوجوه سلمى وريا اتمسحت بإيد بشكل عنيف.\n\nوفي الصورة الأخيرة — كمال وحده.\nبيبتسم.",
        descriptionEn:
          "A happy family photo in front of the cabin — Kamal, Salma and Riya.\n\nBut in the other photos beside it...\nSalma and Riya's faces have been violently scratched out by hand.\n\nAnd in the last photo — Kamal alone.\nSmiling.",
        isClue: true,
        isTool: false,
      },

      item_gramophone_cylinder: {
        id: "item_gramophone_cylinder",
        nameAr: "أسطوانة الجراموفون",
        nameEn: "Gramophone Cylinder",
        type: "clue",
        icon: "clue",
        descriptionAr:
          "أسطوانة قديمة من الجراموفون.\nعلى غلافها: 'س.ك — ١٩٩٤'\n\nالموسيقى اللي فيها هي نفسها اللي بتعزفها علبة الموسيقى في غرفة ريا.",
        descriptionEn:
          "An old gramophone cylinder.\nOn its cover: 'S.K — 1994'\n\nThe melody it plays is the same as Riya's music box.",
        isClue: true,
        isTool: false,
      },

      item_burnt_paper: {
        id: "item_burnt_paper",
        nameAr: "أوراق محروقة",
        nameEn: "Burnt Papers",
        type: "document",
        icon: "document",
        descriptionAr:
          "أوراق محروقة في المدفأة.\nبالكشاف تشوف جزء ناجي:\n\n'...الغابة بتختار...\nمن يشوفها...\nلمس العقل...\nإنه...'\n\nالباقي محروق.",
        descriptionEn:
          "Burnt papers in the fireplace.\nWith the flashlight you can see a surviving fragment:\n\n'...the forest chooses...\nthose who see it...\ntouching the mind...\nhe...'\n\nThe rest is burnt.",
        isClue: true,
        isTool: false,
        requiresTool: "flashlight",
      },

      item_calendar: {
        id: "item_calendar",
        nameAr: "التقويم",
        nameEn: "Calendar",
        type: "document",
        icon: "document",
        descriptionAr:
          "تقويم سنة ١٩٩٤ على طاولة المطبخ.\nأيام متشطبة من ١ أكتوبر حتى ٢٨.\n\nكل يوم فيه كلمة واحدة:\n'مش هي — مش هي — مش هي'\n\nفي اليوم الأخير — ٢٨ أكتوبر:\n'هي.'",
        descriptionEn:
          "A 1994 kitchen calendar.\nDays crossed from October 1st to 28th.\n\nEach day has one word:\n'not her — not her — not her'\n\nOn the last day — October 28th:\n'her.'",
        isClue: true,
        isTool: false,
      },

      item_medicine_bottle: {
        id: "item_medicine_bottle",
        nameAr: "قارورة دواء غامضة",
        nameEn: "Mystery Medicine Bottle",
        type: "evidence",
        icon: "evidence",
        descriptionAr:
          "قارورة دواء فارغة — اسم الدواء ممسوح.\n\nبالضوء فوق البنفسجي في قاعها:\n'تجربة رقم ٧ — تغيير الهوية\nالجرعة: ٣ قطرات يومياً في الماء'",
        descriptionEn:
          "An empty medicine bottle — the drug name is scratched off.\n\nUnder UV light on its base:\n'Experiment No. 7 — Identity Shift\nDosage: 3 drops daily in water'",
        isClue: true,
        isTool: false,
        requiresTool: "uv_light",
      },

      item_fathers_diary: {
        id: "item_fathers_diary",
        nameAr: "يوميات الأب",
        nameEn: "Father's Diary",
        type: "document",
        icon: "book",
        descriptionAr:
          "يوميات الأب كمال — صفحات كتيرة:\n\n'٥ يونيو: الغابة هادية ومريحة. الأبحاث ماشية كويس.'\n\n'١٢ يوليو: سلمى بدأت تتصرف غريب. بتتكلم مع نفسها.'\n\n'٣ أغسطس: أنا مش متأكد إن دي سلمى.'\n\n'١ أكتوبر: ريا قالتلي حاجة مرعبة — قالت إن أمها راحت من زمان.'\n\n'آخر إدخال:\nلو حد شايف الكتاب ده يبقى وصل للحقيقة.\nأنا مش اختفيت. أنا اخترت أفضل.\nالغابة عرضت عليا حاجة ما أقدرش أرفضها.'",
        descriptionEn:
          "Father Kamal's diary — many pages:\n\n'June 5: The forest is peaceful. Research going well.'\n\n'July 12: Salma started acting strangely. Talks to herself.'\n\n'August 3: I'm not sure that's Salma.'\n\n'October 1: Riya told me something terrifying — she said her mother left long ago.'\n\n'Last entry:\nIf anyone finds this diary they've reached the truth.\nI didn't disappear. I chose something better.\nThe forest offered me something I couldn't refuse.'",
        isClue: true,
        isTool: false,
      },

      item_hidden_note: {
        id: "item_hidden_note",
        nameAr: "ورقة بالحبر السري",
        nameEn: "Invisible Ink Note",
        type: "clue",
        icon: "clue",
        descriptionAr:
          "بالضوء فوق البنفسجي الكتابة بتظهر:\n\n'الترتيب الصح لقفل السرداب:\n🌿 ، 🌙 ، 🔑 ، ⭐'\n\n(٢ ، ٠ ، ٣ ، ١)",
        descriptionEn:
          "Under UV light the writing appears:\n\n'Correct order for the cellar lock:\n🌿 , 🌙 , 🔑 , ⭐'\n\n(2 , 0 , 3 , 1)",
        isClue: true,
        isTool: false,
        requiresTool: "uv_light",
      },

      item_uv_light: {
        id: "item_uv_light",
        nameAr: "مصباح UV",
        nameEn: "UV Light",
        type: "tool",
        icon: "uv",
        descriptionAr: "مصباح فوق بنفسجي مخبأ في الحجرة السرية في المكتبة. يكشف الكتابة بالحبر السري.",
        descriptionEn: "A UV light hidden in the library's secret compartment. Reveals invisible ink writing.",
        isClue: false,
        isTool: true,
      },

      item_torn_page: {
        id: "item_torn_page",
        nameAr: "صفحة ممزقة من بحث",
        nameEn: "Torn Research Page",
        type: "document",
        icon: "document",
        descriptionAr:
          "صفحة ممزقة من بحث علمي:\n\n'...تجربة الهوية رقم ٧ نجحت في تغيير النمط السلوكي الأساسي...\nالموضوع فقد هويته الأصلية خلال ٦ أسابيع...\nالغابة كانت العامل الرئيسي في...\n\nالنتيجة الأخيرة: الموضوع لم يعد يعرف من هو.\nبدأ يؤمن إنه كيان تاني تماماً.'",
        descriptionEn:
          "A torn research page:\n\n'...Identity Experiment No. 7 succeeded in altering the core behavioral pattern...\nThe subject lost their original identity within 6 weeks...\nThe forest was the primary factor in...\n\nFinal result: The subject no longer knows who they are.\nBegan to believe they are an entirely different entity.'",
        isClue: true,
        isTool: false,
      },

      item_video_camera: {
        id: "item_video_camera",
        nameAr: "كاميرا فيديو قديمة",
        nameEn: "Old Video Camera",
        type: "document",
        icon: "video",
        isFinalClue: true,
        descriptionAr:
          "كاميرا فيديو بتشتغل لوحدها في السرداب.\nعلى الشاشة الصغيرة فيديو:\n\n'أنا كمال يوسف.\nلو حد شايف الفيديو ده يعني وصل للحقيقة.\n\nأنا مش اختفيت.\nأنا اخترت أفضل.\n\nاللي اختفى هو الكوخ نفسه.\nالكوخ ده مش موجود على أي خريطة.\nمحدش بنى الكوخ ده.\n\nإحنا مش أول ناس هنا.\nومش هنبقى الأخرين.\n\nالغابة بتختار مين يشوفها.'",
        descriptionEn:
          "A video camera running alone in the cellar.\nOn the small screen a video plays:\n\n'I am Kamal Yousef.\nIf anyone sees this video they've reached the truth.\n\nI didn't disappear.\nI chose something better.\n\nWhat disappeared is the cabin itself.\nThis cabin doesn't exist on any map.\nNobody built this cabin.\n\nWe're not the first here.\nAnd we won't be the last.\n\nThe forest chooses who sees it.'",
        isClue: true,
        isTool: false,
      },

      item_research_files: {
        id: "item_research_files",
        nameAr: "ملفات مشروع التكيف ٩٤",
        nameEn: "Adaptation Project 94 Files",
        type: "document",
        icon: "folder",
        descriptionAr:
          "ملفات أبحاث كمال السرية.\nالعنوان: مشروع التكيف ٩٤\n\nبيدرس تأثير الغابة على الهوية البشرية.\n\nآخر ملاحظة:\n'التجربة نجحت — لكن مش عليهم.\nالغابة تحكمت فيّ أنا.\nأنا الموضوع.\nأنا كنت دايماً الموضوع.'",
        descriptionEn:
          "Kamal's secret research files.\nTitle: Adaptation Project 94\n\nStudies the forest's effect on human identity.\n\nLast note:\n'The experiment worked — but not on them.\nThe forest controlled me.\nI am the subject.\nI was always the subject.'",
        isClue: true,
        isTool: false,
        requiresTool: "flashlight",
      },

      item_mothers_journal: {
        id: "item_mothers_journal",
        nameAr: "مجلة الأم",
        nameEn: "Mother's Journal",
        type: "document",
        icon: "book",
        descriptionAr:
          "مجلة سلمى — أغلب الصفحات ممزقة.\nاللي ناجي:\n\n'أنا مش سلمى.\nأنا بأعرف كده.\nسلمى راحت من زمان.\n\nبس جسمها لسه هنا وأنا جوه.\n\nالبنت بتعرف.\nالبنت شايفة.\n\nلازم أخرج من هنا.\nلازم أخليها تخرج.'",
        descriptionEn:
          "Salma's journal — most pages torn.\nWhat survives:\n\n'I am not Salma.\nI know that.\nSalma left long ago.\n\nBut her body is still here and I'm inside.\n\nThe girl knows.\nThe girl sees.\n\nI must leave this place.\nI must let her leave.'",
        isClue: true,
        isTool: false,
      },

      item_safe_combination: {
        id: "item_safe_combination",
        nameAr: "كود الخزنة",
        nameEn: "Safe Combination",
        type: "clue",
        icon: "clue",
        descriptionAr:
          "الظل على الحيط كوّن الأرقام:\n\n٤ - ٢ - ٧\n\nده كود خزنة في مكان تاني.",
        descriptionEn:
          "The shadow on the wall formed the numbers:\n\n4 - 2 - 7\n\nThis is a safe combination somewhere else.",
        isClue: true,
        isTool: false,
      },

      item_window_scratches: {
        id: "item_window_scratches",
        nameAr: "خدوش الشباك",
        nameEn: "Window Scratches",
        type: "evidence",
        icon: "evidence",
        descriptionAr:
          "على الجانب الداخلي للشباك — خدوش عميقة بالأظافر.\n\nمحفور بالتكرار:\n'أنا سلمى أنا سلمى أنا سلمى'\n\nبعدين في مكان واحد بس:\n'مش سلمى.'\n\nوتحتها:\n'اهربي.'",
        descriptionEn:
          "On the inside of the window — deep nail scratches.\n\nCarved repeatedly:\n'I am Salma I am Salma I am Salma'\n\nThen in one single place:\n'Not Salma.'\n\nBelow it:\n'Run.'",
        isClue: true,
        isTool: false,
      },

      item_wall_drawings: {
        id: "item_wall_drawings",
        nameAr: "رسومات الحيط",
        nameEn: "Wall Drawings",
        type: "document",
        icon: "image",
        descriptionAr:
          "رسومات ريا على حيط غرفتها — مرتبة من اليسار لليمين:\n\nرسمة ١: ست واقفة في الغابة البعيدة\nرسمة ٢: الست بتتقرب من الكوخ\nرسمة ٣: الست واقفة في الحديقة\nرسمة ٤: الست واقفة في الباب\nرسمة ٥: الست واقفة في نص الأوضة\n\nريا رسمت نفسها في الركن بتجري.\nوكتبت تحت الرسمة الأخيرة:\n'ماما كانت هنا قبل كده.'",
        descriptionEn:
          "Riya's drawings on her room wall — arranged left to right:\n\nDrawing 1: A woman standing in the distant forest\nDrawing 2: The woman approaching the cabin\nDrawing 3: The woman in the garden\nDrawing 4: The woman in the doorway\nDrawing 5: The woman standing in the middle of the room\n\nRiya drew herself in the corner running.\nBelow the last drawing she wrote:\n'Mama was here before.'",
        isClue: true,
        isTool: false,
      },

      item_music_box: {
        id: "item_music_box",
        nameAr: "علبة الموسيقى",
        nameEn: "Music Box",
        type: "document",
        icon: "music",
        descriptionAr:
          "علبة موسيقى صغيرة بتعزف لحن ريا المفضل.\nفي قاعها ورقة صغيرة:\n\n'ماما بتقول إن اللي في الغابة مش ماما.\nبس أنا كنت بحب ماما.\nوالاتنين موجودين.\n\nأنا مش عارفة أحب مين.'",
        descriptionEn:
          "A small music box playing Riya's favorite tune.\nIn its base a small note:\n\n'Mama says the one in the forest isn't mama.\nBut I used to love mama.\nAnd both exist.\n\nI don't know who to love.'",
        isClue: true,
        isTool: false,
      },

      item_riya_letter: {
        id: "item_riya_letter",
        nameAr: "رسالة ريا",
        nameEn: "Riya's Letter",
        type: "document",
        icon: "letter",
        isFinalClue: true,
        descriptionAr:
          "رسالة لقيتها تحت سرير ريا.\nمكتوبة بخط طفلة:\n\n'لو حد لاقي الجواب ده معناه إن ماما راحت فعلاً.\n\nأبويا قال لي نفس حاجة لقيتها في الكتاب الكبير.\n\nالكتاب بتاعكم.\n\nالقصة دي مكتوبتش عن عيلتنا.\nأبويا كتبها عنكم انتوا.\nعنكم انتوا اللي هتيجوا بعدنا.\n\nهو قال إنكم هتلاقوا الكتاب.\nوإن الكتاب هيجيبكم هنا.\n\nإن الغابة بتختار.\nوانتوا اتاختروا.'",
        descriptionEn:
          "A letter found under Riya's bed.\nWritten in a child's handwriting:\n\n'If anyone found this letter it means mama is truly gone.\n\nDaddy told me the same thing I found in the big book.\n\nYour book.\n\nThis story wasn't written about our family.\nDaddy wrote it about you.\nAbout you who will come after us.\n\nHe said you would find the book.\nAnd the book would bring you here.\n\nThe forest chooses.\nAnd you were chosen.'",
        isClue: true,
        isTool: false,
      },
    },

    // الأدوات الابتدائية
    startingItems: ["flashlight"],

    // الأدوات المتاحة
    tools: {
      flashlight: { id: "flashlight", nameAr: "الكشاف",        nameEn: "Flashlight", icon: "flashlight" },
      uv_light:   { id: "uv_light",   nameAr: "مصباح UV",      nameEn: "UV Light",   icon: "uv"         },
      crowbar:    { id: "crowbar",    nameAr: "عتلة",           nameEn: "Crowbar",    icon: "crowbar"    },
    },

    // الفصل التالي وأداته
    nextChapter: "chapter_library_02",
    nextChapterClueId: "item_old_letter",

    // الكشف النهائي
    revelation: {
      titleAr: "الحقيقة الكاملة",
      titleEn: "The Full Truth",
      textAr:
        "كمال يوسف لم يكن مجرد ساكن — كان عالماً درس تأثير الغابة على الهوية البشرية في مشروع سري اسمه 'التكيف ٩٤'.\n\n" +
        "التجربة نجحت — لكن عليه هو، مش على عيلته.\n" +
        "الغابة غيّرته. حوّلته لكيان تاني.\n\n" +
        "وهو — قبل ما يختفي — كتب القصة كاملة.\n" +
        "وحط الكتاب في مكان هيلاقيه الناس الجدد.\n" +
        "عشان يجوا هنا.\n" +
        "عشان تيجوا انتوا.",
      textEn:
        "Kamal Yousef was not just a resident — he was a scientist studying the forest's effect on human identity in a secret project called 'Adaptation 94'.\n\n" +
        "The experiment worked — but on him, not his family.\n" +
        "The forest changed him. Transformed him into something else.\n\n" +
        "And he — before disappearing — wrote the whole story.\n" +
        "And placed the book where new people would find it.\n" +
        "So they would come here.\n" +
        "So you would come.",
      imageUrl: "chapter1_revelation.jpg",

      // الخيط للفصل التاني
      nextChapterHintAr: "وجدتم عنوان المكتبة المركزية في رسالة د. إبراهيم.\nمشروع التكيف ٩٤ موثق هناك.\nوفي المكتبة — سر تاني بيستنى.",
      nextChapterHintEn: "You found the Central Library address in Dr. Ibrahim's letter.\nAdaptation Project 94 is documented there.\nAnd in the library — another secret waits.",
    },
  },

  chapter_library_02: {
  id: "chapter_library_02",
  titleAr: "المكتبة المركزية",
  titleEn: "The Central Library",
 
  mythAr:
    "يقول الناس إن من يقرأ الكتاب الأحمر في المكتبة المركزية\n" +
    "يرى من مات بين رفوفها.\n\n" +
    "ثلاثة أمناء مكتبة اختفوا في خمسين عاماً.\n" +
    "كل واحد قبل الآخر بثماني عشرة سنة بالضبط.\n\n" +
    "المكتبة لم تُغلق يوماً.\n" +
    "الكتب لم تتوقف عن الحركة.",
 
  mythEn:
    "They say whoever reads the Red Book in the Central Library\n" +
    "sees those who died between its shelves.\n\n" +
    "Three librarians disappeared over fifty years.\n" +
    "Each exactly eighteen years after the last.\n\n" +
    "The library never closed.\n" +
    "The books never stopped moving.",
 
  // ── Leonardo AI Prompts ──
  imagePrompts: {
    library_entrance:
      "Abandoned grand library entrance at night, tall wooden doors, stone steps, ivy covered walls, single dim lamp, foggy atmosphere, gothic architecture, photorealistic 360° equirectangular, horror mystery, 8k, no people",
    main_hall:
      "Abandoned library main hall, towering bookshelves reaching ceiling, scattered books on floor, dust in moonlight rays, old wooden reading tables, papers everywhere, eerie atmosphere, photorealistic 360° equirectangular, mystery horror, 8k, no people",
    card_catalog_room:
      "Old library card catalog room, hundreds of small wooden drawers, some open with cards spilling out, single candle light, shadows, mysterious atmosphere, photorealistic 360° equirectangular, 8k, no people",
    archive_room:
      "Dark library archive room, metal shelving with old boxes, document folders, newspaper rolls, locked cabinets, single overhead light flickering, mystery atmosphere, photorealistic 360° equirectangular, 8k, no people",
    reading_room:
      "Abandoned library reading room, individual study booths, some with open books and glasses left behind, clock on wall stopped, dusty atmosphere, moonlight, photorealistic 360° equirectangular, mystery, 8k, no people",
    librarian_office:
      "Old abandoned librarian office, large mahogany desk, papers and files scattered, old telephone, framed photos on wall, half-written notes, mysterious and eerie, photorealistic 360° equirectangular, 8k, no people",
    restricted_section:
      "Forbidden library section behind iron gate, red warning sign, special rare books behind glass, sealed boxes, very dark with minimal light, ominous atmosphere, photorealistic 360° equirectangular, 8k, no people",
    basement:
      "Dark library basement, old printing press, storage boxes, file cabinets, exposed pipes, single swinging light bulb, very ominous and dark, photorealistic 360° equirectangular, horror, 8k, no people",
    secret_room:
      "Hidden secret room behind library bookshelf, walls covered in papers and photographs connected by red string, research board, single desk lamp, classified files, conspiracy atmosphere, photorealistic 360° equirectangular, 8k, no people",
  },
 
  // ══════════════════════════════════════════════════════════════
  // خريطة العُقد
  // ══════════════════════════════════════════════════════════════
  nodes: {
 
    // ── المدخل ──
    library_entrance: {
      id: "library_entrance",
      nameAr: "مدخل المكتبة",
      nameEn: "Library Entrance",
      image: "library_entrance.jpg",
      ambientSound: "night_wind.mp3",
      infrasound: false,
      connections: ["main_hall"],
      requiredItems: [],
      hotspots: [
        { id: "hs_main_door",   x:50, y:48, type:"navigate", target:"main_hall",         icon:"arrow",   labelAr:"الباب الرئيسي",  labelEn:"Main Door"      },
        { id: "hs_notice_board",x:20, y:55, type:"inspect",  itemId:"item_notice_board",  icon:"inspect", labelAr:"لوحة الإعلانات", labelEn:"Notice Board"   },
        { id: "hs_hours_sign",  x:80, y:60, type:"inspect",  itemId:"item_hours_sign",    icon:"inspect", labelAr:"ساعات العمل",    labelEn:"Opening Hours"  },
      ],
      puzzle: null,
    },
 
    // ── القاعة الرئيسية ──
    main_hall: {
      id: "main_hall",
      nameAr: "القاعة الرئيسية",
      nameEn: "Main Hall",
      image: "main_hall.jpg",
      ambientSound: "library_ambience.mp3",
      infrasound: true,
      connections: ["library_entrance", "card_catalog_room", "reading_room", "librarian_office"],
      requiredItems: [],
      hotspots: [
        { id: "hs_catalog",     x:25, y:55, type:"navigate", target:"card_catalog_room", icon:"arrow",   labelAr:"فهرس البطاقات", labelEn:"Card Catalog"   },
        { id: "hs_reading",     x:70, y:50, type:"navigate", target:"reading_room",      icon:"arrow",   labelAr:"قاعة القراءة",   labelEn:"Reading Room"   },
        { id: "hs_office",      x:50, y:30, type:"navigate", target:"librarian_office",  icon:"arrow",   labelAr:"مكتب الأمين",    labelEn:"Librarian's Office"},
        { id: "hs_fallen_book", x:40, y:75, type:"inspect",  itemId:"item_fallen_book",  icon:"inspect", labelAr:"كتاب ساقط",     labelEn:"Fallen Book"    },
        { id: "hs_main_clock",  x:85, y:35, type:"inspect",  itemId:"item_stopped_clock",icon:"inspect", labelAr:"الساعة الكبيرة", labelEn:"Main Clock"     },
      ],
      puzzle: null,
    },
 
    // ── غرفة الفهرس ──
    card_catalog_room: {
      id: "card_catalog_room",
      nameAr: "غرفة فهرس البطاقات",
      nameEn: "Card Catalog Room",
      image: "card_catalog_room.jpg",
      ambientSound: "paper_rustle.mp3",
      infrasound: false,
      connections: ["main_hall", "archive_room"],
      requiredItems: [],
      hotspots: [
        { id: "hs_catalog_a",   x:25, y:55, type:"inspect",  itemId:"item_catalog_drawer_a", icon:"inspect", labelAr:"درج A-F",    labelEn:"Drawer A-F"      },
        { id: "hs_catalog_m",   x:50, y:55, type:"inspect",  itemId:"item_catalog_drawer_m", icon:"inspect", labelAr:"درج M-R",    labelEn:"Drawer M-R"      },
        { id: "hs_catalog_s",   x:75, y:55, type:"inspect",  itemId:"item_catalog_drawer_s", icon:"inspect", labelAr:"درج S-Z",    labelEn:"Drawer S-Z"      },
        { id: "hs_catalog_note",x:50, y:30, type:"inspect",  itemId:"item_catalog_torn_note",icon:"uv",      labelAr:"ورقة ملصقة",labelEn:"Stuck Note", requiresTool:"uv_light"},
        { id: "hs_to_archive",  x:85, y:50, type:"navigate", target:"archive_room",          icon:"door",   labelAr:"الأرشيف",    labelEn:"Archive"         },
        { id: "hs_catalog_puzzle",x:50,y:70,type:"puzzle",   puzzleId:"catalog_cipher",      icon:"interact",labelAr:"الفهرس السري",labelEn:"Secret Index"   },
      ],
      puzzle: {
        id: "catalog_cipher",
        type: "number_pad",
        titleAr: "رمز الفهرس السري",
        titleEn: "Secret Catalog Code",
        descriptionAr:
          "درج واحد في الفهرس مقفول.\n" +
          "أرقام الاستدعاء للكتب الأربعة المميزة بنجمة\n" +
          "بتكوّن الكود لما تجمعها بالترتيب.",
        descriptionEn:
          "One catalog drawer is locked.\n" +
          "The call numbers of the four star-marked books\n" +
          "form the code when combined in order.",
        code: "7291",
        hintAr: "كتاب الذاكرة=٧، السلوك=٢، الهوية=٩، الغابة=١",
        hintEn: "Memory=7, Behavior=2, Identity=9, Forest=1",
        unlocksNode: null,
        rewardItemId: "item_locked_drawer_contents",
      },
    },
 
    // ── الأرشيف ──
    archive_room: {
      id: "archive_room",
      nameAr: "غرفة الأرشيف",
      nameEn: "Archive Room",
      image: "archive_room.jpg",
      ambientSound: "deep_silence.mp3",
      infrasound: true,
      connections: ["card_catalog_room", "restricted_section"],
      requiredItems: [],
      hotspots: [
        { id: "hs_newspaper_box",  x:30, y:60, type:"inspect", itemId:"item_newspaper_box",   icon:"inspect", labelAr:"صناديق الجرائد",    labelEn:"Newspaper Boxes"   },
        { id: "hs_file_cabinet",   x:60, y:55, type:"inspect", itemId:"item_file_cabinet",    icon:"inspect", labelAr:"خزانة الملفات",     labelEn:"File Cabinet"      },
        { id: "hs_reel_player",    x:50, y:40, type:"puzzle",  puzzleId:"reel_puzzle",        icon:"interact",labelAr:"مشغل البكرة",       labelEn:"Reel Player"       },
        { id: "hs_archive_log",    x:80, y:65, type:"inspect", itemId:"item_archive_log",     icon:"inspect", labelAr:"سجل الإعارة",       labelEn:"Loan Register"     },
        { id: "hs_restricted_door",x:50, y:25, type:"navigate",target:"restricted_section",   icon:"door",    labelAr:"القسم المقيّد",     labelEn:"Restricted Section",
          requiresTool: null },
      ],
      puzzle: {
        id: "reel_puzzle",
        type: "sequence_audio",
        titleAr: "تسجيل البكرة",
        titleEn: "Reel Recording",
        descriptionAr:
          "تسجيل قديم لأمينة المكتبة الثانية — ١٩٧٢.\n" +
          "في التسجيل بتذكر خمسة أرقام بترتيب غريب.\n" +
          "رتّب الأرقام حسب ما سمعتها بالضبط.",
        descriptionEn:
          "An old recording by the second librarian — 1972.\n" +
          "She mentions five numbers in a strange order.\n" +
          "Arrange them exactly as heard.",
        sequence: [3, 1, 4, 1, 5],
        rewardItemId: "item_reel_transcript",
        hintAr: "الأرقام مش تصاعدية — استمع مرتين",
        hintEn: "Numbers are not sequential — listen twice",
      },
    },
 
    // ── القسم المقيّد ──
    restricted_section: {
      id: "restricted_section",
      nameAr: "القسم المقيّد",
      nameEn: "Restricted Section",
      image: "restricted_section.jpg",
      ambientSound: "restricted_hum.mp3",
      infrasound: true,
      connections: ["archive_room", "basement"],
      requiredItems: ["item_archive_key"],
      hotspots: [
        { id: "hs_red_book",     x:40, y:45, type:"inspect",  itemId:"item_red_book",      icon:"inspect", labelAr:"الكتاب الأحمر",     labelEn:"The Red Book"      },
        { id: "hs_sealed_box",   x:65, y:60, type:"inspect",  itemId:"item_sealed_box",    icon:"crowbar", labelAr:"صندوق مختوم",       labelEn:"Sealed Box",         requiresTool:"crowbar"},
        { id: "hs_photo_frame",  x:25, y:40, type:"inspect",  itemId:"item_three_librarians",icon:"inspect",labelAr:"إطار صورة",        labelEn:"Photo Frame"       },
        { id: "hs_uv_wall",      x:80, y:50, type:"inspect",  itemId:"item_uv_inscription",icon:"uv",      labelAr:"الحائط",            labelEn:"The Wall",           requiresTool:"uv_light"},
        { id: "hs_basement_door",x:50, y:75, type:"puzzle",   puzzleId:"basement_lock",    icon:"lock",    labelAr:"باب البدروم",       labelEn:"Basement Door"     },
      ],
      puzzle: {
        id: "basement_lock",
        type: "symbol_combination",
        titleAr: "قفل البدروم",
        titleEn: "Basement Lock",
        descriptionAr:
          "القفل عليه أربعة رموز.\n" +
          "كل أمين مكتبة خبّى رمزاً في مكان مختلف.\n" +
          "الترتيب الصح هو تسلسل اختفائهم.",
        descriptionEn:
          "The lock has four symbols.\n" +
          "Each librarian hid one symbol in a different place.\n" +
          "The correct order follows their disappearance sequence.",
        symbols: ["📚", "🔑", "👁️", "⌛"],
        correctSequence: [1, 2, 0, 3],
        hintAr: "الأول رحل بالمفتاح، الثاني بالعين، الثالث بالكتاب، الأخير بالوقت",
        hintEn: "First left with key, second with eye, third with book, last with time",
        unlocksNode: "basement",
      },
    },
 
    // ── قاعة القراءة ──
    reading_room: {
      id: "reading_room",
      nameAr: "قاعة القراءة",
      nameEn: "Reading Room",
      image: "reading_room.jpg",
      ambientSound: "reading_silence.mp3",
      infrasound: false,
      connections: ["main_hall"],
      requiredItems: [],
      hotspots: [
        { id: "hs_open_book",    x:45, y:65, type:"inspect",  itemId:"item_open_book",     icon:"inspect", labelAr:"كتاب مفتوح",        labelEn:"Open Book"         },
        { id: "hs_reading_notes",x:70, y:60, type:"inspect",  itemId:"item_reading_notes", icon:"inspect", labelAr:"ملاحظات على الطاولة",labelEn:"Table Notes"       },
        { id: "hs_bookmark",     x:30, y:55, type:"inspect",  itemId:"item_strange_bookmark",icon:"inspect",labelAr:"علامة كتاب غريبة",  labelEn:"Strange Bookmark"  },
        { id: "hs_mirror",       x:85, y:40, type:"puzzle",   puzzleId:"mirror_riddle",    icon:"interact",labelAr:"المرآة",             labelEn:"The Mirror"        },
      ],
      puzzle: {
        id: "mirror_riddle",
        type: "mirror_angle",
        titleAr: "لغز المرآة",
        titleEn: "Mirror Riddle",
        descriptionAr:
          "على المرآة خدش بالعكس.\n" +
          "وجّهها بالزاوية الصح تقرأ الرسالة.",
        descriptionEn:
          "There's a backwards scratch on the mirror.\n" +
          "Angle it correctly to read the message.",
        correctAngle: 45,
        tolerance: 8,
        revealedMessage: "١٩٥٤ — ١٩٧٢ — ١٩٩٠ — ٢٠٠٨",
        revealedMessageEn: "1954 — 1972 — 1990 — 2008",
        hintAr: "الأرقام دي سنين — مش مصادفة",
        hintEn: "These are years — not a coincidence",
        rewardItemId: "item_mirror_dates",
      },
    },
 
    // ── مكتب الأمين ──
    librarian_office: {
      id: "librarian_office",
      nameAr: "مكتب أمين المكتبة",
      nameEn: "Librarian's Office",
      image: "librarian_office.jpg",
      ambientSound: "office_creak.mp3",
      infrasound: false,
      connections: ["main_hall", "secret_room"],
      requiredItems: [],
      hotspots: [
        { id: "hs_desk_diary",   x:50, y:60, type:"inspect",  itemId:"item_third_librarian_diary", icon:"inspect", labelAr:"يوميات على المكتب",  labelEn:"Desk Diary"        },
        { id: "hs_phone",        x:25, y:55, type:"inspect",  itemId:"item_phone_note",   icon:"inspect", labelAr:"التليفون",           labelEn:"The Phone"         },
        { id: "hs_photo_wall",   x:75, y:40, type:"inspect",  itemId:"item_office_photos",icon:"inspect", labelAr:"صور الحائط",         labelEn:"Wall Photos"       },
        { id: "hs_drawer_uv",    x:35, y:70, type:"inspect",  itemId:"item_uv_schedule",  icon:"uv",      labelAr:"درج المكتب",         labelEn:"Desk Drawer",        requiresTool:"uv_light"},
        { id: "hs_bookshelf_secret",x:85,y:50,type:"puzzle",  puzzleId:"bookshelf_sequence",icon:"interact",labelAr:"رف الكتب",         labelEn:"Bookshelf"         },
      ],
      puzzle: {
        id: "bookshelf_sequence",
        type: "book_sequence",
        titleAr: "ترتيب الكتب السري",
        titleEn: "Secret Book Sequence",
        descriptionAr:
          "الأمين الثالث كتب في يومياته:\n" +
          "'الحقيقة في الكتب الثلاثة المرتبة خطأ.\n" +
          "رتّبها حسب تاريخ الشراء لا العنوان.'\n\n" +
          "تواريخ الشراء في باطن الغلاف.",
        descriptionEn:
          "The third librarian wrote in their diary:\n" +
          "'The truth is in the three wrongly arranged books.\n" +
          "Order them by purchase date, not title.'\n\n" +
          "Purchase dates are inside the covers.",
        books: [
          { id: "b1", titleAr: "علم النفس السلوكي — ١٩٦٨",  titleEn: "Behavioral Psychology — 1968",  correct:true,  order:1 },
          { id: "b2", titleAr: "الذاكرة والهوية — ١٩٧١",    titleEn: "Memory & Identity — 1971",      correct:true,  order:2 },
          { id: "b3", titleAr: "تجارب الوعي — ١٩٧٩",        titleEn: "Consciousness Experiments — 1979",correct:false         },
          { id: "b4", titleAr: "الإنسان والطبيعة — ١٩٨٨",   titleEn: "Man & Nature — 1988",           correct:true,  order:3 },
          { id: "b5", titleAr: "الفلسفة الحديثة — ١٩٦٢",    titleEn: "Modern Philosophy — 1962",      correct:false         },
        ],
        rewardItemId: "item_secret_compartment_key",
        hintAr: "الكتب الصح بتتكلم عن الدراسات النفسية — رتّبها من الأقدم للأحدث",
        hintEn: "The right books are about psychological studies — order oldest to newest",
      },
    },
 
    // ── الغرفة السرية ──
    secret_room: {
      id: "secret_room",
      nameAr: "الغرفة السرية",
      nameEn: "The Secret Room",
      image: "secret_room.jpg",
      ambientSound: "secret_room_ambience.mp3",
      infrasound: true,
      connections: ["librarian_office"],
      requiredItems: ["item_secret_compartment_key"],
      hotspots: [
        { id: "hs_research_board",x:50, y:45, type:"inspect", itemId:"item_research_board", icon:"inspect", labelAr:"لوحة الأبحاث",      labelEn:"Research Board"    },
        { id: "hs_jame_file",     x:25, y:60, type:"inspect", itemId:"item_jame_file",       icon:"inspect", labelAr:"ملف الجامع",         labelEn:"The Jame' File"    },
        { id: "hs_photo_evidence",x:75, y:55, type:"inspect", itemId:"item_photo_1985",      icon:"inspect", labelAr:"صورة ١٩٨٥",          labelEn:"Photo 1985"        },
        { id: "hs_timeline",      x:50, y:75, type:"puzzle",  puzzleId:"timeline_puzzle",    icon:"interact",labelAr:"لوحة الأحداث",      labelEn:"Timeline Board"    },
      ],
      puzzle: {
        id: "timeline_puzzle",
        type: "book_sequence",
        titleAr: "ترتيب الأحداث",
        titleEn: "Events Timeline",
        descriptionAr:
          "على اللوحة ست بطاقات لأحداث.\n" +
          "رتّبها بالترتيب الزمني الصح.\n\n" +
          "التواريخ موزعة على أدلة مختلفة —\n" +
          "محتاج تجمعها كلها عشان تعرف الترتيب.",
        descriptionEn:
          "The board has six event cards.\n" +
          "Arrange them in correct chronological order.\n\n" +
          "Dates are spread across different clues —\n" +
          "you need all of them to know the order.",
        books: [
          { id: "e1", titleAr: "تأسيس المكتبة — ١٩٤٨",           titleEn: "Library Founded — 1948",              correct:true, order:1 },
          { id: "e2", titleAr: "اختفاء الأمين الأول — ١٩٥٤",      titleEn: "First Librarian Disappears — 1954",   correct:true, order:2 },
          { id: "e3", titleAr: "فتح الأرشيف السري — ١٩٦٨",        titleEn: "Secret Archive Opened — 1968",        correct:true, order:3 },
          { id: "e4", titleAr: "اختفاء الأمينة الثانية — ١٩٧٢",   titleEn: "Second Librarian Disappears — 1972",  correct:true, order:4 },
          { id: "e5", titleAr: "زيارة الجامع الموثقة — ١٩٨٥",     titleEn: "Documented Jame' Visit — 1985",       correct:true, order:5 },
          { id: "e6", titleAr: "اختفاء الأمين الثالث — ١٩٩٠",     titleEn: "Third Librarian Disappears — 1990",   correct:true, order:6 },
        ],
        rewardItemId: "item_timeline_complete",
        hintAr: "التواريخ في المرآة + يوميات الأمين + سجل الإعارة + لوحة الأبحاث",
        hintEn: "Dates from mirror + librarian diary + loan register + research board",
      },
    },
 
    // ── البدروم ──
    basement: {
      id: "basement",
      nameAr: "البدروم",
      nameEn: "The Basement",
      image: "basement.jpg",
      ambientSound: "basement_drip.mp3",
      infrasound: true,
      connections: ["restricted_section"],
      requiredItems: [],
      hotspots: [
        { id: "hs_printing_press",x:40, y:60, type:"inspect", itemId:"item_printing_press",  icon:"inspect", labelAr:"ماكينة الطباعة",    labelEn:"Printing Press"    },
        { id: "hs_buried_box",    x:65, y:75, type:"inspect", itemId:"item_buried_manuscript",icon:"crowbar", labelAr:"صندوق تحت الأرض",  labelEn:"Buried Box",         requiresTool:"crowbar"},
        { id: "hs_jame_message",  x:50, y:35, type:"inspect", itemId:"item_final_message",   icon:"inspect", labelAr:"رسالة على الحائط",  labelEn:"Wall Message",       isFinalClue:true},
      ],
      puzzle: null,
    },
  },
 
  // ══════════════════════════════════════════════════════════════
  // الأغراض
  // ══════════════════════════════════════════════════════════════
  items: {
 
    item_notice_board: {
      id: "item_notice_board",
      nameAr: "لوحة الإعلانات",
      nameEn: "Notice Board",
      type: "document", icon: "document",
      descriptionAr:
        "لوحة إعلانات قديمة.\n" +
        "معظم الإعلانات ممزقة أو باهتة.\n\n" +
        "إعلان واحد واضح:\n" +
        "'تنبيه للعاملين: الدرج رقم ٧ في فهرس M-R\n" +
        "مخصص للوثائق الإدارية فقط.\n" +
        "لا يُفتح إلا بموافقة رسمية.'\n\n" +
        "تحت الإعلان بخط يد:\n" +
        "'الدرج ٧ فيه ما لا يجب أن يُرى.'",
      descriptionEn:
        "An old notice board.\n" +
        "Most notices are torn or faded.\n\n" +
        "One notice is clear:\n" +
        "'Staff Notice: Drawer 7 in catalog M-R\n" +
        "is for administrative documents only.\n" +
        "Do not open without official approval.'\n\n" +
        "Below in handwriting:\n" +
        "'Drawer 7 contains what must not be seen.'",
      isClue: true, isTool: false,
    },
 
    item_hours_sign: {
      id: "item_hours_sign",
      nameAr: "لافتة ساعات العمل",
      nameEn: "Hours Sign",
      type: "clue", icon: "clue",
      descriptionAr:
        "لافتة ساعات عمل المكتبة.\n" +
        "أوقات عادية — ٨ صباحاً لـ ٨ مساءً.\n\n" +
        "بس في ساعة إضافية مكتوبة بخط صغير:\n" +
        "'القسم المقيّد: ١٢ ليلاً فقط\n" +
        "بموافقة المؤسسة.'\n\n" +
        "المؤسسة — أي مؤسسة؟",
      descriptionEn:
        "Library opening hours sign.\n" +
        "Normal hours — 8am to 8pm.\n\n" +
        "But there's an extra line in small print:\n" +
        "'Restricted Section: Midnight only\n" +
        "with Foundation approval.'\n\n" +
        "The Foundation — which foundation?",
      isClue: true, isTool: false,
    },
 
    item_fallen_book: {
      id: "item_fallen_book",
      nameAr: "الكتاب الساقط",
      nameEn: "Fallen Book",
      type: "document", icon: "book",
      descriptionAr:
        "كتاب ساقط مفتوح على صفحة محددة.\n\n" +
        "عنوان الكتاب: 'علم النفس السلوكي'\n" +
        "رقم الاستدعاء: BF-٧٢١\n\n" +
        "الصفحة المفتوحة تتكلم عن\n" +
        "'تجارب تغيير الهوية القسري.'\n\n" +
        "في هامش الصفحة بالقلم الرصاص:\n" +
        "'مشروع التكيف ٩٤ — نجح هنا أيضاً.'",
      descriptionEn:
        "A book fallen open to a specific page.\n\n" +
        "Title: 'Behavioral Psychology'\n" +
        "Call number: BF-721\n\n" +
        "The open page discusses\n" +
        "'forced identity change experiments.'\n\n" +
        "In pencil in the margin:\n" +
        "'Adaptation Project 94 — succeeded here too.'",
      isClue: true, isTool: false,
    },
 
    item_stopped_clock: {
      id: "item_stopped_clock",
      nameAr: "الساعة المتوقفة",
      nameEn: "Stopped Clock",
      type: "clue", icon: "clue",
      descriptionAr:
        "ساعة حائط كبيرة متوقفة على:\n\n" +
        "٣:١٧ صباحاً\n\n" +
        "في كل حادثة اختفاء في المكتبة\n" +
        "كان الموظفون يبلغون عن سماع صوت الساعة\n" +
        "تدق ثلاث مرات قبل الفجر مباشرة.\n\n" +
        "الساعة متوقفة منذ ١٩٩٠.",
      descriptionEn:
        "A large wall clock stopped at:\n\n" +
        "3:17 AM\n\n" +
        "In every disappearance incident at the library\n" +
        "staff reported hearing the clock\n" +
        "strike three times just before dawn.\n\n" +
        "Clock stopped in 1990.",
      isClue: true, isTool: false,
    },
 
    item_catalog_drawer_a: {
      id: "item_catalog_drawer_a",
      nameAr: "بطاقات الفهرس A-F",
      nameEn: "Catalog Cards A-F",
      type: "document", icon: "document",
      descriptionAr:
        "مئات البطاقات — معظمها عادية.\n\n" +
        "بطاقة واحدة مميزة بنجمة حمراء:\n" +
        "عنوان: 'الذاكرة والمكان'\n" +
        "رقم الاستدعاء: BF-٧\n" +
        "ملاحظة: '⭐ انظر الجانب'\n\n" +
        "الجانب الآخر للبطاقة:\n" +
        "'الرقم الأول: ٧'",
      descriptionEn:
        "Hundreds of cards — most normal.\n\n" +
        "One card marked with a red star:\n" +
        "Title: 'Memory & Place'\n" +
        "Call number: BF-7\n" +
        "Note: '⭐ See reverse'\n\n" +
        "The reverse side:\n" +
        "'First number: 7'",
      isClue: true, isTool: false,
    },
 
    item_catalog_drawer_m: {
      id: "item_catalog_drawer_m",
      nameAr: "بطاقات الفهرس M-R",
      nameEn: "Catalog Cards M-R",
      type: "document", icon: "document",
      descriptionAr:
        "الدرج رقم ٧ المذكور في الإعلان.\n\n" +
        "فيه بطاقتان مميزتان بنجمة:\n\n" +
        "بطاقة ١: 'السلوك الإنساني'\n" +
        "الجانب الآخر: 'الرقم الثاني: ٢'\n\n" +
        "بطاقة ٢: 'الهوية والذات'\n" +
        "الجانب الآخر: 'الرقم الثالث: ٩'",
      descriptionEn:
        "Drawer 7 mentioned in the notice.\n\n" +
        "Contains two star-marked cards:\n\n" +
        "Card 1: 'Human Behavior'\n" +
        "Reverse: 'Second number: 2'\n\n" +
        "Card 2: 'Identity & Self'\n" +
        "Reverse: 'Third number: 9'",
      isClue: true, isTool: false,
    },
 
    item_catalog_drawer_s: {
      id: "item_catalog_drawer_s",
      nameAr: "بطاقات الفهرس S-Z",
      nameEn: "Catalog Cards S-Z",
      type: "document", icon: "document",
      descriptionAr:
        "درج S-Z — فيه بطاقة مميزة بنجمة:\n\n" +
        "عنوان: 'الغابة والعقل'\n" +
        "رقم الاستدعاء: SF-١\n" +
        "الجانب الآخر:\n" +
        "'الرقم الرابع والأخير: ١'\n\n" +
        "ملاحظة تحتها:\n" +
        "'الأرقام الأربعة بالترتيب\n" +
        "تفتح الدرج المقفول.'",
      descriptionEn:
        "Drawer S-Z — has one star-marked card:\n\n" +
        "Title: 'Forest & Mind'\n" +
        "Call number: SF-1\n" +
        "Reverse:\n" +
        "'The fourth and final number: 1'\n\n" +
        "Note below:\n" +
        "'The four numbers in order\n" +
        "open the locked drawer.'",
      isClue: true, isTool: false,
    },
 
    item_catalog_torn_note: {
      id: "item_catalog_torn_note",
      nameAr: "ورقة بالحبر السري",
      nameEn: "Invisible Ink Note",
      type: "clue", icon: "clue",
      descriptionAr:
        "بالضوء فوق البنفسجي تظهر كتابة:\n\n" +
        "'الأرقام بالترتيب هي كود الدرج المقفول.\n" +
        "الكود يتغير كل عام.\n" +
        "الكود الحالي مكوّن من أرقام الاستدعاء\n" +
        "للكتب المميزة بنجمة حمراء فقط.\n\n" +
        "— الأمين الثاني'",
      descriptionEn:
        "Under UV light writing appears:\n\n" +
        "'The numbers in order are the code for the locked drawer.\n" +
        "The code changes every year.\n" +
        "Current code formed from call numbers\n" +
        "of red star-marked books only.\n\n" +
        "— Second Librarian'",
      isClue: true, isTool: false,
      requiresTool: "uv_light",
    },
 
    item_locked_drawer_contents: {
      id: "item_locked_drawer_contents",
      nameAr: "محتويات الدرج المقفول",
      nameEn: "Locked Drawer Contents",
      type: "evidence", icon: "folder",
      descriptionAr:
        "الدرج المقفول يحتوي على:\n\n" +
        "١. مفتاح صغير عليه كلمة 'أرشيف'\n" +
        "٢. ورقة بثلاثة أسماء:\n" +
        "   - نادية حسن — ١٩٥٤\n" +
        "   - سامية رشيد — ١٩٧٢\n" +
        "   - حسام الدين — ١٩٩٠\n\n" +
        "٣. صورة فوتوغرافية قديمة\n" +
        "   الثلاثة مع بعض — كلهم بيبتسموا.\n" +
        "   على الظهر: 'قبل أن يعرفوا.'",
      descriptionEn:
        "The locked drawer contains:\n\n" +
        "1. A small key labeled 'Archive'\n" +
        "2. A paper with three names:\n" +
        "   - Nadia Hassan — 1954\n" +
        "   - Samia Rashid — 1972\n" +
        "   - Hossam el-Din — 1990\n\n" +
        "3. An old photograph\n" +
        "   All three together — all smiling.\n" +
        "   On the back: 'Before they knew.'",
      isClue: true, isTool: false,
    },
 
    item_archive_key: {
      id: "item_archive_key",
      nameAr: "مفتاح الأرشيف",
      nameEn: "Archive Key",
      type: "tool", icon: "key",
      descriptionAr: "مفتاح صغير عليه كلمة 'أرشيف'. يفتح القسم المقيّد.",
      descriptionEn: "A small key labeled 'Archive'. Opens the restricted section.",
      isClue: false, isTool: true,
    },
 
    item_newspaper_box: {
      id: "item_newspaper_box",
      nameAr: "صناديق الجرائد القديمة",
      nameEn: "Old Newspaper Boxes",
      type: "document", icon: "document",
      descriptionAr:
        "صناديق جرائد مرتبة بالسنة.\n\n" +
        "في ٣ صناديق مختلفة — ٣ مقالات:\n\n" +
        "📰 ١٩٥٤: 'اختفاء أمينة مكتبة بظروف غامضة'\n" +
        "آخر من رآها ذكر أنها كانت تحمل ملفاً.\n\n" +
        "📰 ١٩٧٢: 'اختفاء ثاني لموظفة في نفس المكتبة'\n" +
        "التحقيق أُغلق دون نتيجة.\n\n" +
        "📰 ١٩٩٠: 'تكرار مثير للقلق — ثالث اختفاء'\n" +
        "المقال مقطوع من هنا.\n\n" +
        "الفترة بين كل اختفاء: ١٨ سنة بالضبط.",
      descriptionEn:
        "Newspaper boxes sorted by year.\n\n" +
        "In 3 different boxes — 3 articles:\n\n" +
        "📰 1954: 'Library Librarian Disappears in Mysterious Circumstances'\n" +
        "Last person to see her noted she carried a file.\n\n" +
        "📰 1972: 'Second Disappearance at Same Library'\n" +
        "Investigation closed without results.\n\n" +
        "📰 1990: 'Worrying Pattern — Third Disappearance'\n" +
        "Article cut off here.\n\n" +
        "Gap between each disappearance: exactly 18 years.",
      isClue: true, isTool: false,
    },
 
    item_file_cabinet: {
      id: "item_file_cabinet",
      nameAr: "خزانة الملفات",
      nameEn: "File Cabinet",
      type: "document", icon: "folder",
      descriptionAr:
        "خزانة ملفات — معظمها فارغة.\n\n" +
        "ملف واحد متبقي: 'تقرير سري — ١٩٨٥'\n\n" +
        "المحتوى:\n" +
        "'زيارة غير رسمية من شخص\n" +
        "عرّف نفسه بـ الجامع.\n" +
        "طلب الاطلاع على أرشيف الحوادث.\n" +
        "لم يقدم هوية.\n" +
        "أمضى ٦ ساعات في القسم المقيّد.\n\n" +
        "الغريب: لا يوجد له سجل في دفتر الزوار.\n" +
        "وكاميرا الأمن في ذلك اليوم كانت معطلة.'",
      descriptionEn:
        "File cabinet — mostly empty.\n\n" +
        "One remaining file: 'Confidential Report — 1985'\n\n" +
        "Content:\n" +
        "'Unofficial visit from a person\n" +
        "who identified himself as The Collector.\n" +
        "Requested access to the incident archive.\n" +
        "Provided no identification.\n" +
        "Spent 6 hours in the restricted section.\n\n" +
        "Strangely: no record in the visitors' book.\n" +
        "And the security camera that day was broken.'",
      isClue: true, isTool: false,
    },
 
    item_archive_log: {
      id: "item_archive_log",
      nameAr: "سجل الإعارة",
      nameEn: "Loan Register",
      type: "document", icon: "document",
      descriptionAr:
        "سجل الإعارة من ١٩٤٨ لـ ١٩٩٢.\n\n" +
        "في صفحة ١٩٧١ — إعارة غريبة:\n" +
        "الكتاب: 'مخطوطة الأماكن المنسية'\n" +
        "المستعير: الجامع\n" +
        "تاريخ الإعارة: ٣ مارس ١٩٧١\n" +
        "تاريخ الإرجاع: لم يُرجَع\n\n" +
        "ملاحظة بالهامش:\n" +
        "'المخطوطة الأصلية كانت هنا.\n" +
        "الكتاب الذي بين يديكم الآن\n" +
        "هو نسخة من تلك المخطوطة.'",
      descriptionEn:
        "Loan register from 1948 to 1992.\n\n" +
        "On page 1971 — a strange loan:\n" +
        "Book: 'Manuscript of Forgotten Places'\n" +
        "Borrower: The Collector\n" +
        "Loan date: March 3, 1971\n" +
        "Return date: Never returned\n\n" +
        "Margin note:\n" +
        "'The original manuscript was here.\n" +
        "The book in your hands now\n" +
        "is a copy of that manuscript.'",
      isClue: true, isTool: false,
    },
 
    item_reel_transcript: {
      id: "item_reel_transcript",
      nameAr: "نص تسجيل البكرة",
      nameEn: "Reel Recording Transcript",
      type: "document", icon: "document",
      descriptionAr:
        "تسجيل صوتي لسامية رشيد — الأمينة الثانية — ١٩٧٢:\n\n" +
        "'أنا سامية رشيد. اليوم ١٢ يناير ١٩٧٢.\n" +
        "إذا سمع أحد هذا التسجيل\n" +
        "يعني أني اختفيت مثل نادية.\n\n" +
        "الكتاب ليس كتاباً عادياً.\n" +
        "هو أداة. أداة لجمع الأدلة.\n\n" +
        "الجامع لا يكتب الخرافات —\n" +
        "هو يوثق الحقائق التي يخفيها الآخرون.\n\n" +
        "الأرقام: ٣ ، ١ ، ٤ ، ١ ، ٥\n" +
        "ليست عشوائية.\n" +
        "هي إحداثيات. أعرف أين.'",
      descriptionEn:
        "Audio recording by Samia Rashid — second librarian — 1972:\n\n" +
        "'I am Samia Rashid. Today is January 12, 1972.\n" +
        "If anyone hears this recording\n" +
        "it means I've disappeared like Nadia.\n\n" +
        "The book is not an ordinary book.\n" +
        "It is a tool. A tool for gathering evidence.\n\n" +
        "The Collector doesn't write myths —\n" +
        "he documents truths that others hide.\n\n" +
        "The numbers: 3, 1, 4, 1, 5\n" +
        "are not random.\n" +
        "They are coordinates. I know where.'",
      isClue: true, isTool: false,
    },
 
    item_red_book: {
      id: "item_red_book",
      nameAr: "الكتاب الأحمر",
      nameEn: "The Red Book",
      type: "evidence", icon: "book",
      descriptionAr:
        "الكتاب الأحمر المذكور في الخرافة.\n\n" +
        "غلافه جلد أحمر داكن.\n" +
        "صفحاته فارغة تماماً — كلها بيضاء.\n\n" +
        "إلا صفحة واحدة في المنتصف:\n" +
        "رسم لخريطة.\n" +
        "عليها خمس نقاط محددة.\n" +
        "النقطة الأولى: كوخ الغابة.\n" +
        "النقطة الثانية: المكتبة المركزية.\n" +
        "النقاط الثلاثة الأخرى: غير مسماة.\n\n" +
        "تحت الخريطة:\n" +
        "'من يجمع الخمسة يعرف الحقيقة.'",
      descriptionEn:
        "The Red Book mentioned in the myth.\n\n" +
        "Its cover is dark red leather.\n" +
        "Its pages are completely empty — all white.\n\n" +
        "Except one page in the middle:\n" +
        "A map drawing.\n" +
        "With five marked points.\n" +
        "First point: The Forest Cabin.\n" +
        "Second point: The Central Library.\n" +
        "The other three: unnamed.\n\n" +
        "Below the map:\n" +
        "'Whoever gathers the five will know the truth.'",
      isClue: true, isTool: false,
    },
 
    item_sealed_box: {
      id: "item_sealed_box",
      nameAr: "الصندوق المختوم",
      nameEn: "Sealed Box",
      type: "evidence", icon: "folder",
      descriptionAr:
        "صندوق مختوم بالشمع.\n" +
        "على الختم: 'للجامع فقط'\n\n" +
        "جوا الصندوق:\n\n" +
        "١. يوميات الأمينة الأولى — نادية حسن:\n" +
        "   آخر إدخال قبل اختفائها:\n" +
        "   'وجدت ما كان يبحث عنه الجامع.\n" +
        "   الحقيقة في الطابق السفلي.\n" +
        "   لا أستطيع المغادرة الآن.'\n\n" +
        "٢. مفتاح صغير عليه: 'القسم المقيّد — B7'",
      descriptionEn:
        "A wax-sealed box.\n" +
        "On the seal: 'For The Collector Only'\n\n" +
        "Inside the box:\n\n" +
        "1. First librarian's diary — Nadia Hassan:\n" +
        "   Last entry before disappearance:\n" +
        "   'I found what The Collector was looking for.\n" +
        "   The truth is on the lower floor.\n" +
        "   I cannot leave now.'\n\n" +
        "2. A small key labeled: 'Restricted — B7'",
      isClue: true, isTool: false,
      requiresTool: "crowbar",
    },
 
    item_three_librarians: {
      id: "item_three_librarians",
      nameAr: "صورة الأمناء الثلاثة",
      nameEn: "Photo of Three Librarians",
      type: "document", icon: "image",
      descriptionAr:
        "صورة قديمة — ثلاثة أشخاص في المكتبة.\n\n" +
        "نادية حسن — ١٩٥٤\n" +
        "سامية رشيد — ١٩٧٢\n" +
        "حسام الدين — ١٩٩٠\n\n" +
        "الثلاثة بيمسكوا نفس الكتاب.\n\n" +
        "الغريب:\n" +
        "الصورة مؤرخة ١٩٨٨.\n" +
        "يعني الثلاثة كانوا مع بعض قبل اختفاء حسام.\n" +
        "بس نادية اختفت عام ١٩٥٤!\n\n" +
        "إزاي بتظهر في صورة عام ١٩٨٨؟",
      descriptionEn:
        "An old photo — three people in the library.\n\n" +
        "Nadia Hassan — 1954\n" +
        "Samia Rashid — 1972\n" +
        "Hossam el-Din — 1990\n\n" +
        "All three holding the same book.\n\n" +
        "The strange part:\n" +
        "The photo is dated 1988.\n" +
        "Meaning all three were together before Hossam disappeared.\n" +
        "But Nadia disappeared in 1954!\n\n" +
        "How does she appear in a 1988 photo?",
      isClue: true, isTool: false,
    },
 
    item_uv_inscription: {
      id: "item_uv_inscription",
      nameAr: "نقش بالحبر السري",
      nameEn: "UV Wall Inscription",
      type: "clue", icon: "clue",
      descriptionAr:
        "بالضوء فوق البنفسجي على الحائط:\n\n" +
        "'الرموز الأربعة للقفل:\n" +
        "الأول: ما تستعيره لتقرأ 📚\n" +
        "الثاني: ما يفتح الأبواب 🔑\n" +
        "الثالث: ما يراقبك دائماً 👁️\n" +
        "الرابع: ما لا يمكن استعادته ⌛\n\n" +
        "الترتيب: حسب من رحل أولاً.'",
      descriptionEn:
        "Under UV light on the wall:\n\n" +
        "'The four symbols for the lock:\n" +
        "First: what you borrow to read 📚\n" +
        "Second: what opens doors 🔑\n" +
        "Third: what always watches you 👁️\n" +
        "Fourth: what cannot be recovered ⌛\n\n" +
        "Order: by who left first.'",
      isClue: true, isTool: false,
      requiresTool: "uv_light",
    },
 
    item_open_book: {
      id: "item_open_book",
      nameAr: "كتاب مفتوح على الطاولة",
      nameEn: "Open Book on Table",
      type: "document", icon: "book",
      descriptionAr:
        "كتاب مفتوح ومعه نظارة.\n" +
        "كأن صاحبه قام فجأة.\n\n" +
        "الصفحة المفتوحة:\n" +
        "'الفصل الثامن: التعرف على نمط التكرار'\n\n" +
        "جملة واحدة تحتها خط:\n" +
        "'إذا تكرر الحدث بفارق زمني ثابت\n" +
        "فهو ليس صدفة. هو جدول زمني.'\n\n" +
        "في هامش الصفحة بخط حسام الدين:\n" +
        "'١٨ سنة. دائماً ١٨. والقادم ٢٠٠٨.'",
      descriptionEn:
        "A book open with glasses beside it.\n" +
        "As if the owner left suddenly.\n\n" +
        "The open page:\n" +
        "'Chapter Eight: Recognizing Recurring Patterns'\n\n" +
        "One underlined sentence:\n" +
        "'If an event repeats at a fixed time interval\n" +
        "it is not coincidence. It is a schedule.'\n\n" +
        "In Hossam el-Din's handwriting in the margin:\n" +
        "'18 years. Always 18. And the next is 2008.'",
      isClue: true, isTool: false,
    },
 
    item_reading_notes: {
      id: "item_reading_notes",
      nameAr: "ملاحظات على الطاولة",
      nameEn: "Table Notes",
      type: "document", icon: "document",
      descriptionAr:
        "ملاحظات مكتوبة على ورق مقطع.\n\n" +
        "خط حسام الدين — ١٩٩٠:\n\n" +
        "'ما أعرفه:\n" +
        "- الجامع يزور كل ١٨ سنة\n" +
        "- كل مرة يأخذ شيئاً\n" +
        "- الأمينة الأولى فهمت — اختفت\n" +
        "- الأمينة الثانية فهمت — اختفت\n" +
        "- أنا فهمت الآن\n\n" +
        "الفرق: أنا تركت هذه الملاحظات.\n" +
        "من يجدها — لا تبحث عن الجامع.\n" +
        "ابحث عمّن أرسله.'",
      descriptionEn:
        "Notes written on cut paper.\n\n" +
        "Hossam el-Din's handwriting — 1990:\n\n" +
        "'What I know:\n" +
        "- The Collector visits every 18 years\n" +
        "- Each time he takes something\n" +
        "- First librarian understood — disappeared\n" +
        "- Second librarian understood — disappeared\n" +
        "- I understand now\n\n" +
        "The difference: I left these notes.\n" +
        "Whoever finds them — don't look for The Collector.\n" +
        "Look for who sent him.'",
      isClue: true, isTool: false,
    },
 
    item_strange_bookmark: {
      id: "item_strange_bookmark",
      nameAr: "علامة الكتاب الغريبة",
      nameEn: "Strange Bookmark",
      type: "clue", icon: "clue",
      descriptionAr:
        "علامة كتاب عليها رسم لعين.\n" +
        "نفس رمز غلاف الكتاب تماماً.\n\n" +
        "على الظهر بخط صغير:\n" +
        "'الرموز الأربعة الصح في الترتيب الصح\n" +
        "هم: المفتاح، العين، الكتاب، الوقت.\n\n" +
        "بس الترتيب هو ترتيب الاختفاء.\n" +
        "من اختفى أولاً؟\n" +
        "ماذا وجد؟\n" +
        "ذلك هو رمزه.'",
      descriptionEn:
        "A bookmark with an eye symbol.\n" +
        "Exactly the same as the book cover symbol.\n\n" +
        "On the back in small writing:\n" +
        "'The four correct symbols in correct order\n" +
        "are: key, eye, book, time.\n\n" +
        "But the order follows the disappearances.\n" +
        "Who disappeared first?\n" +
        "What did they find?\n" +
        "That is their symbol.'",
      isClue: true, isTool: false,
    },
 
    item_mirror_dates: {
      id: "item_mirror_dates",
      nameAr: "تواريخ المرآة",
      nameEn: "Mirror Dates",
      type: "clue", icon: "clue",
      descriptionAr:
        "التواريخ التي كشفتها المرآة:\n\n" +
        "١٩٥٤ — ١٩٧٢ — ١٩٩٠ — ٢٠٠٨\n\n" +
        "الفارق بين كل تاريخ: ١٨ سنة.\n\n" +
        "اختفاء نادية:   ١٩٥٤ ✓\n" +
        "اختفاء سامية:   ١٩٧٢ ✓\n" +
        "اختفاء حسام:    ١٩٩٠ ✓\n" +
        "التالي:          ٢٠٠٨\n\n" +
        "التالي أنتم؟",
      descriptionEn:
        "The dates revealed by the mirror:\n\n" +
        "1954 — 1972 — 1990 — 2008\n\n" +
        "Gap between each date: 18 years.\n\n" +
        "Nadia's disappearance:  1954 ✓\n" +
        "Samia's disappearance:  1972 ✓\n" +
        "Hossam's disappearance: 1990 ✓\n" +
        "The next:               2008\n\n" +
        "Is the next one you?",
      isClue: true, isTool: false,
    },
 
    item_third_librarian_diary: {
      id: "item_third_librarian_diary",
      nameAr: "يوميات الأمين الثالث",
      nameEn: "Third Librarian's Diary",
      type: "document", icon: "book",
      descriptionAr:
        "يوميات حسام الدين — آخر الإدخالات:\n\n" +
        "'١٥ أكتوبر ١٩٩٠:\n" +
        "الجامع كان هنا الليلة.\n" +
        "لم يره أحد غيري.\n" +
        "طلب مني شيئاً واحداً فقط:\n" +
        "أن أنسى.\n\n" +
        "٢٢ أكتوبر ١٩٩٠:\n" +
        "الكتب الثلاثة في مكتبي\n" +
        "مرتبة خطأ منذ أسبوع.\n" +
        "رتّبها بالتسلسل الزمني\n" +
        "لتجد الحجرة التي لم أُخبر أحداً عنها.\n\n" +
        "٢٨ أكتوبر — الليلة الأخيرة:\n" +
        "الجامع محق.\n" +
        "الحقيقة أكبر من أن تُحتجز في مكتبة.\n" +
        "أتركها لمن يأتي بعدي.'",
      descriptionEn:
        "Hossam el-Din's diary — final entries:\n\n" +
        "'October 15, 1990:\n" +
        "The Collector was here tonight.\n" +
        "No one saw him but me.\n" +
        "He asked one thing only:\n" +
        "To forget.\n\n" +
        "October 22, 1990:\n" +
        "The three books on my desk\n" +
        "have been arranged wrong for a week.\n" +
        "Arrange them chronologically\n" +
        "to find the room I never told anyone about.\n\n" +
        "October 28 — the last night:\n" +
        "The Collector is right.\n" +
        "The truth is too big to be held in a library.\n" +
        "I leave it for whoever comes after me.'",
      isClue: true, isTool: false,
    },
 
    item_phone_note: {
      id: "item_phone_note",
      nameAr: "ورقة بجانب التليفون",
      nameEn: "Note by the Phone",
      type: "clue", icon: "clue",
      descriptionAr:
        "ورقة ممزقة بجانب التليفون:\n\n" +
        "'اتصل بـ الجامع — ضروري\n" +
        "الرقم: لا يوجد رقم\n\n" +
        "ملاحظة لمن يجد هذه الورقة:\n" +
        "الجامع لا يتصل به أحد.\n" +
        "هو من يتصل بك.\n" +
        "وإذا اتصل بك — يعني وجدت شيئاً.'",
      descriptionEn:
        "A torn note beside the phone:\n\n" +
        "'Call The Collector — urgent\n" +
        "Number: no number\n\n" +
        "Note for whoever finds this:\n" +
        "Nobody calls The Collector.\n" +
        "He calls you.\n" +
        "And if he calls you — it means you found something.'",
      isClue: true, isTool: false,
    },
 
    item_office_photos: {
      id: "item_office_photos",
      nameAr: "صور حائط المكتب",
      nameEn: "Office Wall Photos",
      type: "document", icon: "image",
      descriptionAr:
        "صور رسمية لأمناء المكتبة عبر السنين.\n\n" +
        "صورة ١٩٤٨: الأمين المؤسس\n" +
        "صورة ١٩٥٤: نادية حسن (مشطوب عليها)\n" +
        "صورة ١٩٧٢: سامية رشيد (مشطوب عليها)\n" +
        "صورة ١٩٩٠: حسام الدين (مشطوب عليها)\n\n" +
        "في الإطار الأخير — فارغ.\n" +
        "عليه لاصقة: '٢٠٠٨'.\n\n" +
        "من المفروض يكون هنا؟",
      descriptionEn:
        "Official photos of librarians through the years.\n\n" +
        "Photo 1948: Founding librarian\n" +
        "Photo 1954: Nadia Hassan (crossed out)\n" +
        "Photo 1972: Samia Rashid (crossed out)\n" +
        "Photo 1990: Hossam el-Din (crossed out)\n\n" +
        "The last frame — empty.\n" +
        "With a sticker: '2008'.\n\n" +
        "Who is supposed to be here?",
      isClue: true, isTool: false,
    },
 
    item_uv_schedule: {
      id: "item_uv_schedule",
      nameAr: "جدول مخفي في الدرج",
      nameEn: "Hidden Drawer Schedule",
      type: "clue", icon: "clue",
      descriptionAr:
        "بالضوء فوق البنفسجي في درج المكتب:\n\n" +
        "جدول زمني:\n" +
        "نادية: وجدت رمز المفتاح 🔑\n" +
        "سامية: وجدت رمز العين 👁️\n" +
        "حسام:  وجد رمز الكتاب 📚\n" +
        "القادم: سيجد رمز الوقت ⌛\n\n" +
        "ترتيب القفل:\n" +
        "المفتاح أولاً (نادية اختفت أولاً)\n" +
        "ثم العين (سامية)\n" +
        "ثم الكتاب (حسام)\n" +
        "ثم الوقت (القادم — أنتم)",
      descriptionEn:
        "Under UV light in the desk drawer:\n\n" +
        "A timeline:\n" +
        "Nadia: found the key symbol 🔑\n" +
        "Samia: found the eye symbol 👁️\n" +
        "Hossam: found the book symbol 📚\n" +
        "The next: will find the time symbol ⌛\n\n" +
        "Lock order:\n" +
        "Key first (Nadia disappeared first)\n" +
        "Then eye (Samia)\n" +
        "Then book (Hossam)\n" +
        "Then time (the next — you)",
      isClue: true, isTool: false,
      requiresTool: "uv_light",
    },
 
    item_secret_compartment_key: {
      id: "item_secret_compartment_key",
      nameAr: "مفتاح الغرفة السرية",
      nameEn: "Secret Room Key",
      type: "tool", icon: "key",
      descriptionAr: "مفتاح مخبأ خلف الكتب. يفتح الغرفة السرية خلف رف المكتب.",
      descriptionEn: "A key hidden behind books. Opens the secret room behind the office shelf.",
      isClue: false, isTool: true,
    },
 
    item_research_board: {
      id: "item_research_board",
      nameAr: "لوحة الأبحاث",
      nameEn: "Research Board",
      type: "evidence", icon: "evidence",
      descriptionAr:
        "لوحة كبيرة مليانة أوراق وصور وخيوط حمراء.\n\n" +
        "الثلاثة أمناء وضعوا هنا كل ما وجدوه:\n\n" +
        "خيط رابط بين:\n" +
        "كوخ الغابة ← المكتبة ← مؤسسة بحثية ← وزارة؟\n\n" +
        "على بطاقة في المنتصف:\n" +
        "'المؤسسة التي تموّل مشروع التكيف ٩٤\n" +
        "هي نفسها التي طلبت إغلاق التحقيقات.\n" +
        "الجامع يعمل لصالحها؟\n" +
        "أم ضدها؟'\n\n" +
        "سؤال بلا إجابة.",
      descriptionEn:
        "A large board covered in papers, photos and red strings.\n\n" +
        "All three librarians put everything they found here:\n\n" +
        "Connecting thread:\n" +
        "Forest Cabin ← Library ← Research Institute ← Ministry?\n\n" +
        "A card in the center:\n" +
        "'The institution funding Adaptation Project 94\n" +
        "is the same one that ordered investigations closed.\n" +
        "Is The Collector working for them?\n" +
        "Or against them?'\n\n" +
        "A question without an answer.",
      isClue: true, isTool: false,
    },
 
    item_jame_file: {
      id: "item_jame_file",
      nameAr: "ملف الجامع",
      nameEn: "The Collector's File",
      type: "evidence", icon: "folder",
      descriptionAr:
        "ملف سميك عليه: 'الجامع — بيانات مجمعة'\n\n" +
        "المحتوى:\n" +
        "صورة في المكتبة — ١٩٧٢: شخص بالغامض\n" +
        "صورة في مستشفى — ١٩٨٥: نفس الشخص؟\n" +
        "صورة في غابة — ١٩٩٠: نفس الشخص؟\n\n" +
        "الأعمار في الصور: نفسها تقريباً.\n\n" +
        "ملاحظة سامية رشيد:\n" +
        "'وجهه لا يتغير.\n" +
        "في ١٨ سنة — لم يشخ.\n" +
        "من هو فعلاً؟'\n\n" +
        "في آخر الملف بخط مختلف:\n" +
        "'أنا الجامع. وأنا أعلم أنك ستجد هذا.\n" +
        "هذا ما أريده.'",
      descriptionEn:
        "A thick file labeled: 'The Collector — Compiled Data'\n\n" +
        "Contents:\n" +
        "Photo in library — 1972: a shadowy figure\n" +
        "Photo in hospital — 1985: same person?\n" +
        "Photo in forest — 1990: same person?\n\n" +
        "Ages in photos: approximately the same.\n\n" +
        "Samia Rashid's note:\n" +
        "'His face does not change.\n" +
        "In 18 years — he did not age.\n" +
        "Who is he really?'\n\n" +
        "At the end of the file in different handwriting:\n" +
        "'I am The Collector. And I know you will find this.\n" +
        "This is what I want.'",
      isClue: true, isTool: false,
    },
 
    item_photo_1985: {
      id: "item_photo_1985",
      nameAr: "صورة ١٩٨٥",
      nameEn: "Photo 1985",
      type: "evidence", icon: "image",
      descriptionAr:
        "صورة فوتوغرافية واضحة — ١٩٨٥.\n\n" +
        "رجلان في المستشفى القديم:\n" +
        "الأول: الدكتور سامي (من قصة المستشفى)\n" +
        "الثاني: شخص آخر\n\n" +
        "تحت الصورة:\n" +
        "'د. سامي والجامع — ١٩٨٥'\n\n" +
        "وجه الجامع واضح في الصورة.\n" +
        "نفس الوجه الموجود في\n" +
        "صور المكتبة من ١٩٧٢.\n\n" +
        "لم يتغير.",
      descriptionEn:
        "A clear photograph — 1985.\n\n" +
        "Two men at the old hospital:\n" +
        "First: Dr. Sami (from the hospital story)\n" +
        "Second: another person\n\n" +
        "Below the photo:\n" +
        "'Dr. Sami and The Collector — 1985'\n\n" +
        "The Collector's face is clear in the photo.\n" +
        "The same face found in\n" +
        "library photos from 1972.\n\n" +
        "Unchanged.",
      isClue: true, isTool: false,
    },
 
    item_timeline_complete: {
      id: "item_timeline_complete",
      nameAr: "الخط الزمني المكتمل",
      nameEn: "Complete Timeline",
      type: "evidence", icon: "evidence",
      isFinalClue: true,
      descriptionAr:
        "الخط الزمني المكتمل للأحداث:\n\n" +
        "١٩٤٨ — تأسيس المكتبة\n" +
        "١٩٥٤ — نادية تجد الحقيقة، تختفي\n" +
        "١٩٦٨ — فتح الأرشيف السري\n" +
        "١٩٧٢ — سامية تكتشف نادية، تختفي\n" +
        "١٩٨٥ — الجامع يزور المكتبة والمستشفى\n" +
        "١٩٩٠ — حسام يربط كل شيء، يختفي\n\n" +
        "والآن:\n" +
        "أنتم هنا.\n" +
        "في ٢٠٠٨.\n" +
        "الموعد التالي في الجدول.\n\n" +
        "الجامع لم يُخبئ الحقيقة —\n" +
        "هو كان ينتظر من يجمعها.",
      descriptionEn:
        "The complete timeline of events:\n\n" +
        "1948 — Library founded\n" +
        "1954 — Nadia finds the truth, disappears\n" +
        "1968 — Secret archive opened\n" +
        "1972 — Samia discovers Nadia's trail, disappears\n" +
        "1985 — The Collector visits library and hospital\n" +
        "1990 — Hossam connects everything, disappears\n\n" +
        "And now:\n" +
        "You are here.\n" +
        "In 2008.\n" +
        "The next appointment on the schedule.\n\n" +
        "The Collector did not hide the truth —\n" +
        "he was waiting for someone to gather it.",
      isClue: true, isTool: false,
    },
 
    item_printing_press: {
      id: "item_printing_press",
      nameAr: "ماكينة الطباعة القديمة",
      nameEn: "Old Printing Press",
      type: "evidence", icon: "evidence",
      descriptionAr:
        "ماكينة طباعة قديمة — لا تزال تعمل.\n\n" +
        "في الدرج: ورقة مطبوعة جديدة نسبياً:\n\n" +
        "'طُبع هنا أول نسخة من الكتاب — ١٩٧١.\n" +
        "وزُرعت في الأماكن المناسبة.\n" +
        "لمن يجدها ويقرأها ويذهب.\n\n" +
        "الكتاب ليس تحذيراً.\n" +
        "الكتاب دعوة.'",
      descriptionEn:
        "An old printing press — still functioning.\n\n" +
        "In the drawer: a relatively newly printed sheet:\n\n" +
        "'First edition of the book printed here — 1971.\n" +
        "Then planted in the right places.\n" +
        "For whoever finds it, reads it, and goes.\n\n" +
        "The book is not a warning.\n" +
        "The book is an invitation.'",
      isClue: true, isTool: false,
    },
 
    item_buried_manuscript: {
      id: "item_buried_manuscript",
      nameAr: "المخطوطة الأصلية",
      nameEn: "The Original Manuscript",
      type: "evidence", icon: "book",
      descriptionAr:
        "صندوق تحت الأرض — فيه مخطوطة.\n\n" +
        "الغلاف: 'مخطوطة الأماكن المنسية — ١٩١٢'\n\n" +
        "هذه المخطوطة الأصلية التي أعارها الجامع.\n\n" +
        "أول صفحة:\n" +
        "'أنا الجامع الأول.\n" +
        "كتبت هذا في ١٩١٢.\n" +
        "من يقرأ هذا في المستقبل —\n" +
        "الحقيقة التي تبحث عنها\n" +
        "أكبر من أي مكان واحد.\n" +
        "اذهب إلى المصنع.\n" +
        "ثم المستشفى.\n" +
        "ثم المنزل.\n" +
        "ثم ستعرف.'\n\n" +
        "تحتها خاتم: 'مؤسسة الجامع للأبحاث — ١٩١٢'",
      descriptionEn:
        "An underground box — containing a manuscript.\n\n" +
        "Cover: 'Manuscript of Forgotten Places — 1912'\n\n" +
        "This is the original manuscript The Collector borrowed.\n\n" +
        "First page:\n" +
        "'I am the first Collector.\n" +
        "I wrote this in 1912.\n" +
        "Whoever reads this in the future —\n" +
        "the truth you seek\n" +
        "is bigger than any single place.\n" +
        "Go to the factory.\n" +
        "Then the hospital.\n" +
        "Then the house.\n" +
        "Then you will know.'\n\n" +
        "Below it a seal: 'Jame' Research Foundation — 1912'",
      isClue: true, isTool: false,
      requiresTool: "crowbar",
    },
 
    item_final_message: {
      id: "item_final_message",
      nameAr: "رسالة الجامع النهائية",
      nameEn: "The Collector's Final Message",
      type: "document", icon: "letter",
      isFinalClue: true,
      descriptionAr:
        "على حائط البدروم — مكتوب بالطباشير:\n\n" +
        "'أحسنتم. وصلتم.\n\n" +
        "الكتاب الذي معكم\n" +
        "هو دليلكم للفصل الأول.\n\n" +
        "وجدتم:\n" +
        "✓ كوخ الغابة — مشروع التكيف ٩٤\n" +
        "✓ المكتبة المركزية — الأرشيف السري\n\n" +
        "لم تجدوا بعد:\n" +
        "○ المصنع المهجور\n" +
        "○ المستشفى القديم\n" +
        "○ المنزل الفيكتوري\n\n" +
        "في كل منها — جزء من الحقيقة.\n\n" +
        "من كوّن المؤسسة؟\n" +
        "ماذا تريد فعلاً؟\n" +
        "ولماذا أنتم؟\n\n" +
        "اذهبوا.\n" +
        "أنا سأكون هناك.'",
      descriptionEn:
        "Written in chalk on the basement wall:\n\n" +
        "'Well done. You made it.\n\n" +
        "The book in your hands\n" +
        "is your guide for Chapter One.\n\n" +
        "You found:\n" +
        "✓ The Forest Cabin — Adaptation Project 94\n" +
        "✓ The Central Library — The Secret Archive\n\n" +
        "Yet to find:\n" +
        "○ The Abandoned Factory\n" +
        "○ The Old Hospital\n" +
        "○ The Victorian House\n\n" +
        "In each — a piece of the truth.\n\n" +
        "Who founded the institution?\n" +
        "What does it truly want?\n" +
        "And why you?\n\n" +
        "Go.\n" +
        "I will be there.'",
      isClue: true, isTool: false,
    },
  },
 
  // ── الأدوات الابتدائية ──
  startingItems: ["flashlight"],
 
  tools: {
    flashlight: { id:"flashlight", nameAr:"الكشاف",  nameEn:"Flashlight", icon:"flashlight" },
    uv_light:   { id:"uv_light",   nameAr:"مصباح UV", nameEn:"UV Light",   icon:"uv"         },
    crowbar:    { id:"crowbar",    nameAr:"عتلة",     nameEn:"Crowbar",    icon:"crowbar"    },
  },
 
  nextChapter: "chapter_factory_03",
  nextChapterClueId: "item_final_message",
 
  // ── الكشف النهائي ──
  revelation: {
    titleAr: "حقيقة المكتبة",
    titleEn: "The Library's Truth",
    textAr:
      "المكتبة لم تكن مجرد مكتبة.\n\n" +
      "كانت أرشيفاً سرياً لحقائق لا يريد أحد نشرها.\n" +
      "وكل أمين مكتبة عرف — اختفى.\n\n" +
      "لكن الجامع لم يكن يُخفّتهم.\n" +
      "كان يحميهم.\n" +
      "يأخذهم لمكان لا يصله من يريد إسكات الحقيقة.\n\n" +
      "الكتاب الذي بين يديكم\n" +
      "طُبع في هذا البدروم — ١٩٧١.\n" +
      "ووُضع في طريقكم عمداً.\n\n" +
      "أنتم لم تجدوا الكتاب.\n" +
      "الكتاب اختاركم.",
    textEn:
      "The library was never just a library.\n\n" +
      "It was a secret archive for truths nobody wanted published.\n" +
      "And every librarian who knew — disappeared.\n\n" +
      "But The Collector wasn't silencing them.\n" +
      "He was protecting them.\n" +
      "Taking them somewhere those who silence truth cannot reach.\n\n" +
      "The book in your hands\n" +
      "was printed in this basement — 1971.\n" +
      "And placed in your path deliberately.\n\n" +
      "You didn't find the book.\n" +
      "The book chose you.",
 
    nextChapterHintAr:
      "المخطوطة الأصلية تقول: 'اذهب إلى المصنع.'\n" +
      "مؤسسة الجامع للأبحاث — ١٩١٢.\n" +
      "المصنع المهجور كان ملكها.\n" +
      "وفيه — ما لم تره الأمناء الثلاثة.",
    nextChapterHintEn:
      "The original manuscript says: 'Go to the factory.'\n" +
      "Jame' Research Foundation — 1912.\n" +
      "The abandoned factory was theirs.\n" +
      "And in it — what the three librarians never saw.",
  },
  },
};

// ════════════════════════════════════════════════════════════════
// 🏠 إدارة الغرف واللاعبين
// ════════════════════════════════════════════════════════════════

const urbexRooms   = new Map(); // roomId  → roomObject
const urbexPlayers = new Map(); // socketId → playerObject

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "U";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function createRoom(roomId) {
  return {
    id: roomId,
    hostId: null,
    players: new Map(),
    gameState: "waiting",       // waiting | playing | chapter_complete | completed
    currentChapter: null,
    progress: {
      chapterId: null,
      collectedItems: [],
      solvedPuzzles: [],
      playerPositions: {},
      revealedClues: [],
      startedAt: null,
    },
    savedProgress: null,
    createdAt: Date.now(),
  };
}

function createPlayer(socketId, playerId, name, roomId, language) {
  return {
    socketId,
    id: playerId,
    name,
    roomId,
    language: language || "ar",
    currentNode: null,
    inventory: [],
    activeTools: [],
    isHost: false,
  };
}

function getRoomState(room) {
  const players = [];
  room.players.forEach(p =>
    players.push({ id: p.id, name: p.name, currentNode: p.currentNode, isHost: p.isHost, language: p.language })
  );
  return {
    roomId: room.id,
    gameState: room.gameState,
    currentChapter: room.currentChapter,
    players,
    progress: room.progress,
    playerCount: room.players.size,
  };
}

function broadcast(io, room, event, data, excludeSocketId = null) {
  room.players.forEach(p => {
    if (p.socketId !== excludeSocketId) {
      const s = io.sockets.sockets.get(p.socketId);
      if (s) s.emit(event, data);
    }
  });
}

function checkChapterComplete(room, chapter) {
  const finalClues = Object.values(chapter.items)
    .filter(i => i.isFinalClue)
    .map(i => i.id);
  return finalClues.length > 0 && finalClues.every(id => room.progress.collectedItems.includes(id));
}

function validatePuzzleAnswer(puzzle, answer) {
  switch (puzzle.type) {
    case "number_pad":
      return String(answer) === String(puzzle.code);
    case "compass":
      return JSON.stringify(answer) === JSON.stringify(puzzle.sequence);
    case "sequence_audio":
      return JSON.stringify(answer) === JSON.stringify(puzzle.sequence);
    case "symbol_combination":
      return JSON.stringify(answer) === JSON.stringify(puzzle.correctSequence);
    case "book_sequence": {
      const correct = puzzle.books
        .filter(b => b.correct)
        .sort((a, b) => a.order - b.order)
        .map(b => b.id);
      return JSON.stringify(answer) === JSON.stringify(correct);
    }
    case "mirror_angle":
      return Math.abs(Number(answer) - puzzle.correctAngle) <= (puzzle.tolerance || 8);
    case "shadow_angle":
      return String(answer) === "center";
    case "gyroscope_look":
      return String(answer) === "down";
    default:
      return false;
  }
}

// ════════════════════════════════════════════════════════════════
// 🚀 تهيئة السيرفر
// ════════════════════════════════════════════════════════════════

module.exports = function setupUrbexServer(io) {

  io.on("connection", socket => {

    // ── إنشاء غرفة ──────────────────────────────────────────
    socket.on("urbex_create_room", ({ playerId, playerName, language }) => {
      try {
        const roomId = generateRoomCode();
        const room   = createRoom(roomId);
        urbexRooms.set(roomId, room);

        const player  = createPlayer(socket.id, playerId, playerName, roomId, language);
        player.isHost = true;
        room.hostId   = playerId;
        room.players.set(playerId, player);
        urbexPlayers.set(socket.id, player);

        socket.join(`urbex_${roomId}`);

        socket.emit("urbex_room_created", {
          roomId,
          roomState: getRoomState(room),
          isHost: true,
          chapters: Object.values(URBEX_CHAPTERS).map(ch => ({
            id: ch.id, titleAr: ch.titleAr, titleEn: ch.titleEn,
            mythAr: ch.mythAr, mythEn: ch.mythEn,
          })),
        });

        console.log(`🗺️  Urbex room created: ${roomId} by ${playerName}`);
      } catch (e) {
        console.error("❌ urbex_create_room:", e);
        socket.emit("urbex_error", { messageAr: "فشل إنشاء الغرفة", messageEn: "Failed to create room" });
      }
    });

    // ── الانضمام لغرفة ──────────────────────────────────────
    socket.on("urbex_join_room", ({ roomId, playerId, playerName, language }) => {
      try {
        const room = urbexRooms.get(roomId);
        if (!room) {
          socket.emit("urbex_error", { messageAr: "الغرفة غير موجودة", messageEn: "Room not found" });
          return;
        }

        const player = createPlayer(socket.id, playerId, playerName, roomId, language);
        room.players.set(playerId, player);
        urbexPlayers.set(socket.id, player);
        socket.join(`urbex_${roomId}`);

        // لو اللعبة بدأت خليه يدخل من الأول
        if (room.gameState === "playing" && room.currentChapter) {
          const chapter   = URBEX_CHAPTERS[room.currentChapter];
          const startNode = Object.keys(chapter.nodes)[0];
          player.currentNode = startNode;
          player.inventory   = [...chapter.startingItems];
          room.progress.playerPositions[playerId] = startNode;
        }

        socket.emit("urbex_joined", {
          roomId,
          roomState: getRoomState(room),
          isHost: false,
          currentProgress: room.progress,
          savedProgress:   room.savedProgress,
        });

        broadcast(io, room, "urbex_player_joined", {
          playerId, playerName, totalPlayers: room.players.size,
        }, socket.id);

        console.log(`🎮  ${playerName} joined urbex room ${roomId}`);
      } catch (e) {
        console.error("❌ urbex_join_room:", e);
        socket.emit("urbex_error", { messageAr: "فشل الانضمام", messageEn: "Failed to join" });
      }
    });

    // ── بدء اللعبة ──────────────────────────────────────────
    socket.on("urbex_start_game", ({ roomId, chapterId, playerId }) => {
      try {
        const room    = urbexRooms.get(roomId);
        const player  = room?.players.get(playerId);
        if (!room || !player?.isHost) return;

        const chapter = URBEX_CHAPTERS[chapterId];
        if (!chapter) { socket.emit("urbex_error", { messageAr: "الفصل غير موجود" }); return; }

        const startNode = Object.keys(chapter.nodes)[0];
        room.gameState      = "playing";
        room.currentChapter = chapterId;
        room.progress = {
          chapterId,
          collectedItems:  [],
          solvedPuzzles:   [],
          playerPositions: {},
          revealedClues:   [],
          startedAt:       Date.now(),
        };

        room.players.forEach(p => {
          p.currentNode = startNode;
          p.inventory   = [...chapter.startingItems];
          room.progress.playerPositions[p.id] = startNode;
        });

        io.to(`urbex_${roomId}`).emit("urbex_game_started", {
          chapterId,
          chapter: {
            id: chapter.id, titleAr: chapter.titleAr, titleEn: chapter.titleEn,
            mythAr: chapter.mythAr, mythEn: chapter.mythEn,
          },
          startNode,
          startNodeData: chapter.nodes[startNode],
          roomState: getRoomState(room),
        });

        console.log(`🎮  Urbex game started — Room: ${roomId} | Chapter: ${chapterId}`);
      } catch (e) { console.error("❌ urbex_start_game:", e); }
    });

    // ── التنقل بين العُقد ────────────────────────────────────
    socket.on("urbex_navigate", ({ roomId, playerId, targetNode }) => {
      try {
        const room    = urbexRooms.get(roomId);
        const player  = room?.players.get(playerId);
        if (!room || !player || room.gameState !== "playing") return;

        const chapter = URBEX_CHAPTERS[room.currentChapter];
        const curNode = chapter?.nodes[player.currentNode];
        const tgtNode = chapter?.nodes[targetNode];

        if (!curNode || !tgtNode) {
          socket.emit("urbex_error", { messageAr: "المكان غير موجود", messageEn: "Location not found" }); return;
        }
        if (!curNode.connections.includes(targetNode)) {
          socket.emit("urbex_error", { messageAr: "مش قادر توصل هناك", messageEn: "Cannot reach that location" }); return;
        }

        // تحقق من الأدوات المطلوبة
        const required = tgtNode.requiredItems || [];
        const missing  = required.find(r => !player.inventory.includes(r));
        if (missing) {
          const item = chapter.items[missing];
          socket.emit("urbex_navigation_blocked", {
            targetNode,
            reason: "missing_item",
            missingItemAr: item?.nameAr || "غرض مطلوب",
            missingItemEn: item?.nameEn || "Required item",
          });
          return;
        }

        // تحقق من حل اللغز المطلوب لفتح العُقدة
        if (tgtNode.puzzle?.unlocksNode === targetNode &&
            !room.progress.solvedPuzzles.includes(tgtNode.puzzle?.id) &&
            player.currentNode !== targetNode) {
          socket.emit("urbex_node_locked", {
            targetNode,
            puzzleId:          tgtNode.puzzle.id,
            puzzleDescriptionAr: tgtNode.puzzle.descriptionAr,
            puzzleDescriptionEn: tgtNode.puzzle.descriptionEn,
          });
          return;
        }

        player.currentNode = targetNode;
        room.progress.playerPositions[playerId] = targetNode;

        // الأغراض المتاحة في العُقدة الجديدة
        const availableItems = tgtNode.hotspots
          .filter(h => h.itemId && !room.progress.collectedItems.includes(h.itemId))
          .map(h => h.itemId);

        socket.emit("urbex_navigated", {
          node: targetNode,
          nodeData: tgtNode,
          availableItems,
          inventory:    player.inventory,
          activeTools:  player.activeTools,
          ambientSound: tgtNode.ambientSound,
          infrasound:   tgtNode.infrasound,
        });

        broadcast(io, room, "urbex_player_moved", {
          playerId,
          playerName: player.name,
          node: targetNode,
          nodeName: { ar: tgtNode.nameAr, en: tgtNode.nameEn },
        }, socket.id);

      } catch (e) { console.error("❌ urbex_navigate:", e); }
    });

    // ── فحص غرض ─────────────────────────────────────────────
    socket.on("urbex_inspect_item", ({ roomId, playerId, itemId }) => {
      try {
        const room   = urbexRooms.get(roomId);
        const player = room?.players.get(playerId);
        if (!room || !player) return;

        const chapter = URBEX_CHAPTERS[room.currentChapter];
        const item    = chapter?.items[itemId];
        if (!item) return;

        // تحقق من الأداة المطلوبة
        if (item.requiresTool && !player.inventory.includes(item.requiresTool) && !player.activeTools.includes(item.requiresTool)) {
          const tool = chapter.tools?.[item.requiresTool];
          socket.emit("urbex_tool_required", {
            itemId,
            requiredTool:   item.requiresTool,
            messageAr: `محتاج ${tool?.nameAr || "أداة"} لفحص ده`,
            messageEn: `Need ${tool?.nameEn || "a tool"} to inspect this`,
          });
          return;
        }

        // إضافة الغرض للحقيبة
        if (!room.progress.collectedItems.includes(itemId)) {
          room.progress.collectedItems.push(itemId);
        }
        if (!player.inventory.includes(itemId)) {
          player.inventory.push(itemId);
        }
        if (item.isClue && !room.progress.revealedClues.includes(itemId)) {
          room.progress.revealedClues.push(itemId);
        }

        // لو الغرض أداة — أضفها للأدوات
        if (item.isTool && !player.activeTools.includes(itemId)) {
          player.activeTools.push(itemId);
        }

        socket.emit("urbex_item_inspected", {
          itemId, item,
          addedToInventory: true,
          inventory:   player.inventory,
          activeTools: player.activeTools,
        });

        // إشعار الفريق لو الغرض دليل
        if (item.isClue) {
          broadcast(io, room, "urbex_clue_found", {
            playerId, playerName: player.name,
            itemId, itemNameAr: item.nameAr, itemNameEn: item.nameEn,
          }, socket.id);
        }

        // تفعيل الأداة
        if (item.isTool) {
          socket.emit("urbex_tool_acquired", {
            toolId: itemId, toolNameAr: item.nameAr, toolNameEn: item.nameEn,
          });
        }

      } catch (e) { console.error("❌ urbex_inspect_item:", e); }
    });

    // ── تفعيل أداة ──────────────────────────────────────────
    socket.on("urbex_activate_tool", ({ roomId, playerId, toolId }) => {
      try {
        const room   = urbexRooms.get(roomId);
        const player = room?.players.get(playerId);
        if (!room || !player) return;

        if (!player.inventory.includes(toolId)) {
          socket.emit("urbex_error", { messageAr: "مش عندك الأداة دي", messageEn: "You don't have this tool" }); return;
        }
        if (!player.activeTools.includes(toolId)) player.activeTools.push(toolId);

        socket.emit("urbex_tool_activated", { toolId, activeTools: player.activeTools });
        broadcast(io, room, "urbex_player_tool", { playerId, playerName: player.name, toolId }, socket.id);
      } catch (e) { console.error("❌ urbex_activate_tool:", e); }
    });

    // ── حل لغز ──────────────────────────────────────────────
    socket.on("urbex_solve_puzzle", ({ roomId, playerId, puzzleId, answer }) => {
      try {
        const room    = urbexRooms.get(roomId);
        const player  = room?.players.get(playerId);
        if (!room || !player || room.gameState !== "playing") return;

        const chapter = URBEX_CHAPTERS[room.currentChapter];
        if (!chapter) return;

        // إيجاد اللغز
        let puzzle = null, puzzleNodeId = null;
        Object.entries(chapter.nodes).forEach(([nodeId, nd]) => {
          if (nd.puzzle?.id === puzzleId) { puzzle = nd.puzzle; puzzleNodeId = nodeId; }
        });
        if (!puzzle) return;

        if (room.progress.solvedPuzzles.includes(puzzleId)) {
          socket.emit("urbex_puzzle_already_solved", { puzzleId }); return;
        }

        const correct = validatePuzzleAnswer(puzzle, answer);

        if (correct) {
          room.progress.solvedPuzzles.push(puzzleId);

          let rewardItem = null;
          if (puzzle.rewardItemId) {
            if (!player.inventory.includes(puzzle.rewardItemId)) player.inventory.push(puzzle.rewardItemId);
            if (!room.progress.collectedItems.includes(puzzle.rewardItemId)) room.progress.collectedItems.push(puzzle.rewardItemId);
            rewardItem = chapter.items[puzzle.rewardItemId];

            // لو الجائزة أداة — فعّلها
            if (rewardItem?.isTool && !player.activeTools.includes(puzzle.rewardItemId)) {
              player.activeTools.push(puzzle.rewardItemId);
            }
          }

          socket.emit("urbex_puzzle_solved", {
            puzzleId, correct: true, rewardItem,
            revealedMessage:   puzzle.revealedMessage || null,
            revealedMessageEn: puzzle.revealedMessageEn || null,
            inventory:   player.inventory,
            activeTools: player.activeTools,
            solvedPuzzles: room.progress.solvedPuzzles,
          });

          io.to(`urbex_${roomId}`).emit("urbex_puzzle_unlocked", {
            puzzleId, solvedBy: player.name, puzzleNodeId,
            nodeNameAr: chapter.nodes[puzzleNodeId]?.nameAr,
            nodeNameEn: chapter.nodes[puzzleNodeId]?.nameEn,
          });

          // تحقق من اكتمال الفصل
          if (checkChapterComplete(room, chapter)) {
            room.gameState = "chapter_complete";
            io.to(`urbex_${roomId}`).emit("urbex_chapter_complete", {
              chapterId: room.currentChapter,
              revelation: chapter.revelation,
              nextChapter: chapter.nextChapter,
              stats: {
                itemsCollected:  room.progress.collectedItems.length,
                totalItems:      Object.keys(chapter.items).length,
                puzzlesSolved:   room.progress.solvedPuzzles.length,
                totalPuzzles:    Object.values(chapter.nodes).filter(n => n.puzzle).length,
                timeTakenMs:     Date.now() - room.progress.startedAt,
              },
            });
          }

        } else {
          socket.emit("urbex_puzzle_wrong", {
            puzzleId, correct: false,
            hintAr: puzzle.hintAr, hintEn: puzzle.hintEn,
          });
        }

      } catch (e) { console.error("❌ urbex_solve_puzzle:", e); }
    });

    // ── إشارة Ping ───────────────────────────────────────────
    socket.on("urbex_ping", ({ roomId, playerId, nodeId, hotspotId, pingType }) => {
      try {
        const room   = urbexRooms.get(roomId);
        const player = room?.players.get(playerId);
        if (!room || !player) return;

        const chapter  = URBEX_CHAPTERS[room.currentChapter];
        const nodeData = chapter?.nodes[nodeId];

        io.to(`urbex_${roomId}`).emit("urbex_ping_received", {
          fromPlayerId:  playerId,
          fromPlayer:    player.name,
          nodeId,
          hotspotId,
          nodeNameAr:    nodeData?.nameAr,
          nodeNameEn:    nodeData?.nameEn,
          pingType:      pingType || "attention",  // attention | found_clue | need_help
          timestamp:     Date.now(),
        });
      } catch (e) { console.error("❌ urbex_ping:", e); }
    });

    // ── حفظ التقدم ───────────────────────────────────────────
    socket.on("urbex_save_progress", ({ roomId, playerId }) => {
      try {
        const room   = urbexRooms.get(roomId);
        const player = room?.players.get(playerId);
        if (!room || !player?.isHost) return;

        const playerData = {};
        room.players.forEach(p => {
          playerData[p.id] = { currentNode: p.currentNode, inventory: p.inventory, activeTools: p.activeTools };
        });

        room.savedProgress = {
          roomId, chapterId: room.currentChapter,
          progress: { ...room.progress }, playerData, savedAt: Date.now(),
        };

        socket.emit("urbex_progress_saved", { savedAt: room.savedProgress.savedAt, saveCode: roomId });
      } catch (e) { console.error("❌ urbex_save_progress:", e); }
    });

    // ── تغيير اللغة ──────────────────────────────────────────
    socket.on("urbex_change_language", ({ playerId, language }) => {
      const player = urbexPlayers.get(socket.id);
      if (player) { player.language = language; socket.emit("urbex_language_changed", { language }); }
    });

    // ── قائمة الفصول ─────────────────────────────────────────
    socket.on("urbex_get_chapters", () => {
      const chapters = Object.values(URBEX_CHAPTERS).map(ch => ({
        id: ch.id, titleAr: ch.titleAr, titleEn: ch.titleEn,
        mythAr: ch.mythAr, mythEn: ch.mythEn,
        nodeCount: Object.keys(ch.nodes).length,
      }));
      socket.emit("urbex_chapters_list", { chapters });
    });

    // ── قطع الاتصال ──────────────────────────────────────────
    socket.on("disconnect", () => {
      try {
        const player = urbexPlayers.get(socket.id);
        if (!player) return;

        const room = urbexRooms.get(player.roomId);
        if (room) {
          room.players.delete(player.id);
          const wasHost = player.isHost;

          broadcast(io, room, "urbex_player_left", {
            playerId: player.id, playerName: player.name, wasHost,
            remainingPlayers: room.players.size,
          });

          // تحويل الهوست تلقائياً
          if (wasHost && room.players.size > 0) {
            const next = room.players.values().next().value;
            next.isHost  = true;
            room.hostId  = next.id;

            io.to(`urbex_${player.roomId}`).emit("urbex_host_changed", {
              newHostId:     next.id,
              newHostName:   next.name,
              saveCode:      player.roomId,
              savedProgress: room.progress,
              messageAr:     "صاحب الغرفة خرج — تم تعيين هوست جديد تلقائياً",
              messageEn:     "Host left — new host assigned automatically",
            });
          }

          if (room.players.size === 0) {
            urbexRooms.delete(player.roomId);
            console.log(`🗑️  Urbex room ${player.roomId} deleted (empty)`);
          }
        }

        urbexPlayers.delete(socket.id);
        console.log(`👋  Urbex player disconnected: ${player.name}`);
      } catch (e) { console.error("❌ urbex disconnect:", e); }
    });
  });

  console.log("🗺️  Urbex Game Server ready — المستكشفون جاهز!");
};