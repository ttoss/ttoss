import { Box, Flex, Label, type SxProp } from '@ttoss/ui';
import * as React from 'react';
import {
  FieldPath,
  FieldPathValue,
  FieldValues,
  useController,
  UseControllerReturn,
} from 'react-hook-form';

import { FormErrorMessage } from './FormErrorMessage';

export type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  label?: React.ReactNode;
  labelPosition?: 'top' | 'bottom' | 'left' | 'right';
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
  labelPosition = 'top',
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

  const uniqueId = React.useId();

  const id = idProp || `form-field-${name}-${uniqueId}`;

  const memoizedRender = React.useMemo(() => {
    return React.Children.map(render(controllerReturn), (child) => {
      if (!React.isValidElement(child)) {
        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const childProps = child.props as any;

      const isLabelHorizontal = ['left', 'right'].includes(labelPosition);

      const labelFontSize = isLabelHorizontal ? 'md' : 'sm';

      const flexDirectionMap = {
        top: 'column',
        bottom: 'column-reverse',
        left: 'row',
        right: 'row-reverse',
      };

      return (
        <Flex
          sx={{
            width: '100%',
            flexDirection: flexDirectionMap[labelPosition] as
              | 'row'
              | 'column'
              | 'row-reverse'
              | 'column-reverse',
            gap: 'sm',
          }}
        >
          {label && (
            <Label
              aria-disabled={disabled}
              htmlFor={id}
              tooltip={tooltip}
              onTooltipClick={onTooltipClick}
              sx={{
                fontSize: labelFontSize,
              }}
            >
              {label}
            </Label>
          )}
          <Box>{React.createElement(child.type, { id, ...childProps })}</Box>
        </Flex>
      );
    });
  }, [
    render,
    controllerReturn,
    labelPosition,
    label,
    disabled,
    id,
    tooltip,
    onTooltipClick,
  ]);

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
