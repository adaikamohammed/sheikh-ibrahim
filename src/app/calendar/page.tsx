"use client";

import { useState, useMemo } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react";
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
  const { role } = useRealtime();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [assignments, setAssignments] = useState<Record<string, WirdAssignment>>({});

  // حالة النموذج
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [formData, setFormData] = useState({
    surahId: 1,
    startAyah: 1,
    endAyah: 1,
    targetRepetitions: 5,
    isHoliday: false,
    note: "",
  });

  const [error, setError] = useState("");
  const [suggestedStartAyah, setSuggestedStartAyah] = useState<number | null>(null);

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

  // إنشاء شبكة التقويم
  const calendarGrid = useMemo(
    () => generateCalendarGrid(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  // الشهر واللغة
  const monthName = format(new Date(currentYear, currentMonth - 1), "MMMM", {
    locale: ar,
  });

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
      targetRepetitions: 5,
      isHoliday: false,
      note: "",
    });

    setShowModal(true);
  };

  // إضافة ورد جديد
  const handleAddWird = () => {
    if (!selectedDate) {
      setError("يرجى اختيار تاريخ");
      return;
    }

    if (formData.isHoliday) {
      // إذا كانت يوم عطلة
      const wird: WirdAssignment = {
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
      setAssignments({ ...assignments, [selectedDate]: wird });
    } else {
      // ورد عادي
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
        return;
      }

      setAssignments({ ...assignments, [selectedDate]: result.data! });
    }

    // إعادة تعيين النموذج
    setShowModal(false);
    setFormData({
      surahId: 1,
      startAyah: 1,
      endAyah: 1,
      targetRepetitions: 5,
      isHoliday: false,
      note: "",
    });
    setSelectedDate("");
  };

  // حذف ورد
  const handleDeleteWird = (date: string) => {
    const newAssignments = { ...assignments };
    delete newAssignments[date];
    setAssignments(newAssignments);
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

  return (
    <div className="min-h-screen bg-background text-white pb-32 md:pb-8">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2"></div>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 relative z-10">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Calendar className="w-8 h-8 text-gold" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-quran">التقويم والأوراد</h1>
              <p className="text-slate-400 text-sm mt-1">
                حدد الأوراد اليومية والعطل الأسبوعية
              </p>
            </div>
          </div>
        </header>

        {/* الإحصائيات الشهرية */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="glass-panel rounded-lg p-4 text-center border border-gold/20">
            <p className="text-slate-400 text-xs md:text-sm mb-2">إجمالي الأوراد</p>
            <p className="text-2xl md:text-3xl font-bold text-gold">{monthStats.normalWirds}</p>
          </div>
          <div className="glass-panel rounded-lg p-4 text-center border border-emerald-500/20">
            <p className="text-slate-400 text-xs md:text-sm mb-2">أيام العطل</p>
            <p className="text-2xl md:text-3xl font-bold text-emerald-500">{monthStats.holidays}</p>
          </div>
          <div className="glass-panel rounded-lg p-4 text-center border border-blue-500/20">
            <p className="text-slate-400 text-xs md:text-sm mb-2">المجموع</p>
            <p className="text-2xl md:text-3xl font-bold text-blue-500">{monthStats.totalWirds}</p>
          </div>
        </div>

        {/* التقويم */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 border border-card-border space-y-6">
          {/* رأس التقويم */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="الشهر السابق"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold font-quran mb-1">
                {monthName} {currentYear}
              </h2>
              <p className="text-sm text-slate-400">
                {monthStats.normalWirds} ورد | {monthStats.holidays} عطلة
              </p>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="الشهر التالي"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>

          {/* أيام الأسبوع */}
          <div className="grid grid-cols-7 gap-2 text-center">
            {["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map(
              (day) => (
                <div key={day} className="text-xs md:text-sm font-bold text-gold py-3 border-b border-gold/20">
                  {day}
                </div>
              )
            )}
          </div>

          {/* أيام الشهر */}
          <div className="grid grid-cols-7 gap-2">
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

                if (wird) {
                  if (wird.isHoliday) {
                    displayText = "عطلة";
                    displayColor = "text-emerald-400";
                    bgColor = "bg-emerald-500/15 border-emerald-500/50 hover:border-emerald-500";
                  } else {
                    const surah = getSurahInfo(wird.surahId);
                    displayText = `${wird.startAyah}-${wird.endAyah}`;
                    displayColor = "text-gold";
                    bgColor = "bg-gold/10 border-gold/50 hover:border-gold";
                  }
                } else {
                  bgColor = "bg-slate-900/30 border-slate-700/50 hover:border-slate-600";
                }

                return (
                  <div
                    key={dateStr}
                    className={`aspect-square rounded-lg border-2 transition-all cursor-pointer flex flex-col items-center justify-center p-2 relative group ${bgColor} ${
                      isToday ? "ring-2 ring-offset-2 ring-primary shadow-lg" : ""
                    }`}
                    onClick={() => handleDayClick(day)}
                  >
                    {/* رقم اليوم */}
                    <span className={`font-bold text-sm md:text-base ${isToday ? "text-primary" : ""}`}>
                      {day}
                    </span>

                    {/* معلومات الورد */}
                    {wird && (
                      <div className="mt-1.5 text-center w-full">
                        {wird.isHoliday ? (
                          <div className="text-emerald-400 text-xs md:text-sm font-bold">
                            🌟
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
                        className="absolute -top-1.5 -left-1.5 bg-red-500 hover:bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        title="حذف"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}

                    {/* زر الإضافة للأيام الفارغة */}
                    {!wird && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-sm">
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-panel rounded-2xl p-6 md:p-8 border border-card-border max-w-lg w-full space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* الرأس */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                <div>
                  <h3 className="text-lg md:text-xl font-bold">
                    {selectedDate && getDayNameAr(selectedDate)}
                  </h3>
                  <p className="text-slate-400 text-sm">
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
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm flex items-start space-x-3 space-x-reverse">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              {/* اقتراح ذكي */}
              {suggestedStartAyah !== null && (
                <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 flex items-start space-x-3 space-x-reverse">
                  <div className="text-blue-400 text-xl flex-shrink-0">💡</div>
                  <div className="text-sm text-blue-300">
                    <p className="font-bold mb-1">اقتراح ذكي:</p>
                    <p>
                      تابع من <span className="text-blue-200 font-bold text-base">الآية {suggestedStartAyah}</span>
                    </p>
                    <p className="text-blue-400 text-xs mt-1">
                      (تلقائياً بعد اليوم السابق)
                    </p>
                  </div>
                </div>
              )}

              {/* خيار يوم عطلة */}
              <div className="space-y-3 pb-4 border-b border-slate-700">
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
                  <span className="font-semibold text-base group-hover:text-gold transition-colors">
                    🌟 هذا يوم عطلة
                  </span>
                </label>
              </div>

              {!formData.isHoliday && (
                <>
                  {/* اختيار السورة */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-300">السورة</label>
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
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-gold transition-colors"
                    >
                      {QURAN_SURAHS.map((surah) => (
                        <option key={surah.id} value={surah.id}>
                          {surah.arabicName} ({surah.totalAyahs} آية)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* الآيات */}
                  <div className="grid grid-cols-2 gap-4">
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
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-gold transition-colors text-center text-lg font-bold"
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
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-gold transition-colors text-center text-lg font-bold"
                      />
                    </div>
                  </div>

                  {/* معلومات الآيات */}
                  {formData.startAyah <= formData.endAyah && (
                    <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3 text-sm text-slate-300">
                      📊 إجمالي الآيات: <span className="font-bold text-gold">{formData.endAyah - formData.startAyah + 1}</span> آية
                    </div>
                  )}

                  {/* عدد التكرارات */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-300">عدد التكرارات</label>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <button
                        onClick={() =>
                          setFormData({
                            ...formData,
                            targetRepetitions: Math.max(1, formData.targetRepetitions - 1),
                          })
                        }
                        className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 hover:border-gold transition-colors flex items-center justify-center"
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
                        className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-gold transition-colors text-center text-lg font-bold"
                      />
                      <button
                        onClick={() =>
                          setFormData({
                            ...formData,
                            targetRepetitions: formData.targetRepetitions + 1,
                          })
                        }
                        className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 hover:border-gold transition-colors flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ملاحظات */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-300">ملاحظات (اختياري)</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-gold transition-colors h-20 resize-none placeholder-slate-500"
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>

              {/* الأزرار */}
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSuggestedStartAyah(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors font-semibold border border-slate-700"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleAddWird}
                  className="flex-1 px-4 py-3 rounded-lg bg-gold hover:bg-gold/90 transition-colors font-bold text-black flex items-center justify-center space-x-2 space-x-reverse shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  <span>حفظ الورد</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
