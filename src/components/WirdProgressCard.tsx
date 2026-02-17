"use client";

import { WirdStudentProgress } from "@/types";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

interface WirdProgressCardProps {
  progress: WirdStudentProgress;
  onClick?: () => void;
}

export default function WirdProgressCard({ progress, onClick }: WirdProgressCardProps) {
  const statusConfig = {
    completed: {
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      label: "مكتمل",
      labelBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      glow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    },
    "in-progress": {
      icon: Clock,
      color: "text-gold",
      bgColor: "bg-gold/10",
      borderColor: "border-gold/20",
      label: "قيد الإنجاز",
      labelBg: "bg-gold/10 text-gold border border-gold/20",
      glow: "shadow-[0_0_15px_rgba(212,175,55,0.1)]",
    },
    "not-started": {
      icon: AlertCircle,
      color: "text-slate-500",
      bgColor: "bg-slate-500/10",
      borderColor: "border-slate-700",
      label: "لم يبدأ",
      labelBg: "bg-slate-800 text-slate-400 border border-slate-700",
      glow: "",
    },
  };

  const config = statusConfig[progress.status];
  const Icon = config.icon;
  // Ensure we handle potentially invalid dates
  let formattedDate = "";
  try {
    if (progress.date) {
      formattedDate = format(parseISO(progress.date), "EEEE، d MMMM", { locale: ar });
    }
  } catch (e) {
    formattedDate = progress.date || "";
  }

  return (
    <button
      onClick={onClick}
      className={`w-full glass-panel p-4 md:p-5 border text-start group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] ${config.borderColor} ${config.glow}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

      <div className="space-y-3 md:space-y-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className={`p-2 md:p-2.5 rounded-xl ${config.bgColor}`}>
            <Icon className={`w-4 h-4 md:w-5 md:h-5 ${config.color}`} />
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${config.labelBg}`}>
            {config.label}
          </span>
        </div>

        {/* Student Name */}
        <div>
          <h3 className="text-sm md:text-base font-bold text-white font-quran mb-0.5 truncate">{progress.studentName}</h3>
          <p className="text-[10px] text-slate-500 font-sans">{formattedDate}</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 md:space-y-2">
          <div className="flex items-center justify-between font-sans">
            <span className="text-[11px] md:text-xs text-slate-400">
              <span className="text-white font-bold">{progress.currentCount}</span> / {progress.targetCount}
            </span>
            <span className={`text-[11px] md:text-xs font-bold ${config.color}`}>
              {progress.percentage}%
            </span>
          </div>
          <div className="h-1.5 md:h-2 w-full bg-slate-950/50 rounded-full overflow-hidden border border-slate-800/50">
            <div
              className={`h-full rounded-full transition-all duration-700 ${progress.status === "completed"
                ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                : progress.status === "in-progress"
                  ? "bg-gold shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                  : "bg-slate-600"
                }`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}
