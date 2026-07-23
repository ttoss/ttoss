import {
  Badge,
  Button,
  Grid,
  Heading,
  Icon,
  Separator,
  Stack,
  Surface,
  Text,
} from '@ttoss/fsl-ui';

interface Tier {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const TIERS: Tier[] = [
  {
    name: 'Starter',
    price: '$9',
    description: 'For side projects and first experiments.',
    features: ['5 projects', '2 team members', 'Community support'],
    cta: 'Choose Starter',
  },
  {
    name: 'Pro',
    price: '$29',
    description: 'For teams shipping to production.',
    features: [
      'Unlimited projects',
      '10 team members',
      'Priority support',
      'Custom domains',
    ],
    cta: 'Start free trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    description: 'For organizations with compliance needs.',
    features: ['SSO / SAML', 'Audit log', 'Dedicated support', '99.9% SLA'],
    cta: 'Contact sales',
  },
];

/**
 * One feature line: a decorative success glyph beside the copy. List
 * semantics are hand-applied roles on Stack (friction F-016 — no list
 * primitive; Text renders p/span/div only).
 */
const FeatureItem = ({ feature }: { feature: string }) => {
  return (
    <Stack direction="horizontal" gap="sm" align="center" role="listitem">
      <Icon intent="status.success" size="sm" />
      <Text as="span" variant="body-sm">
        {feature}
      </Text>
    </Stack>
  );
};

const TierCard = ({ tier }: { tier: Tier }) => {
  return (
    <Surface
      level={tier.popular ? 'raised' : 'flat'}
      padding="lg"
      evaluation={tier.popular ? 'primary' : 'muted'}
    >
      <Stack gap="md">
        <Stack direction="horizontal" gap="sm" align="center" justify="between">
          <Heading level={5} size="title-sm">
            {tier.name}
          </Heading>
          {tier.popular && <Badge evaluation="positive">Most popular</Badge>}
        </Stack>
        <Stack direction="horizontal" gap="xs" align="end">
          <Text as="span" variant="display-sm" numeric="tabular">
            {tier.price}
          </Text>
          <Text as="span" variant="body-sm" tone="muted">
            /month
          </Text>
        </Stack>
        <Text variant="body-sm" tone="muted">
          {tier.description}
        </Text>
        <Separator />
        <Stack gap="sm" role="list" aria-label={`${tier.name} features`}>
          {tier.features.map((feature) => {
            return <FeatureItem key={feature} feature={feature} />;
          })}
        </Stack>
        <Button evaluation={tier.popular ? 'primary' : 'secondary'}>
          {tier.cta}
        </Button>
      </Stack>
    </Surface>
  );
};

/**
 * Block: a marketing pricing section — three tiers with feature lists,
 * a highlighted plan, and calls to action. It proves marketing
 * composition (centered rhythm, card hierarchy by elevation + border
 * emphasis) and is the first consumer of the public Icon (ADR-010,
 * friction F-015).
 */
export const PricingBlock = () => {
  return (
    <Surface level="raised" padding="lg">
      <Stack gap="xl">
        <Stack gap="sm">
          <Heading level={4} size="headline-sm" align="center">
            Simple, honest pricing
          </Heading>
          <Text tone="muted" align="center">
            Every plan includes unlimited deploys and preview environments.
          </Text>
        </Stack>
        <Grid minColumnWidth="sm" gap="lg" align="stretch">
          {TIERS.map((tier) => {
            return <TierCard key={tier.name} tier={tier} />;
          })}
        </Grid>
      </Stack>
    </Surface>
  );
};
