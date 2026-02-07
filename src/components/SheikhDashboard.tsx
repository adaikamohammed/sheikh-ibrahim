"use client";

import { useMemo } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useWird } from "@/hooks/useWird";
import { WirdProgress } from "@/types";
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
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function SheikhDashboard() {
  const { allStudents, role } = useRealtime();
  const { getWirdForDate } = useWird();

  const today = format(new Date(), "yyyy-MM-dd");
  const todayWird = getWirdForDate(today);

  // حساب بيانات الورد اليوم
  const todayProgress: WirdProgress[] = useMemo(() => {
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

  if (role !== "sheikh") return null;

  return (
    <div className="min-h-screen bg-background text-white pb-32">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] -translate-x-1/2"></div>

      <main className="max-w-7xl mx-auto px-6 pt-10 space-y-12 relative z-10">
        {/* Header */}
        <header className="space-y-2">
          <p className="text-slate-500 text-sm font-sans">السلام عليكم،</p>
          <h1 className="text-4xl font-bold font-quran">لوحة التحكم الشاملة</h1>
          <p className="text-slate-400 text-sm font-sans">
            {format(new Date(), "EEEE، d MMMM yyyy", { locale: ar })}
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Students */}
          <div className="glass-panel rounded-2xl p-6 border border-card-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-400 font-quran">إجمالي الطلاب</h3>
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-4xl font-bold text-foreground">{stats.totalStudents}</p>
          </div>

          {/* Active Today */}
          <div className="glass-panel rounded-2xl p-6 border border-card-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-400 font-quran">مكتملو اليوم</h3>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                <Trophy className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-end space-x-3 space-x-reverse">
              <p className="text-4xl font-bold text-emerald-500">{stats.activeStudents}</p>
              <p className="text-sm text-slate-500 font-sans pb-1">
                {stats.totalStudents > 0
                  ? Math.round((stats.activeStudents / stats.totalStudents) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>

          {/* Average Completion */}
          <div className="glass-panel rounded-2xl p-6 border border-card-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-400 font-quran">متوسط الإكمال</h3>
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-end space-x-3 space-x-reverse">
              <p className="text-4xl font-bold text-primary">{stats.averageCompletion}%</p>
            </div>
          </div>

          {/* Consistency Rate */}
          <div className="glass-panel rounded-2xl p-6 border border-card-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-400 font-quran">الاستمرارية</h3>
              <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-end space-x-3 space-x-reverse">
              <p className="text-4xl font-bold text-orange-500">{stats.consistencyRate}%</p>
            </div>
          </div>
        </div>

        {/* Wird Info */}
        {todayWird && (
          <div className="glass-panel rounded-[2.5rem] p-8 border border-card-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-sans font-bold">الورد اليومي</p>
                <h2 className="text-2xl font-bold font-quran text-foreground">
                  سورة {todayWird.surahName}
                </h2>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-sans font-bold">الآيات</p>
                <p className="text-lg font-bold text-primary">
                  من {todayWird.startAyah} إلى {todayWird.endAyah}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-sans font-bold">عدد التكرارات</p>
                <p className="text-lg font-bold text-emerald-500">{todayWird.repetitions} تكرار</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Summary */}
        <div className="glass-panel rounded-2xl p-6 border border-card-border">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-500">{stats.activeStudents}</p>
                <p className="text-xs text-slate-500 font-sans">مكتملوا</p>
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{stats.inProgress}</p>
                <p className="text-xs text-slate-500 font-sans">قيد الإنجاز</p>
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-500/10 text-slate-500">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-500">{stats.notStarted}</p>
                <p className="text-xs text-slate-500 font-sans">لم يبدأ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Students List */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold font-quran">تقدم الطلاب</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedProgress.map((progress) => (
              <WirdProgressCard key={progress.studentId} progress={progress} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
