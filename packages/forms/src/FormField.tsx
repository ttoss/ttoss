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
import {
  type FeedbackTooltipProps,
  FormFeedbackMessage,
} from './FormFeedbackMessage';

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
  feedbackMessage?: string | React.ReactNode;
  feedbackMaxLines?: number;
  feedbackTooltipProps?: FeedbackTooltipProps;
  feedbackTooltipLabel?: string;
  feedbackVariant?: 'success' | 'warning' | 'error' | 'info';
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
  sx,
  css,
  render,
  feedbackMessage,
  feedbackMaxLines,
  feedbackTooltipProps,
  feedbackTooltipLabel,
  feedbackVariant = 'warning',
  tooltip,
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

      const getTrailingIcon = () => {
        if (!feedbackMessage) return undefined;
        switch (feedbackVariant || 'warning') {
          case 'success':
            return 'fluent:checkmark-circle-16-regular';
          case 'warning':
            return 'warning-alt';
          case 'error':
            return 'warning-alt';
          case 'info':
            return 'fluent:info-20-regular';
          default:
            return 'warning-alt';
        }
      };

      if (
        label &&
        [Checkbox, Switch].some((component) => {
          return child.type === component;
        })
      ) {
        return (
          <Label aria-disabled={disabled} tooltip={tooltip}>
            <Flex>
              {React.createElement(child.type, {
                id,
                ...childProps,
                ...(feedbackMessage ? { trailingIcon: getTrailingIcon() } : {}),
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
          {React.createElement(child.type, {
            id,
            ...childProps,
            ...(feedbackMessage ? { trailingIcon: getTrailingIcon() } : {}),
          })}
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
    feedbackMessage,
    feedbackVariant,
  ]);

  return (
    <Flex
      sx={{ flexDirection: 'column', width: '100%', gap: '1', ...sx }}
      css={css}
    >
      {memoizedRender}
      <FormErrorMessage name={name} />
      <FormFeedbackMessage
        name={name}
        feedbackMessage={feedbackMessage}
        feedbackMaxLines={feedbackMaxLines}
        feedbackTooltipProps={feedbackTooltipProps}
        feedbackTooltipLabel={feedbackTooltipLabel}
        feedbackVariant={feedbackVariant}
      />
    </Flex>
  );
};
