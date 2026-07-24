import {
  Badge,
  Button,
  ConfirmationDialog,
  Grid,
  Heading,
  Icon,
  Meter,
  Separator,
  Stack,
  Surface,
  Text,
} from '@ttoss/fsl-ui';

import type { Plan } from '../data';
import { PLANS, USAGE } from '../data';
import { setPlan, useWorkspace } from '../store';
import { toasts } from '../toasts';

export const formatPrice = (price: number): string => {
  return price === 0 ? 'Free' : `$${price}`;
};

const CurrentPlanCard = ({ plan }: { plan: Plan }) => {
  return (
    <Surface level="raised" padding="lg">
      <Stack gap="lg">
        <Stack direction="horizontal" align="start" justify="between">
          <Stack gap="xs">
            <Stack direction="horizontal" align="center" gap="sm">
              <Text variant="label-lg">{`${plan.name} plan`}</Text>
              <Badge evaluation="positive">Active</Badge>
            </Stack>
            <Text variant="body-sm" tone="muted">
              Renews August 18, 2026 · billed monthly
            </Text>
          </Stack>
          <Stack gap="xs" align="end">
            <Text variant="display-sm" numeric="tabular">
              {formatPrice(plan.price)}
            </Text>
            <Text variant="label-sm" tone="muted">
              per seat / month
            </Text>
          </Stack>
        </Stack>
        <Separator />
        <Grid minColumnWidth="xs" gap="lg">
          {USAGE.map((item) => {
            return (
              <Stack key={item.id} gap="xs">
                <Meter
                  aria-label={item.label}
                  label={item.label}
                  value={item.percent}
                  evaluation={item.percent > 80 ? 'caution' : 'primary'}
                />
                <Text variant="label-sm" tone="muted" numeric="tabular">
                  {item.detail}
                </Text>
              </Stack>
            );
          })}
        </Grid>
      </Stack>
    </Surface>
  );
};

const PlanAction = ({
  plan,
  currentPrice,
}: {
  plan: Plan;
  currentPrice: number;
}) => {
  const isUpgrade = plan.price > currentPrice;
  const label = isUpgrade
    ? `Upgrade to ${plan.name}`
    : `Downgrade to ${plan.name}`;

  return (
    <ConfirmationDialog
      trigger={
        <Button evaluation={isUpgrade ? 'primary' : 'secondary'}>
          {label}
        </Button>
      }
      title={`Switch to the ${plan.name} plan?`}
      confirmLabel={`Switch to ${plan.name}`}
      cancelLabel="Cancel"
      consequence="committing"
      onConfirm={() => {
        setPlan({ planId: plan.id });
        toasts.add(
          { title: `Workspace moved to the ${plan.name} plan` },
          { timeout: 4000 }
        );
      }}
    >
      {`northline moves to ${plan.name} on the next billing cycle. No deploys are interrupted.`}
    </ConfirmationDialog>
  );
};

const PlanCard = ({ plan, currentPlan }: { plan: Plan; currentPlan: Plan }) => {
  const isCurrent = plan.id === currentPlan.id;

  return (
    <Surface level="raised" padding="lg">
      <Stack gap="md">
        <Stack direction="horizontal" align="center" justify="between">
          <Text variant="label-lg">{plan.name}</Text>
          {isCurrent && <Badge>Current plan</Badge>}
        </Stack>
        <Stack direction="horizontal" align="end" gap="sm">
          <Text variant="display-sm" numeric="tabular">
            {formatPrice(plan.price)}
          </Text>
          {plan.price > 0 && (
            <Text variant="label-sm" tone="muted">
              per seat / month
            </Text>
          )}
        </Stack>
        <Text variant="body-sm" tone="muted">
          {plan.description}
        </Text>
        <Separator />
        {/*
         * Content list — the recorded F-016 pattern: Stack carries the list
         * semantics until a List primitive exists.
         */}
        <Stack gap="sm" role="list">
          {plan.features.map((feature) => {
            return (
              <Stack
                key={feature}
                direction="horizontal"
                align="center"
                gap="sm"
                role="listitem"
              >
                <Icon intent="status.success" size="sm" />
                <Text variant="body-sm">{feature}</Text>
              </Stack>
            );
          })}
        </Stack>
        {isCurrent ? (
          <Button evaluation="secondary" isDisabled>
            Current plan
          </Button>
        ) : (
          <PlanAction plan={plan} currentPrice={currentPlan.price} />
        )}
      </Stack>
    </Surface>
  );
};

/** Billing — current plan, usage against allowances, and the plan ladder. */
export const BillingPage = () => {
  const { planId } = useWorkspace();
  const currentPlan =
    PLANS.find((plan) => {
      return plan.id === planId;
    }) ?? PLANS[1];

  return (
    <Stack gap="xl">
      <Stack gap="xs">
        <Heading level={1} size="headline-sm">
          Billing
        </Heading>
        <Text tone="muted">Plan and usage for the northline workspace.</Text>
      </Stack>
      <CurrentPlanCard plan={currentPlan} />
      <Stack gap="md">
        <Heading level={2} size="title-sm">
          Plans
        </Heading>
        <Grid minColumnWidth="sm" gap="md">
          {PLANS.map((plan) => {
            return (
              <PlanCard key={plan.id} plan={plan} currentPlan={currentPlan} />
            );
          })}
        </Grid>
      </Stack>
    </Stack>
  );
};
