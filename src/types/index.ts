/**
 * أنواع البيانات الرئيسية للمشروع
 */

export interface WirdAssignment {
  date: string; // YYYY-MM-DD
  surahId: number;
  surahName: string;
  startAyah: number;
  endAyah: number;
  repetitions: number;
  isHoliday: boolean;
  note?: string;
}

export interface StudentProgress {
  date: string; // YYYY-MM-DD
  count: number; // عدد التكرارات المكتملة
  timestamp: number;
  status: "pending" | "in-progress" | "completed"; // حالة الورد
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
  studentId: string;
  studentName: string;
  date: string;
  currentCount: number;
  targetCount: number;
  percentage: number;
  status: "completed" | "in-progress" | "not-started";
  lastUpdate: number;
}

export type UserRole = "sheikh" | "student" | null;
