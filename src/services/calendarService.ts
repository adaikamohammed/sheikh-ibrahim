/**
 * خدمة إدارة التقويم والأوراد
 * تتعامل مع إضافة وتعديل وحذف الأوراد اليومية
 */

import { WirdAssignment } from "@/types";
import {
  format,
  parse,
} from "date-fns";
import { ar } from "date-fns/locale";

/**
 * قائمة السور والمعلومات
 */
export const QURAN_SURAHS = [
  { id: 1, name: "Al-Fatihah", arabicName: "الفاتحة", totalAyahs: 7 },
  { id: 2, name: "Al-Baqarah", arabicName: "البقرة", totalAyahs: 286 },
  { id: 3, name: "Aal-E-Imran", arabicName: "آل عمران", totalAyahs: 200 },
  { id: 4, name: "An-Nisa", arabicName: "النساء", totalAyahs: 176 },
  { id: 5, name: "Al-Ma'idah", arabicName: "المائدة", totalAyahs: 120 },
  { id: 6, name: "Al-An'am", arabicName: "الأنعام", totalAyahs: 165 },
  { id: 7, name: "Al-A'raf", arabicName: "الأعراف", totalAyahs: 206 },
  { id: 8, name: "Al-Anfal", arabicName: "الأنفال", totalAyahs: 75 },
  { id: 9, name: "At-Tawbah", arabicName: "التوبة", totalAyahs: 129 },
  { id: 10, name: "Yunus", arabicName: "يونس", totalAyahs: 109 },
  { id: 11, name: "Hud", arabicName: "هود", totalAyahs: 123 },
  { id: 12, name: "Yusuf", arabicName: "يوسف", totalAyahs: 111 },
  { id: 13, name: "Ar-Ra'd", arabicName: "الرعد", totalAyahs: 43 },
  { id: 14, name: "Ibrahim", arabicName: "إبراهيم", totalAyahs: 52 },
  { id: 15, name: "Al-Hijr", arabicName: "الحجر", totalAyahs: 99 },
  { id: 16, name: "An-Nahl", arabicName: "النحل", totalAyahs: 128 },
  { id: 17, name: "Al-Isra", arabicName: "الإسراء", totalAyahs: 111 },
  { id: 18, name: "Al-Kahf", arabicName: "الكهف", totalAyahs: 110 },
  { id: 19, name: "Maryam", arabicName: "مريم", totalAyahs: 98 },
  { id: 20, name: "Ta-Ha", arabicName: "طه", totalAyahs: 135 },
  { id: 21, name: "Al-Anbiya", arabicName: "الأنبياء", totalAyahs: 112 },
  { id: 22, name: "Al-Hajj", arabicName: "الحج", totalAyahs: 78 },
  { id: 23, name: "Al-Mu'minun", arabicName: "المؤمنون", totalAyahs: 118 },
  { id: 24, name: "An-Nur", arabicName: "النور", totalAyahs: 64 },
  { id: 25, name: "Al-Furqan", arabicName: "الفرقان", totalAyahs: 77 },
  { id: 26, name: "Ash-Shu'ara", arabicName: "الشعراء", totalAyahs: 227 },
  { id: 27, name: "An-Naml", arabicName: "النمل", totalAyahs: 93 },
  { id: 28, name: "Al-Qasas", arabicName: "القصص", totalAyahs: 88 },
  { id: 29, name: "Al-'Ankabut", arabicName: "العنكبوت", totalAyahs: 69 },
  { id: 30, name: "Ar-Rum", arabicName: "الروم", totalAyahs: 60 },
];

// ==================== Cache للسور لتسريع البحث ====================
const SURAHS_CACHE = new Map<number, (typeof QURAN_SURAHS)[0]>();

// بناء الـ cache عند التحميل الأول
QURAN_SURAHS.forEach((surah) => {
  SURAHS_CACHE.set(surah.id, surah);
});

/**
 * الحصول على معلومات السورة (محسّن بـ Cache)
 */
export function getSurahInfo(surahId: number) {
  return SURAHS_CACHE.get(surahId);
}

/**
 * الحصول على اسم اليوم بالعربية
 */
export function getDayNameAr(date: string | Date): string {
  const d = typeof date === "string" ? parse(date, "yyyy-MM-dd", new Date()) : date;
  return format(d, "EEEE", { locale: ar });
}

/**
 * التحقق من صحة الآيات
 */
export function validateAyahs(
  surahId: number,
  startAyah: number,
  endAyah: number
): { valid: boolean; error?: string } {
  const surah = getSurahInfo(surahId);
  if (!surah) {
    return { valid: false, error: "السورة غير موجودة" };
  }

  if (startAyah < 1 || endAyah < startAyah || endAyah > surah.totalAyahs) {
    return {
      valid: false,
      error: `الآيات يجب أن تكون بين 1 و ${surah.totalAyahs}`,
    };
  }

  return { valid: true };
}

/**
 * إنشاء معرّف فريد للورد
 */
export function generateWirdId(date: string, surahId: number): string {
  return `wird-${date}-surah${surahId}`;
}

/**
 * إنشاء ورد جديد
 */
export function createWirdAssignment(
  date: string,
  surahId: number,
  startAyah: number,
  endAyah: number,
  targetRepetitions: number,
  isHoliday: boolean = false,
  note?: string
): { success: boolean; data?: WirdAssignment; error?: string } {
  // التحقق من صحة الآيات
  const validation = validateAyahs(surahId, startAyah, endAyah);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const surah = getSurahInfo(surahId)!;
  const d = parse(date, "yyyy-MM-dd", new Date());

  const totalAyahs = endAyah - startAyah + 1;

  const wird: WirdAssignment = {
    id: generateWirdId(date, surahId),
    date,
    dayOfWeek: getDayNameAr(d),
    surahId,
    surahName: surah.name,
    arabicSurahName: surah.arabicName,
    startAyah,
    endAyah,
    totalAyahs,
    targetRepetitions,
    isHoliday,
    note,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return { success: true, data: wird };
}

/**
 * تنسيق اسم الورد (مثال: "سورة الشعراء 1-10")
 */
export function formatWirdName(wird: WirdAssignment): string {
  if (wird.isHoliday) {
    return "🌟 يوم عطلة";
  }
  return `${wird.arabicSurahName} ${wird.startAyah}-${wird.endAyah}`;
}

/**
 * الحصول على لون الورد بناءً على اسمه
 */
export function getWirdColor(surahId: number): string {
  const colors = [
    "#d4af37", // gold
    "#10b981", // emerald
    "#8b5cf6", // purple
    "#06b6d4", // cyan
    "#ec4899", // pink
    "#f59e0b", // amber
    "#6366f1", // indigo
    "#14b8a6", // teal
  ];
  return colors[surahId % colors.length];
}

/**
 * حساب عدد أيام الشهر الكاملة للتقويم
 */
export function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const totalDays = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

  return {
    totalDays,
    startingDayOfWeek,
    firstDay,
    lastDay,
  };
}

/**
 * إنشاء شبكة التقويم
 */
export function generateCalendarGrid(year: number, month: number) {
  const { totalDays, startingDayOfWeek } = getMonthDays(year, month);
  const grid: (number | null)[][] = [];
  let week: (number | null)[] = [];

  // إضافة خلايا فارغة في البداية
  for (let i = 0; i < startingDayOfWeek; i++) {
    week.push(null);
  }

  // إضافة أيام الشهر
  for (let day = 1; day <= totalDays; day++) {
    week.push(day);
    if (week.length === 7) {
      grid.push(week);
      week = [];
    }
  }

  // إضافة خلايا فارغة في النهاية
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null);
    }
    grid.push(week);
  }

  return grid;
}

/**
 * تحويل شهر ويوم إلى تاريخ YYYY-MM-DD
 */
export function dateToString(year: number, month: number, day: number): string {
  return format(new Date(year, month - 1, day), "yyyy-MM-dd");
}

/**
 * الحصول على أسبوع التاريخ
 */
export function getWeekNumber(date: string | Date): number {
  const d = typeof date === "string" ? parse(date, "yyyy-MM-dd", new Date()) : date;
  const year = d.getFullYear();
  const firstDay = new Date(year, 0, 1);
  const pastDaysOfYear = (d.getTime() - firstDay.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7);
}

/**
 * حساب الآية البدائية التلقائية لليوم التالي
 * إذا انتهى الورد بآية 10، اليوم التالي يبدأ من 11
 */
export function getNextWirdStartAyah(
  currentWird: WirdAssignment | undefined,
  nextDay: string,
  assignments: Record<string, WirdAssignment>
): number {
  // إذا لم يكن هناك ورد في اليوم الحالي
  if (!currentWird || currentWird.isHoliday) {
    return 1;
  }

  // إذا كان اليوم التالي نفس السورة، ابدأ من الآية التالية
  const nextWird = assignments[nextDay];
  if (nextWird && !nextWird.isHoliday && nextWird.surahId === currentWird.surahId) {
    // إذا كان هناك ورد بالفعل، لا تغير
    return nextWird.startAyah;
  }

  // ابدأ من الآية التالية
  return currentWird.endAyah + 1;
}

/**
 * الحصول على تاريخ اليوم التالي (YYYY-MM-DD)
 */
export function getNextDay(dateStr: string): string {
  const d = parse(dateStr, "yyyy-MM-dd", new Date());
  d.setDate(d.getDate() + 1);
  return format(d, "yyyy-MM-dd");
}

/**
 * الحصول على تاريخ اليوم السابق (YYYY-MM-DD)
 */
export function getPreviousDay(dateStr: string): string {
  const d = parse(dateStr, "yyyy-MM-dd", new Date());
  d.setDate(d.getDate() - 1);
  return format(d, "yyyy-MM-dd");
}
