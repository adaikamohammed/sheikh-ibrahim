"use client";

import { LogOut, User, Shield, Moon, Sun } from "lucide-react";
import { useRealtime } from "@/hooks/useRealtime";
import { useTheme } from "next-themes";
import Link from "next/link";

export default function RoleSwitcher() {
    const { role, logout, loading, studentData, currentUser } = useRealtime();
    const { theme, setTheme } = useTheme();

    if (loading || !role) return null;

    return (
        <div className="fixed top-6 left-6 z-[9990] flex items-center space-x-3 space-x-reverse">
            {/* Profile Link */}
            <Link href="/profile">
                <div className="glass-panel w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-gold hover:border-gold/30 transition-all duration-300 cursor-pointer shadow-lg active:scale-95" title="الملف الشخصي">
                    {role === "sheikh" ? (
                        <Shield className="w-5 h-5" />
                    ) : (
                        <div className="font-bold text-xs">
                            {studentData?.name?.[0] || currentUser?.email?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                        </div>
                    )}
                </div>
            </Link>

            {/* Theme Toggle (Simplified) */}
            <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="glass-panel w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-gold hover:border-gold/30 transition-all duration-300 shadow-lg active:scale-95"
            >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
            </button>

            {/* Logout */}
            <button
                onClick={logout}
                className="glass-panel w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300 shadow-lg active:scale-95"
                title="تسجيل الخروج"
            >
                <LogOut className="w-5 h-5" />
            </button>
        </div>
    );
}
