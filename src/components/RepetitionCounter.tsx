"use client";

import { useState } from "react";

interface CounterProps {
    limit: number;
    initialCount?: number;
    onUpdate?: (count: number) => void;
    onComplete: () => void;
}

export default function RepetitionCounter({ limit = 100, initialCount = 0, onUpdate, onComplete }: CounterProps) {
    const [count, setCount] = useState(initialCount);

    // Update local state if initialCount changes from parent (DB sync)
    if (initialCount !== 0 && count === 0 && initialCount !== count) {
        setCount(initialCount);
    }

    const handleIncrement = () => {
        if (count < limit) {
            const nextCount = count + 1;
            setCount(nextCount);

            // Sync to DB
            if (onUpdate) onUpdate(nextCount);

            // Haptic feedback if available
            if (typeof window !== "undefined" && window.navigator.vibrate) {
                window.navigator.vibrate(15);
            }

            if (nextCount === limit) {
                onComplete();
            }
        }
    };

    const reset = () => {
        setCount(0);
        if (onUpdate) onUpdate(0);
    };

    const percentage = (count / limit) * 100;
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center space-y-12 py-10">
            <div
                className="relative flex items-center justify-center cursor-pointer select-none active:scale-95 transition-all duration-300 group"
                onClick={handleIncrement}
            >
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-full bg-emerald-glow/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Progress Ring */}
                <svg className="w-80 h-80 transform -rotate-90 drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    {/* Track */}
                    <circle
                        cx="160"
                        cy="160"
                        r={radius}
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="8"
                        fill="transparent"
                    />
                    {/* Progress */}
                    <circle
                        cx="160"
                        cy="160"
                        r={radius}
                        stroke="url(#royalGradient)"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={circumference}
                        style={{
                            strokeDashoffset,
                            transition: "stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
                        } as React.CSSProperties}
                        strokeLinecap="round"
                    />
                    <defs>
                        <linearGradient id="royalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="50%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                </svg>

                {/* Counter Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
                    <span className="text-8xl font-bold font-sans text-transparent bg-clip-text bg-gradient-to-b from-white to-emerald-200 drop-shadow-lg">
                        {count}
                    </span>
                    <span className="text-emerald-400 mt-4 font-normal text-lg tracking-widest opacity-80 uppercase">تسبــيحة</span>
                </div>
            </div>

            <div className="flex space-x-4 space-x-reverse">
                <button
                    onClick={reset}
                    className="px-8 py-3 glass-midnight rounded-full text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-950/30 transition-all border border-white/5 active:scale-95"
                >
                    بدء من جديد
                </button>
            </div>

            <div className="text-center space-y-3">
                {count === limit ? (
                    <div className="glass-gold px-6 py-3 rounded-xl animate-pulse">
                        <p className="text-gold font-bold font-quran text-xl">
                            ✨ فتح الله عليك، تقبل الله سعيك
                        </p>
                    </div>
                ) : (
                    <p className="text-slate-400 font-sans text-sm">
                        الهدف اليومي: <span className="text-emerald-400 font-bold">{limit}</span>
                    </p>
                )}
            </div>
        </div>
    );
}
