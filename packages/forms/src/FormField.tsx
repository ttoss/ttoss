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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const childProps = child.props as any;

      const elementProps = {
        id,
        ...childProps,
        ...(warning && { trailingIcon: 'warning-alt' }),
      };

      if (label && isCheckboxOrSwitch(child)) {
        return (
          <Label
            aria-disabled={disabled}
            htmlFor={id}
            tooltip={labelTooltip}
            sx={{
              display: 'flex',
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
              {React.createElement(child.type, elementProps)}
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
          {React.createElement(child.type, elementProps)}
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

  return (
    <Flex
      sx={{ flexDirection: 'column', width: '100%', gap: '1', ...sx }}
      css={css}
    >
      {memoizedRender}
      <FormErrorMessage name={name} />
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
