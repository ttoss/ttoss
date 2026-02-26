import type { ThemeUIStyleObject } from '@ttoss/ui';
import { Box, Flex, Tag, Text } from '@ttoss/ui';
import type * as React from 'react';
import type { FieldPath, FieldValues } from 'react-hook-form';

import { FormField, type FormFieldProps } from './FormField';

export type FormRadioOption = {
  value: string | number;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  tag?: {
    label: string;
    variant?:
      | 'accent'
      | 'positive'
      | 'caution'
      | 'muted'
      | 'negative'
      | 'primary'
      | 'secondary'
      | 'default';
    sx?: ThemeUIStyleObject;
  };
};

export type FormFieldRadioCardIconyProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldProps<TFieldValues, TName> & {
  options: FormRadioOption[];
  direction?: 'column' | 'row';
  width?: string;
};

export const FormFieldRadioCardIcony = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  disabled,
  ...props
}: FormFieldRadioCardIconyProps<TFieldValues, TName>) => {
  const {
    label,
    name,
    labelTooltip,
    warning,
    sx,
    css,
    rules,
    id,
    defaultValue,
    unsavedChangesGuard,
    options,
    direction = 'row',
    width = 'full',
  } = props;

  return (
    <FormField
      id={id}
      label={label}
      name={name}
      labelTooltip={labelTooltip}
      warning={warning}
      sx={sx}
      css={css}
      defaultValue={defaultValue}
      rules={rules}
      disabled={disabled}
      unsavedChangesGuard={unsavedChangesGuard}
      render={({ field }) => {
        const isDisabled = disabled ?? field.disabled;
        const handleOptionClick = (optionValue: string | number) => {
          if (!isDisabled) {
            field.onChange(optionValue);
            field.onBlur();
          }
        };

        return (
          <Flex
            sx={{
              flexDirection: direction,
              gap: '4',
            }}
          >
            {options.map((option: FormRadioOption) => {
              const key = `form-field-radio-card-${name}-${option.value}`;
              const isSelected = field.value === option.value;
              const IconComponent = option.icon;
              const tag = option.tag;

              return (
                <Box
                  key={key}
                  onClick={() => {
                    return handleOptionClick(option.value);
                  }}
                  sx={{
                    width,
                    padding: '6',
                    border: isSelected ? 'lg' : 'md',
                    borderColor: isSelected
                      ? 'input.background.accent.default'
                      : 'input.border.muted.default',
                    borderRadius: 'md',
                    backgroundColor: isSelected
                      ? 'feedback.background.positive.default'
                      : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isDisabled ? 0.5 : 1,
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  {IconComponent && (
                    <Box
                      sx={{
                        marginBottom: '2',
                        color: 'text.primary',
                      }}
                    >
                      <IconComponent size={24} />
                    </Box>
                  )}
                  <Flex sx={{ flexDirection: 'column', gap: '1' }}>
                    {option.label && (
                      <Text
                        sx={{
                          fontSize: 'lg',
                          fontWeight: 'semibold',
                          color: 'text.primary',
                        }}
                      >
                        {option.label}
                      </Text>
                    )}
                    {option.description && (
                      <Text
                        sx={{
                          fontSize: 'md',
                          color: 'text.secondary',
                        }}
                      >
                        {option.description}
                      </Text>
                    )}
                  </Flex>
                  {tag?.label && (
                    <Tag
                      variant={tag?.variant}
                      sx={{
                        px: '3',
                        mt: '2',
                        fontSize: 'sm',
                        ...tag?.sx,
                      }}
                    >
                      {tag.label}
                    </Tag>
                  )}
                </Box>
              );
            })}
          </Flex>
        );
      }}
    />
  );
};
