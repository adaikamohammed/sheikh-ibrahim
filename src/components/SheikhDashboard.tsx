"use client";

import { useMemo, useState } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useWird } from "@/hooks/useWird";
import { WirdProgress, WirdStudentProgress } from "@/types";
import { calculateCompletionRate } from "@/services/progressService";
import WirdProgressCard from "./WirdProgressCard";
import {
  Users,
  TrendingUp,
  Trophy,
  Target,
  BarChart3,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Activity,
  User,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Medal,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function SheikhDashboard() {
  const { allStudents, role } = useRealtime();
  const { getWirdForDate } = useWird();
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayWird = getWirdForDate(today);

  // حساب بيانات الورد اليوم
  const todayProgress: WirdStudentProgress[] = useMemo(() => {
    return allStudents.map((student) => {
      const currentCount = student.dailyProgress?.[today] || 0;
      const targetCount = todayWird?.repetitions || 100;
      const percentage = calculateCompletionRate(currentCount, targetCount);

      return {
        studentId: student.uid,
        studentName: student.name,
        date: today,
        currentCount,
        targetCount,
        percentage,
        status:
          percentage === 100
            ? "completed"
            : percentage > 0
              ? "in-progress"
              : "not-started",
        lastUpdate: Date.now(),
      };
    });
  }, [allStudents, today, todayWird?.repetitions]);

  // الإحصائيات الرئيسية
  const stats = useMemo(() => {
    const completedCount = todayProgress.filter((p) => p.status === "completed").length;
    const inProgressCount = todayProgress.filter((p) => p.status === "in-progress").length;
    const totalCompletions = todayProgress.reduce((sum, p) => sum + p.currentCount, 0);
    const averageCompletion =
      allStudents.length > 0
        ? Math.round(
          todayProgress.reduce((sum, p) => sum + p.percentage, 0) / allStudents.length
        )
        : 0;

    // نسبة الاستمرارية (آخر 7 أيام)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    });

    let consistentStudents = 0;
    allStudents.forEach((student) => {
      const completedDays = last7Days.filter((day) => (student.dailyProgress?.[day] || 0) > 0)
        .length;
      if (completedDays >= 5) consistentStudents++;
    });

    const consistencyRate =
      allStudents.length > 0 ? Math.round((consistentStudents / allStudents.length) * 100) : 0;

    return {
      totalStudents: allStudents.length,
      activeStudents: completedCount,
      inProgress: inProgressCount,
      notStarted: todayProgress.filter((p) => p.status === "not-started").length,
      averageCompletion,
      totalCompletions,
      consistencyRate,
    };
  }, [allStudents, todayProgress]);

  // ترتيب الطلاب حسب التقدم
  const sortedProgress = useMemo(() => {
    return [...todayProgress].sort((a, b) => {
      const statusOrder = { completed: 0, "in-progress": 1, "not-started": 2 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return b.percentage - a.percentage;
    });
  }, [todayProgress]);

  // ===== بيانات تكرارات الأوراد لآخر 7 أيام =====
  const wirdStats = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    });

    return last7.map((date) => {
      const wird = getWirdForDate(date);
      const rankings = allStudents
        .map((s) => ({
          name: s.name,
          count: s.dailyProgress?.[date] || 0,
          target: wird?.repetitions || 100,
        }))
        .sort((a, b) => b.count - a.count);

      const dayName = format(new Date(date), "EEEE", { locale: ar });
      return { date, dayName, wird, rankings };
    });
  }, [allStudents, getWirdForDate]);

  if (role !== "sheikh") return null;

  return (
    <div className="min-h-screen text-white pb-8">
      {/* Ambient Background Glows */}
      <div className="fixed top-0 end-0 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none"></div>
      <div className="fixed bottom-0 start-0 w-[300px] h-[300px] bg-blue-900/10 rounded-full blur-[100px] translate-y-1/2 pointer-events-none"></div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-10 space-y-8 md:space-y-12 relative z-10">
        {/* Header */}
        <header className="space-y-1">
          <p className="text-slate-400 text-sm font-sans">السلام عليكم،</p>
          <h1 className="text-3xl md:text-4xl font-bold font-quran text-white">لوحة التحكم الشاملة</h1>
          <p className="text-slate-500 text-sm font-sans">
            {format(new Date(), "EEEE، d MMMM yyyy", { locale: ar })}
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Total Students */}
          <div className="glass-panel p-4 md:p-6 border border-card-border space-y-3 md:space-y-4 group hover:border-blue-500/30 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-xs md:text-sm font-bold text-slate-400 font-quran">إجمالي الطلاب</h3>
              <div className="p-2 md:p-3 bg-blue-500/10 rounded-xl text-blue-500 group-hover:bg-blue-500/20 transition-colors">
                <Users className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-white font-sans">{stats.totalStudents}</p>
          </div>

          {/* Active Today */}
          <div className="glass-panel p-4 md:p-6 border border-card-border space-y-3 md:space-y-4 group hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-xs md:text-sm font-bold text-slate-400 font-quran">مكتملو اليوم</h3>
              <div className="p-2 md:p-3 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
                <Trophy className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl md:text-4xl font-bold text-emerald-500 font-sans">{stats.activeStudents}</p>
              <p className="text-xs md:text-sm text-slate-500 font-sans pb-1">
                {stats.totalStudents > 0
                  ? Math.round((stats.activeStudents / stats.totalStudents) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>

          {/* Average Completion */}
          <div className="glass-panel p-4 md:p-6 border border-card-border space-y-3 md:space-y-4 group hover:border-gold/30 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-xs md:text-sm font-bold text-slate-400 font-quran">متوسط الإكمال</h3>
              <div className="p-2 md:p-3 bg-gold/10 rounded-xl text-gold group-hover:bg-gold/20 transition-colors">
                <Target className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl md:text-4xl font-bold text-gold font-sans">{stats.averageCompletion}%</p>
            </div>
          </div>

          {/* Consistency Rate */}
          <div className="glass-panel p-4 md:p-6 border border-card-border space-y-3 md:space-y-4 group hover:border-orange-500/30 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-xs md:text-sm font-bold text-slate-400 font-quran">الاستمرارية</h3>
              <div className="p-2 md:p-3 bg-orange-500/10 rounded-xl text-orange-500 group-hover:bg-orange-500/20 transition-colors">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl md:text-4xl font-bold text-orange-500 font-sans">{stats.consistencyRate}%</p>
            </div>
          </div>
        </div>

        {/* Wird Info */}
        {todayWird && (
          <div className="glass-panel rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 border border-card-border relative overflow-hidden">
            <div className="absolute top-0 start-0 w-full h-full bg-gradient-to-l from-transparent via-transparent to-gold/5 opacity-50 pointer-events-none"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8 relative z-10">
              <div className="space-y-1 md:space-y-2">
                <p className="text-xs text-slate-400 font-sans font-bold uppercase tracking-wider">الورد اليومي</p>
                <h2 className="text-2xl md:text-3xl font-bold font-quran text-white">
                  سورة {todayWird.surahName}
                </h2>
              </div>
              <div className="space-y-1 md:space-y-2">
                <p className="text-xs text-slate-400 font-sans font-bold uppercase tracking-wider">الآيات</p>
                <p className="text-lg md:text-xl font-bold text-gold font-sans">
                  من {todayWird.startAyah} إلى {todayWird.endAyah}
                </p>
              </div>
              <div className="space-y-1 md:space-y-2">
                <p className="text-xs text-slate-400 font-sans font-bold uppercase tracking-wider">المستهدف</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl font-bold text-emerald-500 font-sans">{todayWird.repetitions}</span>
                  <span className="text-xs text-emerald-500/70 font-bold">تكرار</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Summary */}
        <div className="glass-panel p-5 md:p-8 border border-card-border">
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="text-center space-y-2 md:space-y-3">
              <div className="inline-flex items-center justify-center w-11 h-11 md:w-14 md:h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 md:w-7 md:h-7" />
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-emerald-500 font-sans">{stats.activeStudents}</p>
                <p className="text-[10px] md:text-xs text-slate-400 font-quran mt-1">أتموا الورد</p>
              </div>
            </div>
            <div className="text-center space-y-2 md:space-y-3">
              <div className="inline-flex items-center justify-center w-11 h-11 md:w-14 md:h-14 rounded-2xl bg-gold/10 text-gold shadow-lg shadow-gold/5 ring-1 ring-gold/20">
                <Activity className="w-5 h-5 md:w-7 md:h-7" />
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-gold font-sans">{stats.inProgress}</p>
                <p className="text-[10px] md:text-xs text-slate-400 font-quran mt-1">بدأوا القراءة</p>
              </div>
            </div>
            <div className="text-center space-y-2 md:space-y-3">
              <div className="inline-flex items-center justify-center w-11 h-11 md:w-14 md:h-14 rounded-2xl bg-slate-800 text-slate-500 shadow-lg ring-1 ring-slate-700">
                <AlertCircle className="w-5 h-5 md:w-7 md:h-7" />
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-slate-500 font-sans">{stats.notStarted}</p>
                <p className="text-[10px] md:text-xs text-slate-400 font-quran mt-1">لم يبدأوا بعد</p>
              </div>
            </div>
          </div>
        </div>

        {/* ===== تكرارات الأوراد حسب اليوم ===== */}
        <section className="space-y-5 md:space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><BookOpen className="w-5 h-5" /></div>
            <h2 className="text-xl md:text-2xl font-bold font-quran text-white">تكرارات الأوراد</h2>
            <span className="text-xs text-slate-500 font-sans">آخر 7 أيام</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wirdStats.map(({ date, dayName, wird, rankings }) => {
              const isExpanded = expandedDay === date;
              const readCount = rankings.filter((r) => r.count > 0).length;
              if (!wird || wird.isHoliday) return null;

              return (
                <div key={date} className="glass-panel border border-card-border rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setExpandedDay(isExpanded ? null : date)}
                    className="w-full p-4 md:p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-gold/10 rounded-xl text-gold flex-shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="text-start min-w-0">
                        <p className="font-bold text-white text-sm font-quran">{dayName}</p>
                        <p className="text-xs text-slate-400 font-quran truncate">سورة {wird.surahName} · {wird.repetitions} تكرار</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${readCount === allStudents.length
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : readCount > 0
                            ? "bg-gold/10 text-gold border-gold/20"
                            : "bg-slate-800 text-slate-500 border-slate-700"
                        }`}>
                        {readCount}/{allStudents.length}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-white/5 px-4 md:px-5 py-3 space-y-2">
                      {rankings.map((r, i) => {
                        const pct = Math.min(100, (r.count / r.target) * 100);
                        const medals = ["🥇", "🥈", "🥉"];
                        return (
                          <div key={i} className="flex items-center gap-3 py-1.5">
                            <span className="w-6 text-center text-sm flex-shrink-0">
                              {r.count > 0 && i < 3 ? medals[i] : <span className="text-slate-600 text-xs">{i + 1}</span>}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1">
                                <span className={`text-xs font-bold truncate ${r.count >= r.target ? "text-emerald-400" : r.count > 0 ? "text-white" : "text-slate-500"}`}>
                                  {r.name}
                                </span>
                                <span className={`text-xs font-bold font-sans ms-2 flex-shrink-0 ${r.count >= r.target ? "text-emerald-400" : r.count > 0 ? "text-gold" : "text-slate-600"}`}>
                                  {r.count}/{r.target}
                                </span>
                              </div>
                              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${r.count >= r.target ? "bg-emerald-500" : "bg-gold/70"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Students List */}
        <section className="space-y-5 md:space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2 bg-gold/10 rounded-lg text-gold"><BarChart3 className="w-5 h-5" /></div>
            <h2 className="text-xl md:text-2xl font-bold font-quran text-white">تقدم الطلاب</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {sortedProgress.map((progress) => (
              <WirdProgressCard key={progress.studentId} progress={progress} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
