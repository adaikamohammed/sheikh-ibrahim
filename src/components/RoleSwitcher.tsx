import { User, Users } from "lucide-react";
import { useRealtime } from "@/hooks/useRealtime";
import StudentDashboard from "./StudentDashboard";
import SheikhDashboard from "./SheikhDashboard";

export default function RoleSwitcher() {
    const { role, switchRole } = useRealtime();

    return (
        <div className="relative">
            {/* Absolute Role Toggler */}
            <div className="fixed top-20 right-4 z-[9999] flex flex-col space-y-2">
                <button
                    onClick={() => switchRole("student")}
                    className={`p-3 rounded-full shadow-xl transition-all ${role === "student" ? "bg-gold text-midnight-950 scale-110" : "glass-midnight text-slate-400 border border-white/10"}`}
                    title="عرض كطالب"
                >
                    <User className="w-5 h-5" />
                </button>
                <button
                    onClick={() => switchRole("sheikh")}
                    className={`p-3 rounded-full shadow-xl transition-all ${role === "sheikh" ? "bg-gold text-midnight-950 scale-110" : "glass-midnight text-slate-400 border border-white/10"}`}
                    title="عرض كشيخ"
                >
                    <Users className="w-5 h-5" />
                </button>
            </div>

            {role === "student" ? <StudentDashboard /> : <SheikhDashboard />}
        </div>
    );
}
