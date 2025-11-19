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
  };
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
  disabled,
  tooltip,
  inputTooltip,
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

  const hasError = !!errors[name];
  const uniqueId = React.useId();
  const id = idProp || `form-field-${name}-${uniqueId}`;
  const tooltipId = `${id}-tooltip`;

  // Estado para controlar a visibilidade da tooltip
  const [showInputTooltip, setShowInputTooltip] = React.useState(false);
  const inputRef = React.useRef<HTMLElement>(null);

  // Handlers estáveis para evitar re-renders
  const handleClickOutside = React.useCallback((event: MouseEvent) => {
    if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
      setShowInputTooltip(false);
    }
  }, []);

  const handleEscapeKey = React.useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowInputTooltip(false);
    }
  }, []);

  // Effect para adicionar/remover event listeners
  React.useEffect(() => {
    if (!inputTooltip || !showInputTooltip) {
      return;
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showInputTooltip, inputTooltip, handleClickOutside, handleEscapeKey]);

  // Handlers do input
  const handleInputClick = React.useCallback(() => {
    if (inputTooltip) {
      setShowInputTooltip(true);
    }
  }, [inputTooltip]);

  const handleInputFocus = React.useCallback(() => {
    if (inputTooltip && !inputTooltip.openOnClick) {
      setShowInputTooltip(true);
    }
  }, [inputTooltip]);

  const handleInputBlur = React.useCallback(() => {
    if (inputTooltip && !inputTooltip.openOnClick) {
      setShowInputTooltip(false);
    }
  }, [inputTooltip]);

  const tooltipElement = React.useMemo(() => {
    if (!inputTooltip || !showInputTooltip) {
      return null;
    }

    return (
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
    );
  }, [inputTooltip, showInputTooltip, tooltipId]);

  const isCheckboxOrSwitch = (element: React.ReactElement) => {
    return [Checkbox, Switch].some((component) => {
      return element.type === component;
    });
  };

  const memoizedRender = React.useMemo(() => {
    return React.Children.map(render(controllerReturn), (child) => {
      if (!React.isValidElement(child)) {
        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const childProps = child.props as any;

      const inputProps = {
        ...childProps,
        ref: inputRef,
        onClick: (e: React.MouseEvent) => {
          childProps.onClick?.(e);
          handleInputClick();
        },
        onFocus: (e: React.FocusEvent) => {
          childProps.onFocus?.(e);
          handleInputFocus();
        },
        onBlur: (e: React.FocusEvent) => {
          childProps.onBlur?.(e);
          handleInputBlur();
        },
        ...(inputTooltip && showInputTooltip
          ? { 'data-tooltip-id': tooltipId }
          : {}),
      };

      const elementProps = {
        id,
        ...inputProps,
        ...(warning && { trailingIcon: 'warning-alt' }),
      };

      if (label && isCheckboxOrSwitch(child)) {
        return (
          <>
            <Label aria-disabled={disabled} tooltip={tooltip}>
              <Flex
                sx={{
                  position: 'relative',
                }}
              >
                {React.createElement(child.type, elementProps)}
              </Flex>
              {label}
            </Label>
            {tooltipElement}
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
          {React.createElement(child.type, elementProps)}
          {tooltipElement}
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
    handleInputClick,
    handleInputFocus,
    handleInputBlur,
    tooltipElement,
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
