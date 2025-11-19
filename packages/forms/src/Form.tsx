import { Box, BoxProps } from '@ttoss/ui';
import * as React from 'react';
import { FieldValues, FormProvider, FormProviderProps } from 'react-hook-form';

export const Form = <
  TFieldValues extends FieldValues,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TContext = any,
  TTransformedValues = TFieldValues,
>({
  children,
  onSubmit,
  sx,
  ...formMethods
}: {
  children?: React.ReactNode;
  onSubmit?: (data: TTransformedValues) => Promise<void> | void;
  sx?: BoxProps['sx'];
} & FormProviderProps<TFieldValues, TContext, TTransformedValues>) => {
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
