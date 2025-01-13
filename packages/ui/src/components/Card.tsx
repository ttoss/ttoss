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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: 'fit-content',
        boxShadow: '2px 4px 8px #E5E7EB',
        ...props.sx,
      }}
    />
  );
};
