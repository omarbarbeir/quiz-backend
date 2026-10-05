/**
 * ================================================
 * horrorServer.js — النسخة المحدّثة الكاملة
 * التعديلات المضافة:
 * 1. horror_npc_choose_option — متابعة حوار NPC
 * 2. horror_room_light_toggled — يُرسل لكل اللاعبين
 * 3. horror_examine — فحص الأدلة مع التحقق من الأداة
 * 4. horror_send_to_lab — إرسال دليل للمختبر
 * 5. horror_solve_case — حل القضية
 * 6. horror_add_connection / horror_remove_connection — لوحة التحقيق
 * 7. horror_solve_puzzle — حل الألغاز
 * 8. horror_change_case — تغيير القضية
 * ================================================
 */

const {
  STORY_EVENTS,
  STORY_DIALOGUES,
  ENDINGS,
  initStoryEvents,
  calculateEnding,
  resolveNpcDialogue,
} = require("./storyEvents");

const HORROR_CASES = {
  case_hotel_01: {
    id: "case_hotel_03",
    title: "غرفة 1408",
    description: "رجل الأعمال رمزي عوض وُجد ميتاً في جناح البنتهاوس بفندق الأمير الكبير، والفندق مغلق أمام الصحافة، والإدارة تتكتم.",
    location: "crime_scene",
    requiredEvidence: 6,

    questions: [
      { id: "q1", text: "ما الطريقة الحقيقية التي قُتل بها رمزي عوض؟", options: ["سقط من الشرفة بعد نزاع","أُعطي جرعة زائدة من الدواء ثم رُميت الجثة","خُنق بحبل ودُبِّر المشهد ليبدو انتحاراً","تسمم بالنبيذ المسموم في المينيبار"] },
      { id: "q2", text: "من الذي دبَّر عملية القتل؟", options: ["ليلى عوض — الزوجة","طارق منصور — الشريك التجاري","نادين سرحان — المدير التنفيذية","كمال الديب — رجل الأعمال المنافس"] },
      { id: "q3", text: "ما الدافع الحقيقي وراء الجريمة؟", options: ["الإرث والأصول المالية","صفقة مخدرات مخفية في الشركة","وثائق تُجرِّم مسؤولين كباراً","انتقام شخصي بسبب خيانة"] },
      { id: "q4", text: "من الشريك الثاني في التنفيذ؟", options: ["نادر — موظف الأمن","يوسف — الكونسيرج","لا يوجد شريك","سائق رمزي الخاص"] },
      { id: "q5", text: "أين يوجد الدليل المادي الأهم الذي يثبت الجريمة؟", options: ["داخل خزنة الجناح","في السيارة الخاصة لرمزي","في غرفة خادمة الفندق","مخبأ في مطبخ الطابق العاشر"] },
    ],

    correctAnswers: { q1: 2, q2: 1, q3: 2, q4: 0, q5: 0 },

    npcs: [
      {
        id: "hotel_manager",
        name: "مدير الفندق — أنطوان خوري",
        avatar: "🤵",
        photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&q=80",
        location: "hotel_lobby",
        dialogues: [
          { id: "intro", text: "أهلاً... أنا أنطوان خوري، مدير فندق الأمير الكبير. آسف على التأخر، كانت ليلة صعبة جداً. أنا في تصرفك الكامل — نحن نريد حل هذه القضية بهدوء تام.", options: [{ text: "إيه اللي حصل بالظبط في الليلة دي؟", next: "night_events" },{ text: "مين آخر واحد شاف رمزي عوض حي؟", next: "last_seen" },{ text: "الفندق فيه كاميرات؟", next: "cameras" },{ text: "شكراً، هرجعلك.", next: "end" }] },
          { id: "night_events", text: "السيد رمزي وصل الساعة 7 مساءً بالطائرة الخاصة. طلب جناح البنتهاوس زي كل مرة. الأغرب... إنه في الساعة 11 إلا ربع طلب موظف الروم سيرفس يجيبله زجاجة نبيذ محددة — Château Margaux 2009 — وقال ما حدش يكلمه بعد كده.", options: [{ text: "النبيذ ده طُلب منين؟", next: "wine_source" },{ text: "مين اللي وصّل النبيذ؟", next: "wine_delivery" },{ text: "رجوع", next: "intro" }] },
          { id: "wine_source", text: "من مخزن الفندق... لكن الزجاجة دي اتطلبت بشكل خاص قبل وصوله بيوم. طلبها حد عبر الإيميل بصفته السيد رمزي. بس أنا بدأت أشك لأن الإيميل ده جه من حساب عام مش الحساب الخاص بتاعه.", options: [{ text: "عندك الإيميل ده؟", next: "email_clue" },{ text: "رجوع", next: "intro" }] },
          { id: "email_clue", text: "إيه... بس القسم القانوني للفندق قالي ما أديش أي ورق للتحقيق من غير أمر رسمي. معذرة. بس... غير رسمي؟ الإيميل جه من جهاز داخل الفندق نفسه. من الطابق العاشر.", options: [{ text: "الطابق العاشر فيه إيه؟", next: "floor_ten" },{ text: "رجوع", next: "intro" }] },
          { id: "floor_ten", text: "الطابق العاشر فيه مكاتب إدارية وغرف الموظفين الكبار. الكونسيرج يوسف بيشتغل هناك. وبرضو... في أوضة موظفة كانت بتشتغل هنا وانهى خدمتها رمزي شخصياً قبل 3 شهور.", options: [{ text: "اسمها إيه؟", next: "fired_employee" },{ text: "رجوع", next: "intro" }] },
          { id: "fired_employee", text: "ريم... ريم حسن. بتقول إنه فصلها ظلماً بعد ما اكتشفت حاجة ما كانتش المفروض تشوفها في أوراقه. هي لسه موجودة في الفندق... طالبة تاخد حاجاتها من الأوضة اللي كانت فيها.", options: [{ text: "شكراً، مهم جداً.", next: "intro" }] },
          { id: "last_seen", text: "آخر شخص شافه رسمياً هو يوسف الكونسيرج — الساعة 10 مساءً في اللوبي. بس في موظف أمن اسمه نادر يقول إنه شاف حد داخل البنتهاوس الساعة 11 ونص، من السلم الخلفي.", options: [{ text: "السلم الخلفي — مين عنده وصول ليه؟", next: "back_stairs" },{ text: "رجوع", next: "intro" }] },
          { id: "back_stairs", text: "من المفروض موظفي الأمن والخدمة بس. لكن المفتاح الرقمي بتاعه اتبرمج 3 مرات خلال الأسبوع اللي فات. ومرة واحدة تسجيل الدخول كان الساعة 3 الفجر. دي معلومة بشكل رسمي مش موجودة — أنا بقولك من باب التعاون.", options: [{ text: "شكراً على الصراحة.", next: "intro" }] },
          { id: "cameras", text: "في كاميرات في كل حتة... ماعدا السلم الخلفي والممر الجانبي للبنتهاوس. اتعطلوا من أسبوع. وطلبنا صيانة... بس للأسف الطلب مش موجود في السيستم.", options: [{ text: "يعني حد مسح الطلب؟", next: "deleted_request" },{ text: "رجوع", next: "intro" }] },
          { id: "deleted_request", text: "ممكن... ومن يملك صلاحية حذف الطلبات هي المديرة التنفيذية نادين سرحان. بس أنا مش بتهمها — ده مجرد رد على سؤالك.", options: [{ text: "تمام، شكراً.", next: "intro" }] },
          { id: "wine_delivery", text: "بوي اسمه عمر خليل وصّلها. كان عادي جداً — زجاجة مغلقة على طبق فضي. هو مش متهم في حاجة.", options: [{ text: "رجوع", next: "intro" }] },
          { id: "end", text: "أنا هنا طول الوقت. أي حاجة تحتاجها — كلمني.", options: [] }
        ]
      },
      {
        id: "concierge",
        name: "يوسف — الكونسيرج",
        avatar: "🛎️",
        photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80",
        location: "hotel_lobby",
        dialogues: [
          { id: "intro", text: "أنا يوسف... خدمت السيد رمزي 6 سنين كل ما يجي الفندق. ده مش مجرد نزيل بالنسبة لي. ده راجل بيعرفني بالاسم وبيسأل عن أهلي. خبر وفاته... صعب عليا جداً.", options: [{ text: "إيه آخر مرة اتكلمت معاه؟", next: "last_talk" },{ text: "حد غريب شفته الليلة دي؟", next: "strangers" },{ text: "تعرف طارق منصور؟", next: "tariq" },{ text: "شكراً يا يوسف.", next: "end" }] },
          { id: "last_talk", text: "الساعة 10 مساءً. قالي 'يوسف، لو حد سأل عني الليلة قل إني تعبان ومش شايف حد.' ده مش كلامه العادي. حسيت إنه خايف من حاجة. جبهته كانت عرقانة.", options: [{ text: "قال إيه تاني؟", next: "more_talk" },{ text: "رجوع", next: "intro" }] },
          { id: "more_talk", text: "حاول يعمل نفسه تمام. بس قبل ما يمشي قالي بالهمس: 'لو حصلي حاجة، في ورقة في الكتاب الأزرق.' أنا ما فهمتش يقصد إيه وقتها.", options: [{ text: "الكتاب الأزرق؟ فين؟", next: "blue_book" },{ text: "رجوع", next: "intro" }] },
          { id: "blue_book", text: "في الجناح كان بيحب يقرأ. كان دايماً معاه كتاب أزرق الغلاف — نوع الدفتر اللي الصفحات فيه مسطرة. ما شفتوش بعد الحادثة. ممكن لسه في الجناح... أو اتاخد.", options: [{ text: "شكراً، ده مهم.", next: "intro" }] },
          { id: "strangers", text: "في راجل وقف في اللوبي قرب الساعة 11 ليلاً — بدلة رمادية، واقف بيتكلم في الموبايل وعينيه مش بتتركوا الأسانسير. لما اتحرك راح ناحية السلم الخلفي مش الباب الرئيسي.", options: [{ text: "عرفت مين هو؟", next: "stranger_id" },{ text: "رجوع", next: "intro" }] },
          { id: "stranger_id", text: "لا مش عارفه. بس لما شوفت الصور في نشرة الأخبار بعدين... وجهه قرّب من وجه حد رأيته مع السيد رمزي في اجتماع هنا الأسبوع اللي فات. كان جنب طارق منصور.", options: [{ text: "مهم جداً — شكراً.", next: "intro" }] },
          { id: "tariq", text: "طارق منصور... بييجي مع السيد رمزي أحياناً. بس في المرة الأخيرة الأسبوع اللي فات، صوتهم اتعلى في الاجتماع. ما عرفتش تفاصيل بس سمعت رمزي بيقول 'أنت بتهددني؟' وطارق رد بهدوء مخيف: 'أنا بس بقولك الخيارات.'", options: [{ text: "الاجتماع ده كان فين؟", next: "meeting_place" },{ text: "رجوع", next: "intro" }] },
          { id: "meeting_place", text: "في غرفة الاجتماعات في الطابق 5. الغرفة دي بتتأجر بالساعة للزبائن الكبار. عندي رقم الحجز لو محتاجه.", options: [{ text: "إيه رقم الحجز؟", next: "booking_num" },{ text: "رجوع", next: "intro" }] },
          { id: "booking_num", text: "HGR-2208. الاجتماع اتحجز باسم طارق منصور ودفعه نقداً. الغريب إن الأوضة اتحجزت قبل وصول رمزي بيوم — يعني طارق كان عارف هييجي.", options: [{ text: "شكراً يا يوسف.", next: "intro" }] },
          { id: "end", text: "أنا هنا لو في أي حاجة. ربنا يرحمه.", options: [] }
        ]
      },
      {
        id: "security_nader",
        name: "نادر — موظف الأمن",
        avatar: "💂",
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
        location: "security_room",
        dialogues: [
          { id: "intro", text: "أيوه؟ أنا نادر، مسؤول الأمن الليلي. اتكلموا معايا أمبارح كتير. حكيت اللي شفته وبس.", options: [{ text: "إيه اللي شفته بالظبط؟", next: "saw_what" },{ text: "أنت كنت فين الساعة 11 ليلاً؟", next: "location_11" },{ text: "الكاميرات عطلانة — إيه اللي حصل؟", next: "cameras_broken" },{ text: "تمام، شكراً.", next: "end" }] },
          { id: "saw_what", text: "شفت حد داخل من السلم الخلفي — الباب اللي المفروض يبقى مقفول بعد الـ 10 بالليل. الشخص كان لابس ملابس غامقة، ماشي بسرعة ومعاه حاجة في إيده — زي كيس صغير أو شنطة.", options: [{ text: "عرفت مين هو؟", next: "who_person" },{ text: "بلغت؟", next: "reported" },{ text: "رجوع", next: "intro" }] },
          { id: "who_person", text: "لا... الإضاءة كانت خافتة. بس كان واضح إنه راجل، طويل الشعر شوية، وكان بيعرف الطريق كويس — مشيش كده كده، عرف يروح فين.", options: [{ text: "رجوع", next: "intro" }] },
          { id: "reported", text: "بلغت نادين هانم — المديرة التنفيذية. قالتلي 'دي مشكلة صغيرة هتتحل، ما تكتبش تقرير.' أنا كنت هكتب بس... قالتلي بشكل واضح إن مستقبلي في الفندق يعتمد على تعاوني.", options: [{ text: "ده تهديد واضح — هل عندك أي إثبات؟", next: "proof_threat" },{ text: "رجوع", next: "intro" }] },
          { id: "proof_threat", text: "في رسالة واتساب بيننا. بس موبايلي اتسرق من غرفتي الأسبوع اللي فات. ومش عارف مين. كل اللي عندي دلوقتي إن في ساعة في البنتهاوس — ساعة حيط قديمة — كانت وقفت على 11:47. وده الوقت اللي سمعت فيه صوت غريب من فوق.", options: [{ text: "صوت زي إيه؟", next: "strange_sound" },{ text: "رجوع", next: "intro" }] },
          { id: "strange_sound", text: "مش صوت إطلاق نار... زي صوت كرسي اتكسر أو حاجة اتحطت بقوة. بعدها سكت تماماً. مرحتش أتأكد — نادين هانم كانت في المبنى وما كنتش عايز ترساني.", options: [{ text: "شكراً يا نادر، ده مهم.", next: "intro" }] },
          { id: "location_11", text: "كنت في غرفة المراقبة — الكاميرات. بس الشاشات الخاصة بالطابق 14 والطريق الخلفي كانت سودة. قلقت بس فكرت عطل تقني.", options: [{ text: "تقدر تعرف مين عطّلها؟", next: "who_disabled" },{ text: "رجوع", next: "intro" }] },
          { id: "who_disabled", text: "الوصول لسيستم الكاميرات محتاج باسورد خاص. عندي باسوردي وعند نادين هانم بس. مش هينفع أتهمها بدون دليل... بس الحسبة بسيطة.", options: [{ text: "تمام، فهمت.", next: "intro" }] },
          { id: "cameras_broken", text: "الكاميرات اتعطلت فجأة الساعة 10:50 ليلاً. أنا حاولت أعيد الشبكة بس مفيش رد. اللي بيقدر يعمل كده لازم يكون عارف إزاي يدخل على الـ DVR الرئيسي — وده في غرفة مغلقة في الطابق الأرضي.", options: [{ text: "رجوع", next: "intro" }] },
          { id: "end", text: "أنا قلت اللي عندي. أنا بس موظف عادي — ماعنديش أعداء.", options: [] }
        ]
      },
      {
        id: "exec_nadine",
        name: "نادين سرحان — المديرة التنفيذية",
        avatar: "👩‍💼",
        photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80",
        location: "hotel_office",
        dialogues: [
          { id: "intro", text: "أنا نادين سرحان، المديرة التنفيذية لمجموعة عوض القابضة. أنا هنا لأتعاون مع التحقيق، ولكن أطلب الاحترام المهني في الأسئلة.", options: [{ text: "ما علاقتك برمزي عوض؟", next: "relation" },{ text: "فين كنتِ ليلة الحادثة؟", next: "alibi" },{ text: "إيه اللي تعرفيه عن طارق منصور؟", next: "tariq_info" },{ text: "شكراً على وقتك.", next: "end" }] },
          { id: "relation", text: "عملت مع رمزي 12 سنة. هو اللي بنى الشركة وأنا اللي خليتها تشتغل. كنا شريكين في الفكر... على مستوى مهني بالكامل.", options: [{ text: "بس في شائعات عن خلافات بينكم؟", next: "disputes" },{ text: "رجوع", next: "intro" }] },
          { id: "disputes", text: "شائعات؟ في أي عمل كبير في خلافات. رمزي اتخذ قرار ببيع جزء من أسهم الشركة لطارق منصور بدون مشاورتي. ده كان... مزعج. بس ما خلانيش أتصرف بغير الطريق القانوني.", options: [{ text: "إيه الطريق القانوني اللي اتخدته؟", next: "legal_action" },{ text: "رجوع", next: "intro" }] },
          { id: "legal_action", text: "وكّلت محامي لمراجعة عقود الشراكة. ولقينا إن طارق وقّع على وثائق فيها بنود مخالفة للقانون. كنا هنتخذ خطوات... لو رمزي ما ماتش.", options: [{ text: "الوثائق دي فين دلوقتي؟", next: "documents_now" },{ text: "رجوع", next: "intro" }] },
          { id: "documents_now", text: "في مكتبي... في الخزنة. وأنا مش هافتحها من غير أمر قضائي. ده حق قانوني.", options: [{ text: "طيب، هنتدبر أمرنا.", next: "intro" }] },
          { id: "alibi", text: "كنت في اجتماع فيديو مع شركاء في دبي من الساعة 9 لحد منتصف الليل. في تسجيل كامل.", options: [{ text: "منتصف الليل بالظبط؟", next: "exact_time" },{ text: "رجوع", next: "intro" }] },
          { id: "exact_time", text: "من 9 مساءً لـ 12:05 بالضبط. أنا كنت في أوضتي في الفندق — نعم أنا برضو نزيلة هنا في نفس الليلة. الأوضة 1012.", options: [{ text: "نفس الطابق العاشر؟", next: "floor_ten_r" },{ text: "رجوع", next: "intro" }] },
          { id: "floor_ten_r", text: "مصادفة بحتة. أنا دايماً بنزل في الطابق ده لما بييجي للفندق في اجتماعات.", options: [{ text: "تمام.", next: "intro" }] },
          { id: "tariq_info", text: "طارق منصور رجل طموح جداً. بس طموحه أكبر من أخلاقه. عارفه من سنين — كان موردنا الأساسي وبعدين أصبح شريكاً. رمزي وثق فيه أكتر اللازم.", options: [{ text: "طارق كان عنده دافع للقتل؟", next: "tariq_motive" },{ text: "رجوع", next: "intro" }] },
          { id: "tariq_motive", text: "رمزي اكتشف إن طارق بيستخدم قنوات الشركة في أعمال غير مشروعة. وكان هيمشيه ويتخذ إجراءات قانونية. طارق كان عارف ده وقتها. في ورقة — إيميل — بعتها رمزي لمحاميه قبل موته بيومين. الإيميل ده لو اتحصل عليه هو الدليل.", options: [{ text: "عندك نسخة منه؟", next: "email_copy" },{ text: "رجوع", next: "intro" }] },
          { id: "email_copy", text: "ما عنديش. بس أنا عارفة إن رمزي بيعمل نسخ من كل إيميل مهم يحطها في كمبيوتره الشخصي — اللي اتاخد من الجناح بعد الحادثة.", options: [{ text: "اتاخد مين؟", next: "laptop_who" },{ text: "رجوع", next: "intro" }] },
          { id: "laptop_who", text: "ده سؤالك أنت مش أنا. أنا بس محتاجة تعرف إن اللاب توب ده فيه كل حاجة. كل حاجة.", options: [{ text: "شكراً على المعلومة.", next: "intro" }] },
          { id: "end", text: "أنا متعاونة بالكامل... في حدود القانون.", options: [] }
        ]
      },
      {
        id: "fired_ream",
        name: "ريم حسن — الموظفة المفصولة",
        avatar: "😰",
        photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80",
        location: "hotel_staff_room",
        dialogues: [
          { id: "intro", text: "...مين أنت؟ أنا جيت بس آخد حاجاتي. مش عايزة مشاكل. رمزي فصلني وخلاص... بس ده مش معناه إني سعيدة إنه مات.", options: [{ text: "إيه اللي شوفتيه وخلاه يفصلك؟", next: "what_saw" },{ text: "أنا مش هنا أتهمك، بس محتاج مساعدتك.", next: "need_help" },{ text: "تمام، مش هزعجك أكتر.", next: "end" }] },
          { id: "need_help", text: "...أنا مش واثقة أتكلم. لو كلامي راح لطارق منصور — أنا خلاص. هو مش رجل بيسمح بشهود.", options: [{ text: "أنا محقق مستقل. كلامك هيبقى سري.", next: "secret_info" },{ text: "رجوع", next: "intro" }] },
          { id: "secret_info", text: "قبل ما أتكلم... في مكان في الأوضة دي في حاجة أنا خبيتها. كنت عايزة أعمل بيها حاجة بس خفت. لو أخدت الحاجة دي ووعدت تحميني — هأفضل معاك.", options: [{ text: "وين الحاجة دي؟", next: "hidden_item" },{ text: "رجوع", next: "intro" }] },
          { id: "hidden_item", text: "وراء الرف التاني من فوق في الدولاب — في كيس بلاستيك صغير. ده USB فيه نسخ من وثائق إمضائها طارق منصور على صفقات وهمية. أنا نسختهم لما كنت بعمل أرشفة.", options: [{ text: "ده أهم دليل في القضية. شكراً.", next: "gratitude" },{ text: "رجوع", next: "intro" }] },
          { id: "gratitude", text: "بس أنا محتاجة ضمان. طارق مش هيتردد. أنا شفت بعيني... شفت حد يشبهه داخل الفندق الليلة دي. ومكنتش وحده.", options: [{ text: "مين كان معاه؟", next: "accomplice" },{ text: "رجوع", next: "intro" }] },
          { id: "accomplice", text: "راجل أنا شايفاه قبل كده مع نادر الحارس — كانوا بيتكلموا في الدهليز الخلفي قبل أسبوع. ومعاه حاجة في إيده زي عبوة صغيرة... مش عارفة إيه بالظبط.", options: [{ text: "نادر متورط؟", next: "nader_involved" },{ text: "رجوع", next: "intro" }] },
          { id: "nader_involved", text: "مش عارفة. ممكن يكون بيعمل حاجة تانية. بس اللي أنا متأكدة منه إن نادر كان خايف. وجهه كان أبيض لما شافني.", options: [{ text: "شكراً يا ريم.", next: "intro" }] },
          { id: "what_saw", text: "لقيت ورقة على مكتب رمزي لما كنت بأرتب — فيها أرقام حسابات بنكية ومبالغ ضخمة بيتحول بيها لحسابات في الخارج. الأرقام دي بنفس اسم شركة طارق منصور. لما رمزي عرف إني شفتها... فصلني من ساعتها.", options: [{ text: "حفظتِ أي حاجة من الورقة دي؟", next: "memorized" },{ text: "رجوع", next: "intro" }] },
          { id: "memorized", text: "صورتها بموبايلي قبل ما رمزي يطلب مني أسلمها. الصورة دي موجودة في الكلاود — بس ما قدرتش أوصلها من غير إنترنت الفندق اللي اتقطع فجأة في الليلة دي.", options: [{ text: "الصورة دي ممكن تغير كل حاجة.", next: "intro" }] },
          { id: "end", text: "روح معاك، أنا مش قادرة أتكلم أكتر.", options: [] }
        ]
      }
    ],

    suspects: [
      { id: "sus_h01", name: "طارق منصور", image: "🕴️", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80", color: "#dc2626", age: "48 سنة", job: "شريك تجاري", description: "الشريك التجاري — طموح، بارد الأعصاب، ولديه الأكثر لخسارته." },
      { id: "sus_h02", name: "ليلى عوض", image: "👒", photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80", color: "#f59e0b", age: "49 سنة", job: "زوجة الضحية", description: "الزوجة — وارثة الثروة، وتعلم بالخيانة المالية." },
      { id: "sus_h03", name: "نادين سرحان", image: "👩‍💼", photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80", color: "#8b5cf6", age: "44 سنة", job: "مديرة تنفيذية", description: "المديرة التنفيذية — لديها صلاحيات وخلافات واضحة." },
      { id: "sus_h04", name: "نادر الحارس", image: "💂", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80", color: "#0ea5e9", age: "35 سنة", job: "موظف أمن", description: "موظف الأمن — شاهد عيان، ومتناقض في روايته." },
      { id: "sus_h05", name: "ريم حسن", image: "😰", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80", color: "#22c55e", age: "31 سنة", job: "موظفة سابقة", description: "الموظفة المفصولة — غاضبة ولديها معلومات خطيرة." },
      { id: "sus_h06", name: "الرجل الغامض", image: "🎭", photo: null, color: "#f97316", age: "مجهول", job: "مجهول", description: "شخص مجهول رصده يوسف وريم في نفس الليلة." }
    ],

    evidenceList: [
      { id: "ev_h01", name: "زجاجة النبيذ — Château Margaux 2009", content: "زجاجة النبيذ الموجودة في الجناح. التحليل يظهر وجود مادة Succinylcholine — عضلة مشلة سريعة الأثر وغير قابلة للكشف في التحليل الروتيني. الجرعة كافية لشل الجهاز التنفسي.", type: "physical", location: "penthouse", tool: "flashlight", position: { x: 65, y: 55 }, radius: 8 },
      { id: "ev_h02", name: "الكتاب الأزرق — مذكرات رمزي", content: "دفتر أزرق مخبأ خلف اللوحة في الجناح. آخر ما كُتب:\n\n'طارق يعرف عن الملفات. قال لي بوضوح: إما أن تتنازل أو أجد طريقة. أنا خايف. بعتّ نسخة من كل حاجة لمحامي — كوريه للنجاة.'\n\nالتاريخ: يوم قبل الوفاة.", type: "physical", location: "penthouse", tool: "uv", position: { x: 30, y: 35 }, radius: 7 },
      { id: "ev_h03", name: "رسالة الإيميل المجهولة", content: "إيميل أُرسل من حساب عام (protonmail) لموظف الروم سيرفس يطلب الزجاجة المحددة. الـ IP الأصلي يعود لشبكة WiFi داخلية في الطابق العاشر. رقم الجهاز يطابق لاب توب مسجل باسم 'T. Mansour' في سجلات ضيوف الأسبوع الماضي.", type: "digital", location: "hotel_office", tool: "uv", position: { x: 50, y: 60 }, radius: 7 },
      { id: "ev_h04", name: "USB — ريم حسن", content: "USB مخبأ في غرفة الموظفين. يحتوي على 47 وثيقة مالية موقعة من طارق منصور تُثبت تحويلات غير مشروعة بقيمة 340 مليون جنيه عبر شركات وهمية. كل الوثائق تحمل ختم شركة عوض القابضة.", type: "digital", location: "hotel_staff_room", tool: "flashlight", position: { x: 22, y: 75 }, radius: 8 },
      { id: "ev_h05", name: "تقرير الكاميرات — فجوة الـ 42 دقيقة", content: "سجلات النظام تُظهر إن الكاميرات في الطابق 14 والمسار الخلفي أُغلقت يدوياً الساعة 10:50 وأُعيد تشغيلها 11:32 ليلاً — فجوة 42 دقيقة. كلمة المرور المستخدمة تعود لمستخدم رقم 002 وهو حساب نادين سرحان.", type: "digital", location: "security_room", tool: "uv", position: { x: 70, y: 45 }, radius: 7 },
      { id: "ev_h06", name: "الساعة الحائط — وقفت على 11:47", content: "ساعة حيط قديمة في جناح البنتهاوس. وقفت على الساعة 11:47 بعد أن اصطدمت بجسم ساقط. السطح الخلفي للساعة يحمل بصمة جزئية — 3 أصابع — لا تطابق رمزي ولا أي موظف رسمي.", type: "physical", location: "penthouse", tool: "uv", position: { x: 80, y: 25 }, radius: 6 },
      { id: "ev_h07", name: "إيصال دفع نقدي — غرفة اجتماعات", content: "إيصال ورقي بحجز غرفة الاجتماعات HGR-2208 بتاريخ قبل الحادثة بيوم. مدفوع نقداً بدون بطاقة. اسم الحاجز: Tariq M. الكاتبة التي استلمت الدفع تتذكر إن المبلغ كان كاملاً ومعاه إكرامية كبيرة — وكان مستعجلاً.", type: "physical", location: "hotel_lobby", tool: "flashlight", position: { x: 45, y: 70 }, radius: 7 },
      { id: "ev_h08", name: "شريحة SIM مكسورة", content: "شريحة SIM مكسورة وُجدت خلف مرآة الحمام في الجناح. الرقم المسجل عليها من خلال قاعدة البيانات يعود لهاتف مسبق الدفع. آخر مكالمة أُجريت منه كانت للحارس نادر — قبل الحادثة بساعة وربع.", type: "physical", location: "penthouse", tool: "uv", position: { x: 55, y: 80 }, radius: 6 }
    ],

    // صور الأماكن — مؤقتة من Unsplash
    locationImages: {
      dark: {
        hotel_entrance:   "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80",
        hotel_lobby:      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
        hotel_corridor:   "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=1200&q=80",
        penthouse:        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80",
        hotel_office:     "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
        security_room:    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
        hotel_staff_room: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=1200&q=80",
        hotel_restaurant: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
        lab:              "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1200&q=80",
        police_station:   "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=1200&q=80",
      },
      lit: {
        hotel_entrance:   "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80",
        hotel_lobby:      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80",
        hotel_corridor:   "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=80",
        penthouse:        "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80",
        hotel_office:     "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&q=80",
        security_room:    "https://images.unsplash.com/photo-1587302986-7eb89793cd3a?w=1200&q=80",
        hotel_staff_room: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=80",
        hotel_restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
        lab:              "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1200&q=80",
        police_station:   "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&q=80",
      }
    },

    // صور الأدلة
    evidenceImages: {
      ev_h01: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
      ev_h02: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80",
      ev_h03: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
      ev_h04: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&q=80",
      ev_h05: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80",
      ev_h06: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=80",
      ev_h07: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80",
      ev_h08: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&q=80",
    },

    map: {
      hotel_entrance: {
        name: "مسرح الجريمة — مدخل الفندق",
        connections: ["hotel_lobby", "security_room"],
        type: "crime_scene",
        ambient: "outside",
        interactables: [
          { id: "light_switch_entrance", type: "light_switch", x: 8, y: 6, radius: 6, label: "مفتاح النور" }
        ]
      },
      hotel_lobby: {
        name: "مسرح الجريمة — اللوبي الرئيسي",
        connections: ["hotel_entrance", "hotel_corridor", "hotel_office", "lab", "police_station"],
        type: "crime_scene",
        ambient: "morgue_drip",
        interactables: [
          { id: "light_switch_lobby", type: "light_switch", x: 7, y: 5, radius: 6, label: "مفتاح النور" },
          { id: "npc_hotel_manager", type: "npc", npcId: "hotel_manager", x: 60, y: 50, radius: 12, label: "أنطوان خوري" },
          { id: "npc_concierge", type: "npc", npcId: "concierge", x: 30, y: 55, radius: 12, label: "يوسف الكونسيرج" }
        ]
      },
      hotel_corridor: {
        name: "مسرح الجريمة — ممر الفندق",
        connections: ["hotel_lobby", "penthouse", "hotel_restaurant", "hotel_staff_room"],
        type: "crime_scene",
        ambient: "morgue_hum",
        interactables: [
          { id: "light_switch_corridor", type: "light_switch", x: 92, y: 8, radius: 6, label: "مفتاح النور" }
        ]
      },
      penthouse: {
        name: "مسرح الجريمة — جناح البنتهاوس",
        connections: ["hotel_corridor"],
        type: "crime_scene",
        ambient: "morgue_drip",
        interactables: []
      },
      hotel_restaurant: {
        name: "مسرح الجريمة — مطعم الفندق",
        connections: ["hotel_corridor"],
        type: "crime_scene",
        ambient: "morgue_hum",
        interactables: []
      },
      hotel_staff_room: {
        name: "مسرح الجريمة — غرف الموظفين",
        connections: ["hotel_corridor", "hotel_office"],
        type: "crime_scene",
        ambient: "morgue_drip",
        interactables: [
          { id: "npc_ream", type: "npc", npcId: "fired_ream", x: 50, y: 55, radius: 12, label: "ريم حسن" }
        ]
      },
      hotel_office: {
        name: "مسرح الجريمة — المكاتب الإدارية",
        connections: ["hotel_lobby", "hotel_staff_room", "lab"],
        type: "crime_scene",
        ambient: "morgue_hum",
        interactables: [
          { id: "light_switch_office", type: "light_switch", x: 85, y: 10, radius: 6, label: "مفتاح النور" },
          { id: "npc_nadine", type: "npc", npcId: "exec_nadine", x: 70, y: 45, radius: 12, label: "نادين سرحان" }
        ]
      },
      security_room: {
        name: "مسرح الجريمة — غرفة الأمن",
        connections: ["hotel_entrance", "lab"],
        type: "crime_scene",
        ambient: "police_chatter",
        interactables: [
          { id: "npc_nader", type: "npc", npcId: "security_nader", x: 40, y: 50, radius: 12, label: "نادر الأمن" }
        ]
      },
      lab: {
        name: "المختبر الجنائي",
        connections: ["hotel_lobby", "hotel_office", "security_room", "police_station"],
        type: "lab",
        ambient: "lab",
        interactables: []
      },
      police_station: {
        name: "قسم البوليس",
        connections: ["lab", "hotel_lobby"],
        type: "police_station",
        ambient: "police_chatter",
        interactables: []
      }
    },

    puzzles: {
      penthouse_safe: {
        id: "penthouse_safe",
        location: "penthouse",
        type: "number_pad",
        code: "1147",
        hint: "الوقت اللي وقفت عنده الساعة الحائط.",
        description: "خزنة الجناح — أرقام سرية",
        unlocked: false
      }
    },

    forensicReports: {
      ev_h01: { title: "تقرير سم زجاجة النبيذ", content: "مادة Succinylcholine — مشل عضلي — بتركيز 4 مرات أعلى من الجرعة الطبية. المادة دي مش بتظهر في التحليل الجنائي العادي. اللي بيعرفها غالباً شخص بخلفية طبية أو له وصول لمختبرات خاصة.", conclusion: "الضحية أُصيب بشلل تام وفقد القدرة على الاستغاثة. ثم رُمي من الشرفة لتضليل التحقيق. الجريمة مخططة بدقة." },
      ev_h02: { title: "تقرير تحليل المذكرات", content: "خط اليد مطابق لرمزي عوض بنسبة 99.3%. الحبر حديث — لا يزيد عن 72 ساعة. الضغط على القلم يتصاعد في السطور الأخيرة — علامة على اضطراب نفسي شديد أثناء الكتابة.", conclusion: "رمزي كان يعرف أن حياته في خطر ووثّق خوفه. المذكرة دليل مباشر على التهديد المسبق." },
      ev_h03: { title: "تقرير تتبع الإيميل", content: "الـ IP يعود لـ WiFi الطابق العاشر — نطاق يشمل غرف 1001-1015 والمكاتب الإدارية. الجهاز المستخدم: MacBook Pro آخر تسجيل نزيل بالاسم 'T. Mansour' في 3 زيارات خلال شهرين.", conclusion: "الإيميل أُرسل من داخل الفندق وعلى الأرجح من جهاز طارق منصور أو من شخص يعمل في الطابق العاشر." },
      ev_h04: { title: "تقرير تحليل ملفات USB", content: "47 وثيقة مصادقة بخوادم عدة. 12 صفقة وهمية بقيمة إجمالية تتجاوز 340 مليون جنيه محولة لحسابات في جزر كايمان وسنغافورة. التواريخ تمتد من 2021 حتى شهر قبل الحادثة.", conclusion: "طارق منصور استخدم موارد الشركة في عمليات تبييض أموال. رمزي اكتشف هذا وكان يُجهز للإبلاغ." },
      ev_h05: { title: "تقرير سجلات الكاميرات", content: "الفجوة 42 دقيقة — من 10:50 لـ 11:32 — كافية لتنفيذ الجريمة والهروب. كلمة المرور المستخدمة رقم 002 تعود تاريخياً لمستخدم نادين سرحان. لا يوجد سجل لتفويض آخر شخص باستخدامها.", conclusion: "نادين سرحان تملك الوصول لإيقاف الكاميرات. سواء فعلت ذلك بنفسها أو سمحت لشخص آخر باستخدام كلمتها — هي متورطة." },
      ev_h06: { title: "تقرير البصمة على الساعة", content: "بصمة جزئية — 3 أصابع — مقارنة بقاعدة بيانات. مطابقة جزئية 67% مع بصمة موجودة في قضية احتيال قديمة عام 2018 متعلقة بشخص يعمل في مجال الأمن الخاص.", conclusion: "المنفذ الميداني على الأرجح محترف — ليس طارق شخصياً. في شريك تنفيذي مجهول." },
      ev_h07: { title: "تقرير إيصال الحجز", content: "الإيصال طُبع من نظام الفندق الداخلي. الكاتبة المسؤولة تؤكد إن الشخص كان 'متسرعاً وعينيه كانت على الباب'. دفع بأوراق جديدة تشير لسحب حديث من ATM.", conclusion: "طارق منصور حجز غرفة الاجتماعات قبل وصول رمزي — بما يُثبت علمه المسبق بالزيارة والتخطيط المتعمد." },
      ev_h08: { title: "تقرير شريحة SIM", content: "آخر مكالمة من الشريحة لنادر الأمن الساعة 10:31 ليلاً. مدة المكالمة 4 دقائق 12 ثانية. رُصد الهاتف في نطاق برج الاتصالات المجاور للفندق — يعني الشخص كان قريباً أو داخل الفندق.", conclusion: "نادر الأمن تلقى تعليمات أو تنسيقاً مع المنفذ قبل الجريمة بساعة ونص. دوره ليس محايداً." }
    }
  }
};

// ============================================================
// State
// ============================================================
const horrorRooms = new Map();
const horrorPlayers = new Map();

function getFirstNode(caseId) {
  const c = HORROR_CASES[caseId];
  if (!c) return "hotel_entrance";
  const keys = Object.keys(c.map);
  return keys.length > 0 ? keys[0] : "hotel_entrance";
}

function createRoom(roomId, caseId) {
  const resolvedCaseId = caseId && HORROR_CASES[caseId] ? caseId : "case_hotel_01";
  return {
    id: roomId,
    caseId: resolvedCaseId,
    players: new Map(),
    gameState: "waiting",
    collectedEvidence: [],
    evidenceInLab: [],
    analyzedEvidence: [],
    startedAt: null,
    lightOn: false,
    crimeBoardConnections: [],
    puzzleStates: {},
    npcStates: {},
  };
}

function createPlayer(socketId, playerId, name, roomId, caseId) {
  return {
    socketId,
    id: playerId,
    name,
    roomId,
    currentNode: getFirstNode(caseId),
    flashlightOn: false,
    uvMode: false,
    isAdmin: false,
  };
}

function getRoomState(room) {
  try {
    const players = [];
    room.players.forEach(p => players.push({
      id: p.id, name: p.name, currentNode: p.currentNode, flashlightOn: p.flashlightOn,
    }));
    const caseData = HORROR_CASES[room.caseId];
    const totalEvidence = caseData?.evidenceList?.length || 0;
    const allCollected = room.collectedEvidence.length + room.evidenceInLab.length + room.analyzedEvidence.length >= totalEvidence;
    return {
      roomId: room.id,
      caseId: room.caseId,
      gameState: room.gameState,
      players,
      evidenceCount: room.collectedEvidence.length,
      collectedEvidence: room.collectedEvidence || [],
      evidenceInLab: room.evidenceInLab || [],
      analyzedEvidence: room.analyzedEvidence || [],
      lightOn: room.lightOn || false,
      allEvidenceCollected: allCollected,
      totalEvidence,
      crimeBoardConnections: room.crimeBoardConnections || [],
      puzzleStates: room.puzzleStates || {},
      npcStates: room.npcStates || {},
    };
  } catch (err) {
    console.error("❌ Error in getRoomState:", err);
    return { roomId: room.id, caseId: room.caseId, gameState: room.gameState || "waiting", players: [], evidenceCount: 0, collectedEvidence: [], evidenceInLab: [], analyzedEvidence: [], lightOn: false, allEvidenceCollected: false, totalEvidence: 0, crimeBoardConnections: [], puzzleStates: {}, npcStates: {} };
  }
}

function broadcast(io, room, event, data, excludeSocketId = null) {
  room.players.forEach(p => {
    if (p.socketId !== excludeSocketId) {
      const s = io.sockets.sockets.get(p.socketId);
      if (s) s.emit(event, data);
    }
  });
}

function calculateScore(correctAnswers, playerAnswers, questions) {
  if (!questions || questions.length === 0) return 0;
  let correct = 0;
  questions.forEach(q => {
    if (playerAnswers[q.id] !== undefined && playerAnswers[q.id] === correctAnswers[q.id]) correct++;
  });
  return Math.round((correct / questions.length) * 100);
}

function initHorrorGame(io) {
  io.on("connection", (socket) => {
    console.log(`🔌 Connected: ${socket.id}`);

    // ── Join ──
    socket.on("horror_join", ({ roomId, playerId, playerName, caseId }) => {
      try {
        const resolvedCaseId = (caseId && HORROR_CASES[caseId]) ? caseId : "case_hotel_01";
        if (!horrorRooms.has(roomId)) {
          horrorRooms.set(roomId, createRoom(roomId, resolvedCaseId));
          console.log(`🆕 Room ${roomId} created — case: ${resolvedCaseId}`);
        }

        // صح
        const room = horrorRooms.get(roomId);
        const { checkAndFireEvents } = initStoryEvents(io, room);
        room.checkAndFireEvents = checkAndFireEvents;
        const player = createPlayer(socket.id, playerId, playerName || "محقق مجهول", roomId, room.caseId);
        if (room.players.size === 0) player.isAdmin = true;
        room.players.set(playerId, player);
        horrorPlayers.set(socket.id, player);
        socket.join(`horror_${roomId}`);
        const roomState = getRoomState(room);
        const caseData = HORROR_CASES[room.caseId];
        if (!caseData) { socket.emit("horror_error", { message: "بيانات القضية غير موجودة" }); return; }
        socket.emit("horror_joined", {
          playerId, roomState, isAdmin: player.isAdmin, caseData,
          myState: { currentNode: player.currentNode },
          collectedEvidence: room.collectedEvidence || [],
        });
        if (roomState.gameState === "playing" && roomState.allEvidenceCollected) {
          socket.emit("horror_all_evidence_collected", { totalEvidence: roomState.totalEvidence });
        }
        broadcast(io, room, "horror_player_joined", { id: playerId, name: playerName, currentNode: player.currentNode }, socket.id);
        console.log(`👻 "${playerName}" joined ${roomId}`);
      } catch (err) {
        console.error("❌ horror_join:", err);
        socket.emit("horror_error", { message: "حدث خطأ أثناء الانضمام" });
      }
    });

    // ── Start ──
    socket.on("horror_start", ({ roomId }) => {
      try {
        const room = horrorRooms.get(roomId);
        if (!room) { socket.emit("horror_error", { message: "الغرفة غير موجودة" }); return; }
        room.gameState = "playing";
        room.startedAt = Date.now();
        io.to(`horror_${roomId}`).emit("horror_game_started", { startedAt: room.startedAt });
        console.log(`🎮 Room ${roomId} started`);
      } catch (err) {
        console.error("❌ horror_start:", err);
        socket.emit("horror_error", { message: "حدث خطأ أثناء بدء اللعبة" });
      }
    });

    // ── Get Room State ──
    socket.on("horror_get_room_state", ({ roomId }) => {
      try {
        const room = horrorRooms.get(roomId);
        if (!room) { socket.emit("horror_error", { message: "الغرفة غير موجودة" }); return; }
        socket.emit("horror_room_state", { roomState: getRoomState(room) });
      } catch (err) { console.error("❌ horror_get_room_state:", err); }
    });

    // ── Move ──
    socket.on("horror_move", ({ roomId, playerId, targetNode }) => {
      try {
        const room = horrorRooms.get(roomId);
        if (!room) { socket.emit("horror_error", { message: "الغرفة غير موجودة" }); return; }
        if (room.gameState !== "playing") { socket.emit("horror_error", { message: "اللعبة لم تبدأ بعد" }); return; }
        const player = room.players.get(playerId);
        if (!player) { socket.emit("horror_error", { message: "أنت غير موجود" }); return; }
        const caseData = HORROR_CASES[room.caseId];
        const current = caseData?.map?.[player.currentNode];
        if (!current?.connections?.includes(targetNode)) { socket.emit("horror_error", { message: "لا يمكنك الوصول لهذا المكان" }); return; }
        player.currentNode = targetNode;

        if (room.storyState) {
          room.storyState.locationVisitCounts[targetNode] =
            (room.storyState.locationVisitCounts[targetNode] || 0) + 1;
          room.checkAndFireEvents({ type: "location_visited", locationId: targetNode });
        }

        const newNode = caseData.map[targetNode];
        const evHere = caseData.evidenceList.filter(e =>
          e.location === targetNode &&
          !room.collectedEvidence.find(ce => ce.id === e.id) &&
          !room.evidenceInLab.find(ce => ce.id === e.id) &&
          !room.analyzedEvidence.find(ce => ce.id === e.id)
        );
        const npcsHere = caseData.npcs?.filter(n => n.location === targetNode) || [];
        socket.emit("horror_moved", {
          node: targetNode, nodeData: newNode,
          evidenceHere: evHere, npcsHere,
          interactables: newNode.interactables || []
        });
        socket.emit("horror_room_state", { roomState: getRoomState(room) });
        broadcast(io, room, "horror_player_moved", { playerId, playerName: player.name, node: targetNode, nodeName: newNode.name }, socket.id);
        console.log(`🚶 "${player.name}" → ${newNode.name}`);
      } catch (err) {
        console.error("❌ horror_move:", err);
        socket.emit("horror_error", { message: "حدث خطأ أثناء الحركة" });
      }
    });

    // ── Interact (مفتاح نور + NPC) ──
    socket.on("horror_interact", ({ roomId, playerId, interactableId }) => {
      try {
        const room = horrorRooms.get(roomId);
        if (!room || room.gameState !== "playing") return;
        const player = room.players.get(playerId);
        if (!player) return;
        const caseData = HORROR_CASES[room.caseId];
        const nodeData = caseData?.map?.[player.currentNode];
        const interactable = nodeData?.interactables?.find(i => i.id === interactableId);
        if (!interactable) { socket.emit("horror_error", { message: "العنصر غير موجود" }); return; }

        if (interactable.type === "light_switch") {
          room.lightOn = !room.lightOn;
          // إرسال لكل اللاعبين في الغرفة
          io.to(`horror_${roomId}`).emit("horror_room_light_toggled", {
            lightOn: room.lightOn,
            playerName: player.name,
            node: player.currentNode
          });
          io.to(`horror_${roomId}`).emit("horror_room_state", { roomState: getRoomState(room) });
          console.log(`💡 "${player.name}" ${room.lightOn ? "فتح" : "أغلق"} النور في ${roomId}`);

        } else if (interactable.type === "npc") {
          const npc = caseData.npcs?.find(n => n.id === interactable.npcId);
          if (!npc) { socket.emit("horror_error", { message: "الشخصية غير موجودة" }); return; }
          const firstDialogue = npc.dialogues.find(d => d.id === "intro");
          if (firstDialogue) {
            socket.emit("horror_npc_dialogue_started", {
              npcId: npc.id, npcName: npc.name, npcAvatar: npc.avatar,
              npcPhoto: npc.photo || null, npcRole: npc.role || "",
              dialogue: firstDialogue
            });
          }
        }
      } catch (err) {
        console.error("❌ horror_interact:", err);
        socket.emit("horror_error", { message: "حدث خطأ أثناء التفاعل" });
      }
    });

    // ── NPC Start Dialogue (fallback) ──
    socket.on("horror_start_npc_dialogue", ({ roomId, playerId, npcId }) => {
      try {
        const room = horrorRooms.get(roomId);
        if (!room) return;
        const caseData = HORROR_CASES[room.caseId];
        const npc = caseData?.npcs?.find(n => n.id === npcId);
        if (!npc) { socket.emit("horror_error", { message: "الشخصية غير موجودة" }); return; }
        const intro = npc.dialogues.find(d => d.id === "intro");
        if (intro) {
          socket.emit("horror_npc_dialogue_started", {
            npcId, npcName: npc.name, npcAvatar: npc.avatar,
            npcPhoto: npc.photo || null, npcRole: npc.role || "",
            dialogue: intro
          });
        }
      } catch (err) { console.error("❌ horror_start_npc_dialogue:", err); }
    });

    // ── NPC Choose Option ──
    socket.on("horror_npc_choose_option", ({ roomId, playerId, npcId, optionId }) => {
      try {
        const room = horrorRooms.get(roomId);
        if (!room) return;
        const caseData = HORROR_CASES[room.caseId];
        const npc = caseData?.npcs?.find(n => n.id === npcId);
        if (!npc) { socket.emit("horror_error", { message: "الشخصية غير موجودة" }); return; }
        const dialogue = npc.dialogues.find(d => d.id === optionId);
        if (!dialogue) {
          socket.emit("horror_npc_dialogue_ended", { npcId });
          return;
        }
        if (!dialogue.options || dialogue.options.length === 0) {
          socket.emit("horror_npc_dialogue_continued", { npcId, dialogue });
          setTimeout(() => socket.emit("horror_npc_dialogue_ended", { npcId }), 1000);
        } else {
          socket.emit("horror_npc_dialogue_continued", { npcId, dialogue });
        }
      } catch (err) {
        console.error("❌ horror_npc_choose_option:", err);
        socket.emit("horror_error", { message: "حدث خطأ في الحوار" });
      }
    });

    // ── Examine Evidence ──
    socket.on("horror_examine", ({ roomId, playerId, evidenceId, toolUsed }) => {
      try {
        const room = horrorRooms.get(roomId);
        if (!room || room.gameState !== "playing") return;
        const player = room.players.get(playerId);
        if (!player) return;
        const caseData = HORROR_CASES[room.caseId];
        const ev = caseData?.evidenceList?.find(e => e.id === evidenceId);
        if (!ev) { socket.emit("horror_examine_result", { found: false, message: "الدليل غير موجود" }); return; }
        if (ev.location !== player.currentNode) { socket.emit("horror_examine_result", { found: false, message: "الدليل ليس في هذا المكان" }); return; }
        if (room.collectedEvidence.find(ce => ce.id === evidenceId)) { socket.emit("horror_examine_result", { found: false, message: "تم جمع هذا الدليل مسبقاً" }); return; }
        // التحقق من الأداة المطلوبة
        if (ev.tool && ev.tool !== toolUsed) {
          const toolName = ev.tool === "uv" ? "الأشعة فوق البنفسجية 🔮" : "الكشاف العادي 🔦";
          socket.emit("horror_examine_result", { found: false, wrongTool: true, message: `هذا الدليل يحتاج ${toolName}` });
          return;
        }
        room.collectedEvidence.push(ev);

        room.checkAndFireEvents?.({ type: "evidence_found", evidenceId: ev.id });
        room.checkAndFireEvents?.({ type: "evidence_count" });

        socket.emit("horror_evidence_found", { evidence: ev });
        broadcast(io, room, "horror_evidence_collected", { evidence: ev, collectedBy: player.name }, socket.id);
        const totalEvidence = caseData.evidenceList.length;
        const totalCollected = room.collectedEvidence.length + room.evidenceInLab.length + room.analyzedEvidence.length;
        if (totalCollected >= totalEvidence) {
          io.to(`horror_${roomId}`).emit("horror_all_evidence_collected", { totalEvidence });
        }
        console.log(`🔍 "${player.name}" found: ${ev.name}`);
      } catch (err) {
        console.error("❌ horror_examine:", err);
        socket.emit("horror_error", { message: "حدث خطأ أثناء الفحص" });
      }
    });

    // ── Send to Lab ──
    socket.on("horror_send_to_lab", ({ roomId, playerId, evidenceId }) => {
      try {
        const room = horrorRooms.get(roomId);
        if (!room) return;
        const evIdx = room.collectedEvidence.findIndex(e => e.id === evidenceId);
        if (evIdx === -1) { socket.emit("horror_error", { message: "الدليل غير موجود في ملفك" }); return; }
        const ev = room.collectedEvidence[evIdx];
        room.collectedEvidence.splice(evIdx, 1);
        const estimatedTime = 15 + Math.floor(Math.random() * 15); // 15-30 ثانية
        room.evidenceInLab.push({ ...ev, inLab: true, estimatedTime });
        socket.emit("horror_evidence_sent_to_lab", { evidence: ev, estimatedTime });
        // محاكاة التحليل بعد الوقت المحدد
        const caseData = HORROR_CASES[room.caseId];
        setTimeout(() => {
          const labIdx = room.evidenceInLab.findIndex(e => e.id === evidenceId);
          if (labIdx === -1) return;
          const labEv = room.evidenceInLab[labIdx];
          room.evidenceInLab.splice(labIdx, 1);
          const report = caseData.forensicReports?.[evidenceId] || { title: "تقرير تحليل", content: "تم التحليل.", conclusion: "لا استنتاجات إضافية." };
          room.analyzedEvidence.push({ ...labEv, analyzed: true, analysisResult: report });

          room.checkAndFireEvents?.({ type: "evidence_analyzed", evidenceId });
          room.checkAndFireEvents?.({ type: "evidence_count" });

          io.to(`horror_${roomId}`).emit("horror_evidence_analyzed", { evidence: labEv, report });
          console.log(`🔬 Analyzed: ${labEv.name}`);
        }, estimatedTime * 1000);
        console.log(`🧪 Sent to lab: ${ev.name} (${estimatedTime}s)`);
      } catch (err) {
        console.error("❌ horror_send_to_lab:", err);
        socket.emit("horror_error", { message: "حدث خطأ أثناء الإرسال للمختبر" });
      }
    });

    // ── Toggle Flashlight ──
    socket.on("horror_toggle_flashlight", ({ roomId, playerId, uvMode }) => {
      try {
        const room = horrorRooms.get(roomId);
        if (!room) return;
        const player = room.players.get(playerId);
        if (!player) return;
        player.flashlightOn = !player.flashlightOn;
        player.uvMode = uvMode || false;
        broadcast(io, room, "horror_flashlight_toggled", { playerId, flashlightOn: player.flashlightOn, uvMode: player.uvMode }, socket.id);
      } catch (err) { console.error("❌ horror_toggle_flashlight:", err); }
    });

    // ── Crime Board — Add Connection ──
    socket.on("horror_add_connection", ({ roomId, playerId, from, to, color }) => {
      try {
        const room = horrorRooms.get(roomId);
        if (!room) return;
        const connId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const conn = { id: connId, from, to, color, addedBy: playerId };
        room.crimeBoardConnections.push(conn);
        io.to(`horror_${roomId}`).emit("horror_connection_added", conn);
      } catch (err) { console.error("❌ horror_add_connection:", err); }
    });

    // ── Crime Board — Remove Connection ──
    socket.on("horror_remove_connection", ({ roomId, connectionId }) => {
      try {
        const room = horrorRooms.get(roomId);
        if (!room) return;
        room.crimeBoardConnections = room.crimeBoardConnections.filter(c => c.id !== connectionId);
        io.to(`horror_${roomId}`).emit("horror_connection_removed", { connectionId });
      } catch (err) { console.error("❌ horror_remove_connection:", err); }
    });

    // ── Solve Puzzle ──
    socket.on("horror_solve_puzzle", ({ roomId, playerId, puzzleId, code }) => {
      try {
        const room = horrorRooms.get(roomId);
        if (!room) return;
        const caseData = HORROR_CASES[room.caseId];
        const puzzle = caseData?.puzzles?.[puzzleId];
        if (!puzzle) { socket.emit("horror_error", { message: "اللغز غير موجود" }); return; }
        if (room.puzzleStates[puzzleId]?.unlocked) { socket.emit("horror_puzzle_solved", { message: "هذا اللغز تم حله مسبقاً" }); return; }

        room.checkAndFireEvents?.({ type: "puzzle_solved", puzzleId });

        if (code === puzzle.code) {
          room.puzzleStates[puzzleId] = { unlocked: true };
          io.to(`horror_${roomId}`).emit("horror_puzzle_solved", { puzzleId, message: `✅ تم فتح: ${puzzle.description}` });
          console.log(`🔓 Puzzle solved: ${puzzleId} by ${playerId}`);
        } else {
          socket.emit("horror_puzzle_failed", { message: "رمز خاطئ — حاول مجدداً" });
        }
      } catch (err) {
        console.error("❌ horror_solve_puzzle:", err);
        socket.emit("horror_error", { message: "حدث خطأ أثناء حل اللغز" });
      }
    });

    // ── Solve Case ──
    // socket.on("horror_solve_case", ({ roomId, playerId, answers }) => {
    //   try {
    //     const room = horrorRooms.get(roomId);
    //     if (!room) { socket.emit("horror_error", { message: "الغرفة غير موجودة" }); return; }
    //     if (room.gameState !== "playing") { socket.emit("horror_solve_rejected", { reason: "اللعبة لم تبدأ بعد" }); return; }
    //     const caseData = HORROR_CASES[room.caseId];
    //     const totalCollected = room.collectedEvidence.length + room.analyzedEvidence.length;
    //     if (totalCollected < (caseData.requiredEvidence || 3)) {
    //       socket.emit("horror_solve_rejected", { reason: `تحتاج ${caseData.requiredEvidence - totalCollected} أدلة إضافية قبل تقديم الحل` });
    //       return;
    //     }
    //     const player = room.players.get(playerId);
    //     const score = calculateScore(caseData.correctAnswers, answers, caseData.questions);
    //     const stars = score >= 90 ? 5 : score >= 75 ? 4 : score >= 60 ? 3 : score >= 40 ? 2 : 1;
    //     const timeTaken = Date.now() - room.startedAt;
    //     if (score >= 60) {
    //       room.gameState = "solved";
    //       io.to(`horror_${roomId}`).emit("horror_case_solved", {
    //         solvedBy: player?.name || "محقق مجهول",
    //         score, stars, timeTaken,
    //         correctAnswers: caseData.correctAnswers
    //       });
    //       console.log(`🏆 Case solved by "${player?.name}" — score: ${score}%`);
    //     } else {
    //       socket.emit("horror_solve_failed", { message: `إجاباتك لم تكن كافية`, score });
    //     }
    //   } catch (err) {
    //     console.error("❌ horror_solve_case:", err);
    //     socket.emit("horror_error", { message: "حدث خطأ أثناء تقديم الحل" });
    //   }
    // });


    // ── Solve Case ──
    socket.on("horror_solve_case", ({ roomId, playerId, answers }) => {
      try {
        const room = horrorRooms.get(roomId);
        if (!room) { socket.emit("horror_error", { message: "الغرفة غير موجودة" }); return; }
        if (room.gameState !== "playing") { socket.emit("horror_solve_rejected", { reason: "اللعبة لم تبدأ بعد" }); return; }

        const caseData = HORROR_CASES[room.caseId];
        const totalCollected = room.collectedEvidence.length + room.analyzedEvidence.length;

        if (totalCollected < (caseData.requiredEvidence || 3)) {
          socket.emit("horror_solve_rejected", {
            reason: `تحتاج ${caseData.requiredEvidence - totalCollected} أدلة إضافية`
          });
          return;
        }

        const player = room.players.get(playerId);
        const ending = calculateEnding(room.caseId, answers, room);
        room.gameState = "solved";

        io.to(`horror_${roomId}`).emit("horror_case_solved", {
          solvedBy: player?.name || "محقق مجهول",
          ending,
          timeTaken: Date.now() - room.startedAt,
          correctAnswers: caseData.correctAnswers,
          answers,
        });

        console.log(`🏆 Case solved — ending: ${ending?.id} — room: ${roomId}`);
      } catch (err) {
        console.error("❌ horror_solve_case:", err);
        socket.emit("horror_error", { message: "حدث خطأ أثناء حل القضية" });
      }
    });

    // ── Change Case ──
    socket.on("horror_change_case", ({ roomId, playerId, caseId }) => {
      try {
        const room = horrorRooms.get(roomId);
        if (!room) return;
        const player = room.players.get(playerId);
        if (!player?.isAdmin) { socket.emit("horror_error", { message: "فقط الأدمن يمكنه تغيير القضية" }); return; }
        if (!HORROR_CASES[caseId]) { socket.emit("horror_error", { message: "القضية غير موجودة" }); return; }
        room.caseId = caseId;
        room.collectedEvidence = [];
        room.evidenceInLab = [];
        room.analyzedEvidence = [];
        room.lightOn = false;
        room.crimeBoardConnections = [];
        room.puzzleStates = {};
        room.npcStates = {};
        room.gameState = "waiting";
        room.players.forEach(p => { p.currentNode = getFirstNode(caseId); });
        const newCaseData = HORROR_CASES[caseId];
        io.to(`horror_${roomId}`).emit("horror_case_changed", {
          caseId, caseData: newCaseData,
          message: `تم تغيير القضية إلى: ${newCaseData.title}`
        });
        console.log(`🔄 Case changed to ${caseId} in room ${roomId}`);
      } catch (err) {
        console.error("❌ horror_change_case:", err);
        socket.emit("horror_error", { message: "حدث خطأ أثناء تغيير القضية" });
      }
    });

    // ── Disconnect ──
    socket.on("disconnect", () => {
      try {
        const player = horrorPlayers.get(socket.id);
        if (!player) return;
        const room = horrorRooms.get(player.roomId);
        if (room) {
          room.players.delete(player.id);
          broadcast(io, room, "horror_player_left", { playerId: player.id, name: player.name });
          if (room.players.size === 0) {
            horrorRooms.delete(player.roomId);
            console.log(`🗑️ Room ${player.roomId} deleted (empty)`);
          }
        }
        horrorPlayers.delete(socket.id);
        console.log(`👋 "${player.name}" disconnected`);
      } catch (err) { console.error("❌ disconnect:", err); }
    });
  });

  console.log("👻 Horror Game Server loaded — case_hotel_01 ready");
}

module.exports = initHorrorGame;