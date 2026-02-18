"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, set } from "firebase/database";
import { format, isThursday, isFriday } from "date-fns";

export interface WirdAssignment {
    date: string; // YYYY-MM-DD
    surahId: number;
    surahName: string;
    startAyah: number;
    endAyah: number;
    repetitions: number;
    isHoliday: boolean;
    note?: string;
}

interface WirdContextType {
    currentWird: WirdAssignment | null;
    allAssignments: Record<string, WirdAssignment>;
    loading: boolean;
    error: string | null;
    assignWird: (date: string, assignment: WirdAssignment) => Promise<void>;
    getWirdForDate: (date: string) => WirdAssignment | null;
}

const WirdContext = createContext<WirdContextType | null>(null);

export function WirdProvider({ children }: { children: React.ReactNode }) {
    const [allAssignments, setAllAssignments] = useState<Record<string, WirdAssignment>>({});
    const [currentWird, setCurrentWird] = useState<WirdAssignment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const todayStr = format(new Date(), "yyyy-MM-dd");

    useEffect(() => {
        // ✅ قراءة الأوراد مباشرة — بدون انتظار تسجيل الدخول
        // الأوراد بيانات عامة يجب أن يراها الجميع
        const assignmentsRef = ref(db, "assignments");

        const unsubscribe = onValue(
            assignmentsRef,
            (snapshot) => {
                const raw = snapshot.val() || {};
                // ✅ تطبيع أسماء الحقول لتوافق Calendar و StudentDashboard
                const normalized: Record<string, WirdAssignment> = {};
                for (const [date, entry] of Object.entries(raw)) {
                    const w = entry as Record<string, unknown>;
                    normalized[date] = {
                        date: (w.date as string) || date,
                        surahId: (w.surahId as number) || 0,
                        surahName: (w.arabicSurahName as string) || (w.surahName as string) || "",
                        startAyah: (w.startAyah as number) || 0,
                        endAyah: (w.endAyah as number) || 0,
                        repetitions: (w.targetRepetitions as number) || (w.repetitions as number) || 100,
                        isHoliday: (w.isHoliday as boolean) || false,
                        note: (w.note as string) || "",
                    };
                }
                console.log("[useWird] ✅ تم تحميل الأوراد:", Object.keys(normalized).length, "ورد");
                setAllAssignments(normalized);
                setError(null);

                if (normalized[todayStr]) {
                    setCurrentWird(normalized[todayStr]);
                } else {
                    const today = new Date();
                    const isWeekend = isThursday(today) || isFriday(today);
                    setCurrentWird({
                        date: todayStr,
                        surahId: 26,
                        surahName: "الشعراء",
                        startAyah: 0,
                        endAyah: 0,
                        repetitions: 100,
                        isHoliday: isWeekend
                    });
                }
                setLoading(false);
            },
            (err) => {
                console.error("[useWird] ❌ خطأ في قراءة الأوراد:", err.message);
                setError("لا يمكن تحميل الأوراد. تحقق من قواعد قاعدة البيانات.");
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [todayStr]);

    const assignWird = async (date: string, assignment: WirdAssignment) => {
        await set(ref(db, `assignments/${date}`), assignment);
    };

    const getWirdForDate = (date: string) => {
        return allAssignments[date] || null;
    };

    return (
        <WirdContext.Provider value={{
            currentWird,
            allAssignments,
            loading,
            error,
            assignWird,
            getWirdForDate
        }}>
            {children}
        </WirdContext.Provider>
    );
}

export const useWird = () => {
    const context = useContext(WirdContext);
    if (!context) throw new Error("useWird must be used within WirdProvider");
    return context;
};
