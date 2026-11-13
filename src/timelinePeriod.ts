// Year strings without a 3–4 digit numeral (for example "宋庆元年间")
// belong with the earlier period. They are not dropped from both filters.
export function timelineYear(year: string): number | null {
  const match = String(year ?? "").match(/\d{3,4}/);
  return match ? Number(match[0]) : null;
}

export function matchesTimelinePeriod(year: string, period: string): boolean {
  if (period === "全部年代") return true;
  const value = timelineYear(year);
  if (period === "1949年以前") return value === null || value < 1949;
  return value !== null && value >= 1949;
}
