"use client";

import { useState } from "react";
import { useWird, WirdAssignment as AssignmentType } from "@/hooks/useWird";
import { format, addDays, startOfToday, isThursday, isFriday } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar as CalendarIcon, BookOpen, Clock, Save, X, ChevronRight, ChevronLeft, Coffee, Hash } from "lucide-react";

export default function WirdAssignment() {
    const { assignWird, getWirdForDate } = useWird();
    const [selectedDate, setSelectedDate] = useState(startOfToday());
    const [surah] = useState({ id: 26, name: "الشعراء", totalAyahs: 227 }); // Focus for now
    const [startAyah, setStartAyah] = useState(1);
    const [endAyah, setEndAyah] = useState(10);
    const [repetitions, setRepetitions] = useState(100);
    const [isHoliday, setIsHoliday] = useState(isThursday(startOfToday()) || isFriday(startOfToday()));
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const displayDate = format(selectedDate, "EEEE, d MMMM yyyy", { locale: ar });

    // Load existing assignment if any
    const loadAssignment = (date: Date) => {
        const dateKey = format(date, "yyyy-MM-dd");
        const existing = getWirdForDate(dateKey);

        if (existing) {
            setStartAyah(existing.startAyah);
            setEndAyah(existing.endAyah);
            setRepetitions(existing.repetitions || 100);
            setIsHoliday(existing.isHoliday);
        } else {
            // Smart Suggestion: Look at the previous day
            const prevDateKey = format(addDays(date, -1), "yyyy-MM-dd");
            const prevAssignment = getWirdForDate(prevDateKey);

            if (prevAssignment && !prevAssignment.isHoliday) {
                const suggestedStart = prevAssignment.endAyah + 1;
                // Ensure we don't exceed total ayahs (227 for Ash-Shu'ara)
                const finalStart = suggestedStart > 227 ? 1 : suggestedStart;
                setStartAyah(finalStart);
                setEndAyah(finalStart); // User usually expands from here
            } else {
                setStartAyah(1);
                setEndAyah(10);
            }
            setRepetitions(100);
            setIsHoliday(isThursday(date) || isFriday(date));
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const assignment: AssignmentType = {
                date: dateStr,
                surahId: surah.id,
                surahName: surah.name,
                startAyah: isHoliday ? 0 : startAyah,
                endAyah: isHoliday ? 0 : endAyah,
                repetitions: isHoliday ? 0 : repetitions,
                isHoliday
            };
            await assignWird(dateStr, assignment);
            setMessage("تم حفظ الورد بنجاح!");
            setTimeout(() => setMessage(""), 3000);
        } catch (e) {
            console.error(e);
            setMessage("فشل الحفظ!");
        } finally {
            setLoading(false);
        }
    };

    const nextDay = () => {
        const d = addDays(selectedDate, 1);
        setSelectedDate(d);
        loadAssignment(d);
    };

    const prevDay = () => {
        const d = addDays(selectedDate, -1);
        setSelectedDate(d);
        loadAssignment(d);
    };

    return (
        <div className="glass-panel rounded-3xl p-6 border border-card-border shadow-2xl space-y-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold font-quran text-foreground">تنظيم الأوراد</h2>
                        <p className="text-xs text-slate-500 font-sans">تحديد ورد يومي للفوج</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                        onClick={prevDay}
                        className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-foreground transition-colors"
                        title="اليوم السابق"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                        onClick={nextDay}
                        className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-foreground transition-colors"
                        title="اليوم التالي"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Date Display */}
            <div className="text-center py-4 bg-primary/5 rounded-2xl border border-primary/10">
                <p className="text-primary font-bold font-quran text-lg">{displayDate}</p>
                {isThursday(selectedDate) || isFriday(selectedDate) ? (
                    <span className="text-[10px] text-orange-500 font-bold bg-orange-500/10 px-2 py-0.5 rounded-full">يوم عطلة تلقائي</span>
                ) : null}
            </div>

            {/* Holiday Toggle */}
            <button
                onClick={() => setIsHoliday(!isHoliday)}
                className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between ${isHoliday
                    ? "bg-orange-500/10 border-orange-500/30 text-orange-500"
                    : "bg-background border-card-border text-slate-500 hover:border-primary/30"
                    }`}
            >
                <div className="flex items-center space-x-3 space-x-reverse">
                    <Coffee className="w-5 h-5" />
                    <span className="font-bold font-sans">تحديد كعطلة</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${isHoliday ? "bg-orange-500" : "bg-slate-300"}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isHoliday ? "right-6" : "right-1"}`}></div>
                </div>
            </button>

            {!isHoliday && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-4 bg-background border border-card-border rounded-2xl space-y-3">
                        <div className="flex items-center space-x-2 space-x-reverse text-emerald-500 mb-2">
                            <BookOpen className="w-4 h-4" />
                            <span className="text-sm font-bold">السورة المختارة</span>
                        </div>
                        <p className="text-2xl font-bold font-quran text-foreground">{surah.name}</p>
                        <p className="text-xs text-slate-500">إجمالي الآيات: {surah.totalAyahs}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="startAyah" className="text-xs text-slate-500 font-bold block mr-2">من الآية</label>
                            <input
                                id="startAyah"
                                type="number"
                                value={startAyah}
                                onChange={(e) => setStartAyah(parseInt(e.target.value) || 0)}
                                className="w-full bg-background border border-card-border rounded-xl py-3 px-4 text-foreground font-sans focus:outline-none focus:border-primary/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="endAyah" className="text-xs text-slate-500 font-bold block mr-2">إلى الآية</label>
                            <input
                                id="endAyah"
                                type="number"
                                value={endAyah}
                                onChange={(e) => setEndAyah(parseInt(e.target.value) || 0)}
                                className="w-full bg-background border border-card-border rounded-xl py-3 px-4 text-foreground font-sans focus:outline-none focus:border-primary/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="repetitions" className="text-xs text-slate-500 font-bold block mr-2 flex items-center">
                            <Hash className="w-3 h-3 ml-1" />
                            عدد التكرارات
                        </label>
                        <input
                            id="repetitions"
                            type="number"
                            value={repetitions}
                            onChange={(e) => setRepetitions(parseInt(e.target.value) || 0)}
                            className="w-full bg-background border border-card-border rounded-xl py-3 px-4 text-foreground font-sans focus:outline-none focus:border-primary/50"
                        />
                    </div>
                </div>
            )}

            <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-primary text-midnight-950 font-bold py-4 rounded-2xl hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-2 space-x-reverse"
            >
                {loading ? <Clock className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                <span>حفظ الورد لليوم</span>
            </button>

            {message && (
                <p className="text-center text-emerald-500 font-bold animate-pulse">{message}</p>
            )}
        </div>
    );
}
