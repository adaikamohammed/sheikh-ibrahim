"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { db } from "@/lib/firebase";
import { ref, onValue, set, remove, push, update } from "firebase/database";
import {
  Clock, MapPin, Plus, Trash2, Calendar, AlertCircle,
  BookOpen, TrendingUp, CheckCircle2, XCircle, User
} from "lucide-react";

// ==================== أنواع البيانات ====================
interface ScheduleSlot {
  id: string;
  startTime: string;
  endTime: string;
  location: string;
  bookedCount: number;
}

interface Booking {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  slotId: string;
  startTime: string;
  endTime: string;
  location: string;
  surahName?: string;
  selectedWirdDate?: string;
  notes?: string;
  status: "pending" | "confirmed" | "completed" | "rejected" | "cancelled";
  createdAt: number;
  dayOfWeek?: number;
}

const LOCATIONS = [
  { id: "mosque", label: "🕌 المسجد" },
  { id: "prayer_room", label: "🙏 المصلى" },
  { id: "quran_school", label: "📚 المدرسة القرآنية" },
];

const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default function AppointmentsPage() {
  const { role } = useRealtime();
  const [activeTab, setActiveTab] = useState<"schedule" | "appointments" | "analytics">("schedule");
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);

  if (role !== "sheikh") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto" />
          <p className="text-slate-400">هذه الصفحة متاحة فقط للشيخ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white p-4 md:p-6 pb-28 md:pb-6">
      <div className="absolute top-0 end-0 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[150px] -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 start-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[150px] translate-y-1/2 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gold/20 rounded-xl blur-lg opacity-30"></div>
              <div className="relative glass-panel p-3 rounded-xl border border-gold/30">
                <Calendar className="w-8 h-8 text-gold" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-quran text-white">إدارة المواعيد</h1>
              <p className="text-slate-400 text-sm font-sans">حدد مواعيدك المتاحة وأدر حجوزات الطلاب</p>
            </div>
          </div>
        </header>

        {/* التبويبات */}
        <div className="flex gap-2 mb-8 md:mb-10 border-b border-card-border p-1.5 md:p-2 glass-panel rounded-xl overflow-x-auto scrollbar-hide">
          {[
            { id: "schedule" as const, label: "جدول المواعيد", icon: Calendar },
            { id: "appointments" as const, label: "الحجوزات", icon: Clock },
            { id: "analytics" as const, label: "الإحصائيات", icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 md:px-6 py-2.5 md:py-3 font-bold transition-all duration-200 flex items-center gap-2 rounded-lg whitespace-nowrap text-sm md:text-base ${activeTab === tab.id
                ? "bg-gold/10 text-gold shadow-lg shadow-gold/5 border border-gold/20"
                : "text-slate-400 hover:text-slate-300 hover:bg-white/5"
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "schedule" && (
          <ScheduleTab
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            showAddSlot={showAddSlot}
            setShowAddSlot={setShowAddSlot}
          />
        )}

        {activeTab === "appointments" && <AppointmentsTab />}

        {activeTab === "analytics" && <AnalyticsTab />}
      </div>
    </div>
  );
}

// ==================== تبويب الجدول ====================
function ScheduleTab({
  selectedDay,
  setSelectedDay,
  showAddSlot,
  setShowAddSlot,
}: {
  selectedDay: number;
  setSelectedDay: (day: number) => void;
  showAddSlot: boolean;
  setShowAddSlot: (show: boolean) => void;
}) {
  const [timeSlots, setTimeSlots] = useState<ScheduleSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [newSlot, setNewSlot] = useState({ startTime: "15:00", endTime: "17:00", location: "mosque" });

  // قراءة الفترات
  useEffect(() => {
    const slotsRef = ref(db, `appointments/schedule/${selectedDay}/slots`);
    const unsubscribe = onValue(slotsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entries = data as Record<string, ScheduleSlot>;
        const slots = Object.entries(entries).map(([id, val]) => ({
          id,
          startTime: val.startTime,
          endTime: val.endTime,
          location: val.location,
          bookedCount: val.bookedCount || 0,
        }));
        setTimeSlots(slots);
      } else {
        setTimeSlots([]);
      }
    });
    return () => unsubscribe();
  }, [selectedDay]);

  // قراءة الحجوزات لليوم المحدد
  useEffect(() => {
    const bookingsRef = ref(db, "appointments/bookings");
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entries = data as Record<string, Booking>;
        const list = Object.entries(entries)
          .map(([id, val]) => ({ ...val, id }))
          .filter((b) => b.dayOfWeek === selectedDay && b.status !== "cancelled");
        setBookings(list);
      } else {
        setBookings([]);
      }
    });
    return () => unsubscribe();
  }, [selectedDay]);

  const addSlot = useCallback(async () => {
    if (newSlot.startTime >= newSlot.endTime) {
      alert("وقت الانتهاء يجب أن يكون بعد وقت البداية");
      return;
    }
    const slotsRef = ref(db, `appointments/schedule/${selectedDay}/slots`);
    const newRef = push(slotsRef);
    await set(newRef, {
      startTime: newSlot.startTime,
      endTime: newSlot.endTime,
      location: newSlot.location,
      bookedCount: 0,
    });
    setNewSlot({ startTime: "15:00", endTime: "17:00", location: "mosque" });
    setShowAddSlot(false);
  }, [newSlot, selectedDay, setShowAddSlot]);

  const removeSlot = useCallback(async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الفترة؟")) return;
    await remove(ref(db, `appointments/schedule/${selectedDay}/slots/${id}`));
  }, [selectedDay]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
      {/* اختيار الأيام */}
      <div className="col-span-1">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3 mb-4 font-quran">
              <div className="p-2 bg-gold/10 rounded-lg">
                <Calendar className="w-5 h-5 text-gold" />
              </div>
              <span>أيام الأسبوع</span>
            </h2>
            <p className="text-slate-400 text-xs mb-4 font-sans">اختر اليوم لعرض وإدارة الفترات الزمنية</p>
          </div>
          <div className="space-y-2">
            {DAYS_AR.map((day, index) => (
              <button
                key={index}
                onClick={() => setSelectedDay(index)}
                className={`w-full px-5 py-3 rounded-xl transition-all duration-200 font-bold border-2 glass-panel ${selectedDay === index
                  ? "bg-gold/10 text-gold border-gold/50 shadow-lg shadow-gold/10 scale-105"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
                  }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* الفترات الزمنية */}
      <div className="col-span-1 lg:col-span-3">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3 mb-2 font-quran">
                <div className="p-2 bg-gold/10 rounded-lg">
                  <Clock className="w-6 h-6 text-gold" />
                </div>
                <span>الفترات الزمنية</span>
                <span className="text-sm text-slate-400 font-sans font-normal">({DAYS_AR[selectedDay]})</span>
              </h2>
              <p className="text-slate-400 text-sm font-sans">أضف فترات زمنية متعددة في نفس اليوم</p>
            </div>
            <button
              onClick={() => setShowAddSlot(!showAddSlot)}
              className="px-6 py-3 bg-gold text-black rounded-xl font-bold hover:shadow-lg hover:shadow-gold/20 transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة فترة
            </button>
          </div>

          {/* نموذج إضافة فترة */}
          {showAddSlot && (
            <div className="glass-panel rounded-2xl p-6 md:p-8 mb-8 border border-card-border">
              <h3 className="text-lg md:text-xl font-bold text-white mb-6 md:mb-8 flex items-center gap-3 font-quran">
                <div className="p-2 bg-gold/10 rounded-lg">
                  <Plus className="w-5 h-5 text-gold" />
                </div>
                <span>إضافة فترة زمنية جديدة</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gold" />
                    <span>وقت البداية</span>
                  </label>
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all font-sans"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gold" />
                    <span>وقت الانتهاء</span>
                  </label>
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all font-sans"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gold" />
                    <span>المكان</span>
                  </label>
                  <select
                    value={newSlot.location}
                    onChange={(e) => setNewSlot({ ...newSlot, location: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all font-sans"
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={addSlot}
                  className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>حفظ الفترة</span>
                </button>
                <button
                  onClick={() => setShowAddSlot(false)}
                  className="flex-1 px-6 py-3 bg-slate-800/50 text-white rounded-xl font-bold hover:bg-slate-700/50 transition-colors duration-200 border border-slate-700"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* عرض الشبكة اليومية */}
          {timeSlots.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center border border-card-border">
              <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400 font-sans">لا توجد فترات زمنية في هذا اليوم</p>
              <p className="text-slate-500 text-sm mt-2 font-sans">اضغط &quot;إضافة فترة&quot; لإنشاء فترة جديدة</p>
            </div>
          ) : (
            <DailyCalendarGrid timeSlots={timeSlots} bookings={bookings} removeSlot={removeSlot} />
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== تبويب الحجوزات ====================
function AppointmentsTab() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    const bookingsRef = ref(db, "appointments/bookings");
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entries = data as Record<string, Booking>;
        const list = Object.entries(entries).map(([id, val]) => ({
          ...val,
          id,
        }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setBookings(list);
      } else {
        setBookings([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const filteredBookings = useMemo(() => {
    return filterStatus === "all" ? bookings : bookings.filter((b) => b.status === filterStatus);
  }, [bookings, filterStatus]);

  const statusConfig: Record<string, { label: string; icon: string; color: string; bgColor: string }> = {
    pending: { label: "قيد الانتظار", icon: "⏳", color: "text-amber-500", bgColor: "bg-amber-500/10" },
    confirmed: { label: "مؤكد", icon: "✅", color: "text-blue-500", bgColor: "bg-blue-500/10" },
    completed: { label: "مكتمل — تم التسميع", icon: "🎉", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    rejected: { label: "مرفوض — يحتاج إعادة", icon: "🔁", color: "text-orange-500", bgColor: "bg-orange-500/10" },
    cancelled: { label: "ملغى", icon: "❌", color: "text-red-500", bgColor: "bg-red-500/10" },
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === "completed") {
      updates.completedAt = Date.now();
    }
    if (newStatus === "rejected") {
      updates.rejectedAt = Date.now();
    }
    await update(ref(db, `appointments/bookings/${bookingId}`), updates);
  };

  const deleteBooking = async (bookingId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الحجز؟")) return;
    await remove(ref(db, `appointments/bookings/${bookingId}`));
  };

  // عدد الحجوزات لكل حالة
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: bookings.length };
    bookings.forEach((b) => {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });
    return counts;
  }, [bookings]);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2 flex items-center gap-3 font-quran">
            <div className="p-2 bg-gold/10 rounded-lg">
              <Clock className="w-6 h-6 text-gold" />
            </div>
            <span>الحجوزات</span>
          </h2>
          <p className="text-slate-400 text-sm font-sans">عرض وإدارة جميع حجوزات الطلاب</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "confirmed", "completed", "rejected", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl font-bold transition-all border glass-panel text-sm flex items-center gap-2 ${filterStatus === status
                ? "bg-gold/10 text-gold border-gold/50 shadow-lg shadow-gold/10"
                : "text-slate-400 hover:text-white border-transparent hover:bg-white/5"
                }`}
            >
              {status === "all" ? "الكل" : statusConfig[status]?.label?.split("—")[0]?.trim()}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filterStatus === status ? "bg-gold/20 text-gold" : "bg-slate-700 text-slate-400"}`}>
                {statusCounts[status] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* قائمة الحجوزات */}
      {filteredBookings.length === 0 ? (
        <div className="glass-panel border border-card-border rounded-2xl p-16 text-center">
          <Calendar className="w-16 h-16 text-slate-500/40 mx-auto mb-6" />
          <p className="text-slate-400 font-bold text-lg">لا توجد حجوزات</p>
          <p className="text-slate-500 text-sm mt-2 font-sans">سيظهر الحجوزات هنا عندما يقوم الطلاب بالحجز</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookings.map((booking) => {
            const config = statusConfig[booking.status];
            return (
              <div
                key={booking.id}
                className={`glass-panel border rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-gold/5 transition-all ${booking.status === "rejected"
                    ? "border-orange-500/30"
                    : booking.status === "completed"
                      ? "border-emerald-500/30"
                      : "border-card-border hover:border-gold/50"
                  }`}
              >
                {/* شريط الحالة العلوي */}
                <div className={`h-1.5 ${booking.status === "completed" ? "bg-emerald-500" :
                    booking.status === "rejected" ? "bg-orange-500" :
                      booking.status === "confirmed" ? "bg-blue-500" :
                        booking.status === "pending" ? "bg-amber-500" :
                          "bg-red-500"
                  }`} />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-bold text-white text-lg font-quran">{booking.studentName}</p>
                      <p className={`text-xs font-bold mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${config?.bgColor} ${config?.color} w-fit`}>
                        {config?.icon} {config?.label}
                      </p>
                    </div>

                    {/* أزرار الإجراءات */}
                    <div className="flex gap-1.5">
                      {/* قيد الانتظار → تأكيد */}
                      {booking.status === "pending" && (
                        <button
                          title="تأكيد الحجز"
                          onClick={() => updateBookingStatus(booking.id, "confirmed")}
                          className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors border border-slate-700/50 hover:border-blue-500/50"
                        >
                          <CheckCircle2 className="w-4 h-4 text-blue-500" />
                        </button>
                      )}

                      {/* مؤكد → مكتمل (تم التسميع) أو مرفوض */}
                      {booking.status === "confirmed" && (
                        <>
                          <button
                            title="تم التسميع — مكتمل"
                            onClick={() => updateBookingStatus(booking.id, "completed")}
                            className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors border border-slate-700/50 hover:border-emerald-500/50"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </button>
                          <button
                            title="مرفوض — لم يحفظ جيداً"
                            onClick={() => updateBookingStatus(booking.id, "rejected")}
                            className="p-2 hover:bg-orange-500/10 rounded-lg transition-colors border border-slate-700/50 hover:border-orange-500/50"
                          >
                            <XCircle className="w-4 h-4 text-orange-500" />
                          </button>
                        </>
                      )}

                      {/* حذف */}
                      <button
                        title="حذف"
                        onClick={() => deleteBooking(booking.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors border border-slate-700/50 hover:border-red-500/50"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-sm font-sans">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>{booking.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>{booking.startTime} - {booking.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span>{LOCATIONS.find(l => l.id === booking.location)?.label || booking.location}</span>
                    </div>
                    {booking.surahName && (
                      <div className="flex items-center gap-2 text-slate-300 pt-2 border-t border-slate-700/50 mt-2">
                        <BookOpen className="w-4 h-4 text-gold" />
                        <span>{booking.surahName}</span>
                      </div>
                    )}
                    {booking.notes && (
                      <div className="text-xs text-slate-500 pt-2 border-t border-slate-700/50">
                        {booking.notes}
                      </div>
                    )}

                    {/* رسالة للمرفوض */}
                    {booking.status === "rejected" && (
                      <div className="mt-3 p-3 bg-orange-500/5 border border-orange-500/20 rounded-xl text-xs text-orange-400">
                        ⚠️ يحتاج الطالب إلى إعادة حفظ وتكرار الورد ثم حجز موعد جديد لهذا الورد.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== تبويب الإحصائيات ====================
function AnalyticsTab() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalSlots, setTotalSlots] = useState(0);

  useEffect(() => {
    const bookingsRef = ref(db, "appointments/bookings");
    const unsub1 = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entries = data as Record<string, Booking>;
        setBookings(Object.entries(entries).map(([id, val]) => ({ ...val, id })));
      } else {
        setBookings([]);
      }
    });

    const scheduleRef = ref(db, "appointments/schedule");
    const unsub2 = onValue(scheduleRef, (snapshot) => {
      const data = snapshot.val();
      let count = 0;
      if (data) {
        const schedule = data as Record<string, { slots?: Record<string, unknown> }>;
        Object.values(schedule).forEach((day) => {
          if (day?.slots) count += Object.keys(day.slots).length;
        });
      }
      setTotalSlots(count);
    });

    return () => { unsub1(); unsub2(); };
  }, []);

  const stats = useMemo(() => {
    const total = bookings.length;
    const completed = bookings.filter((b) => b.status === "completed").length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;
    const pending = bookings.filter((b) => b.status === "pending").length;
    const confirmed = bookings.filter((b) => b.status === "confirmed").length;
    const rejected = bookings.filter((b) => b.status === "rejected").length;
    const bookingRate = totalSlots > 0 ? Math.round((total / totalSlots) * 100) : 0;

    return { total, completed, cancelled, pending, confirmed, rejected, bookingRate };
  }, [bookings, totalSlots]);

  const statCards = [
    { label: "إجمالي المواعيد", value: stats.total, icon: "📅", color: "from-blue-500/20 to-blue-600/5 text-blue-500" },
    { label: "مكتمل (تم التسميع)", value: stats.completed, icon: "✅", color: "from-emerald-500/20 to-emerald-600/5 text-emerald-500" },
    { label: "مرفوض (يحتاج إعادة)", value: stats.rejected, icon: "🔁", color: "from-orange-500/20 to-orange-600/5 text-orange-500" },
    { label: "قيد الانتظار", value: stats.pending, icon: "⏳", color: "from-amber-500/20 to-amber-600/5 text-amber-500" },
    { label: "المؤكدة", value: stats.confirmed, icon: "✔️", color: "from-blue-500/20 to-blue-600/5 text-blue-400" },
    { label: "الملغاة", value: stats.cancelled, icon: "❌", color: "from-red-500/20 to-red-600/5 text-red-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white mb-2 flex items-center gap-3 font-quran">
          <div className="p-2 bg-gold/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-gold" />
          </div>
          <span>الإحصائيات والتقارير</span>
        </h2>
        <p className="text-slate-400 text-sm font-sans">عرض شامل لأداء الجدول والمواعيد</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`glass-panel bg-gradient-to-br ${card.color} rounded-2xl p-6 md:p-8 border border-white/5 hover:border-gold/30 transition-all hover:shadow-lg`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-slate-300 font-bold text-sm font-sans">{card.label}</h3>
              <span className="text-3xl">{card.icon}</span>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-white font-sans">{card.value}</p>
          </div>
        ))}
      </div>

      {/* رسم بياني */}
      {bookings.length > 0 && (
        <div className="glass-panel border border-card-border rounded-2xl p-8">
          <h3 className="text-xl font-bold text-white mb-8 font-quran">توزيع المواعيد</h3>
          <div className="space-y-6">
            {[
              { label: "مكتملة (تم التسميع)", value: stats.completed, color: "bg-emerald-500" },
              { label: "مرفوضة (تحتاج إعادة)", value: stats.rejected, color: "bg-orange-500" },
              { label: "مؤكدة", value: stats.confirmed, color: "bg-blue-500" },
              { label: "قيد الانتظار", value: stats.pending, color: "bg-amber-500" },
              { label: "ملغاة", value: stats.cancelled, color: "bg-red-500" },
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2 font-sans">
                  <span className="text-slate-300 font-bold text-sm">{item.label}</span>
                  <span className="text-white font-bold">{item.value}</span>
                </div>
                <div className="h-3 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/30">
                  <div
                    className={`h-full ${item.color} transition-all`}
                    style={{ width: stats.total > 0 ? `${(item.value / stats.total) * 100}%` : "0%" }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== شبكة يومية محسنة مع حجوزات ====================
function DailyCalendarGrid({
  timeSlots,
  bookings,
  removeSlot,
}: {
  timeSlots: ScheduleSlot[];
  bookings: Booking[];
  removeSlot: (id: string) => void;
}) {
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const { minHour, maxHour } = useMemo(() => {
    let earliest = 24 * 60;
    let latest = 0;
    timeSlots.forEach((slot) => {
      const start = timeToMinutes(slot.startTime);
      const end = timeToMinutes(slot.endTime);
      if (start < earliest) earliest = start;
      if (end > latest) latest = end;
    });
    const minH = Math.floor(earliest / 60);
    const maxH = Math.ceil(latest / 60);
    return { minHour: minH, maxHour: maxH };
  }, [timeSlots]);

  const HOUR_HEIGHT = 80;
  const totalHeight = (maxHour - minHour) * HOUR_HEIGHT;

  const SLOT_COLORS = [
    "from-blue-500/30 to-blue-600/20 border-blue-500/40",
    "from-emerald-500/30 to-emerald-600/20 border-emerald-500/40",
    "from-purple-500/30 to-purple-600/20 border-purple-500/40",
    "from-pink-500/30 to-pink-600/20 border-pink-500/40",
    "from-amber-500/30 to-amber-600/20 border-amber-500/40",
  ];

  // تجميع الحجوزات حسب الفترة الأم
  const bookingsBySlot = useMemo(() => {
    const grouped: Record<string, Booking[]> = {};
    bookings.forEach((b) => {
      if (!grouped[b.slotId]) grouped[b.slotId] = [];
      grouped[b.slotId].push(b);
    });
    return grouped;
  }, [bookings]);

  return (
    <div className="glass-panel border border-card-border rounded-2xl overflow-hidden">
      {/* الرأس */}
      <div className="flex items-center bg-slate-900/50 border-b border-card-border px-6 py-4">
        <div className="w-16 md:w-20 text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">الوقت</div>
        <div className="flex-1 text-sm font-bold text-slate-300 font-sans">الفترات الزمنية</div>
        <div className="flex items-center gap-4 text-xs font-sans">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500/60 inline-block"></span>
            محجوز
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-700/50 inline-block"></span>
            متاح
          </span>
        </div>
      </div>

      {/* الشبكة */}
      <div className="relative" style={{ height: `${totalHeight}px` }}>
        {/* خطوط الساعات */}
        {Array.from({ length: maxHour - minHour + 1 }).map((_, i) => {
          const hour = minHour + i;
          const top = i * HOUR_HEIGHT;
          return (
            <div key={hour} className="absolute w-full" style={{ top: `${top}px` }}>
              <div className="flex items-start">
                <div className="w-16 md:w-20 text-xs font-bold text-slate-500 font-sans pe-2 -translate-y-1/2 text-center">
                  {String(hour).padStart(2, "0")}:00
                </div>
                <div className="flex-1 border-t border-slate-700/30"></div>
              </div>
            </div>
          );
        })}

        {/* الفترات الزمنية مع مؤشرات الحجز */}
        {timeSlots.map((slot, index) => {
          const startMin = timeToMinutes(slot.startTime);
          const endMin = timeToMinutes(slot.endTime);
          const baseMin = minHour * 60;

          const topPx = ((startMin - baseMin) / 60) * HOUR_HEIGHT;
          const heightPx = ((endMin - startMin) / 60) * HOUR_HEIGHT;
          const colorClass = SLOT_COLORS[index % SLOT_COLORS.length];
          const location = LOCATIONS.find((l) => l.id === slot.location);

          // تقسيم الفترة إلى شرائح 15 دقيقة
          const subSlots: { time: string; endTime: string; booking: Booking | null }[] = [];
          for (let m = startMin; m + 15 <= endMin; m += 15) {
            const h1 = Math.floor(m / 60);
            const m1 = m % 60;
            const h2 = Math.floor((m + 15) / 60);
            const m2 = (m + 15) % 60;
            const t = `${String(h1).padStart(2, "0")}:${String(m1).padStart(2, "0")}`;
            const te = `${String(h2).padStart(2, "0")}:${String(m2).padStart(2, "0")}`;

            const slotBookings = bookingsBySlot[slot.id] || [];
            const matchingBooking = slotBookings.find(
              (b) => b.startTime === t && b.endTime === te
            ) || null;

            subSlots.push({ time: t, endTime: te, booking: matchingBooking });
          }

          const bookedCount = subSlots.filter((s) => s.booking).length;
          const totalSubSlots = subSlots.length;

          return (
            <div
              key={slot.id}
              className="absolute group/slot"
              style={{
                top: `${topPx}px`,
                height: `${heightPx}px`,
                left: "5rem",
                right: "0.5rem",
              }}
            >
              <div className={`relative w-full h-full bg-gradient-to-br ${colorClass} border rounded-xl transition-all duration-200 hover:shadow-lg cursor-pointer overflow-hidden`}>
                {/* شريط الحجوزات في الأعلى */}
                <div className="absolute top-0 left-0 right-0 h-auto flex flex-col z-10">
                  {subSlots.map((sub, idx) => {
                    const isBooked = !!sub.booking;
                    const subHeightPercent = 100 / totalSubSlots;
                    const statusColor = sub.booking?.status === "completed"
                      ? "bg-emerald-500/70"
                      : sub.booking?.status === "rejected"
                        ? "bg-orange-500/70"
                        : sub.booking?.status === "confirmed"
                          ? "bg-blue-500/70"
                          : sub.booking?.status === "pending"
                            ? "bg-amber-500/70"
                            : "bg-transparent";

                    return (
                      <div
                        key={idx}
                        className={`relative ${isBooked ? statusColor : ""} border-b border-white/5 last:border-b-0`}
                        style={{ height: `${subHeightPercent}%`, minHeight: `${(heightPx / totalSubSlots)}px` }}
                        title={isBooked ? `${sub.time}-${sub.endTime}: ${sub.booking!.studentName}` : `${sub.time}-${sub.endTime}: متاح`}
                      >
                        {isBooked && (
                          <div className="absolute inset-0 flex items-center px-2 text-[10px] font-bold text-white/90 truncate">
                            <User className="w-3 h-3 mr-1 shrink-0" />
                            <span className="truncate">{sub.booking!.studentName}</span>
                            <span className="mx-1 text-white/50">•</span>
                            <span className="text-white/60">{sub.time}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* معلومات الفترة (الطبقة السفلية) */}
                <div className="absolute bottom-0 left-0 right-0 p-3 z-10 bg-gradient-to-t from-black/40 to-transparent">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white font-bold text-sm font-sans">
                        {slot.startTime} - {slot.endTime}
                      </p>
                      <p className="text-xs text-white/70 font-sans">
                        {location?.label}
                      </p>
                    </div>
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/10 text-xs font-bold text-white flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {bookedCount}/{totalSubSlots}
                    </div>
                  </div>
                </div>

                {/* التحكم عند التمرير */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-xl opacity-0 group-hover/slot:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 z-20">
                  <button
                    onClick={() => removeSlot(slot.id)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-all border border-red-500/30"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
