"use client";

import { LogOut, User, Shield, ArrowRight } from "lucide-react";
import { useRealtime } from "@/hooks/useRealtime";
import { ThemeSwitcher } from "./ThemeSwitcher";
import Link from "next/link";

export default function RoleSwitcher() {
    const { role, logout, loading, studentData, currentUser } = useRealtime();

    if (loading || !role) return null;

    return (
        <div className="fixed top-6 left-6 z-[9999] flex items-center space-x-3 space-x-reverse">
            {/* Profile Link */}
            <Link href="/profile">
                <div className={`p-2 rounded-full shadow-lg glass-panel border border-card-border flex items-center justify-center transition-transform hover:scale-105 active:scale-95 group`} title="الملف الشخصي">
                    {role === "sheikh" ? (
                        <Shield className="w-5 h-5 text-primary group-hover:text-gold-light" />
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary group-hover:text-gold-light">
                            {studentData?.name?.[0] || currentUser?.email?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                        </div>
                    )}
                </div>
            </Link>

            {/* Theme Toggle */}
            <ThemeSwitcher />

            {/* Logout */}
            <button
                onClick={logout}
                className="p-2 rounded-full shadow-lg glass-panel text-red-400 hover:bg-red-500/10 border border-card-border transition-all"
                title="تسجيل الخروج"
            >
                <LogOut className="w-5 h-5" />
            </button>
        </div>
    );
}
