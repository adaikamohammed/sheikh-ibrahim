# 🔧 إصلاح خطأ React Hooks Order

## ❌ المشكلة

```
React has detected a change in the order of Hooks called by CalendarPage. 
This will lead to bugs and errors if not fixed.
```

### السبب
في ملف `src/app/calendar/page.tsx`، كان هناك شرط `if (role !== "sheikh")` **قبل** استدعاء `useMemo`، مما أدى إلى:
- تغيير ترتيب الـ Hooks
- عدم الاستقرار في render cycle
- أخطاء في React

---

## ✅ الحل المطبق

### القاعدة الذهبية للـ Hooks:
```
✅ جميع الـ Hooks يجب أن تكون في الجزء العلوي من الدالة
✅ قبل أي شروط أو حلقات
✅ ترتيب الـ Hooks يجب أن يكون ثابتاً في كل render
```

### الترتيب الصحيح:
```typescript
export default function CalendarPage() {
  // 1️⃣ جميع useContext أولاً
  const { role, currentUser } = useRealtime();
  
  // 2️⃣ جميع useState
  const [currentMonth, setCurrentMonth] = useState(...);
  const [currentYear, setCurrentYear] = useState(...);
  // ... باقي useState ...
  
  // 3️⃣ جميع useEffect
  useEffect(() => {
    // تحميل وحفظ
  }, [deps]);
  
  // 4️⃣ جميع useMemo ✅ قبل الشروط!
  const calendarGrid = useMemo(() => {
    return generateCalendarGrid(currentYear, currentMonth);
  }, [currentYear, currentMonth]);
  
  const monthStats = useMemo(() => {
    // حساب الإحصائيات
  }, [assignments, currentMonth, currentYear]);
  
  // 5️⃣ الآن يمكنك استخدام الشروط بأمان
  if (role !== "sheikh") {
    return <UnauthorizedView />;
  }
  
  // 6️⃣ الدوال العادية (handlers)
  const handleDayClick = (day: number) => { ... };
  
  // 7️⃣ JSX النهائي
  return <div>...</div>;
}
```

---

## 📝 التغييرات المحددة

### قبل (❌ خطأ):
```typescript
const [suggestedStartAyah, setSuggestedStartAyah] = useState<number | null>(null);

useEffect(() => {
  // ...
}, [currentUser?.uid, role]);

❌ if (role !== "sheikh") {
  return <UnauthorizedView />;
}

❌ const calendarGrid = useMemo(() => {  // خطأ: Hooks بعد if
  // ...
}, [currentYear, currentMonth]);
```

### بعد (✅ صحيح):
```typescript
const [suggestedStartAyah, setSuggestedStartAyah] = useState<number | null>(null);

useEffect(() => {
  // ...
}, [currentUser?.uid, role]);

✅ const calendarGrid = useMemo(() => {  // صحيح: Hooks أولاً
  return generateCalendarGrid(currentYear, currentMonth);
}, [currentYear, currentMonth]);

✅ const monthStats = useMemo(() => {   // صحيح: جميع Hooks معاً
  // حساب الإحصائيات
}, [assignments, currentMonth, currentYear]);

✅ if (role !== "sheikh") {             // صحيح: الشروط بعد Hooks
  return <UnauthorizedView />;
}
```

---

## 🧹 التنظيف الإضافي

### تم حذف النسخة المكررة:
```typescript
// ❌ تم حذف هذا (كان مكرراً)
const monthStats = useMemo(() => {
  const wirds = Object.values(assignments).filter(...);
  return { totalWirds, holidays, normalWirds };
}, [assignments, currentMonth, currentYear]);
```

الآن توجد **نسخة واحدة فقط** في الموقع الصحيح.

---

## ✨ النتيجة

| قبل | بعد |
|-----|-----|
| ❌ خطأ Hooks order | ✅ ترتيب صحيح |
| ❌ useMemo بعد if | ✅ useMemo قبل if |
| ❌ monthStats مكررة | ✅ monthStats واحدة |
| ❌ عدم الاستقرار | ✅ استقرار كامل |

---

## 🧪 التحقق

```bash
# بعد الإصلاح:
✅ لا توجد أخطاء في Console
✅ الصفحة تحمل بدون تنبيهات
✅ التقويم يعمل بشكل سلس
✅ البيانات تُحفظ بشكل صحيح
```

---

## 📚 المراجع

- [React Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [Understanding Hooks Order](https://reactjs.org/docs/hooks-rules.html)
- [Common Hooks Mistakes](https://react.dev/reference/react#hooks)

---

**الحالة: ✅ مصلح بنجاح**

الملف الآن يتبع أفضل الممارسات ويعمل بدون أخطاء!
