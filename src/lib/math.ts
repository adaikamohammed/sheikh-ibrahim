/**
 * دوال حسابية ومساعدة متقدمة
 */

/**
 * حساب نسبة النمو بين قيمتين
 */
export function calculateGrowthRate(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * حساب الانحراف المعياري
 */
export function calculateStandardDeviation(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const squaredDiffs = numbers.map((n) => Math.pow(n - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
  
  return Math.sqrt(variance);
}

/**
 * حساب المتوسط المتحرك
 */
export function calculateMovingAverage(numbers: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < numbers.length; i++) {
    const slice = numbers.slice(Math.max(0, i - period + 1), i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    result.push(avg);
  }
  return result;
}

/**
 * حساب الربع الأول (Q1)
 */
export function calculateQ1(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length / 4) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * حساب الوسيط (Q2/Median)
 */
export function calculateMedian(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * حساب الربع الثالث (Q3)
 */
export function calculateQ3(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = Math.ceil((sorted.length * 3) / 4) - 1;
  return sorted[Math.min(sorted.length - 1, index)];
}

/**
 * حساب نطاق البيانات (Range)
 */
export function calculateRange(numbers: number[]): { min: number; max: number; range: number } {
  if (numbers.length === 0) return { min: 0, max: 0, range: 0 };
  
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  
  return {
    min,
    max,
    range: max - min,
  };
}

/**
 * تصنيف القيمة في التوزيع الطبيعي
 */
export function classifyValue(
  value: number,
  mean: number,
  stdDev: number
): "outlier" | "extreme" | "high" | "normal" | "low" {
  if (stdDev === 0) return "normal";
  
  const zScore = (value - mean) / stdDev;
  
  if (Math.abs(zScore) > 3) return "outlier";
  if (Math.abs(zScore) > 2) return "extreme";
  if (zScore > 1) return "high";
  if (zScore < -1) return "low";
  
  return "normal";
}

/**
 * حساب معامل الارتباط (Pearson Correlation)
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let sumX2 = 0;
  let sumY2 = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    sumX2 += dx * dx;
    sumY2 += dy * dy;
  }
  
  const denominator = Math.sqrt(sumX2 * sumY2);
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * التنبؤ بالقيمة التالية (Linear Regression)
 */
export function predictNextValue(numbers: number[]): number {
  if (numbers.length < 2) return numbers[numbers.length - 1] || 0;
  
  const n = numbers.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = numbers;
  
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denominator += dx * dx;
  }
  
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;
  
  return slope * n + intercept;
}

/**
 * حساب الربح/الخسارة كنسبة مئوية
 */
export function calculatePercentageChange(original: number, current: number): number {
  if (original === 0) return current > 0 ? 100 : 0;
  return ((current - original) / original) * 100;
}

/**
 * تقريب الرقم لعدد محدد من الأرقام العشرية
 */
export function roundTo(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * تنسيق الرقم بفواصل ألوف
 */
export function formatNumber(value: number, locale: string = "ar-EG"): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * حساب النسبة المئوية مع تحديد دقيقة
 */
export function calculatePercentage(part: number, whole: number, decimals: number = 1): number {
  if (whole === 0) return 0;
  return roundTo((part / whole) * 100, decimals);
}
