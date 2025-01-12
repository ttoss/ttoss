import { Card as CardUi, type CardProps } from 'theme-ui';

export type { CardProps };

export const Card = (props: CardProps) => {
  return (
    <CardUi
      {...props}
      sx={{
        backgroundColor: 'display.background.secondary.default',
        borderRadius: 'lg',
        border: 'md',
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
