"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeSwitcher() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    const toggleTheme = () => {
        setTheme(theme === "dark" || theme === "system" ? "light" : "dark");
    };

    return (
        <button
            onClick={toggleTheme}
            className={`p-2 rounded-full shadow-md transition-all border ${theme === "dark"
                    ? "glass-midnight text-gold border-white/10 hover:bg-white/5"
                    : "bg-white text-orange-500 border-orange-100 hover:bg-orange-50 ring-1 ring-orange-100"
                }`}
            title={theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}
        >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
    );
}
