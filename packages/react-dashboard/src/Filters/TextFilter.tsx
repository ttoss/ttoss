import { FormFieldInput } from '@ttoss/forms';
import * as React from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { DashboardFilterValue } from '../DashboardFilters';

export const TextFilter = (props: {
  name: string;
  label: string;
  value: DashboardFilterValue;
  placeholder?: string;
  onChange: (value: DashboardFilterValue) => void;
}) => {
  const { value, onChange, label, placeholder } = props;

  const formMethods = useForm<{ value: string }>({
    defaultValues: {
      value: value.toString(),
    },
    mode: 'onChange',
  });

  React.useEffect(() => {
    const stringValue = value.toString();
    formMethods.setValue('value', stringValue, { shouldDirty: false });
  }, [value, formMethods]);

  const currentValue = formMethods.watch('value');

  React.useEffect(() => {
    // Only call onChange if the form value differs from the prop value
    // This means the user changed it, not that it was updated from props
    if (currentValue !== undefined && currentValue !== value.toString()) {
      onChange(currentValue);
    }
  }, [currentValue, value, onChange]);

  return (
    <FormProvider {...formMethods}>
      <FormFieldInput
        name="value"
        label={label}
        placeholder={placeholder}
        sx={{ fontSize: 'sm' }}
      />
    </FormProvider>
  );
};
