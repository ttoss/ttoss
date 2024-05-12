import * as React from 'react';
import {
  FieldPath,
  FieldPathValue,
  FieldValues,
  UseControllerReturn,
  useController,
} from 'react-hook-form';
import { Flex, Label, type SxProp } from '@ttoss/ui';
import { FormErrorMessage } from './FormErrorMessage';

export type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  label?: string;
  id?: string;
  name: TName;
  defaultValue?: FieldPathValue<TFieldValues, TName>;
  disabled?: boolean;
  tooltip?: boolean;
  onTooltipClick?: () => void;
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
  onTooltipClick,
  sx,
  css,
  render,
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
              aria-disabled={disabled}
              htmlFor={id}
              tooltip={tooltip}
              onTooltipClick={onTooltipClick}
            >
              {label}
            </Label>
          )}

          {React.createElement(child.type, { id, ...child.props })}
        </>
      );
    });
  }, [controllerReturn, disabled, onTooltipClick, tooltip, id, label, render]);

  return (
    <Flex
      sx={{ flexDirection: 'column', width: '100%', gap: 'md', ...sx }}
      css={css}
    >
      {memoizedRender}
      <FormErrorMessage name={name} />
    </Flex>
  );
};
