"use client";

import { useState, useEffect, useMemo } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useWird } from "@/hooks/useWird";
import { db } from "@/lib/firebase";
import { ref, onValue, push, set, update } from "firebase/database";
import {
  Calendar,
  Clock,
  ChevronRight,
  Check,
  AlertCircle,
  BookOpen,
  Lock,
  User,
  X,
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";

// ==================== أنواع البيانات ====================
interface ScheduleSlot {
  id: string;
  startTime: string;
  endTime: string;
  location: string;
  bookedCount: number;
}

interface SubSlot {
  time: string;
  endTime: string;
  parentSlotId: string;
  location: string;
  bookedBy: string | null;
  bookedByUid: string | null;
  bookingId: string | null;
}

interface ExistingBooking {
  id: string;
  studentId: string;
  studentName: string;
  startTime: string;
  endTime: string;
  slotId: string;
  dayOfWeek: number;
  date: string;
  status: string;
  surahName?: string;
  selectedWirdDate?: string;
  createdAt?: number;
}

const LOCATIONS_MAP: Record<string, string> = {
  mosque: "🕌 المسجد",
  prayer_room: "🙏 المصلى",
  quran_school: "📚 المدرسة القرآنية",
  other: "🏠 أخرى",
};

const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

// ========== تقسيم فترة كبيرة إلى شرائح 15 دقيقة ==========
function splitInto15MinSlots(slot: ScheduleSlot): { time: string; endTime: string }[] {
  const [sh, sm] = slot.startTime.split(":").map(Number);
  const [eh, em] = slot.endTime.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const result: { time: string; endTime: string }[] = [];

  for (let m = startMin; m + 15 <= endMin; m += 15) {
    const h1 = Math.floor(m / 60);
    const m1 = m % 60;
    const h2 = Math.floor((m + 15) / 60);
    const m2 = (m + 15) % 60;
    result.push({
      time: `${String(h1).padStart(2, "0")}:${String(m1).padStart(2, "0")}`,
      endTime: `${String(h2).padStart(2, "0")}:${String(m2).padStart(2, "0")}`,
    });
  }
  return result;
}

export default function BookAppointmentPage() {
  const { studentData, role, currentUser } = useRealtime();
  const { allAssignments } = useWird();

  const [step, setStep] = useState(1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSubSlot, setSelectedSubSlot] = useState<SubSlot | null>(null);
  const [selectedWirdDate, setSelectedWirdDate] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // حجوزات الطالب الحالي
  const [myBookings, setMyBookings] = useState<ExistingBooking[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showMyBookings, setShowMyBookings] = useState(false);

  // قراءة حجوزات الطالب
  useEffect(() => {
    if (!currentUser?.uid) return;
    const bookingsRef = ref(db, "appointments/bookings");
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entries = data as Record<string, ExistingBooking>;
        const mine = Object.entries(entries)
          .map(([id, val]) => ({ ...val, id }))
          .filter((b) => b.studentId === currentUser.uid && b.status !== "cancelled");
        mine.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setMyBookings(mine);
      } else {
        setMyBookings([]);
      }
    });
    return () => unsubscribe();
  }, [currentUser?.uid]);

  // الأوراد المتاحة (غير عطلات)
  const availableWirds = useMemo(() => {
    const wirds = Object.values(allAssignments || {}).filter((w) => !w.isHoliday);
    return wirds.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allAssignments]);

  // التحقق من حالة الورد المختار
  const selectedWirdInfo = useMemo(() => {
    if (!selectedWirdDate || !allAssignments) return null;
    const wird = allAssignments[selectedWirdDate];
    if (!wird) return null;

    const progress = studentData?.dailyProgress?.[selectedWirdDate] || 0;
    const target = wird.repetitions || 100;
    const isCompleted = progress >= target;

    return {
      wird,
      progress,
      target,
      isCompleted,
      percentage: Math.min(100, Math.round((progress / target) * 100)),
      remaining: Math.max(0, target - progress),
    };
  }, [selectedWirdDate, allAssignments, studentData]);

  // إلغاء حجز
  const handleCancelBooking = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      await update(ref(db, `appointments/bookings/${bookingId}`), {
        status: "cancelled",
        cancelledAt: Date.now(),
      });
    } catch {
      alert("حدث خطأ أثناء إلغاء الحجز");
    } finally {
      setCancellingId(null);
    }
  };

  if (role !== "student") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto" />
          <p className="text-slate-400">هذه الصفحة متاحة فقط للطلاب</p>
        </div>
      </div>
    );
  }

  // ========== حفظ الحجز في Firebase ==========
  const handleBooking = async () => {
    if (!selectedSubSlot || !selectedWirdDate || !selectedWirdInfo?.isCompleted || !selectedDate) {
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingsRef = ref(db, "appointments/bookings");
      const newRef = push(bookingsRef);
      const bookingId = newRef.key!;

      const wird = selectedWirdInfo.wird;

      await set(newRef, {
        id: bookingId,
        studentId: currentUser?.uid || "",
        studentName: studentData?.name || "طالب",
        studentEmail: currentUser?.email || "",
        date: selectedDate,
        dayOfWeek: selectedDay,
        slotId: selectedSubSlot.parentSlotId,
        startTime: selectedSubSlot.time,
        endTime: selectedSubSlot.endTime,
        location: selectedSubSlot.location,
        surahName: `سورة ${wird.surahName} (${wird.startAyah}-${wird.endAyah})`,
        selectedWirdDate: selectedWirdDate,
        notes: notes || "",
        status: "pending",
        createdAt: Date.now(),
      });

      setSubmitted(true);
    } catch {
      alert("حدث خطأ أثناء الحجز. حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // حالة بعد الحجز
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-panel p-8 md:p-12 rounded-2xl border border-card-border max-w-md w-full text-center">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-2xl font-bold text-white mb-4 font-quran">تم الحجز بنجاح!</h2>
          <p className="text-slate-400 mb-3 font-sans">
            حجزت الفترة <span className="text-gold font-bold">{selectedSubSlot?.time} - {selectedSubSlot?.endTime}</span> (15 دقيقة)
          </p>
          {selectedWirdInfo && (
            <p className="text-slate-400 mb-3 font-sans text-sm">
              الورد: <span className="text-emerald-400 font-bold">سورة {selectedWirdInfo.wird.surahName}</span>
            </p>
          )}
          <p className="text-slate-500 mb-8 font-sans text-sm">سيتم تأكيد موعدك من قبل الشيخ.</p>
          <button
            onClick={() => {
              setSubmitted(false);
              setStep(1);
              setSelectedDay(null);
              setSelectedDate("");
              setSelectedSubSlot(null);
              setSelectedWirdDate("");
              setNotes("");
            }}
            className="px-8 py-3 bg-gold text-black font-bold rounded-xl hover:shadow-lg hover:shadow-gold/20 transition-all"
          >
            حجز موعد آخر
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0f1c] to-black text-white p-4 md:p-8 pb-32">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gold/10 rounded-full blur-3xl -z-10"></div>
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-gold to-amber-600 mb-4 font-quran leading-tight py-2">
            حجز حصة تسميع
          </h1>
          <p className="text-slate-400 font-sans text-lg max-w-lg mx-auto leading-relaxed">
            اختر الوقت المناسب لعرض محفوظك على الشيخ.
            <br />
            <span className="text-gold/80 text-sm">مدة الحصة: 15 دقيقة</span>
          </p>
        </div>

        {/* حجوزاتي */}
        {myBookings.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setShowMyBookings(!showMyBookings)}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-gold/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                <span className="font-bold font-quran">حجوزاتي</span>
                <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full border border-gold/20">
                  {myBookings.length}
                </span>
              </div>
              <ChevronRight className={`w-5 h-5 text-slate-500 transition-transform ${showMyBookings ? "rotate-90" : ""}`} />
            </button>

            {showMyBookings && (
              <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                {myBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${booking.status === "confirmed"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : booking.status === "pending"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                          {booking.status === "confirmed" ? "مؤكد" : booking.status === "pending" ? "قيد الانتظار" : "ملغي"}
                        </span>
                        <span className="text-xs text-slate-500">{booking.date}</span>
                      </div>
                      <p className="text-sm font-semibold truncate">
                        {booking.surahName || "غير محدد"} • {booking.startTime} - {booking.endTime}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="shrink-0 p-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 mr-2"
                      title="إلغاء الحجز"
                    >
                      {cancellingId === booking.id ? (
                        <span className="text-xs">جاري...</span>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Steps Indicator */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-full border border-white/5 backdrop-blur-md">
            {[
              { id: 1, label: "اليوم", icon: Calendar },
              { id: 2, label: "الوقت", icon: Clock },
              { id: 3, label: "الورد", icon: BookOpen },
              { id: 4, label: "تأكيد", icon: Check },
            ].map((s, idx) => {
              const isActive = step >= s.id;
              const isCurrent = step === s.id;
              return (
                <div key={s.id} className="flex items-center">
                  <div
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300
                      ${isActive ? "bg-gold text-black font-bold shadow-lg shadow-gold/20" : "text-slate-500"}
                      ${isCurrent ? "scale-105 ring-2 ring-gold/30" : ""}
                    `}
                  >
                    <s.icon className={`w-4 h-4 ${isActive ? "text-black" : "text-slate-500"}`} />
                    <span className="hidden md:inline font-sans text-sm">{s.label}</span>
                  </div>
                  {idx < 3 && (
                    <div className={`w-8 h-0.5 mx-2 rounded-full ${step > s.id ? "bg-gold/50" : "bg-slate-800"}`}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="transition-all duration-500 ease-in-out">
          {step === 1 && (
            <Step1SelectDay
              onDaySelect={(dayIndex) => {
                setSelectedDay(dayIndex);
                const today = new Date();
                const todayDay = today.getDay();
                let diff = dayIndex - todayDay;
                if (diff <= 0) diff += 7;
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() + diff);
                setSelectedDate(targetDate.toISOString().split("T")[0]);
                setStep(2);
              }}
            />
          )}

          {step === 2 && selectedDay !== null && (
            <Step2SelectSubSlot
              dayOfWeek={selectedDay}
              targetDate={selectedDate}
              currentUserUid={currentUser?.uid || ""}
              onSubSlotSelect={(subSlot) => {
                setSelectedSubSlot(subSlot);
                setStep(3);
              }}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && selectedSubSlot && (
            <Step3SelectWird
              availableWirds={availableWirds}
              selectedWirdDate={selectedWirdDate}
              selectedWirdInfo={selectedWirdInfo}
              onWirdSelect={setSelectedWirdDate}
              onConfirm={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}

          {step === 4 && selectedSubSlot && selectedDay !== null && selectedWirdInfo && (
            <Step4Confirmation
              selectedDate={selectedDate}
              selectedDay={selectedDay}
              selectedSubSlot={selectedSubSlot}
              selectedWirdInfo={selectedWirdInfo}
              notes={notes}
              onNotesChange={setNotes}
              onConfirm={handleBooking}
              onBack={() => setStep(3)}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== الخطوة 1: اختيار اليوم ====================
function Step1SelectDay({ onDaySelect }: { onDaySelect: (dayIndex: number) => void }) {
  const [schedule, setSchedule] = useState<Record<number, number>>({});

  useEffect(() => {
    const scheduleRef = ref(db, "appointments/schedule");
    const unsubscribe = onValue(scheduleRef, (snapshot) => {
      const data = snapshot.val();
      const counts: Record<number, number> = {};
      if (data) {
        const entries = data as Record<string, { slots?: Record<string, unknown> }>;
        Object.entries(entries).forEach(([day, val]) => {
          if (val?.slots) {
            counts[parseInt(day)] = Object.keys(val.slots).length;
          }
        });
      }
      setSchedule(counts);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {DAYS_AR.map((day, index) => {
        const slotCount = schedule[index] || 0;
        const hasSlots = slotCount > 0;

        return (
          <button
            key={index}
            onClick={() => hasSlots && onDaySelect(index)}
            disabled={!hasSlots}
            className={`
              relative group overflow-hidden rounded-3xl p-6 text-right transition-all duration-300 border
              ${hasSlots
                ? "bg-slate-800/40 border-slate-700/50 hover:border-gold/50 hover:shadow-2xl hover:shadow-gold/10 hover:-translate-y-1 cursor-pointer"
                : "bg-slate-900/20 border-slate-800/50 opacity-40 grayscale cursor-not-allowed"}
            `}
          >
            {hasSlots && (
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-gold/5 rounded-full blur-3xl group-hover:bg-gold/10 transition-all"></div>
            )}

            <div className="relative z-10 flex justify-between items-start">
              <div>
                <h3 className={`text-2xl font-bold font-quran mb-2 ${hasSlots ? "text-white group-hover:text-gold transition-colors" : "text-slate-500"}`}>
                  {day}
                </h3>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${hasSlots ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></div>
                  <p className="text-sm font-sans text-slate-400">
                    {hasSlots ? `${slotCount} فترات مختلفة متاحة` : "لا توجد حصص"}
                  </p>
                </div>
              </div>

              {hasSlots && (
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:bg-gold group-hover:border-gold group-hover:text-black transition-all">
                  <ChevronRight className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className={`absolute bottom-0 left-0 h-1 rounded-t-full transition-all duration-500 ${hasSlots ? "bg-gradient-to-r from-gold/0 via-gold to-gold/0 w-0 group-hover:w-full" : "w-0"}`}></div>
          </button>
        );
      })}
    </div>
  );
}

// ==================== الخطوة 2: اختيار الوقت ====================
function Step2SelectSubSlot({
  dayOfWeek,
  targetDate,
  currentUserUid,
  onSubSlotSelect,
  onBack,
}: {
  dayOfWeek: number;
  targetDate: string;
  currentUserUid: string;
  onSubSlotSelect: (subSlot: SubSlot) => void;
  onBack: () => void;
}) {
  const [parentSlots, setParentSlots] = useState<ScheduleSlot[]>([]);
  const [bookings, setBookings] = useState<ExistingBooking[]>([]);

  useEffect(() => {
    const slotsRef = ref(db, `appointments/schedule/${dayOfWeek}/slots`);
    const unsubscribe = onValue(slotsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entries = data as Record<string, ScheduleSlot>;
        const list = Object.entries(entries).map(([id, val]) => ({
          id,
          startTime: val.startTime,
          endTime: val.endTime,
          location: val.location,
          bookedCount: val.bookedCount || 0,
        }));
        list.sort((a, b) => a.startTime.localeCompare(b.startTime));
        setParentSlots(list);
      } else {
        setParentSlots([]);
      }
    });
    return () => unsubscribe();
  }, [dayOfWeek]);

  useEffect(() => {
    const bookingsRef = ref(db, "appointments/bookings");
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entries = data as Record<string, ExistingBooking>;
        const list = Object.entries(entries)
          .map(([id, val]) => ({ ...val, id }))
          .filter((b) => b.dayOfWeek === dayOfWeek && b.date === targetDate && b.status !== "cancelled");
        setBookings(list);
      } else {
        setBookings([]);
      }
    });
    return () => unsubscribe();
  }, [dayOfWeek, targetDate]);

  const subSlots: SubSlot[] = useMemo(() => {
    const result: SubSlot[] = [];
    parentSlots.forEach((slot) => {
      const chunks = splitInto15MinSlots(slot);
      chunks.forEach((chunk) => {
        const existing = bookings.find(
          (b) => b.startTime === chunk.time && b.endTime === chunk.endTime && b.slotId === slot.id
        );
        result.push({
          time: chunk.time,
          endTime: chunk.endTime,
          parentSlotId: slot.id,
          location: slot.location,
          bookedBy: existing ? existing.studentName : null,
          bookedByUid: existing ? existing.studentId : null,
          bookingId: existing ? existing.id : null,
        });
      });
    });
    return result;
  }, [parentSlots, bookings]);

  const availableCount = subSlots.filter((s) => !s.bookedBy).length;

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 bg-slate-800/40 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 font-quran flex items-center gap-3">
            <span className="text-gold">⏰</span> اختر التوقيت
          </h2>
          <div className="flex flex-wrap gap-4 text-sm font-sans text-slate-400">
            <span className="flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-lg border border-slate-700">
              <Calendar className="w-4 h-4 text-gold" /> {DAYS_AR[dayOfWeek]}، {targetDate}
            </span>
            <span className="flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-lg border border-slate-700">
              <User className="w-4 h-4 text-emerald-400" /> {availableCount} مقعد متاح
            </span>
          </div>
        </div>
        <button
          onClick={onBack}
          className="mt-4 md:mt-0 px-6 py-2 rounded-full border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700 transition-all font-sans text-sm"
        >
          تغيير اليوم
        </button>
      </div>

      {subSlots.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
          <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl text-slate-400 font-sans">عذراً، لا توجد فترات متاحة لهذا اليوم</h3>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {subSlots.map((sub, idx) => {
            const isBooked = !!sub.bookedBy;
            const isMyBooking = sub.bookedByUid === currentUserUid;

            return (
              <button
                key={idx}
                onClick={() => !isBooked && onSubSlotSelect(sub)}
                disabled={isBooked}
                className={`
                  relative group p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2
                  ${isBooked
                    ? isMyBooking
                      ? "border-blue-500/50 bg-blue-900/10 opacity-100"
                      : "border-slate-800 bg-slate-900/50 opacity-50 cursor-not-allowed grayscale"
                    : "border-slate-700/50 bg-slate-800/40 hover:bg-slate-800 hover:border-gold hover:shadow-lg hover:shadow-gold/10 hover:-translate-y-1"
                  }
                `}
              >
                <div className={`text-xl font-bold font-sans tracking-wider ${isBooked ? (isMyBooking ? "text-blue-400" : "text-slate-500") : "text-white group-hover:text-gold"}`}>
                  {sub.time}
                </div>
                <div className="text-xs text-slate-500 font-sans bg-slate-900/50 px-2 py-1 rounded">
                  إلى {sub.endTime}
                </div>
                <div className="mt-2">
                  {isBooked ? (
                    isMyBooking ? (
                      <span className="text-xs font-bold text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <User className="w-3 h-3" /> حجزك
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> محجوز
                      </span>
                    )
                  ) : (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-900/10 px-2 py-0.5 rounded-full flex items-center gap-1 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                      <Check className="w-3 h-3" /> متاح
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== الخطوة 3: اختيار الورد والتحقق ====================
interface WirdOption {
  date: string;
  surahName: string;
  startAyah: number;
  endAyah: number;
  repetitions: number;
  isHoliday: boolean;
  note?: string;
  surahId: number;
}

function Step3SelectWird({
  availableWirds,
  selectedWirdDate,
  selectedWirdInfo,
  onWirdSelect,
  onConfirm,
  onBack,
}: {
  availableWirds: WirdOption[];
  selectedWirdDate: string;
  selectedWirdInfo: {
    wird: WirdOption;
    progress: number;
    target: number;
    isCompleted: boolean;
    percentage: number;
    remaining: number;
  } | null;
  onWirdSelect: (date: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-3xl mx-auto">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700 transition-all font-sans text-sm mb-6"
        >
          <ArrowRight className="w-4 h-4" /> تغيير الوقت
        </button>

        <h2 className="text-3xl font-bold text-white mb-2 font-quran flex items-center gap-3">
          <span className="text-gold">📖</span> اختر الورد الذي تريد تسميعه
        </h2>
        <p className="text-slate-400 font-sans text-sm">
          يجب أن تكون قد أكملت <span className="text-gold font-bold">100 تكرار</span> على الأقل للورد المختار قبل الحجز.
        </p>
      </div>

      {/* قائمة الأوراد */}
      <div className="space-y-3 mb-8">
        {availableWirds.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
            <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-sans">لا توجد أوراد متاحة حالياً</p>
          </div>
        ) : (
          availableWirds.map((wird) => {
            const isSelected = selectedWirdDate === wird.date;

            return (
              <button
                key={wird.date}
                onClick={() => onWirdSelect(wird.date)}
                className={`w-full p-4 md:p-5 rounded-2xl border-2 transition-all duration-200 text-right flex items-center justify-between gap-4 ${isSelected
                    ? "border-gold bg-gold/5 shadow-lg shadow-gold/5"
                    : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50"
                  }`}
              >
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold font-quran text-lg mb-1 ${isSelected ? "text-gold" : "text-white"}`}>
                    سورة {wird.surahName}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-sans">
                    <span>الآيات {wird.startAyah} - {wird.endAyah}</span>
                    <span>•</span>
                    <span>{wird.date}</span>
                    <span>•</span>
                    <span>الهدف: {wird.repetitions} تكرار</span>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? "border-gold bg-gold" : "border-slate-600"
                  }`}>
                  {isSelected && <Check className="w-4 h-4 text-black" />}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* حالة التحقق من التكرار */}
      {selectedWirdInfo && (
        <div className={`rounded-2xl border-2 p-6 mb-8 transition-all duration-300 ${selectedWirdInfo.isCompleted
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-red-500/30 bg-red-500/5"
          }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl shrink-0 ${selectedWirdInfo.isCompleted ? "bg-emerald-500/10" : "bg-red-500/10"
              }`}>
              {selectedWirdInfo.isCompleted ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              ) : (
                <XCircle className="w-6 h-6 text-red-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`font-bold font-quran text-lg mb-2 ${selectedWirdInfo.isCompleted ? "text-emerald-400" : "text-red-400"
                }`}>
                {selectedWirdInfo.isCompleted
                  ? "✅ أحسنت! أكملت تكرار هذا الورد"
                  : "⚠️ لم تكمل تكرار هذا الورد بعد"}
              </h3>
              <p className="text-slate-400 font-sans text-sm mb-4">
                {selectedWirdInfo.isCompleted
                  ? `أتممت ${selectedWirdInfo.progress} تكرار من أصل ${selectedWirdInfo.target}. يمكنك الآن حجز حصة التسميع.`
                  : `أكملت ${selectedWirdInfo.progress} تكرار فقط من أصل ${selectedWirdInfo.target}. يجب إكمال ${selectedWirdInfo.remaining} تكرار إضافي قبل الحجز.`}
              </p>

              {/* شريط التقدم */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="text-slate-400">
                    <span className="text-white font-bold">{selectedWirdInfo.progress}</span> / {selectedWirdInfo.target}
                  </span>
                  <span className={`font-bold ${selectedWirdInfo.isCompleted ? "text-emerald-400" : "text-red-400"}`}>
                    {selectedWirdInfo.percentage}%
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-900/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${selectedWirdInfo.isCompleted ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    style={{ width: `${selectedWirdInfo.percentage}%` }}
                  />
                </div>
              </div>

              {!selectedWirdInfo.isCompleted && (
                <p className="text-red-400/70 font-sans text-xs mt-3 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  اذهب إلى صفحة الورد اليومي لإكمال التكرار أولاً، ثم عد للحجز.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* زر المتابعة */}
      <button
        onClick={onConfirm}
        disabled={!selectedWirdInfo?.isCompleted}
        className={`w-full py-4 rounded-2xl font-bold font-sans text-lg transition-all flex items-center justify-center gap-2 ${selectedWirdInfo?.isCompleted
            ? "bg-gradient-to-r from-gold to-amber-500 text-black hover:shadow-lg hover:shadow-gold/20 hover:scale-[1.01] active:scale-[0.99]"
            : "bg-slate-800 text-slate-500 cursor-not-allowed"
          }`}
      >
        {selectedWirdInfo?.isCompleted ? (
          <>
            <Check className="w-5 h-5" /> متابعة التأكيد
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" /> أكمل التكرار أولاً
          </>
        )}
      </button>
    </div>
  );
}

// ==================== الخطوة 4: التأكيد النهائي ====================
function Step4Confirmation({
  selectedDate,
  selectedDay,
  selectedSubSlot,
  selectedWirdInfo,
  notes,
  onNotesChange,
  onConfirm,
  onBack,
  isSubmitting,
}: {
  selectedDate: string;
  selectedDay: number;
  selectedSubSlot: SubSlot;
  selectedWirdInfo: {
    wird: WirdOption;
    progress: number;
    target: number;
    isCompleted: boolean;
    percentage: number;
    remaining: number;
  };
  notes: string;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-2xl mx-auto">
      <div className="relative bg-slate-800/40 opacity-80 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="h-2 bg-gradient-to-r from-gold via-amber-400 to-gold w-full"></div>

        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-gold/20">
              <BookOpen className="w-8 h-8 text-gold" />
            </div>
            <h2 className="text-2xl font-bold text-white font-quran mb-2">تأكيد حجز التسميع</h2>
            <p className="text-slate-400 font-sans text-sm">يرجى مراجعة التفاصيل قبل التأكيد النهائي</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-sans">التاريخ</p>
                <p className="text-sm font-bold text-white font-sans">{DAYS_AR[selectedDay]}، {selectedDate}</p>
              </div>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                <Clock className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-sans">الوقت</p>
                <p className="text-sm font-bold text-white font-sans">{selectedSubSlot.time} - {selectedSubSlot.endTime}</p>
              </div>
            </div>
          </div>

          {/* الورد المختار */}
          <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20 mb-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-sans">الورد</p>
              <p className="text-sm font-bold text-emerald-400 font-quran">
                سورة {selectedWirdInfo.wird.surahName} ({selectedWirdInfo.wird.startAyah}-{selectedWirdInfo.wird.endAyah})
              </p>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                ✅ أكملت {selectedWirdInfo.progress} تكرار
              </p>
            </div>
          </div>

          {/* ملاحظات */}
          <div className="group mb-4">
            <label className="block text-sm font-medium text-slate-400 mb-2 font-sans">
              📝 ملاحظات إضافية (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="هل لديك أي ملاحظات للشيخ؟"
              className="w-full px-5 py-4 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all text-base font-sans h-24 resize-none"
            ></textarea>
          </div>
        </div>

        {/* Ticket Perforation */}
        <div className="relative flex items-center justify-between px-4">
          <div className="w-6 h-6 bg-[#0a0f1c] rounded-full -ml-3"></div>
          <div className="flex-1 border-t-2 border-dashed border-slate-700/50 mx-2"></div>
          <div className="w-6 h-6 bg-[#0a0f1c] rounded-full -mr-3"></div>
        </div>

        {/* Actions Footer */}
        <div className="p-8 bg-slate-900/30">
          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="px-6 py-4 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-all font-sans"
            >
              تعديل
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className={`flex-1 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 font-sans shadow-lg
                ${!isSubmitting
                  ? "bg-gradient-to-r from-gold to-amber-500 text-black hover:shadow-gold/20 hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed grayscale"
                }
              `}
            >
              {isSubmitting ? (
                <span>جاري الحجز...</span>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  تأكيد الحجز الآن
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
