import { Icon } from '@ttoss/react-icons';
import { Checkbox, Flex, Label, Switch, type SxProp } from '@ttoss/ui';
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
  id?: string;
  name: TName;
  defaultValue?: FieldPathValue<TFieldValues, TName>;
  disabled?: boolean;
  tooltip?: string | React.ReactNode;
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
          <Label
            aria-disabled={disabled}
            tooltip={tooltip}
            onTooltipClick={onTooltipClick}
          >
            <Flex>
              {React.createElement(child.type, { id, ...childProps })}
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
        </Flex>
      );
    });
  }, [render, controllerReturn, label, disabled, id, tooltip, onTooltipClick]);

  return (
    <Flex
      sx={{ flexDirection: 'column', width: '100%', gap: '1', ...sx }}
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
