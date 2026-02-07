/**
 * أنواع البيانات الرئيسية للمشروع
 */

/**
 * معلومات السورة والآيات
 */
export interface SurahInfo {
  id: number;
  name: string;
  arabicName: string;
  totalAyahs: number;
}

/**
 * تعريف الورد اليومي (ورقة العمل)
 */
export interface WirdAssignment {
  id?: string; // معرّف فريد للورد
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // اليوم من الأسبوع (أحد، اثنين، إلخ)
  surahId: number;
  surahName: string;
  arabicSurahName: string;
  startAyah: number;
  endAyah: number;
  totalAyahs: number; // عدد الآيات في هذا الورد
  targetRepetitions: number; // عدد التكرارات المطلوب
  isHoliday: boolean;
  note?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface StudentProgress {
  date: string; // YYYY-MM-DD
  wirdId: string; // معرّف الورد
  wirdName: string; // اسم الورد (مثلاً "سورة الشعراء 1-10")
  count: number; // عدد التكرارات المكتملة
  targetCount: number; // عدد التكرارات المطلوب
  timestamp: number;
  status: "pending" | "in-progress" | "completed"; // حالة الورد
  completedAt?: number; // وقت الإكمال
  notes?: string;
}

export interface StudentData {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  progress: number; // الإجمالي الكلي (legacy)
  status: string; // الحالة الحالية
  lastUpdated: number;
  dailyProgress: Record<string, number>; // YYYY-MM-DD -> count
  weeklyStats: Record<string, WeeklyStats>; // YYYY-W## -> stats
  monthlyStats: Record<string, MonthlyStats>; // YYYY-MM -> stats
  joinedDate: number;
  avatar?: string;
}

export interface WeeklyStats {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;
  totalCompletions: number;
  completedDays: number;
  averagePerDay: number;
  bestDay: string;
  bestDayCount: number;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  totalCompletions: number;
  completedDays: number;
  averagePerDay: number;
  totalPages?: number;
  improvementRate: number;
}

export interface SheikhStats {
  totalStudents: number;
  activeStudents: number; // طلاب أكملوا اليوم
  averageCompletion: number; // متوسط الإكمال
  totalCompletions: number; // إجمالي التكرارات
  consistencyRate: number; // نسبة الاستمرارية
}

export interface WirdProgress {
  wirdId: string;
  wirdName: string;
  surah: string;
  ayahRange: string; // "1-10"
  students: WirdStudentProgress[];
  completionPercentage: number; // النسبة الإجمالية
  completedStudents: number;
  totalStudents: number;
  createdAt: number;
  updatedAt: number;
}

export interface WirdStudentProgress {
  studentId: string;
  studentName: string;
  currentCount: number;
  targetCount: number;
  percentage: number;
  status: "completed" | "in-progress" | "not-started";
  lastUpdate: number;
}

export interface WirdTracking {
  wirdId: string;
  date: string;
  surah: string;
  ayahRange: string;
  targetRepetitions: number;
  studentProgress: Record<string, number>; // studentId -> count
  statistics: {
    completed: number;
    inProgress: number;
    notStarted: number;
    averageCompletion: number;
  };
}

export type UserRole = "sheikh" | "student" | null;
