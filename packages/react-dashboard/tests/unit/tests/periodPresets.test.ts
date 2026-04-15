import { createDefaultPeriodPresets } from 'src/index';

describe('createDefaultPeriodPresets', () => {
  beforeEach(() => {
    // Fix time to 2025-03-15T12:00:00.000Z
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-03-15T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should return 7 presets', () => {
    const presets = createDefaultPeriodPresets();
    expect(presets).toHaveLength(7);
  });

  test('should compute dates lazily at call time', () => {
    const presets1 = createDefaultPeriodPresets();

    jest.setSystemTime(new Date('2025-06-01T12:00:00.000Z'));
    const presets2 = createDefaultPeriodPresets();

    expect(presets1[0].from.getMonth()).toBe(2); // March
    expect(presets2[0].from.getMonth()).toBe(5); // June
  });

  test('Today preset: from start of day to end of day', () => {
    const presets = createDefaultPeriodPresets();
    const today = presets[0];

    expect(today.label).toBe('Today');
    expect(today.from.getFullYear()).toBe(2025);
    expect(today.from.getMonth()).toBe(2);
    expect(today.from.getDate()).toBe(15);
    expect(today.from.getHours()).toBe(0);
    expect(today.from.getMinutes()).toBe(0);
    expect(today.to.getHours()).toBe(23);
    expect(today.to.getMinutes()).toBe(59);
  });

  test('Yesterday preset: full previous day', () => {
    const presets = createDefaultPeriodPresets();
    const yesterday = presets[1];

    expect(yesterday.label).toBe('Yesterday');
    expect(yesterday.from.getDate()).toBe(14);
    expect(yesterday.from.getHours()).toBe(0);
    expect(yesterday.to.getDate()).toBe(14);
    expect(yesterday.to.getHours()).toBe(23);
  });

  test('Last 7 days preset: 6 days back from today', () => {
    const presets = createDefaultPeriodPresets();
    const last7 = presets[2];

    expect(last7.label).toBe('Last 7 days');
    expect(last7.from.getDate()).toBe(9); // March 15 - 6 = March 9
    expect(last7.from.getHours()).toBe(0);
  });

  test('This month preset: from 1st of current month', () => {
    const presets = createDefaultPeriodPresets();
    const thisMonth = presets[3];

    expect(thisMonth.label).toBe('This month');
    expect(thisMonth.from.getDate()).toBe(1);
    expect(thisMonth.from.getMonth()).toBe(2); // March
  });

  test('Last month preset: full previous month', () => {
    const presets = createDefaultPeriodPresets();
    const lastMonth = presets[4];

    expect(lastMonth.label).toBe('Last month');
    expect(lastMonth.from.getMonth()).toBe(1); // February
    expect(lastMonth.from.getDate()).toBe(1);
    expect(lastMonth.to.getMonth()).toBe(1); // February
    expect(lastMonth.to.getDate()).toBe(28); // 2025 is not leap
  });

  test('Last 30 days preset: 29 days back from today', () => {
    const presets = createDefaultPeriodPresets();
    const last30 = presets[5];

    expect(last30.label).toBe('Last 30 days');
    expect(last30.from.getDate()).toBe(14); // March 15 - 29 = Feb 14
    expect(last30.from.getMonth()).toBe(1); // February
  });

  test('Last quarter preset: full previous quarter', () => {
    const presets = createDefaultPeriodPresets();
    const lastQuarter = presets[6];

    // March is in Q1 (months 0,1,2), so last quarter is Q4 of previous year (months 9,10,11)
    expect(lastQuarter.label).toBe('Last quarter');
    expect(lastQuarter.from.getMonth()).toBe(9); // October
    expect(lastQuarter.from.getDate()).toBe(1);
    expect(lastQuarter.to.getMonth()).toBe(11); // December
    expect(lastQuarter.to.getDate()).toBe(31);
  });

  test('all presets have from <= to', () => {
    const presets = createDefaultPeriodPresets();
    for (const preset of presets) {
      expect(preset.from.getTime()).toBeLessThanOrEqual(preset.to.getTime());
    }
  });
});
