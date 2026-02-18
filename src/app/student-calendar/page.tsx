"use client";

import { useState, useMemo, useEffect } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useWird } from "@/hooks/useWird";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    BookOpen,
    CheckCircle2,
    Trophy,
    Star,
    Coffee,
    TrendingUp,
} from "lucide-react";
import {
    generateCalendarGrid,
    dateToString,
    getSurahInfo,
} from "@/services/calendarService";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function StudentCalendarPage() {
    const { role, studentData } = useRealtime();
    const { allAssignments } = useWird();
    const router = useRouter();
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [selectedDayInfo, setSelectedDayInfo] = useState<string | null>(null);

    const calendarGrid = useMemo(
        () => generateCalendarGrid(currentYear, currentMonth),
        [currentYear, currentMonth]
    );

    const monthName = format(new Date(currentYear, currentMonth - 1), "MMMM", {
        locale: ar,
    });

    // إحصائيات الشهر
    const monthStats = useMemo(() => {
        const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
        const monthAssignments = Object.values(allAssignments).filter(
            (w) => w.date.startsWith(monthPrefix)
        );

        const totalWirds = monthAssignments.filter((w) => !w.isHoliday).length;
        const holidays = monthAssignments.filter((w) => w.isHoliday).length;

        // حساب الأوراد المكتملة
        let completedWirds = 0;
        let totalProgress = 0;
        monthAssignments
            .filter((w) => !w.isHoliday)
            .forEach((w) => {
                const progress = studentData?.dailyProgress?.[w.date] || 0;
                const target = w.repetitions || 100;
                if (progress >= target) completedWirds++;
                totalProgress += Math.min(100, Math.round((progress / target) * 100));
            });

        const avgCompletion = totalWirds > 0 ? Math.round(totalProgress / totalWirds) : 0;

        return { totalWirds, holidays, completedWirds, avgCompletion };
    }, [allAssignments, currentMonth, currentYear, studentData]);

    const handlePrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentYear(currentYear - 1);
            setCurrentMonth(12);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
        setSelectedDayInfo(null);
    };

    const handleNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentYear(currentYear + 1);
            setCurrentMonth(1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
        setSelectedDayInfo(null);
    };

    // النقر على يوم → نقل إلى العداد
    const handleDayClick = (dateStr: string) => {
        const wird = allAssignments[dateStr];
        if (wird && !wird.isHoliday) {
            // الانتقال إلى الصفحة الرئيسية مع تاريخ الورد
            router.push(`/?date=${dateStr}`);
        } else {
            // عرض معلومات اليوم
            setSelectedDayInfo(selectedDayInfo === dateStr ? null : dateStr);
        }
    };

    if (role !== "student") {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Calendar className="w-12 h-12 text-slate-500 mx-auto" />
                    <p className="text-slate-400">هذه الصفحة متاحة فقط للطلاب</p>
                </div>
            </div>
        );
    }

    const todayStr = new Date().toISOString().split("T")[0];

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-slate-950 to-background text-white pb-32 md:pb-8">
            {/* التأثيرات الخلفية */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-gold/10 to-transparent rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tl from-emerald-500/5 to-transparent rounded-full blur-[150px] translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

            <main className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 relative z-10">
                {/* Header */}
                <header className="space-y-2">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-gold to-emerald-500 rounded-xl blur-lg opacity-30"></div>
                            <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 p-3 rounded-xl border border-gold/30">
                                <Calendar className="w-7 h-7 text-gold" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gold via-white to-emerald-400 bg-clip-text text-transparent">
                                تقويم الأوراد
                            </h1>
                            <p className="text-slate-400 text-sm mt-1">
                                تابع أوراد الحفظ الشهرية واضغط على الورد لبدء التكرار
                            </p>
                        </div>
                    </div>
                </header>

                {/* بطاقات الإحصائيات */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="glass-panel rounded-xl p-4 border border-gold/20 hover:border-gold/40 transition-all group">
                        <div className="flex items-center justify-between mb-2">
                            <BookOpen className="w-4 h-4 text-gold" />
                            <span className="text-2xl font-bold text-gold font-sans">{monthStats.totalWirds}</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400">إجمالي الأوراد</p>
                    </div>

                    <div className="glass-panel rounded-xl p-4 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group">
                        <div className="flex items-center justify-between mb-2">
                            <Trophy className="w-4 h-4 text-emerald-400" />
                            <span className="text-2xl font-bold text-emerald-400 font-sans">{monthStats.completedWirds}</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400">أوراد مكتملة</p>
                    </div>

                    <div className="glass-panel rounded-xl p-4 border border-blue-500/20 hover:border-blue-500/40 transition-all group">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                            <span className="text-2xl font-bold text-blue-400 font-sans">{monthStats.avgCompletion}%</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400">متوسط الإنجاز</p>
                    </div>

                    <div className="glass-panel rounded-xl p-4 border border-slate-600/20 hover:border-slate-600/40 transition-all group">
                        <div className="flex items-center justify-between mb-2">
                            <Coffee className="w-4 h-4 text-slate-400" />
                            <span className="text-2xl font-bold text-slate-300 font-sans">{monthStats.holidays}</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400">أيام العطل</p>
                    </div>
                </div>

                {/* التقويم */}
                <div className="glass-panel rounded-2xl p-5 md:p-8 border border-card-border space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-gold/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    {/* رأس التقويم */}
                    <div className="flex items-center justify-between relative z-10">
                        <button
                            onClick={handlePrevMonth}
                            className="p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 hover:border-gold/50 border border-slate-700 transition-all"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="text-center">
                            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gold via-white to-emerald-300 bg-clip-text text-transparent">
                                {monthName} {currentYear}
                            </h2>
                            <div className="flex items-center justify-center gap-4 text-xs text-slate-400 mt-1">
                                <span className="flex items-center gap-1">
                                    <BookOpen className="w-3 h-3 text-gold" />
                                    {monthStats.totalWirds} ورد
                                </span>
                                <span className="text-slate-600">|</span>
                                <span className="flex items-center gap-1">
                                    <Trophy className="w-3 h-3 text-emerald-400" />
                                    {monthStats.completedWirds} مكتمل
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={handleNextMonth}
                            className="p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 hover:border-gold/50 border border-slate-700 transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    </div>

                    {/* أيام الأسبوع */}
                    <div className="grid grid-cols-7 gap-1.5 md:gap-2 text-center relative z-10">
                        {["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map(
                            (day) => (
                                <div key={day} className="text-[10px] md:text-xs font-bold text-gold bg-gradient-to-b from-gold/15 to-gold/5 py-3 rounded-lg border border-gold/20">
                                    {day}
                                </div>
                            )
                        )}
                    </div>

                    {/* أيام الشهر */}
                    <div className="grid grid-cols-7 gap-1.5 md:gap-2 relative z-10">
                        {calendarGrid.map((week, weekIdx) =>
                            week.map((day, dayIdx) => {
                                if (day === null) {
                                    return (
                                        <div
                                            key={`empty-${weekIdx}-${dayIdx}`}
                                            className="aspect-square bg-transparent"
                                        ></div>
                                    );
                                }

                                const dateStr = dateToString(currentYear, currentMonth, day);
                                const wird = allAssignments[dateStr];
                                const isToday = todayStr === dateStr;
                                const isSelected = selectedDayInfo === dateStr;

                                // حساب التقدم
                                const progress = studentData?.dailyProgress?.[dateStr] || 0;
                                const target = wird?.repetitions || 100;
                                const isDone = wird && !wird.isHoliday && progress >= target;
                                const progressPercent = wird && !wird.isHoliday ? Math.min(100, Math.round((progress / target) * 100)) : 0;

                                // ألوان اليوم
                                let bgColor = "";
                                let borderColor = "";
                                let hoverColor = "";

                                if (wird) {
                                    if (wird.isHoliday) {
                                        bgColor = "bg-gradient-to-br from-emerald-500/15 to-emerald-600/5";
                                        borderColor = "border-emerald-500/30";
                                        hoverColor = "hover:border-emerald-400/50";
                                    } else if (isDone) {
                                        bgColor = "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10";
                                        borderColor = "border-emerald-500/50";
                                        hoverColor = "hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20";
                                    } else if (progress > 0) {
                                        bgColor = "bg-gradient-to-br from-gold/15 to-amber-600/5";
                                        borderColor = "border-gold/40";
                                        hoverColor = "hover:border-gold hover:shadow-lg hover:shadow-gold/20";
                                    } else {
                                        bgColor = "bg-gradient-to-br from-gold/10 to-gold/5";
                                        borderColor = "border-gold/30";
                                        hoverColor = "hover:border-gold/60 hover:shadow-lg hover:shadow-gold/10";
                                    }
                                } else {
                                    bgColor = "bg-slate-800/20";
                                    borderColor = "border-slate-700/30";
                                    hoverColor = "";
                                }

                                return (
                                    <div
                                        key={dateStr}
                                        onClick={() => wird ? handleDayClick(dateStr) : undefined}
                                        className={`aspect-square rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center p-1.5 md:p-2 relative group ${bgColor} ${borderColor} ${hoverColor} ${wird ? "cursor-pointer active:scale-95" : "cursor-default"
                                            } ${isToday ? "ring-2 ring-offset-1 ring-offset-background ring-gold shadow-lg shadow-gold/30" : ""} ${isSelected ? "scale-105 shadow-xl" : ""
                                            }`}
                                    >
                                        {/* رقم اليوم */}
                                        <span className={`font-bold text-xs md:text-sm transition-colors ${isToday ? "text-gold" : isDone ? "text-emerald-300" : "text-slate-200"
                                            }`}>
                                            {day}
                                        </span>

                                        {/* محتوى الورد */}
                                        {wird && (
                                            <div className="mt-0.5 md:mt-1 text-center w-full">
                                                {wird.isHoliday ? (
                                                    <div className="text-emerald-300 text-[10px] md:text-xs font-bold">✓</div>
                                                ) : (
                                                    <>
                                                        {/* نطاق الآيات */}
                                                        <div className={`text-[9px] md:text-[10px] font-bold ${isDone ? "text-emerald-400" : "text-gold"}`}>
                                                            {wird.startAyah}-{wird.endAyah}
                                                        </div>

                                                        {/* شريط التقدم */}
                                                        <div className="w-full h-1 md:h-1.5 bg-slate-950/50 rounded-full overflow-hidden mt-0.5 border border-slate-800/50">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${isDone ? "bg-emerald-500" : progressPercent > 0 ? "bg-gold" : "bg-transparent"
                                                                    }`}
                                                                style={{ width: `${progressPercent}%` }}
                                                            ></div>
                                                        </div>

                                                        {/* أيقونة الإنجاز */}
                                                        {isDone && (
                                                            <div className="absolute -top-1 -end-1 bg-emerald-500 rounded-full p-0.5 shadow-lg shadow-emerald-500/50">
                                                                <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* tooltip عند التمرير — سطح المكتب */}
                                        {wird && !wird.isHoliday && (
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-30 pointer-events-none hidden md:block">
                                                <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 shadow-xl min-w-[140px] text-center">
                                                    <p className="text-[11px] font-bold text-white mb-1">
                                                        سورة {wird.surahName}
                                                    </p>
                                                    <p className="text-[10px] text-gold mb-1">
                                                        الآيات {wird.startAyah} - {wird.endAyah}
                                                    </p>
                                                    <div className="flex items-center justify-center gap-1 text-[10px]">
                                                        <span className={isDone ? "text-emerald-400" : "text-slate-400"}>
                                                            {progress}/{target}
                                                        </span>
                                                        <span className="text-slate-600">•</span>
                                                        <span className={isDone ? "text-emerald-400 font-bold" : "text-gold"}>
                                                            {progressPercent}%
                                                        </span>
                                                    </div>
                                                    <p className="text-[9px] text-blue-400 mt-1.5 border-t border-slate-700 pt-1.5">
                                                        اضغط لبدء التكرار ←
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* دليل الألوان */}
                    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 pt-4 border-t border-slate-700/30 text-[10px] md:text-xs font-bold text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/40 inline-block"></span>
                            ورد جديد
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-gradient-to-br from-gold/40 to-amber-500/20 border border-gold/50 inline-block"></span>
                            قيد التكرار
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-gradient-to-br from-emerald-500/30 to-emerald-600/10 border border-emerald-500/50 inline-block"></span>
                            مكتمل ✓
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 border border-emerald-500/30 inline-block"></span>
                            عطلة
                        </span>
                    </div>
                </div>
            </main>
        </div>
    );
}
