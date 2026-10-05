const puzzlesData = {
  // استقبال: كود الممر من التقويم
  corridor_code: {
    id: 'corridor_code',
    type: 'code_lock',
    title: 'باب الممر',
    digits: 4,
    solution: '1510',
    hints: [
      'التقويم على الحيطة.',
      '١٥ أكتوبر ٢٠٠٣.',
      'الحل: 1510',
    ],
    reward: 'corridor_key',
  },

  // ممر: كود المشرحة
  morgue_code: {
    id: 'morgue_code',
    type: 'code_lock',
    title: 'باب المشرحة',
    digits: 3,
    solution: '404',
    hints: [
      'رقم الغرفة على الباب.',
      'المشرحة في الدور الرابع.',
      'الحل: 404',
    ],
  },

  // مخزن: كود غرفة الأمن
  security_code: {
    id: 'security_code',
    type: 'code_lock',
    title: 'باب غرفة الأمن',
    digits: 4,
    solution: '2003',
    hints: [
      'سنة إغلاق المشفى.',
      '١٥ أكتوبر ٢٠٠٣.',
      'الحل: 2003',
    ],
  },

  // أمن: كود غرفة التشريح
  autopsy_code: {
    id: 'autopsy_code',
    type: 'code_lock',
    title: 'باب غرفة التشريح',
    digits: 4,
    solution: '3470',
    hints: [
      'الساعة اللي واقفة.',
      '٣:٤٧ — حوّل ٣:٤٧ لـ أرقام.',
      'الحل: 3470',
    ],
  },
};

module.exports = puzzlesData;