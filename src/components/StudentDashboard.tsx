"use client";

import { useState } from "react";
import RepetitionCounter from "@/components/RepetitionCounter";
import { BookOpen, Trophy, User, Coffee, Star } from "lucide-react";
import { useRealtime } from "@/hooks/useRealtime";
import { useWird } from "@/hooks/useWird";

export default function StudentDashboard() {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const { updateProgress, studentData, role } = useRealtime();
    const { getWirdForDate } = useWird();

    const activeWird = getWirdForDate(selectedDate);
    const currentProgress = studentData?.dailyProgress?.[selectedDate] || 0;

    // Last 7 days including today
    const recentDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    });

    const handleUpdateProgress = (count: number) => {
        updateProgress(count, selectedDate);
    };

    const handleComplete = () => {
        // Completion celebration logic if needed
    };

    if (role !== "student") return null;

    return (
        <div className="min-h-screen text-white pb-8">
            {/* Ambient Background Glows */}
            <div className="fixed top-0 end-0 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none"></div>
            <div className="fixed bottom-0 start-0 w-[300px] h-[300px] bg-blue-900/10 rounded-full blur-[100px] translate-y-1/2 pointer-events-none"></div>

            <main className="max-w-4xl mx-auto px-4 md:px-6 pt-6 md:pt-10 space-y-8 relative z-10">
                <header className="flex flex-col gap-1">
                    <p className="text-slate-400 text-sm font-sans">السلام عليكم،</p>
                    <h1 className="text-3xl md:text-4xl font-bold font-quran text-white">{studentData?.name} <span className="inline-block animate-wave">👋</span></h1>
                </header>

                {/* Date/Wird Selector Card */}
                <section className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <Coffee className="w-4 h-4 text-gold" />
                        <h2 className="text-sm font-bold text-slate-400 font-quran">اختر الورد للمتابعة أو المراجعة:</h2>
                    </div>

                    <div className="flex gap-2.5 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1">
                        {recentDates.map((date) => {
                            const assignment = getWirdForDate(date);
                            const isSelected = selectedDate === date;
                            const progress = studentData?.dailyProgress?.[date] || 0;
                            const target = assignment?.repetitions || 100;
                            const isDone = progress >= target;
                            const isToday = date === new Date().toISOString().split('T')[0];

                            return (
                                <button
                                    key={date}
                                    onClick={() => setSelectedDate(date)}
                                    className={`flex-shrink-0 w-28 md:w-36 rounded-2xl p-3 md:p-4 border transition-all text-start relative overflow-hidden group ${isSelected
                                        ? "glass-panel border-gold/50 shadow-[0_0_20px_rgba(212,175,55,0.15)] bg-slate-800/80"
                                        : "bg-slate-900/40 border-slate-800 hover:bg-slate-800 hover:border-slate-700 active:scale-95"
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-2.5">
                                        <span className={`text-[10px] font-bold font-sans px-2 py-0.5 rounded-full border ${isToday
                                            ? "bg-gold/10 text-gold border-gold/20"
                                            : "bg-slate-800 text-slate-400 border-slate-700"}`}>
                                            {isToday ? "اليوم" : date.split('-').slice(1).join('/')}
                                        </span>
                                        {isDone && <div className="bg-emerald-500/10 p-1 rounded-full"><Trophy className="w-3 h-3 text-emerald-500" /></div>}
                                    </div>

                                    <p className={`font-bold text-xs md:text-sm truncate font-quran mb-2.5 transition-colors ${isSelected ? "text-white" : "text-slate-300 group-hover:text-white"}`}>
                                        {assignment ? `سورة ${assignment.surahName}` : "يوم عطلة"}
                                    </p>

                                    <div className="h-1.5 w-full bg-slate-950/50 rounded-full overflow-hidden border border-slate-800">
                                        <div
                                            className={`h-full transition-all duration-700 rounded-full ${isDone ? "bg-emerald-500" : "bg-gradient-to-r from-gold to-gold-400"}`}
                                            style={{ width: `${Math.min(100, (progress / target) * 100)}%` }}
                                        ></div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Primary Counter UI */}
                <section className="flex flex-col lg:flex-row gap-6 items-start">
                    <div className="flex-1 w-full space-y-6">
                        {/* Selected Wird Info Card */}
                        <div className="glass-panel p-5 md:p-8 relative overflow-hidden group">
                            <div className="absolute top-0 end-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 group-hover:bg-gold/10 transition-colors duration-700"></div>

                            <div className="flex justify-between items-start relative z-10">
                                <div className="space-y-2 md:space-y-3 flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-gold/10"><BookOpen className="w-4 h-4 text-gold" /></div>
                                        <span className="text-xs font-bold text-slate-400 font-quran tracking-wide">{activeWird?.isHoliday ? "يوم للراحة والمراجعة" : "الورد المختار"}</span>
                                    </div>
                                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold font-quran text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-300">
                                        {activeWird?.isHoliday ? "عطلة رسمية" : `سورة ${activeWird?.surahName || "---"}`}
                                    </h2>
                                    {!activeWird?.isHoliday && (
                                        <div className="flex items-center gap-3 text-sm text-slate-400">
                                            <span className="bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-700 text-xs">الآيات {activeWird?.startAyah} - {activeWird?.endAyah}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-start flex-shrink-0 ms-3">
                                    <div className="glass-card px-4 py-2.5 md:px-5 md:py-3 rounded-2xl flex flex-col items-center border-gold/20">
                                        <span className="text-gold font-bold font-sans text-xl md:text-2xl">{activeWird?.repetitions || 100}</span>
                                        <span className="text-slate-400 text-[10px] font-bold font-quran">تكرار</span>
                                    </div>
                                </div>
                            </div>

                            {!activeWird?.isHoliday && (
                                <div className="mt-6 md:mt-10 space-y-3 relative z-10">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs md:text-sm font-bold text-slate-400 font-sans">الإنجاز الحالي</span>
                                        <div className="flex items-baseline gap-0.5">
                                            <span className="text-2xl md:text-3xl font-bold text-gold font-sans">{Math.round((currentProgress / (activeWird?.repetitions || 100)) * 100)}</span>
                                            <span className="text-sm text-gold/60">%</span>
                                        </div>
                                    </div>
                                    <div className="h-2.5 md:h-3 w-full bg-slate-950/50 rounded-full overflow-hidden border border-slate-800/50 p-[2px]">
                                        <div
                                            className="h-full bg-gradient-to-r from-gold-600 to-gold rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                                            style={{ width: `${(currentProgress / (activeWird?.repetitions || 100)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* The Large Counter */}
                        {!activeWird?.isHoliday && (
                            <div className="flex justify-center py-2 md:py-6">
                                <RepetitionCounter
                                    key={selectedDate}
                                    limit={activeWird?.repetitions || 100}
                                    initialCount={currentProgress}
                                    onUpdate={handleUpdateProgress}
                                    onComplete={handleComplete}
                                />
                            </div>
                        )}

                        {activeWird?.isHoliday && (
                            <div className="glass-panel p-8 md:p-12 flex flex-col items-center justify-center gap-6 text-center">
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 border border-slate-700 shadow-inner">
                                    <Coffee className="w-8 h-8 md:w-10 md:h-10" />
                                </div>
                                <div>
                                    <h3 className="text-xl md:text-2xl font-bold font-quran text-white mb-3">وقت الراحة</h3>
                                    <p className="text-slate-400 font-sans max-w-xs leading-relaxed text-sm">لا يوجد ورد مخصص لهذا التاريخ. <br />استغل وقتك في مراجعة الأيام السابقة.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-full lg:w-72 space-y-4">
                        {/* Quick Stats sidebar */}
                        <div className="glass-panel p-5 md:p-6 space-y-5">
                            <h3 className="text-sm font-bold text-slate-400 font-quran border-b border-slate-700/50 pb-3">مؤشرات الأداء</h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:bg-emerald-500/20 transition-colors"><Trophy className="w-4 h-4" /></div>
                                        <span className="text-xs font-bold font-quran text-slate-300">الحالة الراهنة</span>
                                    </div>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${currentProgress >= (activeWird?.repetitions || 100) ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-800 text-slate-400 border-slate-700"}`}>
                                        {currentProgress >= (activeWird?.repetitions || 100) ? "مكتمل" : "قيد المراجعة"}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gold/10 rounded-xl text-gold group-hover:bg-gold/20 transition-colors"><BookOpen className="w-4 h-4" /></div>
                                        <span className="text-xs font-bold font-quran text-slate-300">التكرار المتبقي</span>
                                    </div>
                                    <span className="text-xs font-bold text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                                        {Math.max(0, (activeWird?.repetitions || 100) - currentProgress)} مرة
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-5 md:p-6 border-gold/20 bg-gradient-to-br from-gold/5 to-transparent relative overflow-hidden">
                            <div className="absolute top-0 start-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-50"></div>
                            <div className="flex flex-col items-center text-center gap-4 py-2">
                                <div className="relative">
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-slate-800 flex items-center justify-center font-bold text-xl md:text-2xl text-gold font-sans bg-slate-900 shadow-xl relative z-10">
                                        {Math.round((currentProgress / (activeWird?.repetitions || 100)) * 100)}%
                                    </div>
                                    <div className="absolute inset-0 rounded-full border-4 border-gold blur-sm opacity-30"></div>
                                </div>
                                <p className="text-xs text-slate-300 font-quran px-2 leading-relaxed">
                                    <span className="text-gold font-bold">نصيحة:</span> واصل التكرار بتركيز تام ، فالإتقان يأتي بالصبر والمداومة.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
