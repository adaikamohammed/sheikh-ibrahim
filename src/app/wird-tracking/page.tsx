"use client";

import { useState, useMemo } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useWird } from "@/hooks/useWird";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   Cell,
//   LineChart,
//   Line,
// } from "recharts";
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";
import { ar } from "date-fns/locale";
import { TrendingUp, AlertCircle, Trophy, Users } from "lucide-react";
import { WirdAssignment } from "@/types";

interface StudentChartData {
  name: string;
  achieved: number;
  target: number;
  percentage: number;
}

interface WirdStat {
  wirdId: string;
  date: string;
  surah: string;
  ayahRange: string;
  wirdName: string;
  targetRepetitions: number;
  studentProgress: Array<{
    studentId: string;
    studentName: string;
    progress: number;
    targetCount: number;
    percentage: number;
  }>;
  completedStudents: number;
  totalStudents: number;
  completionPercentage: number;
}

export default function WirdTrackingPage() {
  const { allStudents, role } = useRealtime();
  const { allAssignments } = useWird();
  const [selectedWirdId, setSelectedWirdId] = useState<string>("");

  // حساب إحصائيات الأوراد - MOVED BEFORE CONDITIONAL
  const wirdStats = useMemo((): WirdStat[] => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    // تجميع الأوراد غير العطلات
    const wirds: WirdAssignment[] = Array.isArray(allAssignments)
      ? allAssignments.filter((w: WirdAssignment) => !w.isHoliday)
      : [];

    // لكل ورد، حساب التقدم عند جميع الطلاب
    const stats: WirdStat[] = wirds.map((wird: WirdAssignment) => {
      const studentProgress = allStudents.map((student) => {
        const progress = student.dailyProgress?.[wird.date] || 0;
        return {
          studentId: student.uid,
          studentName: student.name,
          progress,
          targetCount: wird.targetRepetitions,
          percentage: Math.min(100, (progress / wird.targetRepetitions) * 100),
        };
      });

      const completedStudents = studentProgress.filter(
        (sp) => sp.progress >= sp.targetCount
      ).length;
      const averageCompletion =
        studentProgress.reduce((sum, sp) => sum + sp.percentage, 0) /
        studentProgress.length;

      return {
        wirdId: wird.id!,
        date: wird.date,
        surah: wird.arabicSurahName,
        ayahRange: `${wird.startAyah}-${wird.endAyah}`,
        wirdName: `${wird.arabicSurahName} ${wird.startAyah}-${wird.endAyah}`,
        targetRepetitions: wird.targetRepetitions,
        studentProgress,
        completedStudents,
        totalStudents: allStudents.length,
        completionPercentage: averageCompletion,
      };
    });

    return stats.sort(
      (a: WirdStat, b: WirdStat) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [allStudents, allAssignments]);

  // الورد المختار
  const selectedWird = wirdStats.find((w) => w.wirdId === selectedWirdId) || wirdStats[0];

  // بيانات الرسم البياني - كل طالب وتقدمه
  const chartData = useMemo((): StudentChartData[] => {
    if (!selectedWird) return [];

    return selectedWird.studentProgress.map((sp) => ({
      name: sp.studentName.split(" ")[0], // الاسم الأول فقط
      achieved: sp.progress,
      target: sp.targetCount,
      percentage: Math.round(sp.percentage),
    }));
  }, [selectedWird]);

  // إحصائيات الورد الحالي
  const wirdMetrics = useMemo(() => {
    if (!selectedWird) return null;

    return {
      completionRate: Math.round(selectedWird.completionPercentage),
      completed: selectedWird.completedStudents,
      inProgress: selectedWird.studentProgress.filter(
        (sp) => sp.progress > 0 && sp.progress < sp.targetCount
      ).length,
      notStarted: selectedWird.studentProgress.filter(
        (sp) => sp.progress === 0
      ).length,
    };
  }, [selectedWird]);

  // CONDITIONAL CHECK MOVED AFTER ALL HOOKS
  if (role !== "sheikh") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto" />
          <p className="text-slate-400">هذه الصفحة مخصصة للشيخ فقط</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-32 md:pb-8">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2"></div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 relative z-10">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <TrendingUp className="w-8 h-8 text-gold" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-quran">متابعة الأوراد</h1>
              <p className="text-slate-400 text-sm mt-1">
                عرض تقدم الطلاب في كل ورد على حدة
              </p>
            </div>
          </div>
        </header>

        {wirdStats.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center border border-card-border">
            <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">لم يتم إضافة أي أوراد حتى الآن</p>
            <p className="text-slate-500 text-sm mt-2">
              أضف أوراد من صفحة التقويم أولاً
            </p>
          </div>
        ) : (
          <>
            {/* قائمة الأوراد */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-400">اختر ورد</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {wirdStats.map((wird: WirdStat) => (
                  <button
                    key={wird.wirdId}
                    onClick={() => setSelectedWirdId(wird.wirdId)}
                    className={`p-3 rounded-lg transition-all text-center text-xs md:text-sm font-semibold border-2 ${
                      selectedWirdId === wird.wirdId || !selectedWirdId && wird === wirdStats[0]
                        ? "bg-gold/20 border-gold text-gold"
                        : "bg-slate-900/30 border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white"
                    }`}
                  >
                    <div className="truncate">{wird.surah}</div>
                    <div className="text-[10px] md:text-xs text-slate-400">
                      {wird.ayahRange}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedWird && wirdMetrics && (
              <>
                {/* إحصائيات الورد الحالي */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="glass-panel rounded-lg p-4 border border-gold/20 text-center">
                    <p className="text-slate-400 text-xs md:text-sm mb-2">معدل الإكمال</p>
                    <div className="text-3xl md:text-4xl font-bold text-gold">
                      {wirdMetrics.completionRate}%
                    </div>
                  </div>

                  <div className="glass-panel rounded-lg p-4 border border-emerald-500/20 text-center">
                    <p className="text-slate-400 text-xs md:text-sm mb-2">مكتمل</p>
                    <div className="text-3xl md:text-4xl font-bold text-emerald-500">
                      {wirdMetrics.completed}
                    </div>
                  </div>

                  <div className="glass-panel rounded-lg p-4 border border-yellow-500/20 text-center">
                    <p className="text-slate-400 text-xs md:text-sm mb-2">قيد الإنجاز</p>
                    <div className="text-3xl md:text-4xl font-bold text-yellow-500">
                      {wirdMetrics.inProgress}
                    </div>
                  </div>

                  <div className="glass-panel rounded-lg p-4 border border-red-500/20 text-center">
                    <p className="text-slate-400 text-xs md:text-sm mb-2">لم يبدأ</p>
                    <div className="text-3xl md:text-4xl font-bold text-red-500">
                      {wirdMetrics.notStarted}
                    </div>
                  </div>
                </div>

                {/* الرسم البياني - نسخة بسيطة */}
                <div className="glass-panel rounded-2xl p-6 md:p-8 border border-card-border space-y-4">
                  <h3 className="text-lg font-bold">تقدم الطلاب في هذا الورد</h3>
                  <div className="w-full space-y-4">
                    {chartData.map((student: StudentChartData) => (
                      <div key={student.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">{student.name}</span>
                          <span className="text-xs text-slate-400">
                            {student.achieved} / {student.target}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-gold to-emerald-500 transition-all"
                              style={{ width: `${Math.min(100, student.percentage)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-gold w-12 text-right">
                            {student.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* جدول التفاصيل */}
                <div className="glass-panel rounded-2xl p-6 md:p-8 border border-card-border overflow-x-auto">
                  <h3 className="text-lg font-bold mb-6">تفاصيل تقدم كل طالب</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-right p-3 font-semibold text-gold">الطالب</th>
                        <th className="text-center p-3 font-semibold text-gold">المكتمل</th>
                        <th className="text-center p-3 font-semibold text-gold">الهدف</th>
                        <th className="text-center p-3 font-semibold text-gold">النسبة</th>
                        <th className="text-center p-3 font-semibold text-gold">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((student: StudentChartData) => {
                        const isCompleted = student.achieved >= student.target;
                        const isInProgress =
                          student.achieved > 0 && student.achieved < student.target;

                        return (
                          <tr key={student.name} className="border-b border-slate-800">
                            <td className="p-3">{student.name}</td>
                            <td className="text-center p-3 text-emerald-400 font-semibold">
                              {student.achieved}
                            </td>
                            <td className="text-center p-3 text-gold">{student.target}</td>
                            <td className="text-center p-3">
                              <div className="flex items-center justify-center">
                                <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${
                                      isCompleted
                                        ? "bg-emerald-500"
                                        : isInProgress
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                    }`}
                                    style={{
                                      width: `${Math.min(100, student.percentage)}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="mr-2 text-xs">{student.percentage}%</span>
                              </div>
                            </td>
                            <td className="text-center p-3">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  isCompleted
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : isInProgress
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {isCompleted
                                  ? "✓ مكتمل"
                                  : isInProgress
                                  ? "⏳ قيد الإنجاز"
                                  : "✗ لم يبدأ"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
