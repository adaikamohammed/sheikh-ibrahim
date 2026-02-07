/**
 * متغيرات CSS والألوان
 */

export const colorVariables = {
  primary: "var(--color-primary, #d4af37)", // ذهبي
  secondary: "var(--color-secondary, #10b981)", // أخضر
  success: "var(--color-success, #10b981)",
  warning: "var(--color-warning, #f59e0b)",
  danger: "var(--color-danger, #ef4444)",
  info: "var(--color-info, #3b82f6)",
  background: "var(--color-background, #020617)",
  foreground: "var(--color-foreground, #ffffff)",
  muted: "var(--color-muted, #64748b)",
};

// دالة لتحويل الألوان
export const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

// فئات Tailwind للألوان الديناميكية
export const colorClasses = {
  primary: "text-primary bg-primary/10",
  success: "text-emerald-500 bg-emerald-500/10",
  warning: "text-orange-500 bg-orange-500/10",
  danger: "text-red-500 bg-red-500/10",
  info: "text-blue-500 bg-blue-500/10",
};

// تأثيرات الظلال
export const shadowEffects = {
  glow: "shadow-[0_0_15px_rgba(212,175,55,0.3)]",
  glowSuccess: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
  glowWarning: "shadow-[0_0_15px_rgba(245,158,11,0.2)]",
  card: "shadow-lg",
  sm: "shadow-sm",
};
