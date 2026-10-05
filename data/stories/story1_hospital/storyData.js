const storyData = {
  meta: {
    title: 'الطابق الرابع',
    subtitle: 'صوت من شقة مهجورة',
    setting: 'القاهرة — 2024',
  },

  characters: {
    karim: { name: 'كريم', role: 'صاحب الشقة', age: 26 },
    menna: { name: 'منة', role: 'صحفية', age: 24 },
    tarek: { name: 'طارق', role: 'خواف', age: 27 },
    hadi: { name: 'هدى', role: 'طبيبة أسنان', age: 25 },
    sami: { name: 'د. سامي فؤاد', role: 'الضحية', age: 30 },
    fuad: { name: 'د. فؤاد رشدي', role: 'القاتل', age: 80 },
    nagwa: { name: 'أ. نجوى', role: 'الممرضة', age: 55 },
  },

  chapters: {
    chapter1_apartment: {
      id: 'chapter1_apartment',
      title: 'البداية',
      roomId: 'karim_apartment',
      intro: {
        title: 'الطابق الرابع',
        subtitle: '11:47 مساءً',
        text: 'قاعدين مع أصحابك في شقة كريم. ضحك، كوتشينة، قهوة. فجأة... صوت خبط من الشقة اللي جنبكم. الشقة اللي محدش ساكن فيها من سنين.',
        voice: '/audio/intro/chapter1.ogg',
      },
      outro: {
        text: 'الصوت جاي من شقة رقم ٤. الباب مقفول. التراب عليه يبان إنه محدش فتحه من سنين. بس الصوت واضح.',
        voice: '/audio/outro/chapter1.ogg',
      },
    },
    chapter2_neighbor: {
      id: 'chapter2_neighbor',
      title: 'شقة رقم ٥',
      roomId: 'neighbor_apartment',
      intro: {
        title: 'شقة رقم ٥',
        subtitle: '12:15 صباحًا',
        text: 'الباب مش مقفول. الصوت جاي من هنا. الأستاذ مجدي... راجل عجوز بيعيش لوحده.',
        voice: '/audio/intro/chapter2.ogg',
      },
      outro: {
        text: 'الأستاذ مجدي مقتول. جالس على كرسيه. في جيبه موبايل مش بتاعه. الموبايل عليه رسالة: "أنا سامي فؤاد. أبويا قتلني."',
        voice: '/audio/outro/chapter2.ogg',
      },
    },
    chapter3_sami_apartment: {
      id: 'chapter3_sami_apartment',
      title: 'شقة سامي',
      roomId: 'sami_apartment',
      intro: {
        title: 'شقة رقم ٤',
        subtitle: '12:35 صباحًا',
        text: 'شقة مهجورة من ٢٠ سنة. تراب، أثاث مقلوب، حاجات متروكة. وريحة غريبة.',
        voice: '/audio/intro/chapter3.ogg',
      },
      outro: {
        text: 'سامي كان بيكتب مذكرات. أبوه كان بيحقن المرضى بأدوية مش مصرح بها. والفلاشة اللي فيها الأدلة... في المستشفى.',
        voice: '/audio/outro/chapter3.ogg',
      },
    },
    chapter4_hospital: {
      id: 'chapter4_hospital',
      title: 'مستشفى النور',
      roomId: 'hospital_reception',
      intro: {
        title: 'مستشفى النور',
        subtitle: '1:30 صباحًا',
        text: 'المستشفى اللي اتقفل سنة ٢٠٠٣ بسبب "تسريب غاز". الأبواب موحشة. الأصوات جاية من جوه.',
        voice: '/audio/intro/chapter4.ogg',
      },
      outro: {
        text: 'الممر طويل. المشرحة في الآخر. فيه حاجة بتستنيك هناك.',
        voice: '/audio/outro/chapter4.ogg',
      },
    },
    chapter5_truth: {
      id: 'chapter5_truth',
      title: 'الحقيقة',
      roomId: 'autopsy_room',
      intro: {
        title: 'غرفة التشريح',
        subtitle: '3:47 صباحًا',
        text: 'آخر غرفة. آخر سر. اللي تعرفوه هنا مش هينسى.',
        voice: '/audio/intro/chapter5.ogg',
      },
      outro: {
        text: 'الجثة على الطاولة كانت د. فؤاد نفسه. مات من ٣ أيام. وفي إيده خطاب. الحقيقة كاملة.',
        voice: '/audio/outro/chapter5.ogg',
      },
    },
  },

  voiceClues: {
    sami_phone: {
      itemId: 'sami_phone',
      audio: '/audio/voice/sami_phone.ogg',
      text: 'لو بتقرأ الرسالة دي، يعني أنا مت. أنا سامي فؤاد. أبويا قتلني. الفلاشة في المشفى.',
    },
    nagwa_call: {
      itemId: 'nagwa_call',
      audio: '/audio/voice/nagwa_call.ogg',
      text: 'سامي، أنا معاك. لكن مش دلوقتي. لو حسيت بخطر، متكلمنيش على التليفون.',
    },
    fuad_confession: {
      itemId: 'fuad_confession',
      audio: '/audio/voice/fuad_confession.ogg',
      text: 'أنا قتلت ١٢ مريض. أنا قتلت ابني. أنا آسف.',
    },
    nagwa_final: {
      itemId: 'nagwa_final',
      audio: '/audio/voice/nagwa_final.ogg',
      text: 'لو بتسمع ده، يبقى أنا مت. سامي كان بطل. اوعى تنسوه.',
    },
  },

  endings: {
    escape: {
      id: 'escape',
      title: 'الهروب',
      text: 'خرجتوا من المشفى ومعاكم الأدلة. الجرنال بينشر الفضيحة.',
    },
    truth: {
      id: 'truth',
      title: 'الحقيقة الكاملة',
      text: 'لقيتوا نجوى. عرفتوا كل حاجة. سامي مش هيتنسى.',
    },
    death: {
      id: 'death',
      title: 'الموت',
      text: 'فؤاد مسككوا. المشفى بقى مقبرتكم.',
    },
  },
};

module.exports = storyData;