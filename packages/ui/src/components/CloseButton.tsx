import { Icon } from '@ttoss/react-icons';

import { Button, type ButtonProps } from './Button';

export type CloseButtonProps = ButtonProps & { label?: string };

export const CloseButton = (props: CloseButtonProps) => {
  return (
    <Button
      type="button"
      sx={{
        fontFamily: 'body',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        lineHeight: 'normal',
        padding: '2',
        backgroundColor: 'action.background.primary.active',
        color: 'action.text.primary.default',
        border: 'sm',
        borderColor: 'action.border.primary.default',
        borderRadius: 'sm',
        gap: 2,
        ':disabled': {
          border: 'sm',
          backgroundColor: 'action.background.muted.default',
          borderColor: 'action.border.muted.default',
          color: 'action.text.muted.default',
          cursor: 'not-allowed',
        },
        ':is(:focus-within, :hover):not(:disabled)': {
          color: 'action.text.secondary.active',
          backgroundColor: 'action.background.secondary.active',
          borderColor: 'action.border.secondary.active',
        },
        ...props.sx,
      }}
      {...props}
    >
      {props.label && <span>{props.label}</span>}
      <Icon icon="close" />
    </Button>
  );
};
