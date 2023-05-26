import * as React from 'react';
import { ErrorMessage } from './ErrorMessage';
import {
  FieldPath,
  FieldPathValue,
  FieldValues,
  UseControllerReturn,
  useController,
} from 'react-hook-form';
import { Flex, type FlexProps, Label } from '@ttoss/ui';

export type FormFieldProps = {
  sx?: FlexProps['sx'];
  disabled?: boolean;
  tooltip?: boolean;
  onTooltipClick?: () => void;
};

type FormFieldCompleteProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  label?: string;
  id?: string;
  name: TName;
  defaultValue?: FieldPathValue<TFieldValues, TName>;
  render: (
    props: UseControllerReturn<TFieldValues, TName>
  ) => React.ReactElement;
} & FormFieldProps;

export const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  label,
  id: idProp,
  name,
  defaultValue,
  sx,
  render,
  ...formFieldProps
}: FormFieldCompleteProps<TFieldValues, TName>) => {
  const controllerReturn = useController<TFieldValues, TName>({
    name,
    defaultValue,
  });

  const id = idProp || `form-field-${name}`;

  const memoizedRender = React.useMemo(() => {
    return React.Children.map(render(controllerReturn), (child) => {
      return (
        <>
          {label && (
            <Label
              aria-disabled={formFieldProps.disabled}
              htmlFor={id}
              tooltip={formFieldProps.tooltip}
              onTooltipClick={formFieldProps.onTooltipClick}
            >
              {label}
            </Label>
          )}

          {React.createElement(child.type, { id, ...child.props })}
        </>
      );
    });
  }, [
    controllerReturn,
    formFieldProps.disabled,
    formFieldProps.onTooltipClick,
    formFieldProps.tooltip,
    id,
    label,
    render,
  ]);

  return (
    <Flex sx={{ flexDirection: 'column', width: '100%', gap: 'md', ...sx }}>
      {memoizedRender}
      <ErrorMessage name={name} />
    </Flex>
  );
};
