/**
 * خدمة إدارة المواعيد والحجوزات
 * تدير توفرية الشيخ، الحجوزات، والمواعيد
 */

import {
  TimeSlot,
  SheikhAvailability,
  StudentAppointment,
  SheikhSchedule,
  DayStatistics,
  AppointmentRequest,
} from "@/types";
import { format, parse, addDays, startOfWeek, isBefore, parseISO, eachDayOfInterval, getDay } from "date-fns";
import { ar } from "date-fns/locale";

// ==================== أيام الأسبوع بالعربية ====================
const DAYS_OF_WEEK_AR = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

// ==================== الأماكن المتاحة ====================
export const LOCATIONS = {
  mosque: "المسجد",
  prayer_room: "المصلى",
  quran_school: "المدرسة القرآنية",
  other: "آخر",
};

// ==================== دوال الوقت الأساسية ====================

/**
 * تحويل الوقت من نص إلى دقائق من بداية اليوم
 * مثال: "15:30" -> 930
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * تحويل الدقائق إلى نص الوقت
 * مثال: 930 -> "15:30"
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/**
 * حساب مدة الفترة الزمنية بالدقائق
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return end - start;
}

/**
 * التحقق من تداخل فترتين زمنيتين
 */
export function hasTimeConflict(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return !(e1 <= s2 || e2 <= s1);
}

/**
 * التحقق من صحة صيغة الوقت (HH:mm)
 */
export function isValidTimeFormat(timeStr: string): boolean {
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(timeStr);
}

// ==================== إنشاء وإدارة الفترات الزمنية ====================

/**
 * إنشاء فترة زمنية جديدة
 */
export function createTimeSlot(
  startTime: string,
  endTime: string,
  location: TimeSlot["location"],
  locationDetails?: string
): TimeSlot | { error: string } {
  // التحقق من صحة الوقت
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    return { error: "صيغة الوقت غير صحيحة. استخدم HH:mm" };
  }

  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  if (end <= start) {
    return { error: "وقت الانتهاء يجب أن يكون بعد وقت البداية" };
  }

  const duration = end - start;
  if (duration < 15) {
    return { error: "الفترة الزمنية يجب أن تكون 15 دقيقة على الأقل" };
  }

  return {
    id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    startTime,
    endTime,
    duration,
    location,
    locationDetails,
    isActive: true,
    bookedCount: 0,
  };
}

/**
 * إنشاء توفرية كاملة ليوم واحد
 */
export function createDayAvailability(
  dayOfWeek: number,
  timeSlots: TimeSlot[]
): SheikhAvailability {
  return {
    id: `avail-${Date.now()}-${dayOfWeek}`,
    dayOfWeek,
    dayName: DAYS_OF_WEEK_AR[dayOfWeek],
    timeSlots,
    isAvailable: timeSlots.length > 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * إنشاء جدول أسبوعي كامل
 */
export function createWeeklySchedule(
  availability: SheikhAvailability[]
): SheikhAvailability[] {
  return availability.map((day) => ({
    ...day,
    updatedAt: Date.now(),
  }));
}

// ==================== إدارة الحجوزات ====================

/**
 * التحقق من توفر فترة زمنية
 */
export function isTimeSlotAvailable(
  slot: TimeSlot,
  appointments: StudentAppointment[],
  requestedDate: string,
  requestedDuration: number = 15
): boolean {
  // التحقق من عدم التداخل
  const hasConflict = appointments.some(
    (apt) =>
      apt.date === requestedDate &&
      apt.status !== "cancelled" &&
      hasTimeConflict(apt.startTime, apt.endTime, slot.startTime, slot.endTime)
  );

  return !hasConflict;
}

/**
 * حجز موعد جديد
 */
export function bookAppointment(
  studentId: string,
  studentName: string,
  studentEmail: string,
  sheikhId: string,
  date: string, // YYYY-MM-DD
  timeSlot: TimeSlot,
  location: string,
  locationDetails?: string,
  surahId?: number,
  surahName?: string,
  arabicSurahName?: string,
  ayahRange?: string,
  notes?: string
): StudentAppointment | { error: string } {
  // التحقق من التاريخ
  const bookingDate = parseISO(date);
  const today = new Date();
  if (isBefore(bookingDate, today)) {
    return { error: "لا يمكن الحجز لتاريخ ماضي" };
  }

  // التحقق من الفترة الزمنية
  if (!timeSlot.isActive) {
    return { error: "الفترة الزمنية غير متاحة" };
  }

  const dayOfWeek = getDay(bookingDate);

  return {
    id: `apt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    studentId,
    studentName,
    studentEmail,
    sheikhId,
    date,
    dayOfWeek,
    timeSlotId: timeSlot.id,
    startTime: timeSlot.startTime,
    endTime: timeSlot.endTime,
    duration: timeSlot.duration || calculateDuration(timeSlot.startTime, timeSlot.endTime),
    location,
    locationDetails,
    surahId,
    surahName,
    arabicSurahName,
    ayahRange,
    status: "pending",
    notes,
    createdAt: Date.now(),
  };
}

/**
 * تأكيد الحجز من قبل الشيخ
 */
export function confirmAppointment(
  appointment: StudentAppointment
): StudentAppointment {
  return {
    ...appointment,
    status: "confirmed",
  };
}

/**
 * إلغاء الحجز
 */
export function cancelAppointment(
  appointment: StudentAppointment,
  reason: string
): StudentAppointment {
  return {
    ...appointment,
    status: "cancelled",
    cancelledAt: Date.now(),
    cancelReason: reason,
  };
}

/**
 * إكمال الموعد
 */
export function completeAppointment(
  appointment: StudentAppointment,
  rating?: number,
  feedback?: string
): StudentAppointment {
  return {
    ...appointment,
    status: "completed",
    completedAt: Date.now(),
    rating,
    feedback,
  };
}

// ==================== إحصائيات وتقارير ====================

/**
 * حساب إحصائيات يوم معين
 */
export function getDayStatistics(
  date: string, // YYYY-MM-DD
  appointments: StudentAppointment[],
  availableSlots: TimeSlot[]
): DayStatistics {
  const dayAppointments = appointments.filter((apt) => apt.date === date);

  const totalSlots = availableSlots.length;
  const bookedSlots = availableSlots.filter((slot) =>
    dayAppointments.some(
      (apt) =>
        apt.status !== "cancelled" &&
        hasTimeConflict(apt.startTime, apt.endTime, slot.startTime, slot.endTime)
    )
  ).length;

  const completedAppointments = dayAppointments.filter(
    (apt) => apt.status === "completed"
  ).length;
  const cancelledAppointments = dayAppointments.filter(
    (apt) => apt.status === "cancelled"
  ).length;

  return {
    date,
    dayOfWeek: getDay(parseISO(date)),
    totalSlots,
    availableSlots: totalSlots - bookedSlots,
    bookedSlots,
    completedAppointments,
    cancelledAppointments,
    bookingPercentage: totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0,
  };
}

/**
 * حساب إحصائيات الشيخ الشاملة
 */
export function calculateSheikhStatistics(
  appointments: StudentAppointment[],
  availableSlots: TimeSlot[]
): {
  total: number;
  completed: number;
  cancelled: number;
  pending: number;
  averageRating: number;
  bookingRate: number;
} {
  const total = appointments.length;
  const completed = appointments.filter((apt) => apt.status === "completed").length;
  const cancelled = appointments.filter((apt) => apt.status === "cancelled").length;
  const pending = appointments.filter((apt) => apt.status === "pending").length;

  const ratings = appointments
    .filter((apt) => apt.rating !== undefined && apt.rating > 0)
    .map((apt) => apt.rating!);

  const averageRating =
    ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;

  // حساب معدل الحجز بناءً على عدد الحجوزات مقسومة على إجمالي الفترات
  const totalSlots = availableSlots.length;
  const bookedSlots = availableSlots.filter((slot) => slot.bookedCount > 0).length;
  const bookingRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

  return {
    total,
    completed,
    cancelled,
    pending,
    averageRating,
    bookingRate,
  };
}

/**
 * الحصول على الفترات المتاحة في يوم معين
 */
export function getAvailableSlots(
  date: string, // YYYY-MM-DD
  dayOfWeek: number,
  availability: SheikhAvailability[],
  appointments: StudentAppointment[],
  minDuration?: number
): TimeSlot[] {
  const dayAvailability = availability.find((day) => day.dayOfWeek === dayOfWeek);

  if (!dayAvailability || !dayAvailability.isAvailable) {
    return [];
  }

  return dayAvailability.timeSlots.filter((slot) => {
    // التحقق من المدة الدنيا
    const duration = slot.duration || calculateDuration(slot.startTime, slot.endTime);
    if (minDuration && duration < minDuration) {
      return false;
    }

    // التحقق من التوفر
    return isTimeSlotAvailable(slot, appointments, date);
  });
}

/**
 * الحصول على جميع المواعيد في نطاق زمني معين
 */
export function getAppointmentsInRange(
  startDate: string, // YYYY-MM-DD
  endDate: string, // YYYY-MM-DD
  appointments: StudentAppointment[],
  status?: StudentAppointment["status"]
): StudentAppointment[] {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  return appointments.filter((apt) => {
    const aptDate = parseISO(apt.date);
    const isInRange = !isBefore(aptDate, start) && !isBefore(end, aptDate);
    const matchStatus = !status || apt.status === status;
    return isInRange && matchStatus;
  });
}

/**
 * البحث عن تضارب مواعيد الطالب
 */
export function findStudentConflicts(
  studentId: string,
  appointments: StudentAppointment[],
  newAppointmentDate: string,
  newStartTime: string,
  newEndTime: string
): StudentAppointment[] {
  return appointments.filter(
    (apt) =>
      apt.studentId === studentId &&
      apt.date === newAppointmentDate &&
      apt.status !== "cancelled" &&
      hasTimeConflict(apt.startTime, apt.endTime, newStartTime, newEndTime)
  );
}

/**
 * إعادة جدولة موعد
 */
export function rescheduleAppointment(
  appointment: StudentAppointment,
  newDate: string,
  newTimeSlot: TimeSlot,
  existingAppointments: StudentAppointment[]
): StudentAppointment | { error: string } {
  // التحقق من عدم التعارض
  const conflicts = findStudentConflicts(
    appointment.studentId,
    existingAppointments,
    newDate,
    newTimeSlot.startTime,
    newTimeSlot.endTime
  );

  if (conflicts.length > 0) {
    return { error: "هناك تعارض مع موعد آخر" };
  }

  return {
    ...appointment,
    date: newDate,
    dayOfWeek: getDay(parseISO(newDate)),
    timeSlotId: newTimeSlot.id,
    startTime: newTimeSlot.startTime,
    endTime: newTimeSlot.endTime,
    duration: newTimeSlot.duration || calculateDuration(newTimeSlot.startTime, newTimeSlot.endTime),
  };
}

/**
 * تصدير جدول المواعيد
 */
export function exportScheduleAsICS(
  appointments: StudentAppointment[],
  sheikhName: string
): string {
  // تنسيق iCalendar (.ics)
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Sheikh Ibrahim//Appointment System//AR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:مواعيد ${sheikhName}
X-WR-CALDESC:جدول المواعيد
X-WR-TIMEZONE:Asia/Riyadh
`;

  appointments.forEach((apt) => {
    if (apt.status !== "cancelled") {
      const dateTime = `${apt.date.replace(/-/g, "")}T${apt.startTime.replace(/:/g, "")}00`;
      const endDateTime = `${apt.date.replace(/-/g, "")}T${apt.endTime.replace(/:/g, "")}00`;

      ics += `BEGIN:VEVENT
UID:${apt.id}@sheikh-ibrahim.local
DTSTAMP:${new Date(apt.createdAt).toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTSTART:${dateTime}
DTEND:${endDateTime}
SUMMARY:عرض محفوظ - ${apt.studentName}
DESCRIPTION:${apt.surahName || ""}${apt.ayahRange ? ` (${apt.ayahRange})` : ""}
LOCATION:${apt.locationDetails || apt.location}
STATUS:${apt.status === "completed" ? "CONFIRMED" : "TENTATIVE"}
END:VEVENT
`;
    }
  });

  ics += "END:VCALENDAR";
  return ics;
}

/**
 * الحصول على معلومات شاملة لجدول الشيخ
 */
export function getSheikhScheduleInfo(
  sheikhId: string,
  sheikhName: string,
  availability: SheikhAvailability[],
  appointments: StudentAppointment[],
  totalStudents: number
): SheikhSchedule {
  const stats = calculateSheikhStatistics(
    appointments,
    availability.flatMap((day) => day.timeSlots)
  );

  return {
    sheikhId,
    sheikhName,
    totalStudents,
    weeklyAvailability: availability,
    appointments,
    statistics: {
      totalAppointments: stats.total,
      completedAppointments: stats.completed,
      cancelledAppointments: stats.cancelled,
      averageRating: stats.averageRating,
      bookingRate: stats.bookingRate,
    },
    updatedAt: Date.now(),
  };
}
