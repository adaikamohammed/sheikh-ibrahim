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
        <nav className="fixed bottom-0 left-0 right-0 z-[9999] md:bottom-auto md:top-0 md:left-0 md:h-screen md:w-20 bg-background/80 backdrop-blur-xl border-t md:border-t-0 md:border-l border-card-border flex md:flex-col items-center justify-around md:justify-center md:space-y-8 p-4">
            {navItems.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;

                return (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-3 md:space-x-reverse group transition-all ${isActive ? "text-primaryScale-500" : "text-slate-400 hover:text-primary"
                            }`}
                    >
                        <div className={`p-2 rounded-2xl transition-all ${isActive
                                ? "bg-primary/20 text-primary shadow-[0_0_15px_rgba(212,175,55,0.3)] scale-110"
                                : "group-hover:bg-primary/10 group-hover:text-primary"
                            }`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] md:hidden font-bold font-sans">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
