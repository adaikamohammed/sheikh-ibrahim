"use client";

import { useParams, useRouter } from "next/navigation";
import { useRealtime } from "@/hooks/useRealtime";
import { useWird } from "@/hooks/useWird";
import { format, parseISO, eachDayOfInterval } from "date-fns";
import { ar } from "date-fns/locale";
import {
  ArrowRight,
  TrendingUp,
  Calendar,
  Target,
  Trophy,
  BarChart3,
  AlertCircle,
} from "lucide-react";

export default function StudentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.studentId as string;
  const { allStudents, role } = useRealtime();
  const { getWirdForDate } = useWird();

  const student = allStudents.find((s) => s.uid === studentId);

  if (role !== "sheikh" || !student) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto" />
          <p className="text-slate-400">لم يتم العثور على الطالب</p>
        </div>
      </div>
    );
  }

  // حساب الإحصائيات
  const today = new Date().toISOString().split("T")[0];
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  });

  const weekData = last7Days.map((day) => ({
    date: day,
    count: student.dailyProgress?.[day] || 0,
    formattedDate: format(parseISO(day), "E", { locale: ar }),
  }));

  const weekTotal = weekData.reduce((sum, d) => sum + d.count, 0);
  const weekAverage = Math.round(weekTotal / weekData.length);
  const completedDaysWeek = weekData.filter((d) => d.count > 0).length;

  // Last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  });

  const monthTotal = last30Days.reduce((sum, d) => sum + (student.dailyProgress?.[d] || 0), 0);
  const monthAverage = Math.round(monthTotal / 30);
  const completedDaysMonth = last30Days.filter((d) => (student.dailyProgress?.[d] || 0) > 0).length;

  const todayCount = student.dailyProgress?.[today] || 0;

  return (
    <div className="min-h-screen bg-background text-white pb-32">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2"></div>

      <main className="max-w-4xl mx-auto px-6 pt-10 space-y-8 relative z-10">
        {/* Header with Back Button */}
        <div className="flex items-center space-x-4 space-x-reverse">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowRight className="w-6 h-6 text-slate-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold font-quran">{student.name}</h1>
            <p className="text-sm text-slate-400 font-sans">
              عضو منذ{" "}
              {student.joinedDate
                ? format(student.joinedDate, "d MMMM yyyy", { locale: ar })
                : "---"}
            </p>
          </div>
        </div>

        {/* Today Stats */}
        <div className="glass-panel rounded-2xl p-8 border border-card-border">
          <h2 className="text-lg font-bold font-quran mb-6">إحصائيات اليوم</h2>
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-slate-400 font-sans mb-2">إجمالي التكرارات</p>
                <p className="text-5xl font-bold text-emerald-500">{todayCount}</p>
              </div>
              <div className="h-32 flex items-end space-x-2 space-x-reverse gap-4">
                {[...Array(7)].map((_, i) => {
                  const count = weekData[i]?.count || 0;
                  const maxCount = Math.max(...weekData.map((d) => d.count), 100);
                  const height = (count / maxCount) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-primary/20 rounded-t-lg overflow-hidden relative group"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    >
                      <div
                        className="w-full bg-primary rounded-t-lg transition-all duration-300"
                        style={{ height: "100%" }}
                      >
                        <div className="absolute -top-8 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-center">
                          <p className="text-xs font-bold text-primary">{count}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel rounded-2xl p-6 border border-card-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-400 font-quran">الإجمالي الأسبوعي</h3>
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold text-primary">{weekTotal}</p>
            <p className="text-xs text-slate-500 font-sans">متوسط يومي: {weekAverage}</p>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-card-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-400 font-quran">الإجمالي الشهري</h3>
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold text-emerald-500">{monthTotal}</p>
            <p className="text-xs text-slate-500 font-sans">متوسط يومي: {monthAverage}</p>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-card-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-400 font-quran">أيام الالتزام</h3>
              <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold text-orange-500">{completedDaysMonth}/30</p>
            <p className="text-xs text-slate-500 font-sans">نسبة الالتزام: {Math.round((completedDaysMonth / 30) * 100)}%</p>
          </div>
        </div>

        {/* Weekly Breakdown */}
        <div className="glass-panel rounded-2xl p-6 border border-card-border">
          <h2 className="text-lg font-bold font-quran mb-6">آخر 7 أيام</h2>
          <div className="space-y-3">
            {weekData.map((day, idx) => {
              const todayWird = getWirdForDate(day.date);
              const target = todayWird?.repetitions || 100;
              const percentage = Math.round((day.count / target) * 100);
              return (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="text-right">
                    <p className="font-bold text-foreground capitalize">{day.formattedDate}</p>
                    <p className="text-xs text-slate-500 font-sans">{day.date}</p>
                  </div>
                  <div className="flex items-center space-x-4 space-x-reverse flex-1 mr-6">
                    <div className="flex-1 h-2 bg-slate-200/10 rounded-full overflow-hidden max-w-xs">
                      <div
                        className={`h-full rounded-full transition-all ${
                          day.count >= target ? "bg-emerald-500" : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-foreground min-w-16 text-left">
                      {day.count}/{target}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Insights */}
        <div className="glass-panel rounded-2xl p-6 border border-card-border space-y-6">
          <h2 className="text-lg font-bold font-quran">ملاحظات الأداء</h2>

          <div className="space-y-4">
            <div className="flex items-start space-x-4 space-x-reverse p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500 mt-1">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-foreground">ملتزم جداً</p>
                <p className="text-sm text-slate-400 font-sans">
                  نسبة الالتزام في الشهر {Math.round((completedDaysMonth / 30) * 100)}% - حافظ على هذا الزخم
                </p>
              </div>
            </div>

            {weekAverage < 80 && (
              <div className="flex items-start space-x-4 space-x-reverse p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <div className="p-2 bg-orange-500/20 rounded-lg text-orange-500 mt-1">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-foreground">متوسط منخفض</p>
                  <p className="text-sm text-slate-400 font-sans">
                    المتوسط الأسبوعي {weekAverage} - حاول زيادة الالتزام
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
