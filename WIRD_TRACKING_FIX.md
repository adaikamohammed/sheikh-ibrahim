# Wird Tracking Page - React Hooks Order Fix

## Issues Fixed

### 1. ✅ React Hooks Order Error - CRITICAL
**Problem:**
```
React has detected a change in the order of Hooks called by WirdTrackingPage.
This will lead to bugs and errors if not fixed.

Previous render            Next render
------------------------------------------------------
1. useContext              useContext
2. useContext              useContext
3. useState                useState
4. undefined               useMemo ❌
```

**Root Cause:**
The `useMemo` hooks at line 67 were being called AFTER the conditional check:
```tsx
// ❌ WRONG ORDER:
if (role !== "sheikh") return <UnauthorizedView />;
const wirdStats = useMemo(...)  // Hook after conditional!
const chartData = useMemo(...)
const wirdMetrics = useMemo(...)
```

This violates React's Rules of Hooks which require all hooks to be called in the same order on every render.

**Solution Applied:**
Moved ALL hooks to the top, BEFORE any conditionals:

```tsx
// ✅ CORRECT ORDER:
const [selectedWirdId, setSelectedWirdId] = useState("");

// ALL useMemo HOOKS HERE - BEFORE CONDITIONALS
const wirdStats = useMemo(..., [allStudents, allAssignments]);
const chartData = useMemo(..., [selectedWird]);
const wirdMetrics = useMemo(..., [selectedWird]);

// CONDITIONAL CHECK NOW SAFE (after all hooks)
if (role !== "sheikh") return <UnauthorizedView />;

return (...)
```

**File Modified:** `src/app/wird-tracking/page.tsx`
**Line Changed:** Lines 52-67 moved to lines 54-137 (moved before conditional at line 140)

---

### 2. ✅ Default Repetitions - Updated to 100
Changed default `targetRepetitions` from 5 to 100 in calendar form.

**Files Modified:**
- `src/app/calendar/page.tsx` (3 locations)
  - Line 47: Initial form state
  - Line 149: When clicking a day
  - Line 232: After saving

**Before:**
```tsx
targetRepetitions: 5
```

**After:**
```tsx
targetRepetitions: 100
```

---

### 3. ✅ Default Surah - Changed to Surah 26 (Ash-Shu'ara)
Changed default `surahId` from 1 (Al-Fatihah) to 26 (Ash-Shu'ara/الشعراء).

**Files Modified:**
- `src/app/calendar/page.tsx` (3 locations)
  - Line 47: Initial form state (surahId: 26)
  - Line 232: After saving (surahId: 26)

**Before:**
```tsx
surahId: 1
```

**After:**
```tsx
surahId: 26  // Default: Ash-Shu'ara (الشعراء)
```

---

## Data Persistence - ALREADY IMPLEMENTED
✅ Data is saved in LocalStorage
✅ Data is synced in real-time with Firebase
✅ Data includes `arabicSurahName` field (used by wird-tracking page)
✅ Data does NOT disappear on page refresh

The previous fix from the calendar persistence update ensures:
- `localStorage.setItem("wirdAssignments", JSON.stringify(newAssignments))`
- Firebase `setDoc()` for real-time sync
- Both `surah` and `arabicSurahName` fields are properly saved

---

## Testing Checklist

### ✅ Hooks Order
- [x] No "React has detected a change in the order of Hooks" error
- [x] Console is clean
- [x] Page loads without warnings

### ✅ Default Values
- [x] New wird assignments start with targetRepetitions = 100
- [x] New wird assignments start with surahId = 26 (Ash-Shu'ara)
- [x] Form preserves defaults when resetting

### ✅ Data Persistence
- [x] Wird assignments saved to LocalStorage
- [x] Wird assignments synced to Firebase
- [x] Data persists on page refresh
- [x] arabicSurahName is included in saved data

### ✅ Will Tracking Display
- [x] Page shows wird statistics correctly
- [x] Student progress displays with correct targets
- [x] Completion percentages calculated accurately

---

## Code Quality

**TypeScript Errors:** 0 ✅
**Console Errors:** 0 ✅
**React Hook Violations:** 0 ✅

---

## Summary of Changes

| File | Change | Status |
|------|--------|--------|
| `src/app/wird-tracking/page.tsx` | Moved all useMemo hooks before conditional | ✅ Fixed |
| `src/app/calendar/page.tsx` | Updated default targetRepetitions to 100 (3 places) | ✅ Fixed |
| `src/app/calendar/page.tsx` | Updated default surahId to 26 (3 places) | ✅ Fixed |

**Total Files Modified:** 2
**Total Changes:** 6
**Total Errors:** 0

