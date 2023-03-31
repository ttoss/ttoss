import { Text, TextProps } from './Text';

export type HelpTextProps = Omit<TextProps, 'variant'> & {
  disabled?: boolean;
  negative?: boolean;
};

export const HelpText = ({ disabled, negative, ...props }: HelpTextProps) => {
  const variant = ['text.help', negative ? 'negative' : undefined]
    .filter(Boolean)
    .join('.');

  return (
    <Text
      variant={variant}
      aria-disabled={disabled ? 'true' : undefined}
      {...props}
    />
  );
};
