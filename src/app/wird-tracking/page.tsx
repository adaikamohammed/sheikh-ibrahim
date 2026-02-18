"use client";

import { useState, useMemo } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useWird } from "@/hooks/useWird";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import {
  TrendingUp,
  AlertCircle,
  Trophy,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from "lucide-react";

interface StudentProgress {
  studentId: string;
  studentName: string;
  progress: number;
  targetCount: number;
  percentage: number;
  status: "completed" | "in-progress" | "not-started";
}

interface WirdStat {
  wirdId: string;
  date: string;
  surah: string;
  ayahRange: string;
  wirdName: string;
  targetRepetitions: number;
  studentProgress: StudentProgress[];
  completedStudents: number;
  inProgressStudents: number;
  notStartedStudents: number;
  totalStudents: number;
  completionPercentage: number;
}

export default function WirdTrackingPage() {
  const { allStudents, role } = useRealtime();
  const { allAssignments } = useWird();
  const [expandedWirdId, setExpandedWirdId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "completed" | "in-progress" | "not-started"
  >("all");

  // حساب إحصائيات الأوراد — تحويل Record إلى Array
  const wirdStats = useMemo((): WirdStat[] => {
    // تحويل allAssignments من Record<string, WirdAssignment> إلى مصفوفة
    const wirdsArray = Object.values(allAssignments || {});

    // تصفية العطلات
    const wirds = wirdsArray.filter((w) => !w.isHoliday);

    // لكل ورد، حساب التقدم عند جميع الطلاب
    const stats: WirdStat[] = wirds.map((wird) => {
      const targetReps = wird.repetitions || 100;

      const studentProgress: StudentProgress[] = allStudents.map((student) => {
        const progress = student.dailyProgress?.[wird.date] || 0;
        const percentage = Math.min(
          100,
          Math.round((progress / targetReps) * 100)
        );
        let status: "completed" | "in-progress" | "not-started" = "not-started";
        if (progress >= targetReps) status = "completed";
        else if (progress > 0) status = "in-progress";

        return {
          studentId: student.uid,
          studentName: student.name,
          progress,
          targetCount: targetReps,
          percentage,
          status,
        };
      });

      const completedStudents = studentProgress.filter(
        (sp) => sp.status === "completed"
      ).length;
      const inProgressStudents = studentProgress.filter(
        (sp) => sp.status === "in-progress"
      ).length;
      const notStartedStudents = studentProgress.filter(
        (sp) => sp.status === "not-started"
      ).length;
      const averageCompletion =
        studentProgress.length > 0
          ? Math.round(
            studentProgress.reduce((sum, sp) => sum + sp.percentage, 0) /
            studentProgress.length
          )
          : 0;

      return {
        wirdId: wird.date, // استخدام التاريخ كمعرّف
        date: wird.date,
        surah: wird.surahName || "",
        ayahRange:
          wird.startAyah && wird.endAyah
            ? `${wird.startAyah}-${wird.endAyah}`
            : "",
        wirdName: `${wird.surahName || ""} ${wird.startAyah || ""}-${wird.endAyah || ""}`,
        targetRepetitions: targetReps,
        studentProgress,
        completedStudents,
        inProgressStudents,
        notStartedStudents,
        totalStudents: allStudents.length,
        completionPercentage: averageCompletion,
      };
    });

    return stats.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [allStudents, allAssignments]);

  // تبديل توسّع بطاقة الورد
  const toggleExpand = (wirdId: string) => {
    setExpandedWirdId((prev) => (prev === wirdId ? null : wirdId));
  };

  // تصنيف الطلاب حسب الفلتر
  const getFilteredStudents = (students: StudentProgress[]) => {
    if (filterStatus === "all") return students;
    return students.filter((s) => s.status === filterStatus);
  };

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

  // تنسيق التاريخ
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "EEEE d MMMM", { locale: ar });
    } catch {
      return dateStr;
    }
  };

  // ألوان ورموز الحالات
  const statusConfig = {
    completed: {
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      label: "أكمل ✓",
      barColor: "bg-emerald-500",
    },
    "in-progress": {
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      label: "بدأ ⏳",
      barColor: "bg-amber-500",
    },
    "not-started": {
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      label: "لم يبدأ",
      barColor: "bg-red-500/30",
    },
  };

  return (
    <div className="min-h-screen bg-background text-white pb-32 md:pb-8">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2"></div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 relative z-10">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <TrendingUp className="w-8 h-8 text-gold" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-quran">
                متابعة الأوراد
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                عرض تقدم الطلاب في كل ورد على حدة
              </p>
            </div>
          </div>
        </header>

        {/* إحصائيات عامة */}
        {wirdStats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass-panel rounded-xl p-4 border border-gold/20 text-center">
              <BookOpen className="w-5 h-5 text-gold mx-auto mb-2" />
              <div className="text-2xl font-bold text-gold">
                {wirdStats.length}
              </div>
              <p className="text-xs text-slate-400 mt-1">إجمالي الأوراد</p>
            </div>
            <div className="glass-panel rounded-xl p-4 border border-emerald-500/20 text-center">
              <Users className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-emerald-400">
                {allStudents.length}
              </div>
              <p className="text-xs text-slate-400 mt-1">عدد الطلاب</p>
            </div>
            <div className="glass-panel rounded-xl p-4 border border-amber-500/20 text-center">
              <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-amber-400">
                {wirdStats.length > 0
                  ? Math.round(
                    wirdStats.reduce(
                      (sum, w) => sum + w.completionPercentage,
                      0
                    ) / wirdStats.length
                  )
                  : 0}
                %
              </div>
              <p className="text-xs text-slate-400 mt-1">متوسط الإكمال</p>
            </div>
            <div className="glass-panel rounded-xl p-4 border border-blue-500/20 text-center">
              <CheckCircle2 className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-400">
                {wirdStats.filter((w) => w.completionPercentage === 100).length}
              </div>
              <p className="text-xs text-slate-400 mt-1">أوراد مكتملة 100%</p>
            </div>
          </div>
        )}

        {/* فلتر الحالات */}
        {wirdStats.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: "all", label: "الكل", color: "text-white" },
                {
                  key: "completed",
                  label: "أكمل ✓",
                  color: "text-emerald-400",
                },
                { key: "in-progress", label: "بدأ ⏳", color: "text-amber-400" },
                {
                  key: "not-started",
                  label: "لم يبدأ",
                  color: "text-red-400",
                },
              ] as const
            ).map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${filterStatus === key
                    ? "bg-gold/20 border-gold text-gold"
                    : "bg-slate-900/50 border-slate-700 hover:border-slate-500"
                  } ${color}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {wirdStats.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center border border-card-border">
            <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">لم يتم إضافة أي أوراد حتى الآن</p>
            <p className="text-slate-500 text-sm mt-2">
              أضف أوراد من صفحة التقويم أولاً
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {wirdStats.map((wird) => {
              const isExpanded = expandedWirdId === wird.wirdId;
              const filteredStudents = getFilteredStudents(
                wird.studentProgress
              );

              return (
                <div
                  key={wird.wirdId}
                  className="glass-panel rounded-2xl border border-card-border overflow-hidden transition-all duration-300"
                >
                  {/* رأس بطاقة الورد */}
                  <button
                    onClick={() => toggleExpand(wird.wirdId)}
                    className="w-full p-5 md:p-6 text-right hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg md:text-xl font-bold font-quran truncate">
                            {wird.surah}
                          </h3>
                          {wird.ayahRange && (
                            <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full border border-gold/20 whitespace-nowrap">
                              آية {wird.ayahRange}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {formatDate(wird.date)} • الهدف:{" "}
                          {wird.targetRepetitions} تكرار
                        </p>
                      </div>

                      {/* ملخص سريع */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center gap-1 text-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                            <span className="text-emerald-400 font-bold">
                              {wird.completedStudents}
                            </span>
                          </span>
                          <span className="flex items-center gap-1 text-xs">
                            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                            <span className="text-amber-400 font-bold">
                              {wird.inProgressStudents}
                            </span>
                          </span>
                          <span className="flex items-center gap-1 text-xs">
                            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                            <span className="text-red-400 font-bold">
                              {wird.notStartedStudents}
                            </span>
                          </span>
                        </div>

                        {/* شريط تقدم دائري صغير */}
                        <div className="relative w-10 h-10">
                          <svg
                            className="w-10 h-10 -rotate-90"
                            viewBox="0 0 36 36"
                          >
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="rgba(100,116,139,0.2)"
                              strokeWidth="3"
                            />
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke={
                                wird.completionPercentage >= 80
                                  ? "#10b981"
                                  : wird.completionPercentage >= 40
                                    ? "#f59e0b"
                                    : "#ef4444"
                              }
                              strokeWidth="3"
                              strokeDasharray={`${wird.completionPercentage}, 100`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                            {wird.completionPercentage}%
                          </span>
                        </div>

                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                    </div>

                    {/* شريط تقدم أفقي */}
                    <div className="mt-3 flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-slate-800/50">
                      {wird.completedStudents > 0 && (
                        <div
                          className="bg-emerald-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${(wird.completedStudents / wird.totalStudents) * 100}%`,
                          }}
                        />
                      )}
                      {wird.inProgressStudents > 0 && (
                        <div
                          className="bg-amber-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${(wird.inProgressStudents / wird.totalStudents) * 100}%`,
                          }}
                        />
                      )}
                      {wird.notStartedStudents > 0 && (
                        <div
                          className="bg-red-500/30 rounded-full transition-all duration-500"
                          style={{
                            width: `${(wird.notStartedStudents / wird.totalStudents) * 100}%`,
                          }}
                        />
                      )}
                    </div>
                  </button>

                  {/* تفاصيل الطلاب — تظهر عند التوسيع */}
                  {isExpanded && (
                    <div className="border-t border-slate-800 p-4 md:p-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                      {/* إحصائيات سريعة */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                          <div className="text-lg font-bold text-emerald-400">
                            {wird.completedStudents}
                          </div>
                          <p className="text-[10px] text-slate-500">مكتمل</p>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                          <Clock className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                          <div className="text-lg font-bold text-amber-400">
                            {wird.inProgressStudents}
                          </div>
                          <p className="text-[10px] text-slate-500">
                            قيد الإنجاز
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                          <XCircle className="w-4 h-4 text-red-400 mx-auto mb-1" />
                          <div className="text-lg font-bold text-red-400">
                            {wird.notStartedStudents}
                          </div>
                          <p className="text-[10px] text-slate-500">لم يبدأ</p>
                        </div>
                      </div>

                      {/* قائمة الطلاب */}
                      {filteredStudents.length === 0 ? (
                        <p className="text-center text-slate-500 text-sm py-4">
                          لا يوجد طلاب بهذه الحالة
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {filteredStudents
                            .sort((a, b) => b.percentage - a.percentage)
                            .map((student) => {
                              const config = statusConfig[student.status];
                              const Icon = config.icon;

                              return (
                                <div
                                  key={student.studentId}
                                  className={`p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${config.border} ${config.bg}`}
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Icon
                                        className={`w-4 h-4 shrink-0 ${config.color}`}
                                      />
                                      <span className="font-semibold text-sm truncate">
                                        {student.studentName}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.color} border ${config.border} shrink-0`}
                                    >
                                      {config.label}
                                    </span>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-slate-400">
                                        <span className="text-white font-bold">
                                          {student.progress}
                                        </span>{" "}
                                        / {student.targetCount}
                                      </span>
                                      <span
                                        className={`font-bold ${config.color}`}
                                      >
                                        {student.percentage}%
                                      </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-900/80 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-700 ${config.barColor}`}
                                        style={{
                                          width: `${student.percentage}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
