// ================================================================
// storyEvents_v2.js — النسخة الصح
// الشهود بيوصفوا مش بيسموا — اللاعب هو اللي يربط
// ================================================================

const STORY_EVENTS = {
  case_hotel_01: [

    // ── حدث 1: ريم بعد لقي USB ──
    // مش بتقول مين — بتوصف اللي شافته
    {
      id: "ev_ream_usb_found",
      trigger: { type: "evidence_found", evidenceId: "ev_h04" },
      action: {
        type: "message",
        delay: 8000,
        message: {
          from: "مجهول",
          fromRole: "مصدر سري",
          text: "في حد في غرف الموظفين شايف إنك لقيت الـ USB. عايزة تتكلم معاك قبل ما تمشي.",
          urgent: true,
          location: "hotel_staff_room",
        },
        unlocks: {
          type: "dialogue",
          npcId: "fired_ream",
          dialogueId: "after_usb",
        },
      },
    },

    // ── حدث 2: نادر بعد تحليل شريحة SIM ──
    // مش بيقول مين اتصل — بيوصف الصوت والكلام
    {
      id: "ev_nader_sim_analyzed",
      trigger: { type: "evidence_analyzed", evidenceId: "ev_h08" },
      action: {
        type: "npc_state_change",
        npcId: "security_nader",
        newState: "pressured",
        unlocks: {
          type: "dialogue",
          npcId: "security_nader",
          dialogueId: "after_sim",
        },
        message: {
          from: "نادر فتحي",
          fromRole: "موظف أمن",
          text: "لو في وقتك — في حاجة قلتها للشرطة بشكل مختلف عن اللي حصل فعلاً.",
          urgent: false,
          location: "security_room",
        },
      },
    },

    // ── حدث 3: ملف في مكتب نادين ──
    // بيظهر لوحده — من غير رسالة
    {
      id: "ev_nadine_file_unlocked",
      trigger: { type: "evidence_found", evidenceId: "ev_h05" },
      action: {
        type: "unlock_location_item",
        location: "hotel_office",
        item: {
          id: "nadine_contract_file",
          name: "ملف عقود — مكتب الإدارة",
          type: "document",
          position: { x: 72, y: 38 },
          radius: 8,
          content: `ملف ورقي على مكتب الإدارة.

فيه نسخ من عقود شراكة — التواريخ تمتد من 2021 لـ 2026.

في الصفحة الأخيرة — ملاحظة بخط مختلف عن خط العقد:
"البند 14/ج — مراجعة عاجلة قبل اجتماع الأسبوع القادم."

التاريخ على الملاحظة: قبل أسبوعين من الحادثة.

الملف مش مرتب — زي ما حد فتحه وقرأه مؤخراً.`,
          tool: "flashlight",
        },
        message: null,
      },
    },

    // ── حدث 4: رسالة محامي رمزي ──
    // بيقول إن في مظروف — مش بيقول محتواه
    {
      id: "ev_lawyer_message",
      trigger: { type: "evidence_analyzed", evidenceId: "ev_h02" },
      action: {
        type: "message",
        delay: 15000,
        message: {
          from: "م. كريم الصاوي",
          fromRole: "مكتب محاماة",
          text: "موكلي المتوفى أودع عندي مظروفاً مختوماً وطلب إيصاله للجهة المحققة في حالة وفاته. المظروف في قسم الشرطة باسمك.",
          urgent: false,
          location: "police_station",
        },
        unlocks: {
          type: "evidence",
          evidence: {
            id: "ev_lawyer_envelope",
            name: "مظروف مختوم — أودعه المتوفى عند محاميه",
            type: "physical",
            location: "police_station",
            tool: "flashlight",
            position: { x: 45, y: 50 },
            radius: 9,
            content: `مظروف مختوم بشمع أحمر. الختم سليم — لم يُفتح من قبل.

بالداخل — ورقتان:

الورقة الأولى:
أرقام حسابات بنكية في قبرص وجزر كايمان.
بجانب كل رقم — اسم شركة.
في الهامش بخط صغير: "المصدر — مستودع الإسكندرية."

الورقة الثانية:
"لو بتقرأ ده — اسأل عن ريم. هي ما عملتش حاجة غلط. أنا اللي غلطت في حقها."

لا توقيع. لا تاريخ.`,
          },
        },
      },
    },

    // ── حدث 5: يوسف بيفتكر ──
    // بيوصف ما سمعه — مش بيقول ليه مهم
    {
      id: "ev_youssef_remembers",
      trigger: {
        type: "location_visited",
        locationId: "hotel_lobby",
        count: 3,
      },
      action: {
        type: "npc_state_change",
        npcId: "concierge",
        newState: "remembers",
        unlocks: {
          type: "dialogue",
          npcId: "concierge",
          dialogueId: "remembers",
        },
        message: {
          from: "يوسف منصور",
          fromRole: "كونسيرج الفندق",
          text: "تفتكرت حاجة. مش عارف مهمة ولا لأ — بس قلقتني من الأول وما قلتهاش.",
          urgent: false,
          location: "hotel_lobby",
        },
      },
    },

    // ── حدث 6: محتويات الخزنة ──
    {
      id: "ev_penthouse_safe_opened",
      trigger: { type: "puzzle_solved", puzzleId: "penthouse_safe" },
      action: {
        type: "unlock_location_item",
        location: "penthouse",
        item: {
          id: "ev_safe_contents",
          name: "محتويات الخزنة",
          type: "physical",
          position: { x: 50, y: 50 },
          radius: 10,
          content: `داخل الخزنة:

— مبلغ نقدي كبير بأوراق جديدة غير مستخدمة.

— ورقة بأرقام — نفس تنسيق الأرقام الموجودة في مكان آخر في التحقيق.

— صورة فوتوغرافية قديمة لشخصين في مكان يبدو كمستودع كبير. الوجوه واضحة. على ظهر الصورة بخط رصاص: "ميناء الإسكندرية — 2019."

— هاتف محمول قديم. الشاشة مكسورة. لما يتحلل في المختبر ممكن يطلع منه حاجة.`,
          tool: "flashlight",
        },
        message: null,
      },
    },

    // ── حدث 7: تحذير مجهول ──
    // مش تهديد مباشر — بس جملة غامضة
    {
      id: "ev_anonymous_warning",
      trigger: { type: "evidence_count", count: 5 },
      action: {
        type: "message",
        delay: 5000,
        message: {
          from: "رقم مجهول",
          fromRole: "غير معروف",
          text: "بعض الأشياء أكبر من قضية قتل واحدة.",
          urgent: false,
          location: null,
          isThreaten: false,
        },
      },
    },

  ],
};

// ════════════════════════════════════════════════════════════════
// الحوارات الجديدة — الشهود بيوصفوا مش بيسموا
// ════════════════════════════════════════════════════════════════

const STORY_DIALOGUES = {
  case_hotel_01: {

    // ── ريم بعد USB ──
    fired_ream: {
      after_usb: {
        id: "after_usb",
        text: "...شايف إنك لقيت الـ USB. أنا خبيته لأني خفت. بس في حاجة تانية ما قلتهاش لأي حد — شفتها الليلة دي.",
        options: [
          { text: "قولي اللي شوفتيه.", next: "what_saw" },
          { text: "ليه ما قلتيش للشرطة؟", next: "why_not_police" },
        ],
      },
      what_saw: {
        id: "what_saw",
        text: "في الممر الخلفي — الجزء اللي مش فيه كاميرات. شفت حد خارج من السلم الخدمي. الساعة كانت بعد الحادية عشرة بشوية. الشخص كان بيمشي بسرعة من غير ما يبص يمين أو شمال. زي ما هو عارف الطريق كويس.",
        options: [
          { text: "وصفه؟", next: "describe" },
          { text: "كان معاه حاجة؟", next: "carrying" },
        ],
      },
      describe: {
        id: "describe",
        text: "طويل. لابس جاكيت غامق. الشعر قصير. ما شفتش وجهه — كان بيمشي بظهره ناحيتي في البداية. بس لما اتلف — لحظة — شفت جزء من وجهه. ملامح عادية. بس عيونه... واثق جداً. مش خايف خالص.",
        options: [
          { text: "كان معاه حاجة؟", next: "carrying" },
          { text: "رجوع", next: "after_usb" },
        ],
      },
      carrying: {
        id: "carrying",
        text: "حاجة صغيرة في إيده. زي كيس أو حقيبة صغيرة. ما كانتش كبيرة. بس كان بيمسكها بطريقة... محتاط. مش زي حد بيشيل حاجة عادية.",
        options: [
          { text: "شكراً يا ريم.", next: "end" },
          { text: "رجوع", next: "after_usb" },
        ],
      },
      why_not_police: {
        id: "why_not_police",
        text: "لأني مش عارفة مين هو. ومش عارفة لو قلت — مين هيصدقني. أنا موظفة اتفصلت وعندها دافع — ده اللي هيقولوه. الكلام من غير دليل مش هيفيد.",
        options: [
          { text: "وصفه للي شفتيه.", next: "what_saw" },
          { text: "رجوع", next: "after_usb" },
        ],
      },
      end: {
        id: "end",
        text: "اللي شفته — شفته. التفسير ده دورك أنت.",
        options: [],
      },
    },

    // ── نادر بعد SIM ──
    security_nader: {
      after_sim: {
        id: "after_sim",
        text: "قلت للشرطة إني ما شفتش حد. ده مش كل الحقيقة. شفت حد — بس ما عرفتش أقول مين لأني مش متأكد. ودلوقتي بعد ما تحللتوا الشريحة...",
        options: [
          { text: "قولي اللي شفته.", next: "what_saw" },
          { text: "ليه مش متأكد؟", next: "why_unsure" },
        ],
      },
      what_saw: {
        id: "what_saw",
        text: "من شاشة المراقبة — قبل ما الكاميرات تتعطل — شفت حد داخل من المدخل الجانبي. اللي بيعرف يستخدمه بس موظفين الفندق والناس اللي زاروه قبل كده وعارفين المكان.",
        options: [
          { text: "وصفه؟", next: "describe" },
          { text: "إيمتى بالظبط؟", next: "timing" },
        ],
      },
      describe: {
        id: "describe",
        text: "الصورة مش واضحة — الإضاءة كانت خافتة. بس الجسم والمشية... شبه حد شايفه قبل كده في الفندق. مش قادر أقول أكتر من كده بضمير.",
        options: [
          { text: "إيمتى؟", next: "timing" },
          { text: "رجوع", next: "after_sim" },
        ],
      },
      timing: {
        id: "timing",
        text: "الساعة كانت 10:48 تقريباً. بعدها بدقيقتين الكاميرات اتعطلت. التوقيت ده مش مصادفة — لكن إثبات إن في علاقة بين الاتنين ده مش دوري.",
        options: [
          { text: "والاتصال اللي على الشريحة؟", next: "the_call" },
          { text: "رجوع", next: "after_sim" },
        ],
      },
      the_call: {
        id: "the_call",
        text: "جالي اتصال برقم مجهول قبل الحادثة بساعة وربع. الصوت كان هادي — قالي إن في شخص هيمر من الفندق الليلة وإني أبقى في غرفة المراقبة وما اتحركش. ما سألتش مين ولا ليه. خفت.",
        options: [
          { text: "الصوت — قديم ولا جديد عليك؟", next: "voice" },
          { text: "رجوع", next: "after_sim" },
        ],
      },
      voice: {
        id: "voice",
        text: "...سمعته قبل كده. في الفندق. بس مش قادر أربطه بوجه بثقة. لو سمعته تاني — هعرف.",
        options: [
          { text: "شكراً يا نادر.", next: "end" },
        ],
      },
      end: {
        id: "end",
        text: "اللي قلته — قلته. الباقي عليك.",
        options: [],
      },
    },

    // ── يوسف بيفتكر ──
    concierge: {
      remembers: {
        id: "remembers",
        text: "الليلة دي — قبل ما حاجة تحصل بساعتين تقريباً. في حد كان واقف في ركن اللوبي بيتكلم في التليفون. ما كنتش بادي بالي. بس جملة واحدة وصلتلي.",
        options: [
          { text: "إيه الجملة؟", next: "the_sentence" },
          { text: "الشخص ده — وصفه؟", next: "describe" },
        ],
      },
      the_sentence: {
        id: "the_sentence",
        text: `قال: "الساعة 11. زي ما اتفقنا." وبعدها قطع التليفون وانتظر شوية. بعدين مشى.`,
        options: [
          { text: "مشى فين؟", next: "where_went" },
          { text: "وصفه؟", next: "describe" },
        ],
      },
      where_went: {
        id: "where_went",
        text: "ناحية الجهة الجنوبية من اللوبي. اللي فيها أسانسير الخدمة والسلم الخلفي. مش ناحية الأسانسير الرئيسي.",
        options: [
          { text: "وصفه؟", next: "describe" },
          { text: "شكراً يا يوسف.", next: "end" },
        ],
      },
      describe: {
        id: "describe",
        text: "رجل. بدلة أو جاكيت أنيق — الإضاءة كانت خافتة. وقفته واثقة. مش زي حد بيزور لأول مرة. زي حد عارف المكان.",
        options: [
          { text: "الجملة اللي سمعتها؟", next: "the_sentence" },
          { text: "شكراً يا يوسف.", next: "end" },
        ],
      },
      end: {
        id: "end",
        text: "قلت اللي فاكره. ما أقدرش أزيد على كده.",
        options: [],
      },
    },

  },
};

// ════════════════════════════════════════════════════════════════
// النهايات — زي ما هي من النسخة الأولى
// ════════════════════════════════════════════════════════════════

const ENDINGS = {
  case_hotel_01: {

    perfect: {
      id: "perfect",
      title: "العدالة تحققت",
      subtitle: "القاتل أمام القضاء",
      condition: (answers, state) =>
        answers.q1 === 2 &&
        answers.q2 === 1 &&
        answers.q3 === 2 &&
        answers.q4 === 2 &&
        state.analyzedCount >= 5 &&
        state.firedEvents.has("ev_ream_usb_found"),
      narrative: `طارق منصور اعتُقل في مطار القاهرة وهو يحاول مغادرة البلاد.

شهادة ريم حسن — الوصف الدقيق الذي أعطته — تقاطع مع تسجيل كاميرا المصعد وتحليل شريحة SIM وأثر الـ piano wire.

ثلاثة خيوط منفصلة. كلها تنتهي عند نفس الشخص.

في قاعة المحكمة، لم ينطق بكلمة.

لكن في الجلسة الثانية — خرج ما كان مخفياً. رمزي عوض نفسه كان جزءاً من شبكة أكبر. شركاته كانت تُستخدم. علم بذلك واستمر.

القضية أُغلقت. لكن التحقيق الأكبر بدأ للتو.`,
      stars: 5,
      bgColor: "#0a1a0a",
      accentColor: "#22c55e",
    },

    truth_no_justice: {
      id: "truth_no_justice",
      title: "الحقيقة وحدها لا تكفي",
      subtitle: "المجرم حر — القضية مفتوحة",
      condition: (answers, state) =>
        answers.q2 === 1 &&
        state.analyzedCount < 4,
      narrative: `اتهمت الشخص الصح.

لكن المحامي طارق — وهو يعرف القانون جيداً — وجد ما يبحث عنه.

"الأدلة الظرفية وحدها لا تكفي."

خرج من قاعة المحكمة ببدلته الرمادية. لم يلتفت.

ريم غادرت البلاد. نادر طلب إجازة مفتوحة.

القضية لا تزال مفتوحة رسمياً.`,
      stars: 3,
      bgColor: "#1a1200",
      accentColor: "#f59e0b",
    },

    wrong_accusation: {
      id: "wrong_accusation",
      title: "بريء خلف القضبان",
      subtitle: "العدالة أُهينت",
      condition: (answers, state) =>
        answers.q2 !== 1 &&
        answers.q2 !== undefined,
      narrative: `من اتهمته — بريء.

الخيوط التي جمعتها لم تكن كافية للتمييز.

بعد ستة أشهر — ظهر شريط كاميرا من مدخل جانبي لم يُفحص. الصورة واضحة. الوجه واضح.

لكن القاتل الحقيقي كان قد اختفى منذ وقت طويل.

والبريء؟ قضى شهوراً في انتظار ما لم يأتِ.`,
      stars: 1,
      bgColor: "#1a0000",
      accentColor: "#dc2626",
    },

    moral_dilemma: {
      id: "moral_dilemma",
      title: "حين تكون الضحية مجرماً",
      subtitle: "سؤال بلا إجابة",
      condition: (answers, state) =>
        answers.q2 === 1 &&
        answers.q3 === 2 &&
        state.firedEvents.has("ev_penthouse_safe_opened") &&
        state.firedEvents.has("ev_lawyer_message"),
      narrative: `طارق منصور جلس أمامك ببرود.

لم يُنكر. لم يدافع. فقط نظر إليك طويلاً قبل أن يقول:

"أنت شفت الأوراق. شفت مين كان رمزي فعلاً."

لم يُكمل.

في قاعة المحكمة، حُكم عليه.

لكنك خرجت من القاعة تفكر في سؤال لم تجد له إجابة في أي ملف من الملفات.`,
      stars: 4,
      bgColor: "#0a0a1a",
      accentColor: "#8b5cf6",
    },

    partial_truth: {
      id: "partial_truth",
      title: "جزء من الصورة",
      subtitle: "القضية نصف محلولة",
      condition: (answers, state) =>
        (answers.q2 === 2 || answers.q2 === 3) &&
        answers.q1 === 2,
      narrative: `من اتهمته متورط — لكنه ليس من نفّذ.

هناك خيط لم تتبعه حتى النهاية.

القضية أُغلقت رسمياً.

لكن في الملف — في الزاوية اليمنى — كُتب بقلم رصاص:

"منفذ حقيقي — طليق."`,
      stars: 2,
      bgColor: "#0f0a08",
      accentColor: "#f97316",
    },

    default: {
      id: "default",
      title: "التحقيق غير مكتمل",
      subtitle: "أدلة غير كافية",
      condition: () => true,
      narrative: `القضية وُضعت في الأدراج.

"مؤجلة لحين ظهور أدلة جديدة."

الغرفة لا تزال مقفلة. الملف لا يزال مفتوحاً.

والحقيقة — لا تزال في مكان ما داخل فندق الأمير الكبير.`,
      stars: 0,
      bgColor: "#0a0a0a",
      accentColor: "#6b7280",
    },
  },
};

// ════════════════════════════════════════════════════════════════
// Story Event Engine
// ════════════════════════════════════════════════════════════════

function initStoryEvents(io, room) {
  const caseId = room.caseId;
  const events = STORY_EVENTS[caseId] || [];

  if (!room.storyState) {
    room.storyState = {
      firedEvents: new Set(),
      locationVisitCounts: {},
      npcStates: {},
      unlockedDialogues: {},
      unlockedItems: {},
    };
  }

  function checkAndFireEvents(trigger) {
    events.forEach(event => {
      if (room.storyState.firedEvents.has(event.id)) return;

      let shouldFire = false;

      switch (trigger.type) {
        case "evidence_found":
          shouldFire = event.trigger.type === "evidence_found" &&
            trigger.evidenceId === event.trigger.evidenceId;
          break;
        case "evidence_analyzed":
          shouldFire = event.trigger.type === "evidence_analyzed" &&
            trigger.evidenceId === event.trigger.evidenceId;
          break;
        case "location_visited":
          if (event.trigger.type === "location_visited" &&
              trigger.locationId === event.trigger.locationId) {
            const count = room.storyState.locationVisitCounts[trigger.locationId] || 0;
            shouldFire = count >= event.trigger.count;
          }
          break;
        case "puzzle_solved":
          shouldFire = event.trigger.type === "puzzle_solved" &&
            trigger.puzzleId === event.trigger.puzzleId;
          break;
        case "evidence_count":
          if (event.trigger.type === "evidence_count") {
            const total = (room.collectedEvidence?.length || 0) +
                          (room.analyzedEvidence?.length || 0);
            shouldFire = total >= event.trigger.count;
          }
          break;
      }

      if (shouldFire) {
        room.storyState.firedEvents.add(event.id);
        executeEvent(event, io, room);
      }
    });
  }

  function executeEvent(event, io, room) {
    const action = event.action;
    const delay = action.delay || 0;

    setTimeout(() => {
      // رسالة
      if (action.message) {
        io.to(`horror_${room.id}`).emit("horror_story_message", {
          eventId: event.id,
          message: action.message,
        });
      }

      // تغيير حالة NPC
      if (action.type === "npc_state_change" || action.npcId) {
        if (action.npcId) {
          room.storyState.npcStates[action.npcId] = action.newState;
        }
      }

      // فتح حوار
      if (action.unlocks?.type === "dialogue") {
        const { npcId, dialogueId } = action.unlocks;
        if (!room.storyState.unlockedDialogues[npcId]) {
          room.storyState.unlockedDialogues[npcId] = [];
        }
        if (!room.storyState.unlockedDialogues[npcId].includes(dialogueId)) {
          room.storyState.unlockedDialogues[npcId].push(dialogueId);
        }
        io.to(`horror_${room.id}`).emit("horror_dialogue_unlocked", { npcId, dialogueId });
      }

      // فتح دليل جديد
      if (action.unlocks?.type === "evidence") {
        const ev = action.unlocks.evidence;
        room.storyState.unlockedItems[ev.id] = ev;
        io.to(`horror_${room.id}`).emit("horror_item_unlocked", {
          type: "evidence",
          item: ev,
        });
      }

      // فتح عنصر في مكان
      if (action.type === "unlock_location_item") {
        room.storyState.unlockedItems[action.item.id] = {
          ...action.item,
          location: action.location,
        };
        io.to(`horror_${room.id}`).emit("horror_item_unlocked", {
          type: "location_item",
          location: action.location,
          item: action.item,
        });
      }

      console.log(`Story Event: ${event.id} — room: ${room.id}`);
    }, delay);
  }

  return { checkAndFireEvents };
}

// حساب النهاية
function calculateEnding(caseId, answers, room) {
  const endings = ENDINGS[caseId];
  if (!endings) return null;

  const state = {
    analyzedCount: room.analyzedEvidence?.length || 0,
    firedEvents: room.storyState?.firedEvents || new Set(),
    collectedCount: room.collectedEvidence?.length || 0,
  };

  const order = [
    endings.moral_dilemma,
    endings.perfect,
    endings.truth_no_justice,
    endings.partial_truth,
    endings.wrong_accusation,
    endings.default,
  ];

  for (const ending of order) {
    if (ending.condition(answers, state)) return ending;
  }

  return endings.default;
}

// horror_npc_choose_option — تعديل يدعم الحوارات المفتوحة بالأحداث
function resolveNpcDialogue(caseId, npcId, dialogueId, room) {
  const storyDialogues = STORY_DIALOGUES[caseId]?.[npcId];
  if (storyDialogues?.[dialogueId]) {
    return storyDialogues[dialogueId];
  }
  // fallback للحوارات الأصلية في caseData
  const caseData = HORROR_CASES[caseId];
  const npc = caseData?.npcs?.find(n => n.id === npcId);
  return npc?.dialogues?.find(d => d.id === dialogueId) || null;
}

module.exports = {
  STORY_EVENTS,
  STORY_DIALOGUES,
  ENDINGS,
  initStoryEvents,
  calculateEnding,
  resolveNpcDialogue,
};