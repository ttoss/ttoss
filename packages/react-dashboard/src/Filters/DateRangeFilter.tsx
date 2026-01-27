import { type DateRangePreset, FormFieldDatePicker } from '@ttoss/forms';
import { FormProvider, useForm } from '@ttoss/forms';
import type { SxProp } from '@ttoss/ui';
import * as React from 'react';

export type { DateRange } from '@ttoss/components/DatePicker';

interface DateRangePickerProps {
  sx?: SxProp['sx'];
  label: string;
  value?: { from: Date | undefined; to: Date | undefined };
  presets?: DateRangePreset[];
  onChange?: (
    range: { from: Date | undefined; to: Date | undefined } | undefined
  ) => void;
}

export const DateRangeFilter = ({
  sx,
  label,
  value,
  presets,
  onChange,
}: DateRangePickerProps) => {
  const formMethods = useForm<{ dateRange: typeof value }>({
    defaultValues: {
      dateRange: value,
    },
    mode: 'onChange',
  });

  React.useEffect(() => {
    if (value !== undefined) {
      formMethods.setValue('dateRange', value, { shouldDirty: false });
    }
  }, [value, formMethods]);

  const currentValue = formMethods.watch('dateRange');

  const dateRangesEqual = React.useCallback(
    (
      a: { from: Date | undefined; to: Date | undefined } | undefined,
      b: { from: Date | undefined; to: Date | undefined } | undefined
    ) => {
      if (a === b) {
        return true;
      }
      if (!a || !b) {
        return false;
      }
      const aFrom = a.from?.getTime();
      const aTo = a.to?.getTime();
      const bFrom = b.from?.getTime();
      const bTo = b.to?.getTime();
      return aFrom === bFrom && aTo === bTo;
    },
    []
  );

  React.useEffect(() => {
    if (currentValue !== undefined && !dateRangesEqual(currentValue, value)) {
      onChange?.(currentValue);
    }
  }, [currentValue, value, onChange, dateRangesEqual]);

  return (
    <FormProvider {...formMethods}>
      <FormFieldDatePicker
        name="dateRange"
        label={label}
        presets={presets}
        sx={sx}
      />
    </FormProvider>
  );
};
