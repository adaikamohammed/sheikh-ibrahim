"use client";

import { Home, BarChart3, User, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRealtime } from "@/hooks/useRealtime";

export default function Navigation() {
    const pathname = usePathname();
    const { role } = useRealtime();

    if (!role) return null;

    const navItems = [
        { label: "الرئيسية", icon: Home, path: "/" },
        { label: "الإحصائيات", icon: BarChart3, path: "/stats" },
        { label: "الملف الشخصي", icon: User, path: "/profile" },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[9999] md:left-0 md:top-0 md:h-screen md:w-24 bg-slate-900/95 backdrop-blur-xl border-t md:border-t-0 md:border-l border-slate-700 flex md:flex-col items-center justify-around md:justify-start md:pt-6 md:space-y-2 p-2 md:p-4">
            {navItems.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;

                return (
                    <Link
                        key={item.path}
                        href={item.path}
                        title={item.label}
                        className={`flex flex-col md:flex-col items-center space-y-1 md:space-y-2 group transition-all w-16 md:w-full md:justify-center ${isActive ? "text-gold" : "text-slate-400 hover:text-gold"
                            }`}
                    >
                        <div className={`p-3 rounded-2xl transition-all md:w-full md:flex md:justify-center ${isActive
                                ? "bg-gold/20 text-gold shadow-lg shadow-gold/30"
                                : "group-hover:bg-gold/10 group-hover:text-gold"
                            }`}>
                            <Icon className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <span className="text-[9px] md:hidden font-bold">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
