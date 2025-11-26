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

      /**
       * Use cloneElement to properly preserve the ref from the original element.
       * In React 19, refs are passed as regular props.
       * React.createElement(child.type, elementProps) loses the ref because
       * it doesn't include the ref from child.props automatically.
       */
      const additionalProps = {
        id,
        ...(warning && { trailingIcon: 'warning-alt' }),
      };

      if (label && isCheckboxOrSwitch(child)) {
        return (
          <Flex
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Flex
              sx={{
                position: 'relative',
              }}
            >
              {React.cloneElement(child, additionalProps)}
            </Flex>
            <Label aria-disabled={disabled} htmlFor={id} tooltip={labelTooltip}>
              {label}
            </Label>
          </Flex>
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
          {React.cloneElement(child, additionalProps)}
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
