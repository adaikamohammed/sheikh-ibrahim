"use client";

import { useState, useEffect, useMemo } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { db } from "@/lib/firebase";
import { ref, onValue, push, set, runTransaction } from "firebase/database";
import {
  Calendar,
  Clock,
  ChevronRight,
  Check,
  AlertCircle,
  BookOpen,
  Lock,
  User,
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
  time: string;       // "15:00"
  endTime: string;    // "15:15"
  parentSlotId: string;
  location: string;
  bookedBy: string | null;   // اسم الطالب أو null
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

  const [step, setStep] = useState(1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSubSlot, setSelectedSubSlot] = useState<SubSlot | null>(null);
  const [surahName, setSurahName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    if (!selectedSubSlot || !surahName || !selectedDate) {
      alert("يرجى ملء اسم السورة");
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingsRef = ref(db, "appointments/bookings");
      const newRef = push(bookingsRef);
      const bookingId = newRef.key!;

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
        surahName,
        notes: notes || "",
        status: "pending",
        createdAt: Date.now(),
      });

      // زيادة عدد الحجوزات بشكل ذري
      const countRef = ref(db, `appointments/schedule/${selectedDay}/slots/${selectedSubSlot.parentSlotId}/bookedCount`);
      await runTransaction(countRef, (currentCount) => {
        return (currentCount || 0) + 1;
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
          <p className="text-slate-500 mb-8 font-sans text-sm">سيتم تأكيد موعدك من قبل الشيخ.</p>
          <button
            onClick={() => {
              setSubmitted(false);
              setStep(1);
              setSelectedDay(null);
              setSelectedDate("");
              setSelectedSubSlot(null);
              setSurahName("");
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
    <div className="min-h-screen bg-background p-4 md:p-6 pb-28 md:pb-6">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-primary mb-2 font-quran">📅 احجز حصة تسميع</h1>
        <p className="text-slate-400 font-sans">
          اختر فترة 15 دقيقة لعرض محفوظك على الشيخ
        </p>
      </div>

      {/* شريط التقدم */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= s
                  ? "bg-gradient-to-r from-gold to-emerald-500 text-black"
                  : "bg-slate-700 text-slate-400"
                  }`}
              >
                {s === 1 && "📅"}
                {s === 2 && "⏰"}
                {s === 3 && "✅"}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-1 mx-2 transition-all ${step > s ? "bg-gradient-to-r from-gold to-emerald-500" : "bg-slate-700"}`}></div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm font-semibold font-sans">
          <span className={step === 1 ? "text-primary" : "text-slate-400"}>اختيار اليوم</span>
          <span className={step === 2 ? "text-primary" : "text-slate-400"}>اختيار الوقت</span>
          <span className={step === 3 ? "text-primary" : "text-slate-400"}>التأكيد</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
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

        {step === 3 && selectedSubSlot && selectedDay !== null && (
          <Step3Confirmation
            selectedDate={selectedDate}
            selectedDay={selectedDay}
            selectedSubSlot={selectedSubSlot}
            surahName={surahName}
            notes={notes}
            onSurahNameChange={setSurahName}
            onNotesChange={setNotes}
            onConfirm={handleBooking}
            onBack={() => setStep(2)}
            isSubmitting={isSubmitting}
          />
        )}
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
    <div className="glass-panel p-5 md:p-8 rounded-2xl border border-card-border">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-6 font-quran">📅 اختر اليوم</h2>
      <p className="text-slate-400 text-sm mb-6 font-sans">اختر يوم الأسبوع الذي يناسبك للتسميع.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DAYS_AR.map((day, index) => {
          const slotCount = schedule[index] || 0;
          const hasSlots = slotCount > 0;

          return (
            <button
              key={index}
              onClick={() => hasSlots && onDaySelect(index)}
              disabled={!hasSlots}
              className={`p-6 rounded-xl border-2 transition-all text-start ${hasSlots
                ? "border-card-border hover:border-gold/50 bg-slate-800/30 cursor-pointer hover:shadow-lg hover:shadow-gold/5"
                : "border-slate-800/30 bg-slate-900/20 opacity-40 cursor-not-allowed"
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-white font-quran">{day}</p>
                  <p className="text-sm text-slate-400 font-sans mt-1">
                    {hasSlots ? `${slotCount} فترة متاحة` : "لا توجد فترات"}
                  </p>
                </div>
                {hasSlots && (
                  <div className="flex items-center text-gold">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ==================== الخطوة 2: اختيار فترة 15 دقيقة ====================
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

  // قراءة الفترات الكبيرة
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

  // قراءة الحجوزات الموجودة لنفس اليوم والتاريخ (في الوقت الفعلي)
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

  // بناء الشرائح مع حالة الحجز
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
    <div className="glass-panel p-5 md:p-8 rounded-2xl border border-card-border">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-2 font-quran">⏰ اختر فترة التسميع</h2>
      <p className="text-slate-400 mb-1 font-sans">يوم {DAYS_AR[dayOfWeek]} • {targetDate}</p>
      <p className="text-sm text-slate-500 mb-6 font-sans">
        كل فترة <span className="text-gold font-bold">15 دقيقة</span> • {availableCount} فترة متاحة من {subSlots.length}
      </p>

      {subSlots.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400 font-sans">لا توجد فترات متاحة</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {subSlots.map((sub, idx) => {
            const isBooked = !!sub.bookedBy;
            const isMyBooking = sub.bookedByUid === currentUserUid;

            return (
              <button
                key={idx}
                onClick={() => !isBooked && onSubSlotSelect(sub)}
                disabled={isBooked}
                className={`p-4 rounded-xl border-2 transition-all text-center ${isBooked
                    ? isMyBooking
                      ? "border-blue-500/30 bg-blue-500/10 cursor-not-allowed"
                      : "border-red-500/20 bg-red-500/5 cursor-not-allowed opacity-70"
                    : "border-card-border hover:border-gold/50 bg-slate-800/30 cursor-pointer hover:shadow-lg hover:shadow-gold/5 active:scale-95"
                  }`}
              >
                <p className={`text-lg font-bold font-sans mb-1 ${isBooked ? (isMyBooking ? "text-blue-400" : "text-red-400/70") : "text-white"
                  }`}>
                  {sub.time}
                </p>
                <p className="text-[11px] text-slate-500 font-sans mb-2">
                  إلى {sub.endTime}
                </p>

                {isBooked ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <Lock className="w-3 h-3 text-red-400/70" />
                    <span className={`text-[11px] font-bold truncate ${isMyBooking ? "text-blue-400" : "text-red-400/70"}`}>
                      {isMyBooking ? "حجزك" : sub.bookedBy}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-[11px] font-bold text-emerald-500">متاح</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-3 items-center justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors font-sans"
        >
          ← رجوع
        </button>
        <div className="flex gap-4 text-xs font-sans text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40 inline-block"></span> متاح</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/20 border border-red-500/40 inline-block"></span> محجوز</span>
        </div>
      </div>
    </div>
  );
}

// ==================== الخطوة 3: التأكيد ====================
function Step3Confirmation({
  selectedDate,
  selectedDay,
  selectedSubSlot,
  surahName,
  notes,
  onSurahNameChange,
  onNotesChange,
  onConfirm,
  onBack,
  isSubmitting,
}: {
  selectedDate: string;
  selectedDay: number;
  selectedSubSlot: SubSlot;
  surahName: string;
  notes: string;
  onSurahNameChange: (name: string) => void;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 md:p-8 rounded-2xl border border-card-border">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-6 font-quran">✅ تأكيد الحجز</h2>

        <div className="space-y-4 mb-8">
          {/* التاريخ */}
          <div className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-gold" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-sans">اليوم والتاريخ</p>
              <p className="text-lg font-bold text-white font-sans">
                {DAYS_AR[selectedDay]} • {selectedDate}
              </p>
            </div>
          </div>

          {/* الوقت */}
          <div className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-gold" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-sans">فترة التسميع</p>
              <p className="text-lg font-bold text-white font-sans">
                {selectedSubSlot.time} - {selectedSubSlot.endTime}
                <span className="text-sm text-gold ms-2 font-quran">(15 دقيقة)</span>
              </p>
              <p className="text-sm text-slate-400 font-sans">
                {LOCATIONS_MAP[selectedSubSlot.location] || selectedSubSlot.location}
              </p>
            </div>
          </div>
        </div>

        {/* اسم السورة */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-300 mb-3 font-sans">
            <BookOpen className="inline-block me-2 w-4 h-4" />
            ما ستعرضه على الشيخ
          </label>
          <input
            type="text"
            value={surahName}
            onChange={(e) => onSurahNameChange(e.target.value)}
            placeholder="مثال: سورة الشعراء من الآية 1 إلى 20"
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-base md:text-lg font-sans"
          />
        </div>

        {/* ملاحظات */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-slate-300 mb-3 font-sans">
            📝 ملاحظاتك (اختياري)
          </label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="أضف أي ملاحظات..."
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-base font-sans"
            rows={3}
          ></textarea>
        </div>
      </div>

      {/* الأزرار */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors font-sans"
        >
          ← رجوع
        </button>
        <button
          onClick={onConfirm}
          disabled={!surahName.trim() || isSubmitting}
          className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 font-sans ${surahName.trim() && !isSubmitting
            ? "bg-gradient-to-r from-gold to-emerald-500 text-black hover:shadow-lg hover:shadow-gold/50"
            : "bg-slate-700 text-slate-400 cursor-not-allowed"
            }`}
        >
          {isSubmitting ? (
            <span>جاري الحجز...</span>
          ) : (
            <>
              <Check className="w-4 h-4" />
              تأكيد الحجز
            </>
          )}
        </button>
      </div>
    </div>
  );
}
