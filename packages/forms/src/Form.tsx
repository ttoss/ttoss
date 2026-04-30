import type { BoxProps } from '@ttoss/ui';
import { Box } from '@ttoss/ui';
import type * as React from 'react';
import type { FieldValues, FormProviderProps } from 'react-hook-form';
import { FormProvider } from 'react-hook-form';

import { FormActions } from './FormActions';
import { FormGroup } from './FormGroup';
import { UnsavedChangesBlocker } from './UnsavedChangesBlocker';

const FormBase = <
  TFieldValues extends FieldValues,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TContext = any,
  TTransformedValues = TFieldValues,
>({
  children,
  onSubmit,
  sx,
  warnOnUnsavedChanges,
  ...formMethods
}: {
  children?: React.ReactNode;
  onSubmit?: (data: TTransformedValues) => Promise<void> | void;
  sx?: BoxProps['sx'];
  /**
   * When `true`, blocks in-app navigation and shows a confirmation modal
   * if the form has unsaved changes (`formState.isDirty`). Also triggers
   * the browser's native `beforeunload` prompt on page refresh / tab close.
   * @default false
   */
  warnOnUnsavedChanges?: boolean;
} & FormProviderProps<TFieldValues, TContext, TTransformedValues>) => {
  return (
    <FormProvider {...formMethods}>
      <Box
        as="form"
        variant="forms.form"
        onSubmit={formMethods.handleSubmit((data) => {
          return onSubmit?.(data);
        })}
        sx={{ display: 'flex', flexDirection: 'column', gap: '4', ...sx }}
      >
        {children}
      </Box>
      {warnOnUnsavedChanges && <UnsavedChangesBlocker />}
    </FormProvider>
  );
};

/**
 * Form is the root component for all form compositions. It wraps
 * `react-hook-form`'s `FormProvider` and an HTML `<form>` element,
 * forwarding submission handling.
 *
 * Use the compound sub-components for structure:
 * - `Form.Group` – groups related fields with optional title/description
 * - `Form.Actions` – footer bar for Submit / Cancel / Reset buttons
 *
 * @example
 * ```tsx
 * const methods = useForm<FormValues>();
 *
 * <Form {...methods} onSubmit={handleSubmit}>
 *   <Form.Group title="Personal details">
 *     <FormFieldInput name="firstName" label="First name" />
 *   </Form.Group>
 *   <Form.Actions>
 *     <Button variant="secondary" onClick={onCancel}>Cancel</Button>
 *     <Button type="submit">Save</Button>
 *   </Form.Actions>
 * </Form>
 * ```
 */
export const Form = Object.assign(FormBase, {
  Group: FormGroup,
  Actions: FormActions,
});
