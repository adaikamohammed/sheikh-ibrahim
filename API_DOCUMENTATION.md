# 📚 دليل API والعمليات الرئيسية

## 🎯 Overview

هذا الملف يوثق جميع العمليات الرئيسية والدوال المتاحة في النظام.

---

## 🔐 المصادقة (Authentication)

### تسجيل الدخول
```typescript
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

const login = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Login failed:", error);
  }
};
```

### تسجيل الخروج
```typescript
import { signOut } from "firebase/auth";

const logout = async () => {
  await signOut(auth);
};
```

---

## 📊 البيانات والإحصائيات

### قراءة بيانات الطالب
```typescript
import { useRealtime } from "@/hooks/useRealtime";

const { studentData, allStudents, role } = useRealtime();
```

### تحديث التقدم اليومي
```typescript
import { useRealtime } from "@/hooks/useRealtime";

const { updateProgress } = useRealtime();

// تحديث عدد التكرارات لتاريخ معين
await updateProgress(100, "2025-02-07");

// تحديث اليوم الحالي تلقائياً
await updateProgress(50);
```

### قراءة الأوراد
```typescript
import { useWird } from "@/hooks/useWird";

const { currentWird, allAssignments, getWirdForDate } = useWird();

// الحصول على ورد تاريخ معين
const wird = getWirdForDate("2025-02-07");
// Returns: WirdAssignment | null
```

### تعيين ورد جديد (للشيخ فقط)
```typescript
import { useWird } from "@/hooks/useWird";

const { assignWird } = useWird();

await assignWird("2025-02-08", {
  date: "2025-02-08",
  surahId: 25,
  surahName: "الفرقان",
  startAyah: 1,
  endAyah: 20,
  repetitions: 100,
  isHoliday: false,
});
```

---

## 📈 الإحصائيات والحسابات

### حساب إحصائيات الأسبوع
```typescript
import { calculateWeeklyStats } from "@/services/progressService";

const stats = calculateWeeklyStats(student.dailyProgress, "2025-02-07");
// Returns: WeeklyStats
// {
//   weekStart: "2025-02-01",
//   weekEnd: "2025-02-07",
//   totalCompletions: 700,
//   completedDays: 7,
//   averagePerDay: 100,
//   bestDay: "2025-02-05",
//   bestDayCount: 150
// }
```

### حساب إحصائيات الشهر
```typescript
import { calculateMonthlyStats } from "@/services/progressService";

const stats = calculateMonthlyStats(student.dailyProgress, "2025-02-07");
// Returns: MonthlyStats
// {
//   month: "2025-02",
//   totalCompletions: 2800,
//   completedDays: 28,
//   averagePerDay: 100,
//   improvementRate: 93
// }
```

### حساب نسبة الاكتمال
```typescript
import { calculateCompletionRate } from "@/services/progressService";

const percentage = calculateCompletionRate(75, 100);
// Returns: 75
```

### الحصول على درجة الأداء
```typescript
import { getPerformanceGrade } from "@/services/progressService";

const grade = getPerformanceGrade(95, 100);
// Returns: "A+" | "A" | "B" | "C" | "D"
```

---

## 🧮 الحسابات المتقدمة

### حساب معدل النمو
```typescript
import { calculateGrowthRate } from "@/lib/math";

const growth = calculateGrowthRate(100, 150);
// Returns: 50 (نمو 50%)
```

### حساب المتوسط المتحرك
```typescript
import { calculateMovingAverage } from "@/lib/math";

const data = [100, 105, 110, 95, 120];
const avg = calculateMovingAverage(data, 3);
// Returns: [100, 102.5, 105, 108.33, ...]
```

### التنبؤ بالقيمة التالية
```typescript
import { predictNextValue } from "@/lib/math";

const data = [100, 105, 110, 115];
const next = predictNextValue(data);
// Returns: 120 (التنبؤ)
```

### حساب معامل الارتباط
```typescript
import { calculateCorrelation } from "@/lib/math";

const x = [1, 2, 3, 4, 5];
const y = [2, 4, 6, 8, 10];
const corr = calculateCorrelation(x, y);
// Returns: 1 (ارتباط كامل إيجابي)
```

---

## 🎨 الألوان والنمط

### استخدام متغيرات الألوان
```typescript
import { colorVariables, colorClasses, shadowEffects } from "@/lib/colors";

const className = `text-[${colorVariables.primary}] ${colorClasses.primary}`;
const shadow = shadowEffects.glow;
```

---

## ⚙️ الإعدادات المركزية

### الوصول للإعدادات
```typescript
import { APP_CONFIG, ROLE_PERMISSIONS, PERFORMANCE_THRESHOLDS } from "@/config/app.config";

// الحصول على الإعدادات
const repetitions = APP_CONFIG.wird.defaultRepetitions; // 100
const sheikEmail = APP_CONFIG.security.sheikEmail; // "admin00@gmail.com"

// التحقق من الصلاحيات
const canEdit = ROLE_PERMISSIONS.sheikh.editAssignments; // true

// الحصول على حدود الأداء
const excellent = PERFORMANCE_THRESHOLDS.excellent; // 95
```

---

## 🔄 تدفق البيانات الكامل

### دورة حياة تحديث الورد:

```
الطالب يضغط العداد
     ↓
RepetitionCounter.handleIncrement()
     ↓
onUpdate(count) يُستدعى
     ↓
StudentDashboard.handleUpdateProgress()
     ↓
useRealtime.updateProgress(count, date)
     ↓
Firebase: students/{uid}/dailyProgress/{date} = count
     ↓
Firebase يرسل تحديث للشيخ
     ↓
SheikhDashboard يتلقى التحديث
     ↓
WirdProgressCard يُحدّث النسبة المئوية
```

---

## 🚨 معالجة الأخطاء

### نمط معالجة الأخطاء الموصى به:
```typescript
try {
  await updateProgress(count, date);
} catch (error) {
  console.error("Failed to update progress:", error);
  // عرض رسالة خطأ للمستخدم
}
```

---

## 📝 الأمثلة العملية

### مثال 1: عرض تقدم الطالب اليومي
```typescript
const StudentCard = ({ student }: { student: StudentData }) => {
  const today = new Date().toISOString().split("T")[0];
  const progress = student.dailyProgress?.[today] || 0;
  const percentage = calculateCompletionRate(progress, 100);

  return (
    <div>
      <h3>{student.name}</h3>
      <p>{percentage}% مكتمل</p>
    </div>
  );
};
```

### مثال 2: عرض ترتيب الطلاب
```typescript
const RankedStudents = ({ students }: { students: StudentData[] }) => {
  const ranked = students.sort((a, b) => 
    (b.progress || 0) - (a.progress || 0)
  );

  return (
    <div>
      {ranked.map((student, idx) => (
        <div key={idx}>
          <span>{idx + 1}.</span>
          <span>{student.name}</span>
          <span>{student.progress}</span>
        </div>
      ))}
    </div>
  );
};
```

### مثال 3: عرض إحصائيات الأداء
```typescript
const PerformanceChart = ({ student }: { student: StudentData }) => {
  const stats = formatStats(student);
  const grade = getPerformanceGrade(
    stats.consistency,
    stats.monthly.improvementRate
  );

  return (
    <div>
      <h3>الأداء: {grade}</h3>
      <p>الالتزام: {stats.consistency}%</p>
      <p>الإجمالي الشهري: {stats.monthly.totalCompletions}</p>
    </div>
  );
};
```

---

## 🔗 الروابط المرتبطة

- [نظام متابعة الأوراد](./SYSTEM_GUIDE.md)
- [أنواع البيانات](./src/types/index.ts)
- [الخدمات](./src/services/progressService.ts)

---

**آخر تحديث**: فبراير 2025
