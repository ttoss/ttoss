import { Icon } from '@ttoss/react-icons';
import {
  Box,
  type BoxProps,
  Button,
  type ButtonProps,
  Card,
  type CardProps,
  Flex,
} from '@ttoss/ui';

export type PlanCardSlotName =
  | 'topTag'
  | 'header'
  | 'metadata'
  | 'price'
  | 'features'
  | 'cta';

export interface PlanCardProps extends Omit<CardProps, 'children'> {
  /**
   * Use compound components:
   * `PlanCard.TopTag`, `PlanCard.Header`, `PlanCard.Metadata`, `PlanCard.Price`, `PlanCard.Features`, `PlanCard.CTA`.
   */
  children: React.ReactNode;
}

export interface PlanCardCTAProps extends Omit<ButtonProps, 'children'> {
  /** Button label (e.g. "Assine agora"). */
  label: React.ReactNode;
  /** Wrapper props for the CTA section (use `sx` here). */
  containerProps?: BoxProps;
}

const PlanCardTopTag = ({
  children,
  ...props
}: React.PropsWithChildren<BoxProps>) => {
  return (
    <Box
      {...props}
      sx={{
        paddingX: '8',
        paddingTop: '4',
        width: 'full',
        alignItems: 'center',
        ...props.sx,
      }}
    >
      {children}
    </Box>
  );
};

const PlanCardHeader = ({
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
        alignItems: 'center',
        justifyContent: 'center',
        ...props.sx,
      }}
    >
      {children}
    </Box>
  );
};

const PlanCardMetadata = ({
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
        ...props.sx,
      }}
    >
      {children}
    </Box>
  );
};

const PlanCardPrice = ({
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
        ...props.sx,
      }}
    >
      {children}
    </Box>
  );
};

const PlanCardFeatures = ({
  children,
  ...props
}: React.PropsWithChildren<BoxProps>) => {
  return (
    <Box
      {...props}
      sx={{
        paddingY: '4',
        paddingX: '6',
        width: 'full',
        borderTop: 'md',
        borderBottom: 'md',
        borderColor: 'display.border.muted.default',
        ...props.sx,
      }}
    >
      {children}
    </Box>
  );
};

const PlanCardCTA = ({
  label,
  leftIcon,
  containerProps,
  ...buttonProps
}: PlanCardCTAProps) => {
  return (
    <Flex
      {...containerProps}
      sx={{
        paddingY: '2',
        paddingX: '6',
        width: 'full',
        justifyContent: 'center',
        ...containerProps?.sx,
      }}
    >
      <Button
        variant="accent"
        sx={{
          width: 'full',
          ...buttonProps.sx,
        }}
        {...buttonProps}
      >
        <Flex
          sx={{
            width: 'full',
            gap: '2',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'semibold',
          }}
        >
          {leftIcon && <Icon icon={leftIcon} />}
          {label}
        </Flex>
      </Button>
    </Flex>
  );
};

export type PlanCardComponent = React.FC<PlanCardProps> & {
  TopTag: typeof PlanCardTopTag;
  Header: typeof PlanCardHeader;
  Metadata: typeof PlanCardMetadata;
  Price: typeof PlanCardPrice;
  Features: typeof PlanCardFeatures;
  CTA: typeof PlanCardCTA;
};

export const PlanCard = (({ ...props }: PlanCardProps) => {
  return (
    <Card
      {...props}
      sx={{
        width: 'full',
        maxWidth: '410px',
        alignItems: 'stretch',
        ...props.sx,
      }}
    />
  );
}) as PlanCardComponent;

PlanCard.TopTag = PlanCardTopTag;
PlanCard.Header = PlanCardHeader;
PlanCard.Metadata = PlanCardMetadata;
PlanCard.Price = PlanCardPrice;
PlanCard.Features = PlanCardFeatures;
PlanCard.CTA = PlanCardCTA;
