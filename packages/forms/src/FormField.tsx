import { Icon } from '@ttoss/react-icons';
import { Flex, Label, type SxProp } from '@ttoss/ui';
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
  label?: string;
  id?: string;
  name: TName;
  defaultValue?: FieldPathValue<TFieldValues, TName>;
  disabled?: boolean;
  tooltip?: boolean;
  onTooltipClick?: () => void;
  warning?: boolean | string;
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
  warning,
}: FormFieldCompleteProps<TFieldValues, TName>) => {
  const controllerReturn = useController<TFieldValues, TName>({
    name,
    defaultValue,
  });

  const id = idProp || `form-field-${name}`;

  const memoizedRender = React.useMemo(() => {
    return React.Children.map(render(controllerReturn), (child) => {
      if (!React.isValidElement(child)) {
        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const childProps = child.props as any;

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
          {React.createElement(child.type, { id, ...childProps })}
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

      {typeof warning === 'string' && (
        <Flex sx={{ color: 'orange', fontSize: 'sm' }}>{warning}</Flex>
      )}
      {typeof warning === 'boolean' && warning === true && (
        <Flex sx={{ color: 'orange', fontSize: 'lg' }}>
          <Icon icon={'line-md:alert'} />
        </Flex>
      )}
    </Flex>
  );
};
