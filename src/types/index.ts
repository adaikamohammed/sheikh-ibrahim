/**
 * أنواع البيانات الرئيسية للمشروع
 */

/**
 * معلومات السورة والآيات
 */
export interface SurahInfo {
  id: number;
  name: string;
  arabicName: string;
  totalAyahs: number;
}

/**
 * تعريف الورد اليومي (ورقة العمل)
 */
export interface WirdAssignment {
  id?: string; // معرّف فريد للورد
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // اليوم من الأسبوع (أحد، اثنين، إلخ)
  surahId: number;
  surahName: string;
  arabicSurahName: string;
  startAyah: number;
  endAyah: number;
  totalAyahs: number; // عدد الآيات في هذا الورد
  targetRepetitions: number; // عدد التكرارات المطلوب
  isHoliday: boolean;
  note?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface StudentProgress {
  date: string; // YYYY-MM-DD
  wirdId: string; // معرّف الورد
  wirdName: string; // اسم الورد (مثلاً "سورة الشعراء 1-10")
  count: number; // عدد التكرارات المكتملة
  targetCount: number; // عدد التكرارات المطلوب
  timestamp: number;
  status: "pending" | "in-progress" | "completed"; // حالة الورد
  completedAt?: number; // وقت الإكمال
  notes?: string;
}

export interface StudentData {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  progress: number; // الإجمالي الكلي (legacy)
  status: string; // الحالة الحالية
  lastUpdated: number;
  dailyProgress: Record<string, number>; // YYYY-MM-DD -> count
  weeklyStats: Record<string, WeeklyStats>; // YYYY-W## -> stats
  monthlyStats: Record<string, MonthlyStats>; // YYYY-MM -> stats
  joinedDate: number;
  avatar?: string;
}

export interface WeeklyStats {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;
  totalCompletions: number;
  completedDays: number;
  averagePerDay: number;
  bestDay: string;
  bestDayCount: number;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  totalCompletions: number;
  completedDays: number;
  averagePerDay: number;
  totalPages?: number;
  improvementRate: number;
}

export interface SheikhStats {
  totalStudents: number;
  activeStudents: number; // طلاب أكملوا اليوم
  averageCompletion: number; // متوسط الإكمال
  totalCompletions: number; // إجمالي التكرارات
  consistencyRate: number; // نسبة الاستمرارية
}

export interface WirdProgress {
  wirdId: string;
  wirdName: string;
  surah: string;
  ayahRange: string; // "1-10"
  students: WirdStudentProgress[];
  completionPercentage: number; // النسبة الإجمالية
  completedStudents: number;
  totalStudents: number;
  createdAt: number;
  updatedAt: number;
}

export interface WirdStudentProgress {
  studentId: string;
  studentName: string;
  currentCount: number;
  targetCount: number;
  percentage: number;
  status: "completed" | "in-progress" | "not-started";
  lastUpdate: number;
  date?: string;
}

export interface WirdTracking {
  wirdId: string;
  date: string;
  surah: string;
  ayahRange: string;
  targetRepetitions: number;
  studentProgress: Record<string, number>; // studentId -> count
  statistics: {
    completed: number;
    inProgress: number;
    notStarted: number;
    averageCompletion: number;
  };
}

// ==================== نظام المواعيد والحجوزات ====================

/**
 * فترة زمنية متاحة (مثل: من 3 عصراً إلى 5 مساءً)
 */
export interface TimeSlot {
  id: string; // معرّف فريد للفترة
  startTime: string; // HH:mm (15:00)
  endTime: string; // HH:mm (17:00)
  duration?: number; // المدة بالدقائق (120)
  location: "mosque" | "prayer_room" | "quran_school" | "other" | string; // المكان - allow string for now to avoid breaking changes if strict
  locationDetails?: string; // تفاصيل إضافية (مثل: المسجد الكبير، المصلى الشرقي)
  isActive?: boolean; // هل الفترة مفعلة الآن؟
  bookedCount: number; // عدد الطلاب المحجوزين حالياً
  color?: string; // لون الفترة الزمنية للعرض (hex color)
  capacity?: number; // Added
  booked?: number; // Added for student view
}

/**
 * توفرية الشيخ في يوم معين
 */
export interface SheikhAvailability {
  id: string; // معرّف فريد
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  dayName: string; // الاسم بالعربية (الأحد، الاثنين، إلخ)
  timeSlots: TimeSlot[]; // فترات العمل
  isAvailable: boolean; // هل اليوم متاح عموماً؟
  createdAt: number;
  updatedAt: number;
}

/**
 * حجز موعد من الطالب
 */
// Removed duplicate TimeSlot definition

export interface StudentAppointment {
  id: string; // معرّف فريد للحجز
  studentId: string; // معرّف الطالب
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  sheikhId: string; // معرّف الشيخ
  date: string; // YYYY-MM-DD (التاريخ المحدد للموعد)
  dayOfWeek: number;
  timeSlotId: string; // معرّف الفترة الزمنية
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number; // المدة بالدقائق (15، 30، إلخ)
  location: string; // المكان
  locationDetails?: string;
  surahId?: number; // السورة المراد عرضها (اختياري)
  surahName?: string;
  arabicSurahName?: string;
  ayahRange?: string; // الآيات المراد عرضها
  status: "pending" | "confirmed" | "completed" | "cancelled"; // حالة الحجز
  notes?: string;
  createdAt: number;
  cancelledAt?: number;
  cancelReason?: string;
  completedAt?: number; // وقت إكمال الموعد
  rating?: number; // تقييم الطالب (1-5)
  feedback?: string;
}

/**
 * جدول مواعيد الشيخ بكامل التفاصيل
 */
export interface SheikhSchedule {
  sheikhId: string;
  sheikhName: string;
  totalStudents: number; // عدد الطلاب الكلي
  weeklyAvailability: SheikhAvailability[]; // توفرية الأسبوع
  appointments: StudentAppointment[]; // كل الحجوزات
  statistics: {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    averageRating: number;
    bookingRate: number; // النسبة المئوية للفترات المحجوزة
  };
  updatedAt: number;
}

/**
 * إحصائيات الحجوزات لليوم الواحد
 */
export interface DayStatistics {
  date: string; // YYYY-MM-DD
  dayOfWeek: number;
  totalSlots: number; // إجمالي الفترات
  availableSlots: number; // الفترات المتاحة
  bookedSlots: number; // الفترات المحجوزة
  completedAppointments: number;
  cancelledAppointments: number;
  bookingPercentage: number; // النسبة المئوية
}

/**
 * طلب تأكيد موعد من الشيخ
 */
export interface AppointmentRequest {
  id: string;
  studentId: string;
  studentName: string;
  requestedDate: string; // YYYY-MM-DD
  requestedTimeSlot: string; // HH:mm-HH:mm
  location: string;
  surah?: string;
  notes?: string;
  status: "pending" | "approved" | "rejected"; // قيد الانتظار، موافق عليه، مرفوض
  createdAt: number;
  respondedAt?: number;
  rejectionReason?: string;
}

/**
 * إشعار للطالب أو الشيخ
 */
export interface AppointmentNotification {
  id: string;
  recipientId: string; // معرّف المتلقي
  recipientRole: "student" | "sheikh";
  appointmentId: string;
  type: "booking_confirmed" | "booking_cancelled" | "reminder" | "reschedule_request"; // نوع الإشعار
  title: string;
  message: string;
  date: string; // تاريخ الموعد
  time: string; // وقت الموعد
  isRead: boolean;
  createdAt: number;
  expiresAt?: number; // متى ينتهي صلاحية الإشعار
}

export type UserRole = "sheikh" | "student" | null;
