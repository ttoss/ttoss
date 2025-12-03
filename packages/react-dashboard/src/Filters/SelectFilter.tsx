import { FormFieldSelect, FormProvider, useForm } from '@ttoss/forms';
import * as React from 'react';

import { DashboardFilterValue } from '../DashboardFilters';

type SelectValue = string | number | boolean;

export const SelectFilter = (props: {
  name: string;
  label: string;
  value: DashboardFilterValue;
  options: { label: string; value: string | number | boolean }[];
  onChange: (value: DashboardFilterValue | undefined) => void;
}) => {
  const { value, onChange, label, options } = props;

  const formMethods = useForm<{ value: SelectValue }>({
    defaultValues: {
      value: value as SelectValue,
    },
    mode: 'onChange',
  });

  React.useEffect(() => {
    const propValue = value as SelectValue;
    formMethods.setValue('value', propValue, { shouldDirty: false });
  }, [value, formMethods]);

  const currentValue = formMethods.watch('value');

  React.useEffect(() => {
    // Only call onChange if the form value differs from the prop value
    // This means the user changed it, not that it was updated from props
    if (currentValue !== undefined && currentValue !== (value as SelectValue)) {
      onChange(currentValue);
    }
  }, [currentValue, value, onChange]);

  return (
    <FormProvider {...formMethods}>
      <FormFieldSelect
        name="value"
        label={label}
        options={options}
        sx={{ fontSize: 'sm' }}
      />
    </FormProvider>
  );
};
