import {
  Checkbox,
  Flex,
  Label,
  Switch,
  type SxProp,
  Theme,
  ThemeUIStyleObject,
  Tooltip,
} from '@ttoss/ui';
import * as React from 'react';
import {
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
  useController,
  type UseControllerReturn,
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
  inputTooltip?: {
    render: string | React.ReactNode;
    place: 'bottom' | 'top' | 'left' | 'right';
    openOnClick?: boolean;
    clickable?: boolean;
    variant?: 'info' | 'warning' | 'success' | 'error';
    sx?: ThemeUIStyleObject<Theme>;
  } & SxProp;
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
  inputTooltip,
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
  const tooltipId = `${id}-tooltip`;

  // Estado para controlar a visibilidade da tooltip
  const [showInputTooltip, setShowInputTooltip] = React.useState(false);
  const inputRef = React.useRef<HTMLElement>(null);

  // Effect para adicionar/remover event listeners
  React.useEffect(() => {
    if (!inputTooltip) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowInputTooltip(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowInputTooltip(false);
      }
    };

    if (showInputTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showInputTooltip, inputTooltip]);

  const memoizedRender = React.useMemo(() => {
    return React.Children.map(render(controllerReturn), (child) => {
      if (!React.isValidElement(child)) {
        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const childProps = child.props as any;

      // Adicionar props relacionadas à tooltip no input
      const inputProps = {
        ...childProps,
        ref: inputRef,
        onClick: (e: React.MouseEvent) => {
          childProps.onClick?.(e);
          if (inputTooltip) {
            setShowInputTooltip(true);
          }
        },
        onFocus: (e: React.FocusEvent) => {
          childProps.onFocus?.(e);
          if (inputTooltip && !inputTooltip.openOnClick) {
            setShowInputTooltip(true);
          }
        },
        onBlur: (e: React.FocusEvent) => {
          childProps.onBlur?.(e);
          if (inputTooltip && !inputTooltip.openOnClick) {
            setShowInputTooltip(false);
          }
        },
        ...(inputTooltip && showInputTooltip
          ? { 'data-tooltip-id': tooltipId }
          : {}),
      };

      if (
        label &&
        [Checkbox, Switch].some((component) => {
          return child.type === component;
        })
      ) {
        return (
          <>
            <Label aria-disabled={disabled} tooltip={tooltip}>
              <Flex>
                {warning
                  ? React.createElement(child.type, {
                      id,
                      ...inputProps,
                      ...(warning ? { trailingIcon: 'warning-alt' } : {}),
                    })
                  : React.createElement(child.type, {
                      id,
                      ...inputProps,
                    })}
              </Flex>
              {label}
            </Label>
            {inputTooltip && showInputTooltip && (
              <Flex sx={{ width: 'full', fontSize: 'sm' }}>
                <Tooltip
                  id={tooltipId}
                  place={inputTooltip.place}
                  clickable={inputTooltip.clickable}
                  isOpen={showInputTooltip}
                  variant={inputTooltip.variant}
                >
                  {inputTooltip.render}
                </Tooltip>
              </Flex>
            )}
          </>
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
            <Label aria-disabled={disabled} htmlFor={id} tooltip={tooltip}>
              {label}
            </Label>
          )}
          {warning
            ? React.createElement(child.type, {
                id,
                ...inputProps,
                ...(warning ? { trailingIcon: 'warning-alt' } : {}),
              })
            : React.createElement(child.type, {
                id,
                ...inputProps,
              })}
          {inputTooltip && showInputTooltip && (
            <Flex sx={{ width: 'full', fontSize: 'sm' }}>
              <Tooltip
                id={tooltipId}
                place={inputTooltip.place}
                clickable={inputTooltip.clickable}
                isOpen={showInputTooltip}
                variant={inputTooltip.variant}
                sx={inputTooltip.sx}
              >
                {inputTooltip.render}
              </Tooltip>
            </Flex>
          )}
        </Flex>
      );
    });
  }, [
    render,
    controllerReturn,
    label,
    disabled,
    id,
    tooltip,
    warning,
    inputTooltip,
    showInputTooltip,
    tooltipId,
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
