import { Button, type ButtonProps } from './Button';

export type ActionButtonProps = Omit<
  ButtonProps,
  'rightIcon' | 'leftIcon' | 'variant'
> & {
  icon: ButtonProps['leftIcon'];
  variant?: 'default' | 'accent' | 'quiet';
};

export const ActionButton = ({
  icon,
  variant = 'default',
  sx,
  ...props
}: ActionButtonProps) => {
  return (
    <Button
      variant={`buttons.actionButton.${variant}`}
      leftIcon={icon}
      sx={{
        padding: '2',
        gap: '4',
        fontFamily: 'body',
        borderRadius: 'action',
        outlineColor: 'transparent',
        ':disabled': props.disabled
          ? {
              backgroundColor: 'muted',
              color: 'onMuted',
              cursor: 'not-allowed',
              border: 'muted',
              borderColor: 'onMuted',
            }
          : undefined,
        ...sx,
      }}
      {...props}
    />
  );
};
