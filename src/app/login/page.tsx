"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, Loader2 } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/");
        } catch (err: any) {
            console.error(err);
            setError("فشل تسجيل الدخول. يرجى التحقق من الرسالة وكلمة المرور.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
            {/* Background Ambience */}
            <div className="bg-noise absolute inset-0 opacity-[var(--noise-opacity)]"></div>
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="glass-panel rounded-3xl p-8 border border-card-border shadow-2xl backdrop-blur-xl">
                    <div className="text-center space-y-4 mb-10">
                        <div className="w-20 h-20 rounded-full glass-gold mx-auto flex items-center justify-center border border-primary/30 shadow-[0_0_30px_var(--glass-shadow)] mb-6">
                            <span className="text-4xl">🕌</span>
                        </div>
                        <h1 className="text-3xl font-bold font-quran text-primary">تسجيل الدخول</h1>
                        <p className="text-slate-500 font-sans text-sm">منصة الشيخ إبراهيم مراد لحفظ القرآن الكريم</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-foreground text-sm font-bold block" htmlFor="email">البريد الإلكتروني</label>
                            <div className="relative">
                                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-background/50 border border-card-border rounded-xl py-3.5 pr-12 pl-4 text-foreground placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-sans"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-foreground text-sm font-bold block" htmlFor="password">كلمة المرور</label>
                            <div className="relative">
                                <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-background/50 border border-card-border rounded-xl py-3.5 pr-12 pl-4 text-foreground placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-sans"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary to-yellow-600 text-midnight-950 font-bold py-4 rounded-xl hover:shadow-[0_0_20px_var(--glass-shadow)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 space-x-reverse"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>جاري الدخول...</span>
                                </>
                            ) : (
                                <span>دخول</span>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-500 text-xs mt-8">
                    جميع الحقوق محفوظة © {new Date().getFullYear()} فوج الشيخ إبراهيم مراد
                </p>
            </div>
        </div>
    );
}
