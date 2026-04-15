export interface PeriodPreset {
  label: string;
  from: Date;
  to: Date;
}

const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Creates the standard set of period presets (today, yesterday, last 7 days,
 * this month, last month, last 30 days, last quarter).
 *
 * Dates are computed lazily relative to the instant the function is called,
 * **not** at module import time.
 */
export const createDefaultPeriodPresets = (): PeriodPreset[] => {
  const now = new Date();
  const today = startOfDay(now);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const last7DaysStart = new Date(today);
  last7DaysStart.setDate(last7DaysStart.getDate() - 6);

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  const last30DaysStart = new Date(today);
  last30DaysStart.setDate(last30DaysStart.getDate() - 29);

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const quarterStartMonth = currentMonth - (currentMonth % 3) - 3;
  const lastQuarterStart = new Date(currentYear, quarterStartMonth, 1);
  const lastQuarterEnd = new Date(currentYear, quarterStartMonth + 3, 0);

  return [
    { label: 'Today', from: today, to: endOfDay(now) },
    {
      label: 'Yesterday',
      from: startOfDay(yesterday),
      to: endOfDay(yesterday),
    },
    { label: 'Last 7 days', from: last7DaysStart, to: endOfDay(now) },
    { label: 'This month', from: thisMonthStart, to: endOfDay(now) },
    {
      label: 'Last month',
      from: startOfDay(lastMonthStart),
      to: endOfDay(lastMonthEnd),
    },
    { label: 'Last 30 days', from: last30DaysStart, to: endOfDay(now) },
    {
      label: 'Last quarter',
      from: startOfDay(lastQuarterStart),
      to: endOfDay(lastQuarterEnd),
    },
  ];
};
