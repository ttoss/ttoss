import { createDefaultPeriodPresets } from 'src/utils/periodPresets';

describe('createDefaultPeriodPresets', () => {
  beforeEach(() => {
    // Fix the date to 2025-03-15 10:30:00 (Saturday)
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2025, 2, 15, 10, 30, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should return 7 presets', () => {
    const presets = createDefaultPeriodPresets();
    expect(presets).toHaveLength(7);
  });

  test('Today preset should return start and end of current day', () => {
    const presets = createDefaultPeriodPresets();
    const today = presets.find((p) => {
      return p.label === 'Today';
    })!;
    const { from, to } = today.getValue();

    expect(from).toEqual(new Date(2025, 2, 15, 0, 0, 0, 0));
    expect(to).toEqual(new Date(2025, 2, 15, 23, 59, 59, 999));
  });

  test('Yesterday preset should return start and end of previous day', () => {
    const presets = createDefaultPeriodPresets();
    const yesterday = presets.find((p) => {
      return p.label === 'Yesterday';
    })!;
    const { from, to } = yesterday.getValue();

    expect(from).toEqual(new Date(2025, 2, 14, 0, 0, 0, 0));
    expect(to).toEqual(new Date(2025, 2, 14, 23, 59, 59, 999));
  });

  test('Last 7 days preset should span from 6 days ago to today', () => {
    const presets = createDefaultPeriodPresets();
    const last7 = presets.find((p) => {
      return p.label === 'Last 7 days';
    })!;
    const { from, to } = last7.getValue();

    expect(from).toEqual(new Date(2025, 2, 9, 0, 0, 0, 0));
    expect(to).toEqual(new Date(2025, 2, 15, 23, 59, 59, 999));
  });

  test('This month preset should span from first of month to today', () => {
    const presets = createDefaultPeriodPresets();
    const thisMonth = presets.find((p) => {
      return p.label === 'This month';
    })!;
    const { from, to } = thisMonth.getValue();

    expect(from).toEqual(new Date(2025, 2, 1, 0, 0, 0, 0));
    expect(to).toEqual(new Date(2025, 2, 15, 23, 59, 59, 999));
  });

  test('Last month preset should span entire previous month', () => {
    const presets = createDefaultPeriodPresets();
    const lastMonth = presets.find((p) => {
      return p.label === 'Last month';
    })!;
    const { from, to } = lastMonth.getValue();

    expect(from).toEqual(new Date(2025, 1, 1, 0, 0, 0, 0));
    // Last day of Feb 2025 = 28
    expect(to).toEqual(new Date(2025, 1, 28, 23, 59, 59, 999));
  });

  test('Last 30 days preset should span from 29 days ago to today', () => {
    const presets = createDefaultPeriodPresets();
    const last30 = presets.find((p) => {
      return p.label === 'Last 30 days';
    })!;
    const { from, to } = last30.getValue();

    expect(from).toEqual(new Date(2025, 1, 14, 0, 0, 0, 0));
    expect(to).toEqual(new Date(2025, 2, 15, 23, 59, 59, 999));
  });

  test('Last quarter preset should return the previous quarter', () => {
    const presets = createDefaultPeriodPresets();
    const lastQuarter = presets.find((p) => {
      return p.label === 'Last quarter';
    })!;
    const { from, to } = lastQuarter.getValue();

    // March is in Q1 (months 0-2), so last quarter = Q4 of previous year (months 9-11)
    // currentQuarter = Math.floor(2/3) = 0, so (0-1)*3 = -3 → wraps to Oct
    // Actually: new Date(2025, -3, 1) = new Date(2024, 9, 1) = Oct 1, 2024
    // end: new Date(2025, 0, 0) = Dec 31, 2024
    expect(from).toEqual(new Date(2024, 9, 1, 0, 0, 0, 0));
    expect(to).toEqual(new Date(2024, 11, 31, 23, 59, 59, 999));
  });

  test('should compute dates at call time, not at import time', () => {
    const presets1 = createDefaultPeriodPresets();
    const today1 = presets1.find((p) => {
      return p.label === 'Today';
    })!;
    const { from: from1 } = today1.getValue();

    // Advance time by 1 day
    jest.setSystemTime(new Date(2025, 2, 16, 10, 30, 0));

    const presets2 = createDefaultPeriodPresets();
    const today2 = presets2.find((p) => {
      return p.label === 'Today';
    })!;
    const { from: from2 } = today2.getValue();

    expect(from1).toEqual(new Date(2025, 2, 15, 0, 0, 0, 0));
    expect(from2).toEqual(new Date(2025, 2, 16, 0, 0, 0, 0));
  });

  test('preset labels should match expected values', () => {
    const presets = createDefaultPeriodPresets();
    const labels = presets.map((p) => {
      return p.label;
    });
    expect(labels).toEqual([
      'Today',
      'Yesterday',
      'Last 7 days',
      'This month',
      'Last month',
      'Last 30 days',
      'Last quarter',
    ]);
  });
});
