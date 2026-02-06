"use client";

import RepetitionCounter from "@/components/RepetitionCounter";
import { BookOpen, Trophy, Clock, User, ChevronLeft } from "lucide-react";

export default function StudentDashboard() {
    const handleComplete = () => {
        console.log("Wird Completed!");
    };

    return (
        <div className="min-h-screen bg-midnight-950 text-white relative overflow-hidden pb-32">
            {/* Noise Texture */}
            <div className="bg-noise"></div>

            {/* Header */}
            <header className="p-6 sticky top-0 z-50 glass-midnight border-b border-white/5 backdrop-blur-2xl">
                <div className="flex justify-between items-center max-w-md mx-auto">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="w-12 h-12 rounded-full glass-gold flex items-center justify-center border border-gold/30">
                            <span className="text-xl">🕌</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold font-quran text-gold">فوج الشيخ إبراهيم</h1>
                            <p className="text-xs text-slate-400 font-sans">طالب: يونس أحمد</p>
                        </div>
                    </div>
                    <div className="bg-midnight-800/50 px-4 py-1.5 rounded-full border border-white/5 flex items-center space-x-2 space-x-reverse">
                        <Trophy className="w-4 h-4 text-gold" />
                        <span className="text-sm font-bold text-slate-200 font-sans">750</span>
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto p-6 space-y-10 relative z-10">
                {/* Hero Card */}
                <div className="glass-midnight rounded-[2rem] p-8 relative overflow-hidden group border border-white/5">
                    {/* Ambient Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-glow/10 blur-[80px] -translate-y-1/2 translate-x-1/2"></div>

                    <div className="relative z-10 space-y-6 text-center">
                        <span className="inline-block px-4 py-1 rounded-full bg-emerald-900/30 text-emerald-400 text-xs font-bold border border-emerald-500/20 uppercase tracking-wider backdrop-blur-md">
                            الورد اليومي
                        </span>

                        <div className="space-y-2">
                            <h2 className="text-4xl font-bold font-quran text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-100 to-slate-400 py-1">
                                سورة الشعراء
                            </h2>
                            <div className="flex items-center justify-center space-x-2 space-x-reverse text-slate-400 font-sans text-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></span>
                                <span>الآيات: ١ - ١٠</span>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button className="text-gold text-xs font-bold flex items-center justify-center space-x-1 hover:space-x-2 transition-all">
                                <span>عرض التفاصيل</span>
                                <ChevronLeft className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Counter Section */}
                <section>
                    <RepetitionCounter limit={100} onComplete={handleComplete} />
                </section>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="glass-midnight p-5 rounded-2xl flex flex-col items-center justify-center space-y-2 border border-white/5 hover:border-gold/20 transition-colors">
                        <span className="text-slate-500 text-xs font-sans">إجمالي الآيات</span>
                        <p className="text-2xl font-bold text-white font-sans">1,240</p>
                    </div>
                    <div className="glass-midnight p-5 rounded-2xl flex flex-col items-center justify-center space-y-2 border border-white/5 hover:border-emerald-500/20 transition-colors">
                        <span className="text-slate-500 text-xs font-sans">أيام الالتزام</span>
                        <div className="flex items-baseline space-x-1 space-x-reverse">
                            <p className="text-2xl font-bold text-emerald-400 font-sans">12</p>
                            <span className="text-xs text-emerald-600">يوم</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 glass-midnight border-t border-white/5 pb-8 pt-5 px-6 z-50">
                <div className="flex justify-around items-center max-w-md mx-auto">
                    <button className="flex flex-col items-center space-y-1 group">
                        <div className="p-2 rounded-xl bg-gold/10 text-gold transition-transform group-active:scale-95">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 font-sans group-hover:text-gold transition-colors">الورد</span>
                    </button>

                    <button className="flex flex-col items-center space-y-1 group opacity-60 hover:opacity-100 transition-opacity">
                        <div className="p-2 rounded-xl group-hover:bg-white/5 transition-colors">
                            <Trophy className="w-6 h-6 text-slate-400" />
                        </div>
                        <span className="text-[10px] text-slate-500 font-sans group-hover:text-slate-300">الإنجازات</span>
                    </button>

                    <button className="flex flex-col items-center space-y-1 group opacity-60 hover:opacity-100 transition-opacity">
                        <div className="p-2 rounded-xl group-hover:bg-white/5 transition-colors">
                            <User className="w-6 h-6 text-slate-400" />
                        </div>
                        <span className="text-[10px] text-slate-500 font-sans group-hover:text-slate-300">حسابي</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
