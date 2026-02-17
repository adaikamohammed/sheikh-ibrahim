"use client";

import { useState, useMemo, useEffect } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { firestore } from "@/lib/firebase";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Save,
  Loader,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { collection, setDoc, doc, onSnapshot, deleteDoc } from "firebase/firestore";
import {
  generateCalendarGrid,
  getDayNameAr,
  createWirdAssignment,
  QURAN_SURAHS,
  formatWirdName,
  getWirdColor,
  dateToString,
  getNextWirdStartAyah,
  getNextDay,
  getPreviousDay,
  getSurahInfo,
} from "@/services/calendarService";
import { format, parse } from "date-fns";
import { ar } from "date-fns/locale";
import { WirdAssignment } from "@/types";

export default function CalendarPage() {
  const { role, currentUser } = useRealtime();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [assignments, setAssignments] = useState<Record<string, WirdAssignment>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // حالة النموذج
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [formData, setFormData] = useState({
    surahId: 26, // Default: Ash-Shu'ara (الشعراء)
    startAyah: 1,
    endAyah: 1,
    targetRepetitions: 100,
    isHoliday: false,
    note: "",
  });

  const [error, setError] = useState("");
  const [suggestedStartAyah, setSuggestedStartAyah] = useState<number | null>(null);

  // تحميل البيانات من LocalStorage عند تحميل المكون
  useEffect(() => {
    const savedAssignments = localStorage.getItem("wirdAssignments");
    if (savedAssignments) {
      try {
        setAssignments(JSON.parse(savedAssignments));
      } catch (err) {
        console.error("خطأ في تحميل البيانات المحفوظة:", err);
      }
    }

    // الاشتراك في تحديثات Firebase إذا كان المستخدم موجوداً
    if (currentUser?.uid && role === "sheikh") {
      const assignmentsRef = collection(firestore, "users", currentUser.uid, "wirdAssignments");
      const unsubscribe = onSnapshot(assignmentsRef, (snapshot) => {
        const fbAssignments: Record<string, WirdAssignment> = {};
        snapshot.forEach((doc) => {
          fbAssignments[doc.id] = doc.data() as WirdAssignment;
        });
        setAssignments(fbAssignments);
        setSyncStatus("saved");
        setTimeout(() => setSyncStatus("idle"), 2000);
      });

      return () => unsubscribe();
    }
  }, [currentUser?.uid, role]);

  // إنشاء شبكة التقويم
  const calendarGrid = useMemo(
    () => generateCalendarGrid(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  // الشهر واللغة
  const monthName = format(new Date(currentYear, currentMonth - 1), "MMMM", {
    locale: ar,
  });

  // حساب إحصائيات الشهر
  const monthStats = useMemo(() => {
    const wirds = Object.values(assignments).filter(
      (w) => w.date >= `${currentYear}-${String(currentMonth).padStart(2, "0")}-01` &&
             w.date < `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`
    );
    return {
      totalWirds: wirds.length,
      holidays: wirds.filter((w) => w.isHoliday).length,
      normalWirds: wirds.filter((w) => !w.isHoliday).length,
    };
  }, [assignments, currentMonth, currentYear]);

  if (role !== "sheikh") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto" />
          <p className="text-slate-400">هذه الصفحة مخصصة للشيخ فقط</p>
        </div>
      </div>
    );
  }

  // التعامل مع النقر على اليوم
  const handleDayClick = (day: number) => {
    const dateStr = dateToString(currentYear, currentMonth, day);
    const previousDay = getPreviousDay(dateStr);
    const previousWird = assignments[previousDay];

    setSelectedDate(dateStr);
    setError("");

    // النظام الذكي: اقترح الآية البدائية التالية
    let suggested: number | null = null;
    let suggestedSurah = formData.surahId;

    if (previousWird && !previousWird.isHoliday) {
      suggestedSurah = previousWird.surahId;
      const nextAyah = previousWird.endAyah + 1;
      const surahInfo = getSurahInfo(suggestedSurah);

      // تحقق من أن الآية لم تتجاوز نهاية السورة
      if (surahInfo && nextAyah <= surahInfo.totalAyahs) {
        suggested = nextAyah;
      }
    }

    setSuggestedStartAyah(suggested);

    // تحديث النموذج
    setFormData({
      surahId: suggestedSurah,
      startAyah: suggested || 1,
      endAyah: suggested || 1,
      targetRepetitions: 100,
      isHoliday: false,
      note: "",
    });

    setShowModal(true);
  };

  // إضافة ورد جديد
  const handleAddWird = async () => {
    if (!selectedDate) {
      setError("يرجى اختيار تاريخ");
      return;
    }

    setIsSaving(true);
    setSyncStatus("saving");

    try {
      let wird: WirdAssignment;

      if (formData.isHoliday) {
        wird = {
          id: `wird-holiday-${selectedDate}`,
          date: selectedDate,
          dayOfWeek: getDayNameAr(selectedDate),
          surahId: 0,
          surahName: "Holiday",
          arabicSurahName: "يوم عطلة",
          startAyah: 0,
          endAyah: 0,
          totalAyahs: 0,
          targetRepetitions: 0,
          isHoliday: true,
          note: formData.note,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      } else {
        const result = createWirdAssignment(
          selectedDate,
          formData.surahId,
          formData.startAyah,
          formData.endAyah,
          formData.targetRepetitions,
          false,
          formData.note
        );

        if (!result.success) {
          setError(result.error || "حدث خطأ");
          setSyncStatus("error");
          setIsSaving(false);
          return;
        }

        wird = result.data!;
      }

      // ✅ Optimistic Update: تحديث الواجهة فوراً
      const newAssignments = { ...assignments, [selectedDate]: wird };
      setAssignments(newAssignments);
      localStorage.setItem("wirdAssignments", JSON.stringify(newAssignments));
      setShowModal(false);
      setError("");

      // ✅ حفظ Firebase في الخلفية (بدون انتظار)
      if (currentUser?.uid && role === "sheikh") {
        const assignmentsRef = collection(firestore, "users", currentUser.uid, "wirdAssignments");
        setDoc(doc(assignmentsRef, selectedDate), wird).catch((err) => {
          console.error("خطأ في مزامنة Firebase:", err);
          setSyncStatus("error");
        });
      }

      setSyncStatus("saved");
      setTimeout(() => setSyncStatus("idle"), 1500);

      // إعادة تعيين النموذج
      setFormData({
        surahId: 26,
        startAyah: 1,
        endAyah: 1,
        targetRepetitions: 100,
        isHoliday: false,
        note: "",
      });
      setSelectedDate("");
    } catch (err) {
      console.error("خطأ في إنشاء الورد:", err);
      setError("خطأ في حفظ البيانات");
      setSyncStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  // حذف ورد
  const handleDeleteWird = async (date: string) => {
    try {
      setIsSaving(true);
      setSyncStatus("saving");

      const newAssignments = { ...assignments };
      delete newAssignments[date];
      setAssignments(newAssignments);

      // حفظ في LocalStorage
      localStorage.setItem("wirdAssignments", JSON.stringify(newAssignments));

      // حذف من Firebase
      if (currentUser?.uid && role === "sheikh") {
        const assignmentsRef = collection(firestore, "users", currentUser.uid, "wirdAssignments");
        await deleteDoc(doc(assignmentsRef, date));
      }

      setSyncStatus("saved");
      setTimeout(() => setSyncStatus("idle"), 2000);
    } catch (err) {
      console.error("خطأ في حذف الورد:", err);
      setSyncStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  // التنقل بين الأشهر
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-slate-950 to-background text-white pb-32 md:pb-8">
      {/* التأثيرات الخلفية */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-gold/10 to-transparent rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tl from-blue-500/5 to-transparent rounded-full blur-[150px] translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 relative z-10">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-gold to-emerald-500 rounded-xl blur-lg opacity-30"></div>
                <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 p-3 rounded-xl border border-gold/30">
                  <Calendar className="w-8 h-8 text-gold" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gold via-white to-emerald-400 bg-clip-text text-transparent">التقويم والأوراد</h1>
                <p className="text-slate-400 text-sm mt-1">
                  حدد الأوراد اليومية والعطل الأسبوعية وأدر خطة الحفظ
                </p>
              </div>
            </div>
            {/* مؤشر حالة المزامنة */}
            {syncStatus !== "idle" && (
              <div className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-xl text-sm font-semibold backdrop-blur-xl border transition-all ${
                syncStatus === "saving" ? "bg-blue-500/15 text-blue-300 border-blue-500/30" :
                syncStatus === "saved" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
                "bg-red-500/15 text-red-300 border-red-500/30"
              }`}>
                {syncStatus === "saving" && <Loader className="w-4 h-4 animate-spin" />}
                {syncStatus === "saved" && <CheckCircle2 className="w-4 h-4" />}
                {syncStatus === "error" && <AlertCircle className="w-4 h-4" />}
                <span>
                  {syncStatus === "saving" ? "جاري المزامنة..." :
                   syncStatus === "saved" ? "تم الحفظ" :
                   "خطأ في المزامنة"}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* الإحصائيات الشهرية */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* بطاقة الأوراد */}
          <div className="group relative overflow-hidden rounded-xl border border-gold/20 transition-all hover:border-gold/50 hover:shadow-lg hover:shadow-gold/20">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative glass-panel rounded-xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm font-semibold">إجمالي الأوراد</p>
                <div className="p-2 rounded-lg bg-gold/10 border border-gold/30">
                  <BookOpen className="w-5 h-5 text-gold" />
                </div>
              </div>
              <p className="text-3xl md:text-4xl font-bold text-gold">{monthStats.normalWirds}</p>
              <p className="text-xs text-slate-500">أوراد معتمدة هذا الشهر</p>
            </div>
          </div>

          {/* بطاقة العطل */}
          <div className="group relative overflow-hidden rounded-xl border border-emerald-500/20 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative glass-panel rounded-xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm font-semibold">أيام العطل</p>
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <p className="text-3xl md:text-4xl font-bold text-emerald-400">{monthStats.holidays}</p>
              <p className="text-xs text-slate-500">أيام راحة مجدولة</p>
            </div>
          </div>

          {/* بطاقة المجموع */}
          <div className="group relative overflow-hidden rounded-xl border border-blue-500/20 transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative glass-panel rounded-xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm font-semibold">المجموع</p>
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <p className="text-3xl md:text-4xl font-bold text-blue-400">{monthStats.totalWirds}</p>
              <p className="text-xs text-slate-500">إجمالي الأيام المجدولة</p>
            </div>
          </div>
        </div>

        {/* التقويم */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 border border-card-border space-y-6 relative overflow-hidden">
          {/* خلفية زخرفية */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-gold/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          {/* رأس التقويم */}
          <div className="flex items-center justify-between relative z-10">
            <button
              onClick={handlePrevMonth}
              className="p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 hover:border-gold/50 border border-slate-700 transition-all hover:shadow-lg hover:shadow-gold/10"
              title="الشهر السابق"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gold via-white to-emerald-300 bg-clip-text text-transparent mb-2">
                {monthName} {currentYear}
              </h2>
              <div className="flex items-center justify-center space-x-4 space-x-reverse text-sm text-slate-400">
                <span className="flex items-center space-x-1 space-x-reverse">
                  <BookOpen className="w-4 h-4 text-gold" />
                  <span>{monthStats.normalWirds} ورد</span>
                </span>
                <span className="text-slate-600">|</span>
                <span className="flex items-center space-x-1 space-x-reverse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{monthStats.holidays} عطلة</span>
                </span>
              </div>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 hover:border-gold/50 border border-slate-700 transition-all hover:shadow-lg hover:shadow-gold/10"
              title="الشهر التالي"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>

          {/* أيام الأسبوع */}
          <div className="grid grid-cols-7 gap-2 text-center relative z-10">
            {["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map(
              (day) => (
                <div key={day} className="text-xs md:text-sm font-bold text-gold bg-gradient-to-b from-gold/20 to-gold/5 py-4 rounded-lg border border-gold/30">
                  {day}
                </div>
              )
            )}
          </div>

          {/* أيام الشهر */}
          <div className="grid grid-cols-7 gap-2 relative z-10">
            {calendarGrid.map((week, weekIdx) =>
              week.map((day, dayIdx) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${weekIdx}-${dayIdx}`}
                      className="aspect-square bg-transparent"
                    ></div>
                  );
                }

                const dateStr = dateToString(currentYear, currentMonth, day);
                const wird = assignments[dateStr];
                const isToday =
                  new Date().toISOString().split("T")[0] === dateStr;

                // معلومات تفصيلية
                let displayText = "";
                let displayColor = "";
                let bgColor = "";
                let borderColor = "";
                let hoverColor = "";

                if (wird) {
                  if (wird.isHoliday) {
                    displayText = "عطلة";
                    displayColor = "text-emerald-300";
                    bgColor = "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10";
                    borderColor = "border-emerald-500/50";
                    hoverColor = "hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20";
                  } else {
                    const surah = getSurahInfo(wird.surahId);
                    displayText = `${wird.startAyah}-${wird.endAyah}`;
                    displayColor = "text-gold";
                    bgColor = "bg-gradient-to-br from-gold/20 to-gold/5";
                    borderColor = "border-gold/50";
                    hoverColor = "hover:border-gold hover:shadow-lg hover:shadow-gold/30";
                  }
                } else {
                  bgColor = "bg-slate-800/30 hover:bg-slate-800/50";
                  borderColor = "border-slate-700/50";
                  hoverColor = "hover:border-slate-600/50";
                }

                return (
                  <div
                    key={dateStr}
                    className={`aspect-square rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center p-2 relative group ${bgColor} ${borderColor} ${hoverColor} ${
                      isToday ? "ring-2 ring-offset-2 ring-gold shadow-lg shadow-gold/30" : ""
                    }`}
                    onClick={() => handleDayClick(day)}
                  >
                    {/* رقم اليوم */}
                    <span className={`font-bold text-sm md:text-base transition-colors ${isToday ? "text-gold" : "text-slate-200"}`}>
                      {day}
                    </span>

                    {/* معلومات الورد */}
                    {wird && (
                      <div className="mt-1.5 text-center w-full">
                        {wird.isHoliday ? (
                          <div className="text-emerald-300 text-xs md:text-sm font-bold">
                            ✓
                          </div>
                        ) : (
                          <>
                            <div className={`text-[10px] md:text-xs font-bold ${displayColor}`}>
                              {displayText}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              × {wird.targetRepetitions}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* زر الحذف */}
                    {wird && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWird(dateStr);
                        }}
                        className="absolute -top-1.5 -left-1.5 bg-red-500 hover:bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:shadow-red-500/50"
                        title="حذف"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}

                    {/* زر الإضافة للأيام الفارغة */}
                    {!wird && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20 backdrop-blur-sm">
                        <Plus className="w-4 h-4 md:w-5 md:h-5 text-slate-300" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* النموذج - Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="glass-panel rounded-2xl p-6 md:p-8 border border-card-border max-w-lg w-full space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl relative">
              {/* خلفية زخرفية في المودال */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-gold/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              {/* الرأس */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-700 relative z-10">
                <div>
                  <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-gold to-white bg-clip-text text-transparent">
                    {selectedDate && getDayNameAr(selectedDate)}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    {selectedDate &&
                      format(parse(selectedDate, "yyyy-MM-dd", new Date()), "d MMMM yyyy", {
                        locale: ar,
                      })}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSuggestedStartAyah(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="bg-red-500/15 border border-red-500/50 rounded-xl p-4 text-red-400 text-sm flex items-start space-x-3 space-x-reverse">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              {/* اقتراح ذكي */}
              {suggestedStartAyah !== null && (
                <div className="bg-gradient-to-r from-blue-500/20 to-blue-400/10 border border-blue-500/50 rounded-xl p-4 flex items-start space-x-3 space-x-reverse">
                  <div className="text-blue-300 text-xl flex-shrink-0">💡</div>
                  <div className="text-sm text-blue-200">
                    <p className="font-bold mb-1">اقتراح ذكي:</p>
                    <p>
                      تابع من <span className="text-blue-100 font-bold text-base">الآية {suggestedStartAyah}</span>
                    </p>
                    <p className="text-blue-300 text-xs mt-1">
                      (تلقائياً بعد اليوم السابق)
                    </p>
                  </div>
                </div>
              )}

              {/* خيار يوم عطلة */}
              <div className="space-y-3 pb-4 border-b border-slate-700 relative z-10">
                <label className="flex items-center space-x-3 space-x-reverse cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.isHoliday}
                    onChange={(e) => {
                      setFormData({ ...formData, isHoliday: e.target.checked });
                      setError("");
                    }}
                    className="w-5 h-5 accent-gold rounded cursor-pointer"
                  />
                  <span className="font-semibold text-base text-slate-300 group-hover:text-gold transition-colors">
                    ✓ هذا يوم عطلة
                  </span>
                </label>
              </div>

              {!formData.isHoliday && (
                <>
                  {/* اختيار السورة */}
                  <div className="space-y-3 relative z-10">
                    <label className="block text-sm font-bold text-slate-300 flex items-center space-x-2 space-x-reverse">
                      <BookOpen className="w-4 h-4 text-gold" />
                      <span>السورة</span>
                    </label>
                    <select
                      value={formData.surahId}
                      onChange={(e) => {
                        const surahId = parseInt(e.target.value);
                        const surah = getSurahInfo(surahId);
                        setFormData({
                          ...formData,
                          surahId,
                          endAyah: formData.startAyah,
                        });
                        setError("");
                      }}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                    >
                      {QURAN_SURAHS.map((surah) => (
                        <option key={surah.id} value={surah.id}>
                          {surah.arabicName} ({surah.totalAyahs} آية)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* الآيات */}
                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-300">من الآية</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.startAyah}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setFormData({
                            ...formData,
                            startAyah: val,
                            endAyah: Math.max(formData.endAyah, val),
                          });
                          setError("");
                        }}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all text-center text-lg font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-300">إلى الآية</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.endAyah}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setFormData({
                            ...formData,
                            endAyah: val,
                          });
                          setError("");
                        }}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all text-center text-lg font-bold"
                      />
                    </div>
                  </div>

                  {/* معلومات الآيات */}
                  {formData.startAyah <= formData.endAyah && (
                    <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-gold/30 rounded-lg p-4 text-sm text-slate-300 relative z-10">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="text-lg">📊</span>
                        <span>إجمالي الآيات: <span className="font-bold text-gold text-base">{formData.endAyah - formData.startAyah + 1}</span> آية</span>
                      </div>
                    </div>
                  )}

                  {/* عدد التكرارات */}
                  <div className="space-y-3 relative z-10">
                    <label className="block text-sm font-bold text-slate-300 flex items-center space-x-2 space-x-reverse">
                      <TrendingUp className="w-4 h-4 text-gold" />
                      <span>عدد التكرارات</span>
                    </label>
                    <div className="flex items-center space-x-3 space-x-reverse bg-slate-800/30 rounded-lg p-2 border border-slate-700">
                      <button
                        onClick={() =>
                          setFormData({
                            ...formData,
                            targetRepetitions: Math.max(1, formData.targetRepetitions - 1),
                          })
                        }
                        className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-gold transition-all flex items-center justify-center font-bold"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={formData.targetRepetitions}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            targetRepetitions: parseInt(e.target.value) || 1,
                          })
                        }
                        className="flex-1 bg-transparent border-0 p-3 text-white text-center text-lg font-bold focus:outline-none"
                      />
                      <button
                        onClick={() =>
                          setFormData({
                            ...formData,
                            targetRepetitions: formData.targetRepetitions + 1,
                          })
                        }
                        className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-gold transition-all flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ملاحظات */}
              <div className="space-y-3 relative z-10">
                <label className="block text-sm font-bold text-slate-300 flex items-center space-x-2 space-x-reverse">
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                  <span>ملاحظات (اختياري)</span>
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all h-20 resize-none placeholder-slate-500"
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>

              {/* الأزرار */}
              <div className="flex gap-3 pt-4 border-t border-slate-700 relative z-10">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSuggestedStartAyah(null);
                  }}
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors font-semibold border border-slate-700 disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleAddWird}
                  disabled={isSaving}
                  className={`flex-1 px-4 py-3 rounded-lg font-bold flex items-center justify-center space-x-2 space-x-reverse shadow-lg hover:shadow-xl transition-all border ${
                    isSaving
                      ? "bg-slate-600 opacity-50 cursor-not-allowed border-slate-600"
                      : syncStatus === "saved"
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-emerald-500/50 border-emerald-400/50 text-white"
                      : syncStatus === "error"
                      ? "bg-gradient-to-r from-red-500 to-red-600 hover:shadow-red-500/50 border-red-400/50 text-white"
                      : "bg-gradient-to-r from-gold to-emerald-400 hover:shadow-gold/50 border-gold/50 text-black"
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : syncStatus === "saved" ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>تم الحفظ</span>
                    </>
                  ) : syncStatus === "error" ? (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      <span>خطأ في الحفظ</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>حفظ الورد</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
