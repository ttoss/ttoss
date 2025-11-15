import { Box, Flex, Text } from '@ttoss/ui';
import { Tag } from '@ttoss/ui';
import * as React from 'react';
import { FieldPath, FieldValues } from 'react-hook-form';

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
  };
};

export const FormFieldRadioCardIcony = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  name,
  direction = 'row',
  width = 'full',
  sx,
  options,
  tooltip,
}: {
  options: FormRadioOption[];
  direction?: 'column' | 'row';
  width?: string;
} & FormFieldProps<TFieldValues, TName>) => {
  return (
    <FormField
      label={label}
      name={name}
      sx={sx}
      tooltip={tooltip}
      render={({ field }) => {
        const handleOptionClick = (optionValue: string | number) => {
          field.onChange(optionValue);
          field.onBlur();
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
                    cursor: 'pointer',
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
                        fontWeight: 'semibold',
                        fontSize: 'sm',
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
