"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, set, update } from "firebase/database";
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
    assignWird: (date: string, assignment: WirdAssignment) => Promise<void>;
    getWirdForDate: (date: string) => WirdAssignment | null;
}

const WirdContext = createContext<WirdContextType | null>(null);

export function WirdProvider({ children }: { children: React.ReactNode }) {
    const [allAssignments, setAllAssignments] = useState<Record<string, WirdAssignment>>({});
    const [currentWird, setCurrentWird] = useState<WirdAssignment | null>(null);
    const [loading, setLoading] = useState(true);

    const todayStr = format(new Date(), "yyyy-MM-dd");

    useEffect(() => {
        const assignmentsRef = ref(db, "assignments");
        const unsubscribe = onValue(assignmentsRef, (snapshot) => {
            const data = snapshot.val() || {};
            setAllAssignments(data);

            // Check if today has an assignment or is a default holiday
            if (data[todayStr]) {
                setCurrentWird(data[todayStr]);
            } else {
                const today = new Date();
                const isWeekend = isThursday(today) || isFriday(today);
                setCurrentWird({
                    date: todayStr,
                    surahId: 26, // Default Ash-Shu'ara
                    surahName: "الشعراء",
                    startAyah: 0,
                    endAyah: 0,
                    repetitions: 100,
                    isHoliday: isWeekend
                });
            }
            setLoading(false);
        });

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
