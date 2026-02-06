"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, set, update } from "firebase/database";

// Define the two test users provided by the user
export const TEST_USERS = {
    SHEIKH: {
        uid: "jpKRLSYrEYgsVcBHl3nekWw1", // Replace with full UID if available or use this prefix
        email: "admin00@gmail.com",
        role: "sheikh",
        name: "الشيخ إبراهيم مراد"
    },
    STUDENT: {
        uid: "QpRjyxxaT7dPeaepzWTv461i1", // Replace with full UID if available
        email: "admin1@gmail.com",
        role: "student",
        name: "شايبي عبد الرحمان"
    }
};

type UserRole = "sheikh" | "student";

interface StudentData {
    uid: string;
    name: string;
    progress: number;
    status: string;
    lastUpdated: number;
}

interface RealtimeContextType {
    role: UserRole;
    currentUser: typeof TEST_USERS.SHEIKH | typeof TEST_USERS.STUDENT;
    switchRole: (role: UserRole) => void;
    // Student functions
    updateProgress: (count: number) => Promise<void>;
    studentData: StudentData | null;
    // Sheikh functions
    allStudents: StudentData[];
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const [role, setRole] = useState<UserRole>("student");
    const currentUser = role === "sheikh" ? TEST_USERS.SHEIKH : TEST_USERS.STUDENT;

    const [studentData, setStudentData] = useState<StudentData | null>(null);
    const [allStudents, setAllStudents] = useState<StudentData[]>([]);

    // Function to switch role and simulator identity
    const switchRole = (newRole: UserRole) => {
        setRole(newRole);
    };

    // 1. Sync current student data when in Student mode
    useEffect(() => {
        if (role === "student") {
            const studentRef = ref(db, `students/${TEST_USERS.STUDENT.uid}`);
            const unsubscribe = onValue(studentRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setStudentData(data);
                } else {
                    // Initialize if empty
                    const initialData = {
                        uid: TEST_USERS.STUDENT.uid,
                        name: TEST_USERS.STUDENT.name,
                        progress: 0,
                        status: "تلاوة",
                        lastUpdated: Date.now()
                    };
                    set(studentRef, initialData);
                    setStudentData(initialData);
                }
            });
            return () => unsubscribe();
        }
    }, [role]);

    // 2. Sync all students when in Sheikh mode
    useEffect(() => {
        if (role === "sheikh") {
            const studentsRef = ref(db, "students");
            const unsubscribe = onValue(studentsRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const studentsList = Object.values(data) as StudentData[];
                    setAllStudents(studentsList);
                }
            });
            return () => unsubscribe();
        }
    }, [role]);

    // Update progress function for Student
    const updateProgress = async (count: number) => {
        if (role !== "student") return;

        // Calculate status based on progress (simple logic for demo)
        let status = "تلاوة";
        if (count >= 100) status = "حفظ";
        else if (count >= 50) status = "مراجعة";

        await update(ref(db, `students/${TEST_USERS.STUDENT.uid}`), {
            progress: count,
            status: status,
            lastUpdated: Date.now()
        });
    };

    return (
        <RealtimeContext.Provider value={{
            role,
            currentUser,
            switchRole,
            updateProgress,
            studentData,
            allStudents
        }}>
            {children}
        </RealtimeContext.Provider>
    );
}

export const useRealtime = () => {
    const context = useContext(RealtimeContext);
    if (!context) throw new Error("useRealtime must be used within RealtimeProvider");
    return context;
};
