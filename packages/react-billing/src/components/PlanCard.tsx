import type { IconType } from '@ttoss/react-icons';
import { Box, type ButtonProps, Card, type CardProps } from '@ttoss/ui';

import { PlanCardCtaSlot } from './PlanCardCtaSlot';
import { PlanCardFeaturesSlot } from './PlanCardFeaturesSlot';
import { PlanCardHeaderSlot } from './PlanCardHeaderSlot';
import {
  PlanCardMetadataSlot,
  type PlanCardMetadataSlotService,
  type PlanCardMetadataSlotVariant,
} from './PlanCardMetadataSlot';
import { PlanCardPriceSlot } from './PlanCardPriceSlot';
import { PlanCardTopTagSlot } from './PlanCardTopTagSlot';
import type { PlanCardVariant } from './PlanCardVariant';

export type PlanCardMetadata = PlanCardMetadataSlotService[];

export type PlanCardPrice = {
  value: string | number;
  interval: string;
  description?: string;
};

export type PlanCardButtonProps = Omit<ButtonProps, 'children'> & {
  label?: string;
  leftIcon?: IconType;
};

export interface PlanCardProps extends Omit<CardProps, 'children'> {
  variant?: PlanCardVariant;
  topTag?: React.ReactNode;
  title: string;
  subtitle?: string;
  metadata?: PlanCardMetadata;
  metadataVariant?: PlanCardMetadataSlotVariant;
  price: PlanCardPrice;
  features?: unknown[];
  buttonProps?: PlanCardButtonProps;
}

export const PlanCard = (props: PlanCardProps) => {
  const {
    variant = 'default',
    title,
    subtitle,
    metadata = [],
    metadataVariant,
    price,
    features = [],
    buttonProps,
    ...cardProps
  } = props;

  const effectiveMetadataVariant = metadataVariant ?? variant;

  return (
    <Card
      {...cardProps}
      sx={{
        width: 'full',
        maxWidth: '410px',
        backgroundColor:
          variant === 'enterprise'
            ? 'display.background.primary.active'
            : 'display.background.primary.default',
        ...cardProps.sx,
      }}
    >
      {props.topTag && (
        <PlanCardTopTagSlot variant={variant}>
          {props.topTag}
        </PlanCardTopTagSlot>
      )}

      <PlanCardHeaderSlot
        title={title}
        subtitle={subtitle}
        hasTopTag={Boolean(props.topTag)}
        variant={variant}
      />

      {metadata.length > 0 && (
        <Box sx={{ paddingY: '4', paddingX: '8', width: 'full' }}>
          <PlanCardMetadataSlot
            metadata={metadata}
            variant={effectiveMetadataVariant}
          />
        </Box>
      )}

      <PlanCardPriceSlot price={price} variant={variant} />

      {features.length > 0 && (
        <PlanCardFeaturesSlot features={features} variant={variant} />
      )}

      <PlanCardCtaSlot buttonProps={buttonProps} variant={variant} />
    </Card>
  );
};
