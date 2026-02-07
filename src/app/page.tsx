"use client";

import { useRealtime } from "@/hooks/useRealtime";
import StudentDashboard from "@/components/StudentDashboard";
import SheikhDashboard from "@/components/SheikhDashboard";
import RoleSwitcher from "@/components/RoleSwitcher";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { role, loading, currentUser } = useRealtime();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/login");
    }
  }, [loading, currentUser, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
      </div>
    );
  }

  // If not logged in, useRealtime effects will handle redirect, but we return null here to avoid flash
  if (!currentUser || !role) return null;

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto">
      <RoleSwitcher />
      {role === "student" ? <StudentDashboard /> : <SheikhDashboard />}
    </main>
  );
}
