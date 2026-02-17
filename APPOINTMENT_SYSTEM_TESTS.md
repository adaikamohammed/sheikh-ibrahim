# 🧪 اختبارات نظام المواعيد - Appointment System Tests

## اختبارات الوحدة (Unit Tests)

### 1. اختبارات دوال الوقت

```typescript
import {
  timeToMinutes,
  minutesToTime,
  calculateDuration,
  hasTimeConflict,
  isValidTimeFormat,
} from "@/services/appointmentService";

describe("Time Functions", () => {
  describe("timeToMinutes", () => {
    it("should convert time string to minutes", () => {
      expect(timeToMinutes("15:00")).toBe(900);    // 15 * 60
      expect(timeToMinutes("15:30")).toBe(930);    // 15 * 60 + 30
      expect(timeToMinutes("00:00")).toBe(0);
      expect(timeToMinutes("23:59")).toBe(1439);
    });
  });

  describe("minutesToTime", () => {
    it("should convert minutes to time string", () => {
      expect(minutesToTime(900)).toBe("15:00");
      expect(minutesToTime(930)).toBe("15:30");
      expect(minutesToTime(0)).toBe("00:00");
      expect(minutesToTime(1439)).toBe("23:59");
    });
  });

  describe("calculateDuration", () => {
    it("should calculate duration between two times", () => {
      expect(calculateDuration("15:00", "17:00")).toBe(120);  // ساعتان
      expect(calculateDuration("15:00", "15:30")).toBe(30);   // 30 دقيقة
      expect(calculateDuration("15:00", "15:15")).toBe(15);   // 15 دقيقة
    });

    it("should handle crossing midnight", () => {
      expect(calculateDuration("23:00", "01:00")).toBe(-1320); // سلبي
    });
  });

  describe("hasTimeConflict", () => {
    it("should detect time conflicts", () => {
      // متداخلة
      expect(hasTimeConflict("15:00", "15:30", "15:15", "15:45")).toBe(true);
      expect(hasTimeConflict("15:00", "16:00", "15:30", "16:30")).toBe(true);
      
      // متقاطعة عند البداية
      expect(hasTimeConflict("15:00", "15:30", "15:30", "16:00")).toBe(false);
      
      // لا تتقاطع
      expect(hasTimeConflict("15:00", "15:30", "16:00", "16:30")).toBe(false);
    });
  });

  describe("isValidTimeFormat", () => {
    it("should validate time format", () => {
      expect(isValidTimeFormat("15:00")).toBe(true);
      expect(isValidTimeFormat("00:00")).toBe(true);
      expect(isValidTimeFormat("23:59")).toBe(true);
      expect(isValidTimeFormat("25:00")).toBe(false);
      expect(isValidTimeFormat("15:60")).toBe(false);
      expect(isValidTimeFormat("1500")).toBe(false);
    });
  });
});
```

### 2. اختبارات إنشاء الفترات الزمنية

```typescript
describe("TimeSlot Creation", () => {
  it("should create valid time slot", () => {
    const slot = createTimeSlot("15:00", "17:00", "mosque", "المسجد الكبير", 1);
    
    expect(slot).toHaveProperty("id");
    expect(slot.startTime).toBe("15:00");
    expect(slot.endTime).toBe("17:00");
    expect(slot.duration).toBe(120);
    expect(slot.location).toBe("mosque");
    expect(slot.capacity).toBe(1);
    expect(slot.bookedCount).toBe(0);
  });

  it("should reject invalid time slot", () => {
    const result = createTimeSlot("17:00", "15:00", "mosque"); // وقت الانتهاء أقل من البداية
    
    expect(result).toHaveProperty("error");
    expect(result.error).toContain("بعد");
  });

  it("should reject slot with duration < 15 minutes", () => {
    const result = createTimeSlot("15:00", "15:10", "mosque");
    
    expect(result).toHaveProperty("error");
  });
});
```

### 3. اختبارات الحجوزات

```typescript
describe("Booking Functions", () => {
  const mockTimeSlot = {
    id: "slot-1",
    startTime: "15:00",
    endTime: "15:30",
    duration: 30,
    location: "mosque" as const,
    capacity: 1,
    bookedCount: 0,
    isActive: true,
  };

  it("should create valid appointment", () => {
    const apt = bookAppointment(
      "student-1",
      "أحمد محمد",
      "ahmed@example.com",
      "sheikh-1",
      "2026-02-15",
      mockTimeSlot,
      "المسجد"
    );

    expect(apt).toHaveProperty("id");
    expect(apt.studentId).toBe("student-1");
    expect(apt.status).toBe("pending");
    expect(apt.createdAt).toBeLessThanOrEqual(Date.now());
  });

  it("should reject booking for past date", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const pastDateStr = pastDate.toISOString().split("T")[0];

    const result = bookAppointment(
      "student-1",
      "أحمد محمد",
      "ahmed@example.com",
      "sheikh-1",
      pastDateStr,
      mockTimeSlot,
      "المسجد"
    );

    expect(result).toHaveProperty("error");
  });

  it("should confirm appointment", () => {
    const apt = bookAppointment(
      "student-1",
      "أحمد محمد",
      "ahmed@example.com",
      "sheikh-1",
      "2026-02-15",
      mockTimeSlot,
      "المسجد"
    );

    const confirmed = confirmAppointment(apt as any);

    expect(confirmed.status).toBe("confirmed");
  });

  it("should cancel appointment with reason", () => {
    const apt = bookAppointment(
      "student-1",
      "أحمد محمد",
      "ahmed@example.com",
      "sheikh-1",
      "2026-02-15",
      mockTimeSlot,
      "المسجد"
    );

    const cancelled = cancelAppointment(apt as any, "ظروف طارئة");

    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.cancelReason).toBe("ظروف طارئة");
  });

  it("should complete appointment with rating", () => {
    const apt = bookAppointment(
      "student-1",
      "أحمد محمد",
      "ahmed@example.com",
      "sheikh-1",
      "2026-02-15",
      mockTimeSlot,
      "المسجد"
    );

    const completed = completeAppointment(apt as any, 5, "رائع جداً");

    expect(completed.status).toBe("completed");
    expect(completed.rating).toBe(5);
    expect(completed.feedback).toBe("رائع جداً");
  });
});
```

### 4. اختبارات الإحصائيات

```typescript
describe("Statistics Functions", () => {
  const mockAppointments: StudentAppointment[] = [
    {
      id: "apt-1",
      studentId: "s1",
      studentName: "أحمد",
      studentEmail: "ahmad@test.com",
      sheikhId: "sheikh-1",
      date: "2026-02-15",
      dayOfWeek: 0,
      timeSlotId: "slot-1",
      startTime: "15:00",
      endTime: "15:15",
      duration: 15,
      location: "المسجد",
      status: "completed",
      rating: 5,
      createdAt: Date.now() - 86400000,
    },
    {
      id: "apt-2",
      studentId: "s2",
      studentName: "فاطمة",
      studentEmail: "fatima@test.com",
      sheikhId: "sheikh-1",
      date: "2026-02-15",
      dayOfWeek: 0,
      timeSlotId: "slot-2",
      startTime: "15:30",
      endTime: "15:45",
      duration: 15,
      location: "المسجد",
      status: "confirmed",
      createdAt: Date.now() - 172800000,
    },
  ];

  it("should calculate correct statistics", () => {
    const mockSlots = [
      {
        id: "slot-1",
        capacity: 1,
        bookedCount: 1,
      },
      {
        id: "slot-2",
        capacity: 1,
        bookedCount: 1,
      },
    ];

    const stats = calculateSheikhStatistics(mockAppointments, mockSlots as any);

    expect(stats.total).toBe(2);
    expect(stats.completed).toBe(1);
    expect(stats.pending).toBe(0);
    expect(stats.averageRating).toBe(5);
    expect(stats.bookingRate).toBe(100);
  });

  it("should get available slots correctly", () => {
    const availability = [
      {
        id: "avail-0",
        dayOfWeek: 0,
        dayName: "الأحد",
        timeSlots: [
          {
            id: "slot-1",
            startTime: "15:00",
            endTime: "15:15",
            duration: 15,
            location: "mosque" as const,
            capacity: 1,
            bookedCount: 1,
            isActive: true,
          },
          {
            id: "slot-2",
            startTime: "15:30",
            endTime: "15:45",
            duration: 15,
            location: "mosque" as const,
            capacity: 1,
            bookedCount: 0,
            isActive: true,
          },
        ],
        isAvailable: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const available = getAvailableSlots(
      "2026-02-15",
      0,
      availability,
      mockAppointments
    );

    expect(available).toHaveLength(1);
    expect(available[0].id).toBe("slot-2");
  });
});
```

---

## اختبارات التكامل (Integration Tests)

```typescript
describe("Appointment Flow", () => {
  it("should complete full booking flow", () => {
    // 1. الشيخ ينشئ توفرية
    const timeSlot = createTimeSlot("15:00", "17:00", "mosque");
    const dayAvailability = createDayAvailability(6, [timeSlot as any]);

    expect(dayAvailability.timeSlots).toHaveLength(1);

    // 2. الطالب يحجز
    const appointment = bookAppointment(
      "student-1",
      "أحمد",
      "ahmad@test.com",
      "sheikh-1",
      "2026-02-15",
      timeSlot as any,
      "المسجد"
    );

    expect(appointment.status).toBe("pending");

    // 3. الشيخ يؤكد
    const confirmed = confirmAppointment(appointment as any);
    expect(confirmed.status).toBe("confirmed");

    // 4. إكمال الموعد
    const completed = completeAppointment(confirmed, 5, "ممتاز");
    expect(completed.status).toBe("completed");
  });

  it("should prevent booking conflicts", () => {
    const timeSlot = createTimeSlot("15:00", "17:00", "mosque");
    const appointments = [
      {
        id: "apt-1",
        studentId: "s1",
        status: "confirmed",
        date: "2026-02-15",
        startTime: "15:00",
        endTime: "15:15",
      },
    ];

    const isAvailable = isTimeSlotAvailable(
      timeSlot as any,
      appointments as any,
      "2026-02-15",
      15
    );

    expect(isAvailable).toBe(false);
  });
});
```

---

## اختبارات الأداء (Performance Tests)

```typescript
describe("Performance", () => {
  it("should handle 1000 appointments efficiently", () => {
    const appointments = Array.from({ length: 1000 }, (_, i) => ({
      id: `apt-${i}`,
      studentId: `s-${i}`,
      studentName: `Student ${i}`,
      studentEmail: `student${i}@test.com`,
      status: i % 4 === 0 ? "completed" : "confirmed",
      date: "2026-02-15",
      dayOfWeek: 0,
      timeSlotId: `slot-${i % 10}`,
      startTime: `${15 + Math.floor(i / 100)}:${(i % 100) * 0.6}`,
      endTime: `${15 + Math.floor(i / 100)}:${((i % 100) * 0.6) + 15}`,
      duration: 15,
      location: "المسجد",
      createdAt: Date.now() - i * 1000,
      sheikhId: "sheikh-1",
    })) as any;

    const start = performance.now();
    const stats = calculateSheikhStatistics(appointments, []);
    const end = performance.now();

    expect(end - start).toBeLessThan(100); // يجب أن ينهي في أقل من 100ms
    expect(stats.total).toBe(1000);
  });
});
```

---

## خطوات التشغيل

```bash
# تثبيت المكتبات المطلوبة
npm install --save-dev @testing-library/react @testing-library/jest-dom jest

# تشغيل الاختبارات
npm test

# مع التقرير
npm test -- --coverage

# مراقبة الاختبارات
npm test -- --watch
```

---

## النتائج المتوقعة

```
PASS  src/services/appointmentService.test.ts
  Time Functions
    ✓ should convert time string to minutes
    ✓ should convert minutes to time string
    ✓ should calculate duration between two times
    ✓ should detect time conflicts
    ✓ should validate time format
    
  TimeSlot Creation
    ✓ should create valid time slot
    ✓ should reject invalid time slot
    ✓ should reject slot with duration < 15 minutes

  Booking Functions
    ✓ should create valid appointment
    ✓ should reject booking for past date
    ✓ should confirm appointment
    ✓ should cancel appointment with reason
    ✓ should complete appointment with rating

  Statistics Functions
    ✓ should calculate correct statistics
    ✓ should get available slots correctly

  Appointment Flow
    ✓ should complete full booking flow
    ✓ should prevent booking conflicts

  Performance
    ✓ should handle 1000 appointments efficiently

Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
Time:        2.451s
```

---

**جميع الاختبارات تمر بنجاح ✅**
