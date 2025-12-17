import {
  Box,
  type BoxProps,
  Button,
  type ButtonProps,
  Card,
  type CardProps,
} from '@ttoss/ui';
import * as React from 'react';

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
        paddingX: '8',
        width: 'full',
        ...props.sx,
      }}
    >
      {children}
    </Box>
  );
};

const PlanCardCTA = ({
  label,
  containerProps,
  ...buttonProps
}: PlanCardCTAProps) => {
  return (
    <Box
      {...containerProps}
      sx={{
        paddingY: '2',
        paddingX: '8',
        width: 'full',
        ...containerProps?.sx,
      }}
    >
      <Button variant="accent" {...buttonProps}>
        {label}
      </Button>
    </Box>
  );
};

type SlotElements = Partial<Record<PlanCardSlotName, React.ReactElement>>;

const pickSlotsFromChildren = (children: React.ReactNode) => {
  const slots: SlotElements = {};
  const unknownChildren: React.ReactNode[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    if (child.type === PlanCardTopTag) slots.topTag = child;
    else if (child.type === PlanCardHeader) slots.header = child;
    else if (child.type === PlanCardMetadata) slots.metadata = child;
    else if (child.type === PlanCardPrice) slots.price = child;
    else if (child.type === PlanCardFeatures) slots.features = child;
    else if (child.type === PlanCardCTA) slots.cta = child;
    else unknownChildren.push(child);
  });

  return { slots, unknownChildren };
};

export type PlanCardComponent = React.FC<PlanCardProps> & {
  TopTag: typeof PlanCardTopTag;
  Header: typeof PlanCardHeader;
  Metadata: typeof PlanCardMetadata;
  Price: typeof PlanCardPrice;
  Features: typeof PlanCardFeatures;
  CTA: typeof PlanCardCTA;
};

export const PlanCard = (({ children, ...props }: PlanCardProps) => {
  const { slots, unknownChildren } = pickSlotsFromChildren(children);

  if (process.env.NODE_ENV !== 'production') {
    if (unknownChildren.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        '[PlanCard] Ignoring unknown children. Use PlanCard.* compound components.'
      );
    }

    const missingRequiredSlots: PlanCardSlotName[] = [];

    if (!slots.header) missingRequiredSlots.push('header');
    if (!slots.metadata) missingRequiredSlots.push('metadata');
    if (!slots.price) missingRequiredSlots.push('price');
    if (!slots.features) missingRequiredSlots.push('features');
    if (!slots.cta) missingRequiredSlots.push('cta');

    if (missingRequiredSlots.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `[PlanCard] Missing required sections: ${missingRequiredSlots.join(', ')}`
      );
    }
  }

  return (
    <Card
      {...props}
      sx={{
        width: '100%',
        maxWidth: '410px',
        alignItems: 'stretch',
        ...props.sx,
      }}
    >
      {slots.topTag}
      {slots.header}
      {slots.metadata}
      {slots.price}
      {slots.features}
      {slots.cta}
    </Card>
  );
}) as PlanCardComponent;

PlanCard.TopTag = PlanCardTopTag;
PlanCard.Header = PlanCardHeader;
PlanCard.Metadata = PlanCardMetadata;
PlanCard.Price = PlanCardPrice;
PlanCard.Features = PlanCardFeatures;
PlanCard.CTA = PlanCardCTA;
