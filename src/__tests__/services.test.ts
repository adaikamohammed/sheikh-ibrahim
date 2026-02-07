/**
 * اختبارات بسيطة للدوال الرياضية
 */

import {
  calculateCompletionRate,
  calculateWeeklyStats,
  calculateMonthlyStats,
} from "@/services/progressService";

import {
  calculateGrowthRate,
  calculateMovingAverage,
  calculateMedian,
  predictNextValue,
} from "@/lib/math";

describe("Progress Service", () => {
  describe("calculateCompletionRate", () => {
    it("should return 0 when target is 0", () => {
      const result = calculateCompletionRate(50, 0);
      expect(result).toBe(0);
    });

    it("should return 100 when current equals target", () => {
      const result = calculateCompletionRate(100, 100);
      expect(result).toBe(100);
    });

    it("should calculate correct percentage", () => {
      const result = calculateCompletionRate(50, 100);
      expect(result).toBe(50);
    });

    it("should cap at 100%", () => {
      const result = calculateCompletionRate(150, 100);
      expect(result).toBe(100);
    });
  });

  describe("calculateWeeklyStats", () => {
    it("should calculate weekly statistics correctly", () => {
      const dailyProgress = {
        "2025-02-01": 100,
        "2025-02-02": 80,
        "2025-02-03": 100,
        "2025-02-04": 120,
        "2025-02-05": 90,
        "2025-02-06": 110,
        "2025-02-07": 100,
      };

      const result = calculateWeeklyStats(dailyProgress, "2025-02-07");

      expect(result.totalCompletions).toBe(700);
      expect(result.completedDays).toBe(7);
      expect(result.averagePerDay).toBe(100);
    });

    it("should handle missing days", () => {
      const dailyProgress = {
        "2025-02-01": 100,
        "2025-02-05": 100,
        "2025-02-07": 100,
      };

      const result = calculateWeeklyStats(dailyProgress, "2025-02-07");

      expect(result.completedDays).toBe(3);
      expect(result.totalCompletions).toBe(300);
    });
  });
});

describe("Math Utilities", () => {
  describe("calculateGrowthRate", () => {
    it("should calculate positive growth", () => {
      const result = calculateGrowthRate(100, 150);
      expect(result).toBe(50);
    });

    it("should calculate negative growth", () => {
      const result = calculateGrowthRate(100, 50);
      expect(result).toBe(-50);
    });

    it("should return 100 when previous is 0", () => {
      const result = calculateGrowthRate(0, 100);
      expect(result).toBe(100);
    });

    it("should return 0 when both are 0", () => {
      const result = calculateGrowthRate(0, 0);
      expect(result).toBe(0);
    });
  });

  describe("calculateMovingAverage", () => {
    it("should calculate correct moving average", () => {
      const numbers = [10, 20, 30, 40, 50];
      const result = calculateMovingAverage(numbers, 3);

      expect(result[0]).toBe(10);
      expect(result[1]).toBe(15);
      expect(result[2]).toBe(20);
      expect(result[3]).toBe(30);
      expect(result[4]).toBe(40);
    });
  });

  describe("calculateMedian", () => {
    it("should find median of odd-length array", () => {
      const numbers = [1, 3, 5];
      const result = calculateMedian(numbers);
      expect(result).toBe(3);
    });

    it("should find median of even-length array", () => {
      const numbers = [1, 2, 3, 4];
      const result = calculateMedian(numbers);
      expect(result).toBe(2.5);
    });

    it("should handle single element", () => {
      const numbers = [42];
      const result = calculateMedian(numbers);
      expect(result).toBe(42);
    });
  });

  describe("predictNextValue", () => {
    it("should predict linear progression", () => {
      const numbers = [10, 20, 30, 40, 50];
      const result = predictNextValue(numbers);
      expect(result).toBeCloseTo(60, 1);
    });

    it("should handle constant values", () => {
      const numbers = [100, 100, 100, 100];
      const result = predictNextValue(numbers);
      expect(result).toBeCloseTo(100, 1);
    });
  });
});
