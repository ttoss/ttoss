import type { DateRange } from '../Filters/DateRangeFilter';

export type PeriodPreset = {
  label: string;
  getValue: () => DateRange;
};

/**
 * Creates the standard set of period presets for date-range filters.
 *
 * Dates are computed lazily at call time — the factory itself captures
 * nothing from module-load time.
 */
export const createDefaultPeriodPresets = (): PeriodPreset[] => {
  return [
    {
      label: 'Today',
      getValue: () => {
        const now = new Date();
        const start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );
        return { from: start, to: end };
      },
    },
    {
      label: 'Yesterday',
      getValue: () => {
        const now = new Date();
        const start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 1
        );
        const end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 1,
          23,
          59,
          59,
          999
        );
        return { from: start, to: end };
      },
    },
    {
      label: 'Last 7 days',
      getValue: () => {
        const now = new Date();
        const start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 6
        );
        const end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );
        return { from: start, to: end };
      },
    },
    {
      label: 'This month',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );
        return { from: start, to: end };
      },
    },
    {
      label: 'Last month',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59,
          999
        );
        return { from: start, to: end };
      },
    },
    {
      label: 'Last 30 days',
      getValue: () => {
        const now = new Date();
        const start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 29
        );
        const end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );
        return { from: start, to: end };
      },
    },
    {
      label: 'Last quarter',
      getValue: () => {
        const now = new Date();
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const start = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
        const end = new Date(
          now.getFullYear(),
          currentQuarter * 3,
          0,
          23,
          59,
          59,
          999
        );
        return { from: start, to: end };
      },
    },
  ];
};
