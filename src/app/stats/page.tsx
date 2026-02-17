"use client";

import { useMemo } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useWird } from "@/hooks/useWird";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ar } from "date-fns/locale";
import {
  TrendingUp,
  Download,
  BarChart3,
  Trophy,
  Users,
  CheckCircle2,
} from "lucide-react";

export default function AnalyticsPage() {
  const { allStudents, role } = useRealtime();
  const { allAssignments } = useWird();

  // حساب الإحصائيات الشاملة
  const stats = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const daysInMonth = eachDayOfInterval({
      start: monthStart,
      end: monthEnd,
    });

    let totalCompletions = 0;
    let totalCompletedDays = 0;
    const studentStats = allStudents.map((student) => {
      let monthTotal = 0;
      let completedDays = 0;

      daysInMonth.forEach((date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const count = student.dailyProgress?.[dateStr] || 0;
        monthTotal += count;
        if (count > 0) completedDays += 1;
      });

      totalCompletions += monthTotal;
      totalCompletedDays += completedDays;

      return {
        name: student.name,
        total: monthTotal,
        completedDays,
        average: Math.round(monthTotal / daysInMonth.length),
        consistency: Math.round((completedDays / daysInMonth.length) * 100),
      };
    });

    const sortedByTotal = [...studentStats].sort((a, b) => b.total - a.total);
    const sortedByConsistency = [...studentStats].sort(
      (a, b) => b.consistency - a.consistency
    );

    return {
      totalCompletions,
      totalStudents: allStudents.length,
      averageCompletion: Math.round(totalCompletions / (allStudents.length || 1)),
      topPerformers: sortedByTotal.slice(0, 5),
      mostConsistent: sortedByConsistency.slice(0, 5),
      allStudentStats: studentStats,
    };
  }, [allStudents]);

  if (role !== "sheikh") return null;

  const handleExportPDF = () => {
    // Placeholder for PDF export
    alert("يتم تطوير ميزة تصدير PDF");
  };

  const handleExportCSV = () => {
    // Placeholder for CSV export
    alert("يتم تطوير ميزة تصدير CSV");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-slate-950 to-background text-white pb-28 md:pb-8">
      {/* التأثيرات الخلفية */}
      <div className="absolute top-0 end-0 w-[500px] h-[500px] bg-gradient-to-br from-gold/10 to-transparent rounded-full blur-[150px] -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 start-0 w-[400px] h-[400px] bg-gradient-to-tl from-blue-500/5 to-transparent rounded-full blur-[150px] translate-y-1/2 pointer-events-none"></div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-6 md:pt-10 space-y-8 relative z-10">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gold to-emerald-500 rounded-xl blur-lg opacity-30"></div>
              <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 p-3 rounded-xl border border-gold/30">
                <BarChart3 className="w-8 h-8 text-gold" />
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-sans">الإحصائيات والتقارير</p>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gold via-white to-emerald-400 bg-clip-text text-transparent">تحليل الأداء الشامل</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-blue-500/10 hover:bg-blue-500/30 border border-blue-500/30 transition-all text-sm font-sans hover:shadow-lg hover:shadow-blue-500/20"
            >
              <Download className="w-4 h-4" />
              <span>تصدير PDF</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all text-sm font-sans hover:shadow-lg hover:shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" />
              <span>تصدير Excel</span>
            </button>
          </div>
        </header>

        {/* Main Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {/* بطاقة التكرارات */}
          <div className="group relative overflow-hidden rounded-xl border border-gold/20 transition-all hover:border-gold/50 hover:shadow-lg hover:shadow-gold/20">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative glass-panel rounded-xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-400">إجمالي التكرارات</h3>
                <div className="p-2 rounded-lg bg-gold/10 border border-gold/30">
                  <BarChart3 className="w-5 h-5 text-gold" />
                </div>
              </div>
              <p className="text-4xl font-bold text-gold">{stats.totalCompletions}</p>
              <p className="text-xs text-slate-500">هذا الشهر</p>
            </div>
          </div>

          {/* بطاقة المتوسط */}
          <div className="group relative overflow-hidden rounded-xl border border-emerald-500/20 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative glass-panel rounded-xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-400">متوسط الطالب</h3>
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <p className="text-4xl font-bold text-emerald-400">{stats.averageCompletion}</p>
              <p className="text-xs text-slate-500">تكرار/الشهر</p>
            </div>
          </div>

          {/* بطاقة الطلاب */}
          <div className="group relative overflow-hidden rounded-xl border border-orange-500/20 transition-all hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative glass-panel rounded-xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-400">عدد الطلاب</h3>
                <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <Users className="w-5 h-5 text-orange-400" />
                </div>
              </div>
              <p className="text-4xl font-bold text-orange-400">{stats.totalStudents}</p>
              <p className="text-xs text-slate-500">طالب نشط</p>
            </div>
          </div>
        </div>

        {/* Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performers */}
          <div className="glass-panel rounded-2xl p-6 border border-card-border">
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold font-quran">الأفضل أداءً</h2>
            </div>

            <div className="space-y-3">
              {stats.topPerformers.map((student, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">{student.name}</p>
                      <p className="text-xs text-slate-500 font-sans">
                        متوسط يومي: {student.average}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-primary">{student.total}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Most Consistent */}
          <div className="glass-panel rounded-2xl p-6 border border-card-border">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold font-quran">الأكثر التزاماً</h2>
            </div>

            <div className="space-y-3">
              {stats.mostConsistent.map((student, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-500">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">{student.name}</p>
                      <p className="text-xs text-slate-500 font-sans">
                        {student.completedDays} أيام التزام
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-emerald-500">{student.consistency}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* All Students Table */}
        <div className="glass-panel rounded-2xl p-6 border border-card-border">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold font-quran">جميع الطلاب</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-card-border">
                <tr>
                  <th className="text-start py-3 px-4 font-bold text-slate-400">الاسم</th>
                  <th className="text-center py-3 px-4 font-bold text-slate-400">الإجمالي</th>
                  <th className="text-center py-3 px-4 font-bold text-slate-400">المتوسط</th>
                  <th className="text-center py-3 px-4 font-bold text-slate-400">الأيام</th>
                  <th className="text-center py-3 px-4 font-bold text-slate-400">الالتزام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {stats.allStudentStats
                  .sort((a, b) => b.total - a.total)
                  .map((student, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4 text-start text-foreground font-medium">
                        {student.name}
                      </td>
                      <td className="py-3 px-4 text-center text-primary font-bold">
                        {student.total}
                      </td>
                      <td className="py-3 px-4 text-center text-emerald-500 font-bold">
                        {student.average}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400">
                        {student.completedDays}/30
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary font-bold text-xs">
                          {student.consistency}%
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
