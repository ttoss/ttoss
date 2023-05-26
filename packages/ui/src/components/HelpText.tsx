import { Text, TextProps } from './Text';

export type HelpTextProps = Omit<TextProps, 'variant'> & {
  disabled?: boolean;
  negative?: boolean;
};

export const HelpText = ({
  sx,
  disabled,
  negative,
  ...props
}: HelpTextProps) => {
  const variant = ['text.help', negative ? 'negative' : undefined]
    .filter(Boolean)
    .join('.');

  return (
    <Text
      variant={variant}
      sx={{
        fontSize: 'sm',
        fontFamily: 'caption',
        lineHeight: 'base',
        ...sx,
      }}
      aria-disabled={disabled ? 'true' : undefined}
      {...props}
    />
  );
};
