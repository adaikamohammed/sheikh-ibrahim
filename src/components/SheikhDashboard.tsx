"use client";

import { Users, BarChart3, BookMarked, ArrowUpRight } from "lucide-react";
import { useRealtime } from "@/hooks/useRealtime";

export default function SheikhDashboard() {
    const { allStudents } = useRealtime();

    // Sort students: ones with highest progress first
    const sortedStudents = [...allStudents].sort((a, b) => b.progress - a.progress);
    return (
        <div className="min-h-screen bg-midnight-950 text-white relative overflow-hidden pb-10">
            <div className="bg-noise"></div>

            {/* Header */}
            <header className="p-6 sticky top-0 z-50 glass-midnight border-b border-white/5 backdrop-blur-xl">
                <div className="flex justify-between items-center max-w-5xl mx-auto">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="w-12 h-12 rounded-full glass-gold border border-gold/30 overflow-hidden p-1">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sheikh" alt="Sheikh profile" className="rounded-full" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold font-quran text-gold">لوحة تحكم الشيخ</h1>
                            <p className="text-xs text-slate-400 font-sans">فوج الشيخ إبراهيم مراد</p>
                        </div>
                    </div>
                    <div className="flex space-x-2 space-x-reverse">
                        <button className="p-2.5 glass-midnight rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors" title="قائمة الطلاب">
                            <Users className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-6 space-y-8 relative z-10">
                {/* Global Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-midnight rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gold/10 blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-gold/20 transition-colors"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-slate-400 text-sm font-sans">إجمالي الطلاب</p>
                                <h3 className="text-4xl font-bold mt-2 text-white font-sans">24</h3>
                            </div>
                            <div className="p-3 rounded-xl bg-gold/10 text-gold">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    <div className="glass-midnight rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-colors"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-slate-400 text-sm font-sans">معدل الإنجاز</p>
                                <div className="flex items-baseline space-x-2 space-x-reverse mt-2">
                                    <h3 className="text-4xl font-bold text-white font-sans">72%</h3>
                                    <span className="text-emerald-400 text-xs flex items-center font-sans">
                                        <ArrowUpRight className="w-3 h-3 ml-1" />
                                        +5%
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    <div className="glass-midnight rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-colors"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-slate-400 text-sm font-sans">الآيات المحفوظة</p>
                                <h3 className="text-4xl font-bold mt-2 text-white font-sans">1,250</h3>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                                <BookMarked className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Current Wird Info */}
                <section className="glass-midnight rounded-3xl p-8 text-center space-y-4 border border-gold/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gold/5 blur-3xl"></div>
                    <div className="relative z-10">
                        <h2 className="text-gold/80 font-quran text-lg">الورد الحالي للمجموعة</h2>
                        <div className="py-2">
                            <p className="text-4xl font-bold font-quran text-white drop-shadow-lg">سورة الشعراء</p>
                            <p className="text-xl text-slate-400 mt-2 font-sans">الآيات: ١ - ١٠</p>
                        </div>
                    </div>
                </section>

                {/* Student Progress List */}
                <section className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                        <h2 className="text-2xl font-bold font-quran text-white">قائمة الطلاب</h2>
                        <button className="text-xs text-gold hover:underline font-sans">عرض الكل</button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {sortedStudents.length === 0 ? (
                            <p className="text-center text-slate-500 py-10">جاري تحميل بيانات الطلاب...</p>
                        ) : sortedStudents.map((student) => (
                            <div key={student.uid} className="glass-midnight rounded-2xl p-5 flex items-center justify-between group hover:bg-white/5 transition-all border border-transparent hover:border-white/5 cursor-pointer">
                                <div className="flex items-center space-x-5 space-x-reverse">
                                    <div className="w-12 h-12 rounded-full glass flex items-center justify-center font-bold text-lg text-gold border border-white/10 group-hover:border-gold/30 transition-colors">
                                        {student.name[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-slate-100 font-sans">{student.name}</h4>
                                        <span className={`text-[10px] px-2.5 py-1 rounded-full border ${student.status === "حفظ"
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                : "bg-blue-500/10 text-blue-300 border-blue-500/20"
                                            }`}>
                                            {student.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end space-y-2 w-1/3">
                                    <div className="flex justify-between w-full text-xs font-bold mb-1">
                                        <span className="text-slate-400">الإنجاز</span>
                                        <span className="text-emerald-400">{student.progress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-midnight-950 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-l from-gold to-yellow-600 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                                            style={{ width: `${student.progress}%` } as React.CSSProperties}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
