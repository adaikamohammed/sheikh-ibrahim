/**
 * Hook لإدارة الأوراد والتقويم
 * يوفر واجهة سهلة الاستخدام للتعامل مع الأوراد
 */

"use client";

import { useCallback, useState, useEffect } from "react";
import { WirdAssignment } from "@/types";

/**
 * Hook useWirdCalendar
 * يدير البيانات المتعلقة بالأوراد والتقويم
 */
export function useWirdCalendar() {
  const [assignments, setAssignments] = useState<Record<string, WirdAssignment>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // تحميل الأوراد من Firebase (إذا كان متصل)
  useEffect(() => {
    // في المستقبل، سيتم تحميل البيانات من Firebase
    // الآن نستخدم localStorage كبديل
    try {
      const stored = localStorage.getItem("wirdAssignments");
      if (stored) {
        setAssignments(JSON.parse(stored));
      }
    } catch (err) {
      console.error("خطأ في تحميل الأوراد:", err);
    }
  }, []);

  // حفظ الأوراد في localStorage
  const saveAssignments = useCallback(
    (newAssignments: Record<string, WirdAssignment>) => {
      setAssignments(newAssignments);
      try {
        localStorage.setItem("wirdAssignments", JSON.stringify(newAssignments));
      } catch (err) {
        console.error("خطأ في حفظ الأوراد:", err);
        setError("فشل حفظ البيانات");
      }
    },
    []
  );

  // إضافة ورد جديد
  const addAssignment = useCallback(
    (date: string, assignment: WirdAssignment) => {
      const newAssignments = { ...assignments, [date]: assignment };
      saveAssignments(newAssignments);
    },
    [assignments, saveAssignments]
  );

  // تحديث ورد موجود
  const updateAssignment = useCallback(
    (date: string, assignment: WirdAssignment) => {
      const newAssignments = { ...assignments, [date]: assignment };
      saveAssignments(newAssignments);
    },
    [assignments, saveAssignments]
  );

  // حذف ورد
  const deleteAssignment = useCallback(
    (date: string) => {
      const newAssignments = { ...assignments };
      delete newAssignments[date];
      saveAssignments(newAssignments);
    },
    [assignments, saveAssignments]
  );

  // الحصول على ورد لتاريخ معين
  const getAssignmentForDate = useCallback(
    (date: string) => {
      return assignments[date] || null;
    },
    [assignments]
  );

  // الحصول على جميع الأوراد لشهر معين
  const getAssignmentsForMonth = useCallback(
    (year: number, month: number) => {
      const monthStr = `${year}-${String(month).padStart(2, "0")}`;
      return Object.entries(assignments)
        .filter(([date]) => date.startsWith(monthStr))
        .map(([_, assignment]) => assignment);
    },
    [assignments]
  );

  // حساب إحصائيات الشهر
  const getMonthStats = useCallback(
    (year: number, month: number) => {
      const assignmentsInMonth = getAssignmentsForMonth(year, month);
      return {
        total: assignmentsInMonth.length,
        holidays: assignmentsInMonth.filter((a) => a.isHoliday).length,
        wirds: assignmentsInMonth.filter((a) => !a.isHoliday).length,
      };
    },
    [getAssignmentsForMonth]
  );

  return {
    assignments,
    loading,
    error,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignmentForDate,
    getAssignmentsForMonth,
    getMonthStats,
  };
}

/**
 * Hook useWirdProgress
 * يدير تقدم الطلاب في كل ورد
 */
export function useWirdProgress() {
  const [progress, setProgress] = useState<
    Record<string, Record<string, number>>
  >({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem("wirdProgress");
      if (stored) {
        setProgress(JSON.parse(stored));
      }
    } catch (err) {
      console.error("خطأ في تحميل تقدم الأوراد:", err);
    }
  }, []);

  // تحديث تقدم طالب في ورد معين
  const updateStudentProgress = useCallback(
    (wirdId: string, studentId: string, count: number) => {
      setProgress((prev) => {
        const newProgress = { ...prev };
        if (!newProgress[wirdId]) {
          newProgress[wirdId] = {};
        }
        newProgress[wirdId][studentId] = count;
        localStorage.setItem("wirdProgress", JSON.stringify(newProgress));
        return newProgress;
      });
    },
    []
  );

  // الحصول على تقدم طالب في ورد معين
  const getStudentProgress = useCallback(
    (wirdId: string, studentId: string) => {
      return progress[wirdId]?.[studentId] || 0;
    },
    [progress]
  );

  // الحصول على تقدم جميع الطلاب في ورد معين
  const getWirdProgress = useCallback(
    (wirdId: string) => {
      return progress[wirdId] || {};
    },
    [progress]
  );

  // حساب إحصائيات الورد
  const getWirdStats = useCallback(
    (
      wirdId: string,
      targetCount: number,
      totalStudents: number
    ) => {
      const wirdProgress = getWirdProgress(wirdId);
      const counts = Object.values(wirdProgress);

      if (counts.length === 0) {
        return {
          completed: 0,
          inProgress: 0,
          notStarted: totalStudents,
          averageCompletion: 0,
          completionPercentage: 0,
        };
      }

      const completed = counts.filter((c) => c >= targetCount).length;
      const inProgress = counts.filter((c) => c > 0 && c < targetCount).length;
      const notStarted = totalStudents - completed - inProgress;
      const averageCompletion =
        counts.reduce((sum, c) => sum + c, 0) / totalStudents;
      const completionPercentage =
        (completed / totalStudents) * 100;

      return {
        completed,
        inProgress,
        notStarted,
        averageCompletion: Math.round(averageCompletion),
        completionPercentage: Math.round(completionPercentage),
      };
    },
    [getWirdProgress]
  );

  return {
    progress,
    updateStudentProgress,
    getStudentProgress,
    getWirdProgress,
    getWirdStats,
  };
}
