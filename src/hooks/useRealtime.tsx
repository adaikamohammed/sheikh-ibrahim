"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, onValue, set, update, get } from "firebase/database";
import { onAuthStateChanged, User as FirebaseUser, signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";

// Define the test users and admin emails
export const ADMIN_EMAILS = {
    SHEIKH: "admin00@gmail.com",
    // We can add other admins here if needed
};

// Student Email to Name Mapping
const STUDENT_NAMES: Record<string, string> = {
    "admin1@gmail.com": "بالعيد العاشوري",
    "admin2@gmail.com": "بالعيد زياد",
    "admin3@gmail.com": "تواتي أحمد ساجد",
    "admin4@gmail.com": "جاب الله محمد",
    "admin5@gmail.com": "حناي عبد الرحمان",
    "admin6@gmail.com": "حويذق معتصم بالله",
    "admin7@gmail.com": "شايبي عبد الرحمان",
    "admin8@gmail.com": "شكيمة يعقوب",
    "admin9@gmail.com": "طير رياض",
    "admin10@gmail.com": "فتح الله البراء",
    "admin11@gmail.com": "كنيوة رائد",
    "admin12@gmail.com": "مقدود عبد الناصر",
    "admin13@gmail.com": "ميلاد بولبدة",
    "admin14@gmail.com": "كنيوة وائل",
};

type UserRole = "sheikh" | "student" | null;

interface StudentData {
    uid: string;
    name: string;
    email?: string;
    progress: number;
    status: string;
    lastUpdated: number;
    phone?: string;
    avatar?: string;
    joinedDate?: number;
    dailyProgress?: Record<string, number>; // YYYY-MM-DD -> count
    weeklyStats?: Record<string, unknown>;
    monthlyStats?: Record<string, unknown>;
}

interface RealtimeContextType {
    role: UserRole;
    currentUser: FirebaseUser | null;
    loading: boolean;
    logout: () => Promise<void>;
    // Student functions
    updateProgress: (count: number, date?: string) => Promise<void>;
    studentData: StudentData | null;
    // Sheikh functions
    allStudents: StudentData[];
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [role, setRole] = useState<UserRole>(null);
    const [loading, setLoading] = useState(true);

    const [studentData, setStudentData] = useState<StudentData | null>(null);
    const [allStudents, setAllStudents] = useState<StudentData[]>([]);

    const router = useRouter();
    const pathname = usePathname();

    // 1. Monitor Auth State
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            if (user) {
                // Determine role based on email
                let assignedRole: UserRole = "student";
                if (user.email === ADMIN_EMAILS.SHEIKH) {
                    assignedRole = "sheikh";
                }
                setRole(assignedRole);

                // Redirect to home if on login page
                if (pathname === "/login") {
                    router.push("/");
                }
            } else {
                setRole(null);
                setStudentData(null);
                // Redirect to login if not on login page
                if (pathname !== "/login") {
                    router.push("/login");
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [pathname, router]);

    // 2. Sync Data based on Role
    useEffect(() => {
        if (!currentUser || !role) return;

        if (role === "student") {
            const studentRef = ref(db, `students/${currentUser.uid}`);
            const unsubscribe = onValue(studentRef, (snapshot) => {
                const data = snapshot.val();
                const studentEmail = currentUser.email || "";
                const correctName = STUDENT_NAMES[studentEmail] || currentUser.displayName || "طالب جديد";

                if (data) {
                    setStudentData(data);
                    // Sync name if it's different (fixes "طالب جديد" or old names)
                    if (data.name !== correctName) {
                        update(studentRef, { name: correctName });
                    }
                } else {
                    // Initialize new student data
                    const initialData = {
                        uid: currentUser.uid,
                        name: correctName,
                        email: studentEmail,
                        progress: 0,
                        status: "تلاوة",
                        lastUpdated: Date.now()
                    };
                    set(studentRef, initialData);
                    setStudentData(initialData as StudentData);
                }
            });
            return () => unsubscribe();
        }

        if (role === "sheikh") {
            const studentsRef = ref(db, "students");
            const unsubscribe = onValue(studentsRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const studentsList = Object.values(data) as StudentData[];
                    setAllStudents(studentsList);
                } else {
                    setAllStudents([]);
                }
            });
            return () => unsubscribe();
        }
    }, [currentUser, role]);

    const updateProgress = async (count: number, date?: string) => {
        if (role !== "student" || !currentUser) return;

        const todayStr = date || new Date().toISOString().split('T')[0];

        // Calculate status (legacy/overall)
        let status = "تلاوة";
        if (count >= 100) status = "حفظ";
        else if (count >= 50) status = "مراجعة";

        const updates: Record<string, unknown> = {
            progress: count, // Legacy fallback
            status: status,
            lastUpdated: Date.now(),
        };
        updates[`dailyProgress/${todayStr}`] = count;

        await update(ref(db, `students/${currentUser.uid}`), updates);
    };

    const logout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    return (
        <RealtimeContext.Provider value={{
            role,
            currentUser,
            loading,
            logout,
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
