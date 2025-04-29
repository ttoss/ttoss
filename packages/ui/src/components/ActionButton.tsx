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
  // Get variant-specific styles
  const variantStyles = {
    default: {
      backgroundColor: 'action.background.secondary.default',
      color: 'action.text.primary.default',
      border: 'sm',
      borderColor: 'action.background.primary.default',
      transition: 'all 0.2s',
      ':is(:focus-within, :hover):not(:disabled)': {
        backgroundColor: 'action.background.secondary.active',
        borderColor: 'action.border.secondary.active',
        color: 'action.text.secondary.active',
      },
      ':disabled': {
        cursor: 'default',
        backgroundColor: 'action.background.muted.default',
        borderColor: 'action.border.muted.default',
        color: 'action.text.muted.default',
      },
    },
    accent: {
      backgroundColor: 'action.background.accent.default',
      color: 'action.text.accent.default',
      border: 'none',
      ':disabled': {
        cursor: 'default',
        backgroundColor: 'action.background.muted.default',
        color: 'action.text.muted.default',
      },
    },
    quiet: {
      backgroundColor: 'action.background.muted.default',
      color: 'action.text.accent.default',
      border: 'none',
      borderColor: 'transparent',
      ':disabled': {
        cursor: 'default',
        opacity: 0.6,
        color: 'action.text.muted.default',
      },
    },
  };

  return (
    <Button
      leftIcon={icon}
      sx={{
        paddingY: '2',
        paddingX: '4',
        // Apply variant-specific styles
        ...variantStyles[variant],
        ...sx,
      }}
      {...props}
    />
  );
};
