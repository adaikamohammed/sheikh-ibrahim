/**
 * خدمة الإشعارات والتنبيهات
 * تدير إخطار الطلاب والشيخ بالمواعيد المحجوزة والملغاة والمؤكدة
 */

import { AppointmentNotification, StudentAppointment } from "@/types";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

// ==================== أنواع الإشعارات ====================

/**
 * إنشاء إشعار تأكيد حجز للطالب
 */
export function createBookingConfirmationNotification(
  appointmentId: string,
  studentId: string,
  studentName: string,
  appointment: StudentAppointment
): AppointmentNotification {
  const dateFormatted = format(parseISO(appointment.date), "EEEE, d MMMM yyyy", {
    locale: ar,
  });

  return {
    id: `notif-${Date.now()}`,
    recipientId: studentId,
    recipientRole: "student",
    appointmentId,
    type: "booking_confirmed",
    title: "✅ تم تأكيد موعدك",
    message: `تم تأكيد موعدك لعرض ${appointment.arabicSurahName} بنجاح`,
    date: appointment.date,
    time: `${appointment.startTime} - ${appointment.endTime}`,
    isRead: false,
    createdAt: Date.now(),
    expiresAt: parseISO(appointment.date).getTime(), // ينتهي بنهاية يوم الموعد
  };
}

/**
 * إنشاء إشعار لإلغاء الحجز
 */
export function createCancellationNotification(
  appointmentId: string,
  recipientId: string,
  recipientRole: "student" | "sheikh",
  appointment: StudentAppointment,
  reason: string
): AppointmentNotification {
  return {
    id: `notif-${Date.now()}`,
    recipientId,
    recipientRole,
    appointmentId,
    type: "booking_cancelled",
    title: "❌ تم إلغاء الموعد",
    message: `تم إلغاء موعد عرض ${appointment.arabicSurahName}${reason ? ` (السبب: ${reason})` : ""}`,
    date: appointment.date,
    time: `${appointment.startTime} - ${appointment.endTime}`,
    isRead: false,
    createdAt: Date.now(),
  };
}

/**
 * إنشاء إشعار تذكير قبل الموعد
 */
export function createReminderNotification(
  appointmentId: string,
  recipientId: string,
  recipientRole: "student" | "sheikh",
  appointment: StudentAppointment,
  hoursBeforeAppointment: number = 24
): AppointmentNotification {
  const reminderText =
    hoursBeforeAppointment === 24 ? "غداً" : `في ${hoursBeforeAppointment} ساعات`;

  return {
    id: `notif-${Date.now()}`,
    recipientId,
    recipientRole,
    appointmentId,
    type: "reminder",
    title: `⏰ تذكير: موعد ${reminderText}`,
    message: `موعدك لعرض ${appointment.arabicSurahName} ${reminderText} الساعة ${appointment.startTime}`,
    date: appointment.date,
    time: `${appointment.startTime} - ${appointment.endTime}`,
    isRead: false,
    createdAt: Date.now(),
    expiresAt:
      parseISO(appointment.date).getTime() - hoursBeforeAppointment * 60 * 60 * 1000,
  };
}

/**
 * إنشاء إشعار بطلب إعادة جدولة
 */
export function createRescheduleRequestNotification(
  appointmentId: string,
  recipientId: string,
  appointment: StudentAppointment,
  newDate: string,
  newTime: string
): AppointmentNotification {
  return {
    id: `notif-${Date.now()}`,
    recipientId,
    recipientRole: "sheikh",
    appointmentId,
    type: "reschedule_request",
    title: "🔄 طلب إعادة جدولة",
    message: `${appointment.studentName} يطلب إعادة جدولة الموعد إلى ${newDate} الساعة ${newTime}`,
    date: newDate,
    time: newTime,
    isRead: false,
    createdAt: Date.now(),
  };
}

// ==================== إدارة الإشعارات ====================

/**
 * تحديد إشعار كمقروء
 */
export function markNotificationAsRead(
  notification: AppointmentNotification
): AppointmentNotification {
  return {
    ...notification,
    isRead: true,
  };
}

/**
 * حذف إشعار منتهي الصلاحية
 */
export function isNotificationExpired(notification: AppointmentNotification): boolean {
  if (!notification.expiresAt) return false;
  return Date.now() > notification.expiresAt;
}

/**
 * الحصول على عدد الإشعارات غير المقروءة
 */
export function getUnreadNotificationsCount(
  notifications: AppointmentNotification[]
): number {
  return notifications.filter((n) => !n.isRead).length;
}

/**
 * تصفية الإشعارات حسب النوع
 */
export function filterNotificationsByType(
  notifications: AppointmentNotification[],
  type: AppointmentNotification["type"]
): AppointmentNotification[] {
  return notifications.filter((n) => n.type === type);
}

/**
 * تصفية الإشعارات حسب الحالة
 */
export function filterNotificationsByStatus(
  notifications: AppointmentNotification[],
  isRead: boolean
): AppointmentNotification[] {
  return notifications.filter((n) => n.isRead === isRead);
}

// ==================== رسائل البريد الإلكتروني ====================

/**
 * إنشاء نص بريد تأكيد الحجز
 */
export function generateBookingConfirmationEmail(
  appointment: StudentAppointment
): {
  subject: string;
  html: string;
  text: string;
} {
  const dateFormatted = format(parseISO(appointment.date), "EEEE، d MMMM yyyy", {
    locale: ar,
  });

  const html = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #d4af37 0%, #10b981 100%); padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="color: #000; margin: 0;">✅ تم تأكيد موعدك</h1>
      </div>
      
      <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
          السلام عليكم ورحمة الله وبركاته،<br>
          تم تأكيد موعدك بنجاح لعرض محفوظك من القرآن الكريم.
        </p>

        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #d4af37; margin-top: 0;">📋 تفاصيل الموعد:</h3>
          <p style="margin: 10px 0; color: #333;">
            <strong>📅 التاريخ:</strong> ${dateFormatted}
          </p>
          <p style="margin: 10px 0; color: #333;">
            <strong>⏰ الوقت:</strong> ${appointment.startTime} - ${appointment.endTime}
          </p>
          <p style="margin: 10px 0; color: #333;">
            <strong>📍 المكان:</strong> ${appointment.locationDetails || appointment.location}
          </p>
          <p style="margin: 10px 0; color: #333;">
            <strong>📖 السورة:</strong> ${appointment.arabicSurahName}${
    appointment.ayahRange ? ` (${appointment.ayahRange})` : ""
  }
          </p>
        </div>

        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            ⚠️ <strong>تنبيه مهم:</strong> يرجى الحضور قبل بدء الموعد بـ 5-10 دقائق. إذا لم تتمكن من الحضور، يرجى إخطار الشيخ مسبقاً.
          </p>
        </div>

        <p style="color: #666; margin-top: 30px; font-size: 14px;">
          إذا كان لديك أي استفسارات، يرجى التواصل مع الشيخ مباشرة.
        </p>

        <p style="color: #999; margin-top: 20px; font-size: 12px; text-align: center;">
          هذا البريد من نظام إدارة المواعيد - منصة الشيخ إبراهيم
        </p>
      </div>
    </div>
  `;

  const text = `
    تم تأكيد موعدك

    تفاصيل الموعد:
    التاريخ: ${dateFormatted}
    الوقت: ${appointment.startTime} - ${appointment.endTime}
    المكان: ${appointment.locationDetails || appointment.location}
    السورة: ${appointment.arabicSurahName}${appointment.ayahRange ? ` (${appointment.ayahRange})` : ""}

    تنبيه مهم: يرجى الحضور قبل بدء الموعد بـ 5-10 دقائق. إذا لم تتمكن من الحضور، يرجى إخطار الشيخ مسبقاً.
  `;

  return {
    subject: `✅ تم تأكيد موعدك - عرض ${appointment.arabicSurahName}`,
    html,
    text,
  };
}

/**
 * إنشاء نص بريد إخطار الشيخ بحجز جديد
 */
export function generateSheikhBookingAlertEmail(
  appointment: StudentAppointment
): {
  subject: string;
  html: string;
  text: string;
} {
  const dateFormatted = format(parseISO(appointment.date), "EEEE، d MMMM yyyy", {
    locale: ar,
  });

  const html = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #d4af37 0%, #3b82f6 100%); padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="color: #fff; margin: 0;">📅 حجز جديد قيد الانتظار</h1>
      </div>
      
      <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
          السلام عليكم ورحمة الله وبركاته شيخنا الكريم،<br>
          لديك حجز جديد قيد الانتظار يتطلب منك التأكيد أو الرفض.
        </p>

        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #d4af37; margin-top: 0;">👤 بيانات الطالب:</h3>
          <p style="margin: 10px 0; color: #333;">
            <strong>الاسم:</strong> ${appointment.studentName}
          </p>
          <p style="margin: 10px 0; color: #333;">
            <strong>البريد الإلكتروني:</strong> ${appointment.studentEmail}
          </p>
          <p style="margin: 10px 0; color: #333;">
            <strong>الهاتف:</strong> ${appointment.studentPhone || "غير متوفر"}
          </p>

          <h3 style="color: #d4af37; margin-top: 20px;">📋 تفاصيل الموعد:</h3>
          <p style="margin: 10px 0; color: #333;">
            <strong>التاريخ:</strong> ${dateFormatted}
          </p>
          <p style="margin: 10px 0; color: #333;">
            <strong>الوقت:</strong> ${appointment.startTime} - ${appointment.endTime}
          </p>
          <p style="margin: 10px 0; color: #333;">
            <strong>المكان المطلوب:</strong> ${appointment.locationDetails || appointment.location}
          </p>
          <p style="margin: 10px 0; color: #333;">
            <strong>السورة:</strong> ${appointment.arabicSurahName}${
    appointment.ayahRange ? ` (${appointment.ayahRange})` : ""
  }
          </p>
          ${
            appointment.notes
              ? `<p style="margin: 10px 0; color: #333;">
            <strong>ملاحظات الطالب:</strong> ${appointment.notes}
          </p>`
              : ""
          }
        </div>

        <p style="color: #666; margin-top: 30px; font-size: 14px; text-align: center;">
          يرجى تسجيل الدخول إلى لوحة تحكمك لتأكيد أو رفض هذا الحجز.
        </p>

        <p style="color: #999; margin-top: 20px; font-size: 12px; text-align: center;">
          هذا البريد من نظام إدارة المواعيد - منصة الشيخ إبراهيم
        </p>
      </div>
    </div>
  `;

  const text = `
    حجز جديد قيد الانتظار

    بيانات الطالب:
    الاسم: ${appointment.studentName}
    البريد الإلكتروني: ${appointment.studentEmail}
    الهاتف: ${appointment.studentPhone || "غير متوفر"}

    تفاصيل الموعد:
    التاريخ: ${dateFormatted}
    الوقت: ${appointment.startTime} - ${appointment.endTime}
    المكان: ${appointment.locationDetails || appointment.location}
    السورة: ${appointment.arabicSurahName}${appointment.ayahRange ? ` (${appointment.ayahRange})` : ""}
    ${appointment.notes ? `ملاحظات: ${appointment.notes}` : ""}

    يرجى تسجيل الدخول إلى لوحة تحكمك لتأكيد أو رفض هذا الحجز.
  `;

  return {
    subject: `📅 حجز جديد: ${appointment.studentName} - ${appointment.arabicSurahName}`,
    html,
    text,
  };
}

/**
 * إنشاء نص بريد إلغاء الموعد
 */
export function generateCancellationEmail(
  appointment: StudentAppointment,
  reason: string,
  recipientName: string
): {
  subject: string;
  html: string;
  text: string;
} {
  const dateFormatted = format(parseISO(appointment.date), "EEEE، d MMMM yyyy", {
    locale: ar,
  });

  const html = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="color: #fff; margin: 0;">❌ تم إلغاء الموعد</h1>
      </div>
      
      <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
          السلام عليكم ${recipientName}،<br>
          تم إلغاء الموعد المجدول.
        </p>

        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #ef4444; margin-top: 0;">📋 الموعد الملغى:</h3>
          <p style="margin: 10px 0; color: #333;">
            <strong>التاريخ:</strong> ${dateFormatted}
          </p>
          <p style="margin: 10px 0; color: #333;">
            <strong>الوقت:</strong> ${appointment.startTime} - ${appointment.endTime}
          </p>
          <p style="margin: 10px 0; color: #333;">
            <strong>السورة:</strong> ${appointment.arabicSurahName}
          </p>
          ${
            reason
              ? `<p style="margin: 10px 0; color: #333;">
            <strong>السبب:</strong> ${reason}
          </p>`
              : ""
          }
        </div>

        <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
          <p style="margin: 0; color: #047857; font-size: 14px;">
            💡 <strong>معلومة:</strong> يمكنك حجز موعد آخر في أي وقت تشاء.
          </p>
        </div>

        <p style="color: #999; margin-top: 20px; font-size: 12px; text-align: center;">
          هذا البريد من نظام إدارة المواعيد - منصة الشيخ إبراهيم
        </p>
      </div>
    </div>
  `;

  const text = `
    تم إلغاء الموعد

    الموعد الملغى:
    التاريخ: ${dateFormatted}
    الوقت: ${appointment.startTime} - ${appointment.endTime}
    السورة: ${appointment.arabicSurahName}
    ${reason ? `السبب: ${reason}` : ""}

    يمكنك حجز موعد آخر في أي وقت.
  `;

  return {
    subject: `❌ تم إلغاء الموعد - ${appointment.arabicSurahName}`,
    html,
    text,
  };
}
