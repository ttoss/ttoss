import { Box, Flex, Text } from '@ttoss/ui';
import * as React from 'react';
import { FieldPath, FieldValues } from 'react-hook-form';

import { FormField, type FormFieldProps } from './FormField';

export type TagVariant =
  | 'accent'
  | 'positive'
  | 'caution'
  | 'muted'
  | 'negative'
  | 'primary'
  | 'secondary'
  | 'default';

export type FormRadioOption = {
  value: string | number;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  tag?: {
    label: string;
    variant?: TagVariant;
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
  const tagVariantMap: Record<TagVariant, { bg: string; color: string }> = {
    positive: {
      bg: 'feedback.background.positive.default',
      color: 'feedback.text.positive.default',
    }, //
    accent: {
      bg: 'action.background.accent.default',
      color: 'action.text.accent.default',
    }, //
    caution: {
      bg: 'feedback.background.caution.default',
      color: 'feedback.text.caution.default',
    }, //
    muted: {
      bg: 'display.background.muted.default',
      color: 'display.text.muted.default',
    }, //
    negative: {
      bg: 'feedback.background.negative.default',
      color: 'feedback.text.negative.default',
    }, //
    primary: {
      bg: 'action.background.primary.default',
      color: 'action.text.primary.default',
    }, //
    secondary: {
      bg: 'action.background.secondary.default',
      color: 'action.text.secondary.default',
    }, //
    default: {
      bg: 'action.background.muted.default',
      color: 'action.text.muted.default',
    },
  };

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
              const variant = tag?.variant ?? 'default';
              const tagColors = tagVariantMap[variant];

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
                  {tag && (
                    <Box
                      sx={{
                        px: '3', // padding horizontal
                        py: '1', // padding vertical
                        mt: '2', // margin-top entre label e tag
                        borderRadius: 'full',
                        fontSize: 'xs',
                        fontWeight: 'semibold',
                        backgroundColor: tagColors.bg,
                        color: tagColors.color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        alignSelf: 'center',
                        width: 'auto', // ajusta ao conteúdo
                        maxWidth: '100%',
                        whiteSpace: 'nowrap', // evita quebra dentro da tag
                        boxSizing: 'border-box',
                      }}
                    >
                      {tag.label}
                    </Box>
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
