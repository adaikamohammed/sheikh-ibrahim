"use client";

import { WirdProgress } from "@/types";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

interface WirdProgressCardProps {
  progress: WirdProgress;
  onClick?: () => void;
}

export default function WirdProgressCard({ progress, onClick }: WirdProgressCardProps) {
  const statusConfig = {
    completed: {
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      label: "مكتمل",
      labelBg: "bg-emerald-500/20 text-emerald-400",
    },
    "in-progress": {
      icon: Clock,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
      label: "قيد الإنجاز",
      labelBg: "bg-primary/20 text-primary",
    },
    "not-started": {
      icon: AlertCircle,
      color: "text-slate-500",
      bgColor: "bg-slate-500/5",
      borderColor: "border-slate-500/20",
      label: "لم يبدأ",
      labelBg: "bg-slate-500/10 text-slate-400",
    },
  };

  const config = statusConfig[progress.status];
  const Icon = config.icon;
  const formattedDate = format(parseISO(progress.date), "EEEE، d MMMM", { locale: ar });

  return (
    <button
      onClick={onClick}
      className={`w-full glass-panel rounded-2xl p-4 border transition-all text-right ${config.borderColor} hover:bg-white/10 active:scale-95`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-xl ${config.bgColor}`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-lg ${config.labelBg}`}>
            {config.label}
          </span>
        </div>

        {/* Student Name */}
        <div>
          <p className="text-sm font-bold text-foreground">{progress.studentName}</p>
          <p className="text-xs text-slate-500 font-sans">{formattedDate}</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-sans">
              {progress.currentCount} / {progress.targetCount}
            </span>
            <span className="text-xs font-bold text-foreground">
              {progress.percentage}%
            </span>
          </div>
          <div className="h-2 w-full bg-slate-200/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress.status === "completed"
                  ? "bg-emerald-500"
                  : progress.status === "in-progress"
                    ? "bg-primary"
                    : "bg-slate-500"
              }`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Time */}
        {progress.lastUpdate && (
          <p className="text-xs text-slate-600 font-sans">
            آخر تحديث: {format(progress.lastUpdate, "HH:mm")}
          </p>
        )}
      </div>
    </button>
  );
}
