/**
 * خدمة معالجة التقدم والإحصائيات
 */

import { StudentData, WeeklyStats, MonthlyStats } from "@/types";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, eachDayOfInterval } from "date-fns";
import { ar } from "date-fns/locale";

/**
 * حساب إحصائيات الأسبوع
 */
export function calculateWeeklyStats(
  dailyProgress: Record<string, number>,
  date: string = new Date().toISOString().split("T")[0]
): WeeklyStats {
  const dateObj = parseISO(date);
  const weekStart = format(startOfWeek(dateObj, { weekStartsOn: 6 }), "yyyy-MM-dd"); // السبت أول الأسبوع
  const weekEnd = format(endOfWeek(dateObj, { weekStartsOn: 6 }), "yyyy-MM-dd");

  // الأيام في الأسبوع
  const daysInWeek = eachDayOfInterval({
    start: parseISO(weekStart),
    end: parseISO(weekEnd),
  }).map((d) => format(d, "yyyy-MM-dd"));

  let totalCompletions = 0;
  let completedDays = 0;
  let bestDayCount = 0;
  let bestDay = weekStart;

  daysInWeek.forEach((day) => {
    const count = dailyProgress[day] || 0;
    if (count > 0) {
      totalCompletions += count;
      completedDays += 1;
    }
    if (count > bestDayCount) {
      bestDayCount = count;
      bestDay = day;
    }
  });

  return {
    weekStart,
    weekEnd,
    totalCompletions,
    completedDays,
    averagePerDay: completedDays > 0 ? Math.round(totalCompletions / completedDays) : 0,
    bestDay,
    bestDayCount,
  };
}

/**
 * حساب إحصائيات الشهر
 */
export function calculateMonthlyStats(
  dailyProgress: Record<string, number>,
  date: string = new Date().toISOString().split("T")[0]
): MonthlyStats {
  const dateObj = parseISO(date);
  const monthStart = format(startOfMonth(dateObj), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(dateObj), "yyyy-MM-dd");
  const monthKey = format(dateObj, "yyyy-MM");

  const daysInMonth = eachDayOfInterval({
    start: parseISO(monthStart),
    end: parseISO(monthEnd),
  }).map((d) => format(d, "yyyy-MM-dd"));

  let totalCompletions = 0;
  let completedDays = 0;
  const daysData = daysInMonth.map((day) => dailyProgress[day] || 0);

  daysData.forEach((count) => {
    if (count > 0) {
      totalCompletions += count;
      completedDays += 1;
    }
  });

  // معدل التحسن = (أيام الشهر الكاملة / عدد الأيام) * 100
  const improvementRate = (completedDays / daysInMonth.length) * 100;

  return {
    month: monthKey,
    totalCompletions,
    completedDays,
    averagePerDay: completedDays > 0 ? Math.round(totalCompletions / completedDays) : 0,
    improvementRate: Math.round(improvementRate),
  };
}

/**
 * حساب نسبة الاكتمال للورد اليومي
 */
export function calculateCompletionRate(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

/**
 * الحصول على درجة الأداء (A+, A, B, C, D)
 */
export function getPerformanceGrade(
  completionRate: number,
  consistency: number
): "A+" | "A" | "B" | "C" | "D" {
  const score = (completionRate * 0.7 + consistency * 0.3) / 100;
  if (score >= 0.95) return "A+";
  if (score >= 0.85) return "A";
  if (score >= 0.75) return "B";
  if (score >= 0.6) return "C";
  return "D";
}

/**
 * تنسيق الإحصائيات للعرض
 */
export function formatStats(student: StudentData) {
  const today = new Date().toISOString().split("T")[0];
  const weeklyStats = calculateWeeklyStats(student.dailyProgress, today);
  const monthlyStats = calculateMonthlyStats(student.dailyProgress, today);
  const todayProgress = student.dailyProgress[today] || 0;

  return {
    weekly: weeklyStats,
    monthly: monthlyStats,
    today: todayProgress,
    consistency: monthlyStats.improvementRate,
  };
}
