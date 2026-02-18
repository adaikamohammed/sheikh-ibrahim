"use client";

import { Home, BarChart3, User, Calendar, TrendingUp, Clock, ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRealtime } from "@/hooks/useRealtime";
import { useState, useEffect } from "react";

export default function Navigation() {
    const pathname = usePathname();
    const { role, logout } = useRealtime();
    const [expanded, setExpanded] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem("nav-expanded");
        if (saved === "true") setExpanded(true);
    }, []);

    const toggle = () => {
        const next = !expanded;
        setExpanded(next);
        localStorage.setItem("nav-expanded", String(next));
    };

    if (!role) return null;

    const commonItems = [
        { label: "الرئيسية", icon: Home, path: "/" },
    ];

    const sheikhItems = [
        { label: "الإحصائيات", icon: BarChart3, path: "/stats" },
        { label: "التقويم", icon: Calendar, path: "/calendar" },
        { label: "المواعيد", icon: Clock, path: "/appointments" },
        { label: "الأوراد", icon: TrendingUp, path: "/wird-tracking" },
    ];

    const studentItems = [
        { label: "حجز حصة", icon: Calendar, path: "/book-appointment" },
    ];

    const profileItems = [
        { label: "حسابي", icon: User, path: "/profile" },
    ];

    const navItems = [
        ...commonItems,
        ...(role === "sheikh" ? sheikhItems : studentItems),
        ...profileItems,
    ];

    // قبل التحميل: مطوي دائماً لمنع الوميض
    const isOpen = mounted && expanded;

    return (
        <nav
            className={`
                fixed bottom-0 inset-x-0 z-[9999]
                bg-slate-900/95 backdrop-blur-2xl
                border-t border-white/5
                flex items-center justify-around
                p-1.5

                md:sticky md:top-0 md:bottom-auto md:inset-x-auto
                md:h-screen md:flex-shrink-0
                md:flex-col md:justify-start md:items-stretch
                md:p-2 md:pt-4 md:gap-0
                md:border-t-0 md:border-e
                md:overflow-y-auto md:overflow-x-hidden
                transition-[width] duration-300 ease-in-out
                ${isOpen ? "md:w-52" : "md:w-[72px]"}
            `}
        >
            {/* ═══════ زر التبديل — سطح المكتب فقط ═══════ */}
            <button
                onClick={toggle}
                className="hidden md:flex items-center justify-center w-full p-3 mb-1 rounded-xl
                           hover:bg-white/5 text-slate-400 hover:text-gold transition-all"
                title={isOpen ? "طي الشريط" : "توسيع الشريط"}
            >
                {isOpen
                    ? <ChevronsRight className="w-5 h-5" />
                    : <ChevronsLeft className="w-5 h-5" />
                }
            </button>

            {/* فاصل */}
            <div className="hidden md:block mx-3 mb-2 border-b border-white/10" />

            {/* ═══════ عناصر التنقل ═══════ */}
            {navItems.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;

                return (
                    <Link
                        key={item.path}
                        href={item.path}
                        title={item.label}
                        className={`
                            relative flex flex-col items-center gap-0.5 p-2 rounded-xl
                            transition-all duration-200 min-w-0

                            md:flex-row md:gap-3 md:p-3 md:w-full md:mb-0.5
                            ${isOpen ? "md:px-4" : "md:justify-center"}
                            ${isActive
                                ? "text-gold bg-gold/10 shadow-md shadow-gold/5"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                            }
                        `}
                    >
                        {/* الأيقونة */}
                        <div className={`
                            flex-shrink-0 flex items-center justify-center
                            p-1.5 md:p-0 rounded-xl transition-all duration-200
                            ${isActive
                                ? "md:bg-transparent"
                                : ""
                            }
                        `}>
                            <Icon className={`w-5 h-5 md:w-[22px] md:h-[22px] transition-colors ${isActive ? "text-gold" : ""}`} />
                        </div>

                        {/* اللافتة على الموبايل */}
                        <span className={`text-[9px] font-bold leading-tight md:hidden ${isActive ? "text-gold" : "text-slate-500"}`}>
                            {item.label}
                        </span>

                        {/* اللافتة على سطح المكتب — فقط عند التوسيع */}
                        <span
                            className={`
                                hidden md:block text-sm font-bold whitespace-nowrap
                                transition-all duration-300 overflow-hidden
                                ${isOpen ? "opacity-100 max-w-[150px]" : "opacity-0 max-w-0"}
                            `}
                        >
                            {item.label}
                        </span>

                        {/* مؤشر العنصر النشط — سطح المكتب */}
                        {isActive && (
                            <div className="hidden md:block absolute end-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-gold rounded-s-full shadow-[0_0_12px_rgba(212,175,55,0.4)]" />
                        )}
                    </Link>
                );
            })}

            {/* ═══════ فاصل قبل زر الخروج ═══════ */}
            <div className="hidden md:block flex-1" />
            <div className="hidden md:block mx-3 mb-2 border-b border-white/10" />

            {/* ═══════ زر تسجيل الخروج ═══════ */}
            <button
                onClick={logout}
                title="تسجيل الخروج"
                className={`
                    hidden md:flex items-center gap-3 p-3 rounded-xl w-full mb-2
                    text-red-400 hover:text-red-300 hover:bg-red-500/10
                    transition-all duration-200
                    ${isOpen ? "px-4" : "justify-center"}
                `}
            >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span
                    className={`
                        text-sm font-bold whitespace-nowrap
                        transition-all duration-300 overflow-hidden
                        ${isOpen ? "opacity-100 max-w-[150px]" : "opacity-0 max-w-0"}
                    `}
                >
                    تسجيل الخروج
                </span>
            </button>

            {/* ═══════ زر تسجيل الخروج — الموبايل ═══════ */}
            <button
                onClick={logout}
                title="تسجيل الخروج"
                className="flex flex-col items-center gap-0.5 p-2 rounded-xl
                           text-red-400 hover:text-red-300 active:scale-95
                           transition-all duration-200 min-w-0 md:hidden"
            >
                <div className="p-1.5 rounded-xl">
                    <LogOut className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold leading-tight text-red-400/70">خروج</span>
            </button>
        </nav>
    );
}
