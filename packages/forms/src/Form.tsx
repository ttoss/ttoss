import * as React from 'react';
import { Box, BoxProps } from '@ttoss/ui';
import { FieldValues, FormProvider, FormProviderProps } from 'react-hook-form';

export const Form = <TFieldValues extends FieldValues = FieldValues>({
  children,
  onSubmit,
  sx,
  ...formMethods
}: {
  children?: React.ReactNode;
  onSubmit?: (data: TFieldValues) => Promise<void> | void;
  sx?: BoxProps['sx'];
} & FormProviderProps<TFieldValues>) => {
  return (
    <FormProvider {...formMethods}>
      <Box
        as="form"
        variant="forms.form"
        onSubmit={formMethods.handleSubmit((data) => {
          return onSubmit?.(data);
        })}
        sx={sx}
      >
        {children}
      </Box>
    </FormProvider>
  );
};
