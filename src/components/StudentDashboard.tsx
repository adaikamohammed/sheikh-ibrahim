"use client";

import { useState } from "react";
import RepetitionCounter from "@/components/RepetitionCounter";
import { BookOpen, Trophy, User, Coffee } from "lucide-react";
import { useRealtime } from "@/hooks/useRealtime";
import { useWird } from "@/hooks/useWird";

export default function StudentDashboard() {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const { updateProgress, studentData, role } = useRealtime();
    const { allAssignments, getWirdForDate } = useWird();

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
        <div className="min-h-screen bg-background text-white pb-32">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] -translate-x-1/2"></div>

            <main className="max-w-4xl mx-auto px-6 pt-10 space-y-10 relative z-10">
                <header className="flex justify-between items-center">
                    <div>
                        <p className="text-slate-500 text-sm font-sans mb-1">السلام عليكم،</p>
                        <h1 className="text-3xl font-bold font-quran">{studentData?.name} 👋</h1>
                    </div>
                </header>

                {/* Date/Wird Selector Card */}
                <section className="space-y-4">
                    <div className="flex items-center space-x-2 space-x-reverse px-1">
                        <Coffee className="w-4 h-4 text-primary" />
                        <h2 className="text-sm font-bold text-slate-400 font-quran">اختر الورد للمتابعة أو المراجعة:</h2>
                    </div>

                    <div className="flex space-x-3 space-x-reverse overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
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
                                    className={`flex-shrink-0 w-36 glass-panel rounded-2xl p-4 border transition-all text-right relative overflow-hidden group ${isSelected
                                        ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(212,175,55,0.1)] ring-1 ring-primary/30"
                                        : "border-card-border hover:bg-white/5 active:scale-95"
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`text-[9px] font-bold font-sans px-2 py-0.5 rounded-full ${isToday ? "bg-primary/20 text-primary" : "bg-slate-500/10 text-slate-500"}`}>
                                            {isToday ? "اليوم" : date.split('-').slice(1).join('/')}
                                        </span>
                                        {isDone && <Trophy className="w-3 h-3 text-emerald-500" />}
                                    </div>

                                    <p className="font-bold text-xs truncate font-quran mb-3 text-foreground group-hover:text-primary transition-colors">
                                        {assignment ? `سورة ${assignment.surahName}` : "يوم عطلة"}
                                    </p>

                                    <div className="h-1 w-full bg-slate-200/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-700 ${isDone ? "bg-emerald-500" : "bg-primary"}`}
                                            style={{ width: `${Math.min(100, (progress / target) * 100)}%` }}
                                        ></div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Primary Counter UI */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Selected Wird Info Card */}
                        <div className="glass-panel rounded-[2.5rem] p-8 border border-card-border relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>

                            <div className="flex justify-between items-start relative z-10">
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <BookOpen className="w-5 h-5 text-primary" />
                                        <span className="text-xs font-bold text-slate-400 font-quran">{activeWird?.isHoliday ? "يوم للراحة والمراجعة" : "الورد المختار"}</span>
                                    </div>
                                    <h2 className="text-4xl font-bold font-quran text-foreground">
                                        {activeWird?.isHoliday ? "عطلة رسمية" : `سورة ${activeWird?.surahName || "---"}`}
                                    </h2>
                                    {!activeWird?.isHoliday && (
                                        <p className="text-slate-500 font-sans tracking-tight">الآيات المحررة: {activeWird?.startAyah} إلى {activeWird?.endAyah}</p>
                                    )}
                                </div>
                                <div className="text-left">
                                    <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-2xl">
                                        <span className="text-primary font-bold font-sans text-lg">{activeWird?.repetitions || 100}</span>
                                        <span className="text-primary/70 text-[10px] mr-1 font-bold font-quran">تكرار</span>
                                    </div>
                                </div>
                            </div>

                            {!activeWird?.isHoliday && (
                                <div className="mt-10 space-y-3 relative z-10">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-bold text-slate-500 font-sans">الإنجاز الحالي</span>
                                        <span className="text-2xl font-bold text-emerald-500 font-sans">{Math.round((currentProgress / (activeWird?.repetitions || 100)) * 100)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-200/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                            style={{ width: `${(currentProgress / (activeWird?.repetitions || 100)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* The Large Counter */}
                        {!activeWird?.isHoliday && (
                            <div className="flex justify-center py-6">
                                <RepetitionCounter
                                    key={selectedDate} // Important: Resets counter component on date change
                                    limit={activeWird?.repetitions || 100}
                                    initialCount={currentProgress}
                                    onUpdate={handleUpdateProgress}
                                    onComplete={handleComplete}
                                />
                            </div>
                        )}

                        {activeWird?.isHoliday && (
                            <div className="glass-panel rounded-[2.5rem] p-12 border border-card-border flex flex-col items-center justify-center space-y-6 text-center">
                                <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-lg">
                                    <Coffee className="w-10 h-10" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold font-quran text-foreground mb-2">وقت الراحة</h3>
                                    <p className="text-slate-500 font-sans max-w-xs">لا يوجد ورد مخصص لهذا التاريخ. استغل وقتك في مراجعة الأيام السابقة.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Quick Stats sidebar */}
                        <div className="glass-panel rounded-[2rem] p-6 border border-card-border space-y-6">
                            <h3 className="text-sm font-bold text-slate-400 font-quran border-b border-card-border pb-4">مؤشرات الأداء</h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 space-x-reverse">
                                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500"><Trophy className="w-4 h-4" /></div>
                                        <span className="text-xs font-bold font-quran">الحالة الراهنة</span>
                                    </div>
                                    <span className="text-xs font-bold text-foreground bg-white/5 px-3 py-1 rounded-lg">{currentProgress >= (activeWird?.repetitions || 100) ? "مكتمل" : "قيد المراجعة"}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 space-x-reverse">
                                        <div className="p-2 bg-primary/10 rounded-xl text-primary"><BookOpen className="w-4 h-4" /></div>
                                        <span className="text-xs font-bold font-quran">التكرار المتبقي</span>
                                    </div>
                                    <span className="text-xs font-bold text-foreground bg-white/5 px-3 py-1 rounded-lg">
                                        {Math.max(0, (activeWird?.repetitions || 100) - currentProgress)} مرة
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel rounded-[2rem] p-6 border border-card-border bg-gradient-to-br from-primary/10 to-transparent">
                            <div className="flex flex-col items-center text-center space-y-4 py-4">
                                <div className="w-16 h-16 rounded-full border-4 border-primary/30 flex items-center justify-center font-bold text-xl text-primary font-sans">
                                    {Math.round((currentProgress / (activeWird?.repetitions || 100)) * 100)}%
                                </div>
                                <p className="text-[10px] text-slate-500 font-quran px-4">واصل التكرار بتركيز تام ، فالإتقان يأتي بالصبر والمداومة.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
