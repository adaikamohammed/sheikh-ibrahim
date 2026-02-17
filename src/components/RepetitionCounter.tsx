"use client";

import { useState, useEffect } from "react";
import { Edit3 } from "lucide-react";

interface CounterProps {
    limit: number;
    initialCount?: number;
    onUpdate?: (count: number) => void;
    onComplete: () => void;
}

export default function RepetitionCounter({ limit = 100, initialCount = 0, onUpdate, onComplete }: CounterProps) {
    const [count, setCount] = useState(initialCount);
    const [showInput, setShowInput] = useState(false);
    const [inputValue, setInputValue] = useState("");

    // Update local state if initialCount changes from parent (DB sync)
    useEffect(() => {
        if (initialCount !== 0 && count === 0 && initialCount !== count) {
            setCount(initialCount);
        }
    }, [initialCount, count]);

    const handleIncrement = () => {
        if (count < limit) {
            const nextCount = count + 1;
            setCount(nextCount);
            if (onUpdate) onUpdate(nextCount);

            // Haptic feedback
            if (typeof window !== "undefined" && window.navigator.vibrate) {
                window.navigator.vibrate(15);
            }

            if (nextCount === limit) {
                onComplete();
            }
        }
    };

    const handleDirectInput = () => {
        const num = parseInt(inputValue, 10);
        if (isNaN(num) || num < 0) return;

        const newCount = Math.min(num, limit);
        setCount(newCount);
        if (onUpdate) onUpdate(newCount);
        setShowInput(false);
        setInputValue("");

        if (newCount >= limit) {
            onComplete();
        }
    };

    const reset = () => {
        setCount(0);
        if (onUpdate) onUpdate(0);
    };

    const percentage = Math.min(100, (count / limit) * 100);
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center gap-6 md:gap-10 py-4 md:py-10">
            <button
                className="relative flex items-center justify-center cursor-pointer select-none active:scale-[0.97] transition-all duration-300 group outline-none"
                onClick={handleIncrement}
                disabled={count >= limit}
                aria-label={`عدد التكرار ${count} من ${limit}`}
            >
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-full bg-gold/10 blur-[40px] md:blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Progress Ring */}
                <svg className="w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 transform -rotate-90 drop-shadow-[0_0_30px_rgba(212,175,55,0.15)]" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r={radius} stroke="currentColor" className="text-slate-800/50" strokeWidth="10" fill="transparent" />
                    <circle
                        cx="100" cy="100" r={radius}
                        stroke="url(#goldGradient)" strokeWidth="14" fill="transparent"
                        strokeDasharray={circumference}
                        style={{ strokeDashoffset, transition: "stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1)" } as React.CSSProperties}
                        strokeLinecap="round"
                    />
                    <defs>
                        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#d4af37" />
                            <stop offset="50%" stopColor="#fcd34d" />
                            <stop offset="100%" stopColor="#b4941f" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Counter Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 pointer-events-none">
                    <span className="text-6xl md:text-7xl lg:text-8xl font-bold font-sans text-transparent bg-clip-text bg-gradient-to-b from-white to-gold-200 drop-shadow-lg tracking-tighter">
                        {count}
                    </span>
                    <span className="text-gold-300/80 mt-1 font-medium text-sm md:text-lg tracking-[0.2em] font-quran">
                        تكرار
                    </span>
                </div>
            </button>

            {/* Action Buttons */}
            <div className="flex gap-3 items-center">
                <button
                    onClick={reset}
                    className="px-6 md:px-8 py-2.5 md:py-3 glass-panel rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-all active:scale-95 text-sm font-medium border border-white/5 hover:border-white/10"
                >
                    بدء من جديد
                </button>
                <button
                    onClick={() => { setShowInput(!showInput); setInputValue(String(count)); }}
                    className={`px-5 md:px-6 py-2.5 md:py-3 rounded-full transition-all active:scale-95 text-sm font-bold border flex items-center gap-2 ${showInput
                            ? "bg-gold/10 text-gold border-gold/30"
                            : "glass-panel text-slate-400 hover:text-gold border-white/5 hover:border-gold/30"
                        }`}
                    title="إدخال رقم يدوياً"
                >
                    <Edit3 className="w-4 h-4" />
                    <span>إدخال يدوي</span>
                </button>
            </div>

            {/* Direct Number Input */}
            {showInput && (
                <div className="glass-panel p-4 md:p-5 rounded-2xl border border-gold/20 w-full max-w-xs space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-sm font-bold text-slate-300 font-quran block text-center">
                        أدخل عدد التكرارات مباشرة
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min={0}
                            max={limit}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleDirectInput(); }}
                            placeholder={`0 - ${limit}`}
                            className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-center text-xl font-bold text-white font-sans focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all placeholder:text-slate-600"
                            autoFocus
                        />
                        <button
                            onClick={handleDirectInput}
                            className="px-5 py-3 bg-gold/20 text-gold font-bold rounded-xl border border-gold/30 hover:bg-gold/30 transition-all active:scale-95"
                        >
                            حفظ
                        </button>
                    </div>
                    <p className="text-[11px] text-slate-500 text-center">
                        الحد الأقصى: {limit} تكرار
                    </p>
                </div>
            )}

            {/* Status */}
            <div className="text-center min-h-[50px]">
                {count >= limit ? (
                    <div className="glass-panel border-gold/30 bg-gold/5 px-6 md:px-8 py-3 md:py-4 rounded-2xl">
                        <p className="text-gold font-bold font-quran text-lg md:text-2xl drop-shadow-sm">
                            ✨ فتح الله عليك، تقبل الله سعيك
                        </p>
                    </div>
                ) : (
                    <p className="text-slate-400 font-sans text-xs md:text-sm bg-slate-900/40 px-4 py-2 rounded-full border border-white/5">
                        الهدف اليومي: <span className="text-gold font-bold">{limit}</span>
                    </p>
                )}
            </div>
        </div>
    );
}
