export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface DateRangePreset {
  label: string;
  getValue: () => DateRange;
}
