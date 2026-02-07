/**
 * ملف الإعدادات المركزية للمشروع
 */

export const APP_CONFIG = {
  // الألوان والمظهر
  colors: {
    primary: "#d4af37", // ذهبي
    secondary: "#10b981", // أخضر
    background: "#020617",
    foreground: "#ffffff",
    card: "#1a1f2e",
  },

  // إعدادات الورود
  wird: {
    defaultRepetitions: 100,
    minRepetitions: 1,
    maxRepetitions: 500,
    holidays: [
      "thursday", // الخميس
      "friday", // الجمعة
    ],
  },

  // إعدادات الإحصائيات
  statistics: {
    daysPerWeek: 7,
    daysPerMonth: 30,
    minConsistencyDays: 5, // الحد الأدنى للالتزام (5 أيام في الأسبوع)
  },

  // إعدادات الطلاب
  students: {
    maxActiveStudents: 50,
    defaultStatus: "تلاوة",
  },

  // إعدادات الأمان
  security: {
    sheikEmail: "admin00@gmail.com",
    enableTwoFactor: false,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 ساعة
  },

  // الرسائل والإشعارات
  messages: {
    completion: "✨ فتح الله عليك، تقبل الله سعيك",
    encouragement: "واصل التكرار بتركيز تام ، فالإتقان يأتي بالصبر والمداومة.",
    welcome: "السلام عليكم ورحمة الله وبركاته",
  },

  // API والتكاملات
  api: {
    firebaseRetry: 3,
    requestTimeout: 10000, // 10 ثواني
  },
};

// إعدادات الدور والصلاحيات
export const ROLE_PERMISSIONS = {
  sheikh: {
    viewAllStudents: true,
    editAssignments: true,
    viewAnalytics: true,
    managePlatform: true,
    editProfile: true,
  },
  student: {
    viewOwnProgress: true,
    updateProgress: true,
    viewWeeklyHistory: true,
    editProfile: true,
    viewAnalytics: false,
  },
};

// إعدادات الأداء والحدود الدنيا
export const PERFORMANCE_THRESHOLDS = {
  excellent: 95, // A+
  veryGood: 85, // A
  good: 75, // B
  fair: 60, // C
  poor: 0, // D
};

// رسائل الأداء
export const PERFORMANCE_MESSAGES = {
  "A+": "أداء متميز جداً! استمر على هذه الوتيرة 🌟",
  A: "أداء ممتاز! حافظ على هذا المستوى 🏆",
  B: "أداء جيد! يمكنك تحسين أكثر 💪",
  C: "أداء مقبول، حاول زيادة الالتزام 📈",
  D: "أداء منخفض، نحتاج لمزيد من الاهتمام ⚠️",
};
