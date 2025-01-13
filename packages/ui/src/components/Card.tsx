import { Card as CardUi, type CardProps } from 'theme-ui';

export const Card = (props: CardProps) => {
  return (
    <CardUi
      {...props}
      sx={{
        backgroundColor: 'display.background.secondary.default',
        border: 'md',
        borderColor: 'display.border.muted.default',
        borderRadius: 'lg',
        padding: [4, 5],
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: 'fit-content',
        ...props.sx,
      }}
    />
  );
};
