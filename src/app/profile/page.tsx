"use client";

import { useRealtime } from "@/hooks/useRealtime";
import { User, Shield, Mail, Calendar, ArrowRight } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
    const { currentUser, role, loading, studentData } = useRealtime();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!loading && !currentUser) {
            router.push("/login");
        }
    }, [loading, currentUser, router]);

    if (!mounted || loading || !currentUser) return null;

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 relative overflow-hidden">
            {/* Ambient Background - Adaptive */}
            <div className="bg-noise"></div>
            <div className="absolute top-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>

            {/* Header */}
            <header className="p-6 sticky top-0 z-50 glass-panel border-b border-card-border backdrop-blur-md">
                <div className="max-w-md mx-auto flex justify-between items-center">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        title="العودة"
                    >
                        <ArrowRight className="w-6 h-6 text-foreground" />
                    </button>
                    <h1 className="text-xl font-bold font-quran text-primary">الملف الشخصي</h1>
                    <ThemeSwitcher />
                </div>
            </header>

            <main className="max-w-md mx-auto p-6 space-y-8 relative z-10">

                {/* Profile Card */}
                <div className="glass-panel rounded-3xl p-8 text-center space-y-4 border border-card-border shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>

                    <div className="relative">
                        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-primary to-yellow-200 p-1 shadow-xl">
                            <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                                {role === "sheikh" ? (
                                    <Shield className="w-10 h-10 text-primary" />
                                ) : (
                                    <span className="text-4xl font-bold text-primary font-sans">
                                        {studentData?.name?.[0] || currentUser.email?.[0]?.toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-background border border-card-border px-3 py-1 rounded-full shadow-sm text-xs font-bold text-primary flex items-center space-x-1 space-x-reverse whitespace-nowrap">
                            {role === "sheikh" ? (
                                <>
                                    <Shield className="w-3 h-3" />
                                    <span>الشيخ والمشرف</span>
                                </>
                            ) : (
                                <>
                                    <User className="w-3 h-3" />
                                    <span>طالب علم</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="pt-6">
                        <h2 className="text-2xl font-bold font-sans text-foreground">
                            {studentData?.name || currentUser.displayName || "مستخدم"}
                        </h2>
                        <p className="text-sm text-slate-500 font-sans mt-1">{currentUser.email}</p>
                    </div>
                </div>

                {/* Info List */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold font-quran text-foreground px-2">البيانات الأساسية</h3>

                    <div className="glass-panel p-4 rounded-2xl flex items-center space-x-4 space-x-reverse border border-card-border group hover:border-primary/30 transition-colors">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-slate-500 font-sans">البريد الإلكتروني</p>
                            <p className="font-bold text-foreground font-sans">{currentUser.email}</p>
                        </div>
                    </div>

                    <div className="glass-panel p-4 rounded-2xl flex items-center space-x-4 space-x-reverse border border-card-border group hover:border-primary/30 transition-colors">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-slate-500 font-sans">تاريخ الانضمام</p>
                            <p className="font-bold text-foreground font-sans">
                                {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Account Info Footer */}
                <div className="text-center pt-8 pb-4">
                    <p className="text-xs text-slate-400 font-sans">نسخة التطبيق 1.2.0 • {role === "sheikh" ? "نسخة المشرفين" : "نسخة الطلاب"}</p>
                </div>

            </main>
        </div>
    );
}
