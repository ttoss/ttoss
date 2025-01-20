import * as React from 'react';
import { Box, BoxProps, Card as CardUi, type CardProps } from 'theme-ui';

export type { CardProps };

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

const CardTitle = ({
  children,
  ...props
}: React.PropsWithChildren<BoxProps>) => {
  return (
    <Box
      {...props}
      sx={{
        paddingY: '4',
        paddingX: '8',
        width: 'full',
        borderBottom: 'md',
        borderBottomColor: 'display.border.muted.default',
        ...props.sx,
      }}
    >
      {children}
    </Box>
  );
};

const CardBody = ({
  children,
  ...props
}: React.PropsWithChildren<BoxProps>) => {
  return (
    <Box
      {...props}
      sx={{
        paddingY: '4',
        paddingX: '8',
        width: 'full',
        backgroundColor: 'display.background.muted.default',
        ...props.sx,
      }}
    >
      {children}
    </Box>
  );
};

const CardFooter = ({
  children,
  ...props
}: React.PropsWithChildren<BoxProps>) => {
  return (
    <Box
      {...props}
      sx={{ paddingY: '2', paddingX: '8', width: 'full', ...props.sx }}
    >
      {children}
    </Box>
  );
};

Card.Title = CardTitle;
Card.Body = CardBody;
Card.Footer = CardFooter;
