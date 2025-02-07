import { Checkbox, Flex, Label, Switch, type SxProp } from '@ttoss/ui';
import * as React from 'react';
import {
  FieldPath,
  FieldPathValue,
  FieldValues,
  useController,
  UseControllerReturn,
  useFormContext,
} from 'react-hook-form';

import { FormErrorMessage } from './FormErrorMessage';

export type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  label?: React.ReactNode;
  id?: string;
  name: TName;
  defaultValue?: FieldPathValue<TFieldValues, TName>;
  disabled?: boolean;
  tooltip?: {
    render: string | React.ReactNode;
    place: 'top';
    openOnClick?: boolean;
    clickable?: boolean;
  };
  warning?: string | React.ReactNode;
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
  disabled,
  tooltip,
  sx,
  css,
  render,
  warning,
}: FormFieldCompleteProps<TFieldValues, TName>) => {
  const controllerReturn = useController<TFieldValues, TName>({
    name,
    defaultValue,
  });

  const {
    formState: { errors },
  } = useFormContext();

  const hasError = !!errors[name];

  const uniqueId = React.useId();

  const id = idProp || `form-field-${name}-${uniqueId}`;

  const memoizedRender = React.useMemo(() => {
    return React.Children.map(render(controllerReturn), (child) => {
      if (!React.isValidElement(child)) {
        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const childProps = child.props as any;

      if (
        label &&
        [Checkbox, Switch].some((component) => {
          return child.type === component;
        })
      ) {
        return (
          <Label aria-disabled={disabled} tooltip={tooltip}>
            <Flex>
              {warning
                ? React.createElement(child.type, {
                    id,
                    ...childProps,
                    ...(warning ? { trailingIcon: 'warning-alt' } : {}),
                  })
                : React.createElement(child.type, {
                    id,
                    ...childProps,
                  })}
            </Flex>
            {label}
          </Label>
        );
      }

      return (
        <Flex
          sx={{
            width: '100%',
            flexDirection: 'column',
            gap: '1',
          }}
        >
          {label && (
            <Label aria-disabled={disabled} htmlFor={id} tooltip={tooltip}>
              {label}
            </Label>
          )}
          {warning
            ? React.createElement(child.type, {
                id,
                ...childProps,
                ...(warning ? { trailingIcon: 'warning-alt' } : {}),
              })
            : React.createElement(child.type, {
                id,
                ...childProps,
              })}
        </Flex>
      );
    });
  }, [render, controllerReturn, label, disabled, id, tooltip, warning]);

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
