import {
  Checkbox,
  Flex,
  Label,
  Switch,
  type SxProp,
  type TooltipProps,
} from '@ttoss/ui';
import * as React from 'react';
import {
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
  type RegisterOptions,
  useController,
  type UseControllerReturn,
  useFormContext,
} from 'react-hook-form';

import {
  AuxiliaryCheckbox,
  type AuxiliaryCheckboxProps,
} from './AuxiliaryCheckbox';
import { FormErrorMessage } from './FormErrorMessage';

type Rules<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<
  RegisterOptions<TFieldValues, TName>,
  'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
>;

export type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  label?: React.ReactNode;
  id?: string;
  name: TName;
  defaultValue?: FieldPathValue<TFieldValues, TName>;
  disabled?: boolean;
  labelTooltip?: TooltipProps;
  warning?: string | React.ReactNode;
  rules?: Rules<TFieldValues, TName>;
  /**
   * Optional auxiliary checkbox to render between the field and error message.
   * Useful for input confirmation or conditional display of other fields.
   */
  auxiliaryCheckbox?: Omit<
    AuxiliaryCheckboxProps<TFieldValues, FieldPath<TFieldValues>>,
    'disabled'
  >;
} & SxProp;

type FormFieldCompleteProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  render: (
    props: UseControllerReturn<TFieldValues, TName>
  ) => React.ReactElement;
} & FormFieldProps<TFieldValues, TName>;

export const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  id: idProp,
  name,
  defaultValue,
  disabled: propsDisabled,
  labelTooltip,
  sx,
  css,
  render,
  warning,
  rules,
  auxiliaryCheckbox,
}: FormFieldCompleteProps<TFieldValues, TName>) => {
  const controllerReturn = useController<TFieldValues, TName>({
    name,
    defaultValue,
    rules,
  });

  const {
    formState: { errors },
  } = useFormContext();

  const disabled = propsDisabled ?? controllerReturn.field.disabled;

  const hasError = !!errors[name];
  const hasAuxiliaryError = auxiliaryCheckbox
    ? !!errors[auxiliaryCheckbox.name]
    : false;
  const uniqueId = React.useId();
  const id = idProp || `form-field-${name}-${uniqueId}`;

  const isCheckboxOrSwitch = (element: React.ReactElement) => {
    return [Checkbox, Switch].some((component) => {
      return element.type === component;
    });
  };

  // Create a new controllerReturn with the calculated disabled value
  const controllerReturnWithDisabled = React.useMemo(() => {
    return {
      ...controllerReturn,
      field: {
        ...controllerReturn.field,
        disabled,
      },
    };
  }, [controllerReturn, disabled]);

  const memoizedRender = React.useMemo(() => {
    return React.Children.map(render(controllerReturnWithDisabled), (child) => {
      if (!React.isValidElement(child)) {
        return null;
      }

      /**
       * Use cloneElement to properly preserve the ref from the original element.
       * React.createElement loses the ref because refs are not part of element.props.
       * cloneElement preserves all props including the ref.
       */
      const mergeProps = {
        id,
        ...(warning && { trailingIcon: 'warning-alt' }),
      };

      if (label && isCheckboxOrSwitch(child)) {
        return (
          <Label
            aria-disabled={disabled}
            htmlFor={id}
            tooltip={labelTooltip}
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            <Flex
              sx={{
                position: 'relative',
              }}
            >
              {React.cloneElement(child, mergeProps)}
            </Flex>
            {label}
          </Label>
        );
      }

      return (
        <Flex
          sx={{
            width: 'full',
            flexDirection: 'column',
            gap: '2',
          }}
        >
          {label && (
            <Label aria-disabled={disabled} htmlFor={id} tooltip={labelTooltip}>
              {label}
            </Label>
          )}
          {React.cloneElement(child, mergeProps)}
        </Flex>
      );
    });
  }, [
    render,
    controllerReturnWithDisabled,
    label,
    disabled,
    id,
    labelTooltip,
    warning,
  ]);

  /**
   * Determine which error to display: FormField error takes precedence,
   * then show auxiliaryCheckbox error if present.
   */
  const errorNameToDisplay = hasError
    ? name
    : hasAuxiliaryError && auxiliaryCheckbox
      ? auxiliaryCheckbox.name
      : name;

  return (
    <Flex
      sx={{ flexDirection: 'column', width: '100%', gap: '1', ...sx }}
      css={css}
    >
      {memoizedRender}
      {auxiliaryCheckbox && (
        <AuxiliaryCheckbox {...auxiliaryCheckbox} disabled={disabled} />
      )}
      <FormErrorMessage name={errorNameToDisplay} />
      {warning && !hasError && (
        <Flex
          className="warning"
          sx={{
            color: 'feedback.text.caution.default',
            fontSize: 'sm',
            gap: '2',
            paddingBottom: '1',
            alignItems: 'center',
          }}
        >
          {warning}
        </Flex>
      )}
    </Flex>
  );
};
