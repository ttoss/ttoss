import type { BoxProps, FlexProps } from '@ttoss/ui';
import { Box, Flex, Text } from '@ttoss/ui';
import * as React from 'react';

import { FormErrorMessage } from './FormErrorMessage';

type FormGroupContextType = {
  parentLevel?: number;
};

const FormGroupContext = React.createContext<FormGroupContextType>({});

export const useFormGroup = () => {
  const { parentLevel } = React.useContext(FormGroupContext);

  return {
    level: parentLevel,
  };
};

/**
 * Props for the FormGroup component.
 */
export type FormGroupProps = {
  /**
   * The field name used to display a validation error message below the group.
   * Useful when the group maps to an array or object field in the form schema.
   */
  name?: string;
  /**
   * Optional heading displayed above the group's children.
   */
  title?: string;
  /**
   * Optional description displayed below the title.
   */
  description?: string;
  /**
   * Layout direction for the group's children.
   * @default 'column'
   */
  direction?: 'column' | 'row';
} & BoxProps;

const FormGroupWrapper = ({
  title,
  description,
  direction,
  children,
  name,
  ...boxProps
}: FormGroupProps) => {
  const { level } = useFormGroup();

  const childrenContainerSx: FlexProps['sx'] = {
    flexDirection: direction || 'column',
    gap: '1',
    width: '100%',
  };

  return (
    <Box
      aria-level={level}
      {...boxProps}
      sx={{
        marginTop: level === 0 ? 'none' : '4',
        marginBottom: '4',
        ...boxProps.sx,
      }}
    >
      {(title || description) && (
        <Box sx={{ marginBottom: '2' }}>
          {title && (
            <Text
              sx={{
                fontSize: '2xl',
                fontWeight: 'bold',
              }}
            >
              {title}
            </Text>
          )}
          {description && (
            <Text sx={{ color: 'text.secondary' }}>{description}</Text>
          )}
        </Box>
      )}
      <Flex sx={childrenContainerSx}>{children}</Flex>
      {name && <FormErrorMessage name={name} />}
    </Box>
  );
};

/**
 * FormGroup is a layout container that organises form fields into labelled,
 * optionally nested sections. Each nested `FormGroup` increments an internal
 * `level` counter exposed via `useFormGroup`, which drives `aria-level` and
 * top-margin spacing so deeper groups are visually indented.
 *
 * @example
 * ```tsx
 * <FormGroup title="Personal details">
 *   <FormFieldInput name="firstName" label="First name" />
 *   <FormFieldInput name="lastName" label="Last name" />
 *
 *   <FormGroup title="Address" direction="row">
 *     <FormFieldInput name="city" label="City" />
 *     <FormFieldInput name="zip" label="ZIP" />
 *   </FormGroup>
 * </FormGroup>
 * ```
 *
 * @example
 * // Show a group-level validation error (e.g. for an array field)
 * ```tsx
 * <FormGroup name="items" title="Items">
 *   {fields.map((field, i) => (
 *     <FormFieldInput key={field.id} name={`items[${i}].value`} label="Value" />
 *   ))}
 * </FormGroup>
 * ```
 */
export const FormGroup = (props: FormGroupProps) => {
  const { level } = useFormGroup();

  const currentLevel = level === undefined ? 0 : level + 1;

  return (
    <FormGroupContext.Provider value={{ parentLevel: currentLevel }}>
      <FormGroupWrapper {...props} />
    </FormGroupContext.Provider>
  );
};
