import {
  Badge,
  Button,
  ConfirmationDialog,
  Dialog,
  DialogHeading,
  DialogModal,
  DialogTrigger,
  FieldGroup,
  Form,
  Grid,
  Heading,
  Icon,
  Meter,
  Select,
  SelectItem,
  Separator,
  Stack,
  Surface,
  Text,
  TextField,
  Wizard,
  WizardNavigation,
  WizardStep,
} from '@ttoss/fsl-ui';
import * as React from 'react';

import type { Plan } from '../data';
import { PLANS, USAGE } from '../data';
import { setPaymentMethod, setPlan, useWorkspace } from '../store';
import { toasts } from '../toasts';

const EXPIRY_MONTHS = Array.from({ length: 12 }, (_, index) => {
  return String(index + 1).padStart(2, '0');
});
const EXPIRY_YEARS = ['2026', '2027', '2028', '2029', '2030'];

/** The digits of a card number — what the summary and the store keep. */
export const cardLast4 = (cardNumber: string): string => {
  return cardNumber.replace(/\D/g, '').slice(-4);
};

export const validateCardNumber = (value: string): string | null => {
  const digits = value.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(digits)) {
    return 'Enter the 13–19 digits on the front of the card.';
  }
  return null;
};

/**
 * The payment wizard — forms item G's consumer, exercising both halves at
 * once: per-step validation (each step is its own Form; the Next button is a
 * submit bound to the active step's form, so the platform blocks an invalid
 * step) and FieldGroup (Expiry is one label over a month/year pair).
 */
const AddPaymentMethodDialog = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [card, setCard] = React.useState('');

  const open = (next: boolean) => {
    setIsOpen(next);
    if (!next) {
      setStep(0);
      setCard('');
    }
  };

  const handleCardStep = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setCard(String(data.get('cardNumber') ?? ''));
    setStep(1);
  };

  const handleAddressStep = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPaymentMethod({ last4: cardLast4(card) });
    open(false);
    toasts.add(
      { title: `Card ending ${cardLast4(card)} added` },
      { timeout: 4000 }
    );
  };

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={open}>
      <Button evaluation="secondary">Add payment method</Button>
      <DialogModal>
        <Dialog aria-label="Add payment method">
          <DialogHeading>Add payment method</DialogHeading>
          <Wizard
            currentStep={step}
            onStepChange={setStep}
            aria-label="Payment method"
          >
            <WizardStep aria-label="Card details">
              <Form id="payment-step-0" onSubmit={handleCardStep}>
                <Stack gap="md">
                  <TextField
                    label="Card number"
                    name="cardNumber"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    isRequired
                    validate={validateCardNumber}
                    defaultValue={card}
                  />
                  {/*
                    One label over two controls — the FieldGroup case. The
                    group names the cluster; each Select keeps its own
                    accessible name for AT.
                  */}
                  <FieldGroup label="Expiry">
                    <Select
                      aria-label="Expiry month"
                      name="expiryMonth"
                      isRequired
                      placeholder="MM"
                    >
                      {EXPIRY_MONTHS.map((month) => {
                        return (
                          <SelectItem key={month} id={month}>
                            {month}
                          </SelectItem>
                        );
                      })}
                    </Select>
                    <Select
                      aria-label="Expiry year"
                      name="expiryYear"
                      isRequired
                      placeholder="YYYY"
                    >
                      {EXPIRY_YEARS.map((year) => {
                        return (
                          <SelectItem key={year} id={year}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </Select>
                  </FieldGroup>
                </Stack>
              </Form>
            </WizardStep>
            <WizardStep aria-label="Billing address">
              <Form id="payment-step-1" onSubmit={handleAddressStep}>
                <Stack gap="md">
                  <TextField
                    label="Name on card"
                    name="holder"
                    autoComplete="cc-name"
                    isRequired
                  />
                  <TextField
                    label="Billing address"
                    name="address"
                    autoComplete="street-address"
                    isRequired
                  />
                </Stack>
              </Form>
            </WizardStep>
            {/*
              Per-step validation is a composition, not a Wizard feature: the
              forward button is a submit bound to the ACTIVE step's form via
              the HTML `form` attribute, so native validation gates goNext and
              the step's own fields report the refusal.
            */}
            <WizardNavigation>
              {(state) => {
                return (
                  <>
                    <Button
                      evaluation="secondary"
                      onPress={state.goPrev}
                      isDisabled={state.isFirst}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      form={`payment-step-${state.currentStep}`}
                      consequence={state.isLast ? 'committing' : 'neutral'}
                    >
                      {state.isLast ? 'Save card' : 'Next'}
                    </Button>
                  </>
                );
              }}
            </WizardNavigation>
          </Wizard>
        </Dialog>
      </DialogModal>
    </DialogTrigger>
  );
};

/** The card on file — or the wizard that adds one. */
const PaymentMethodCard = () => {
  const { paymentMethod } = useWorkspace();

  return (
    <Surface level="raised" padding="lg">
      <Stack direction="horizontal" align="center" justify="between">
        <Stack gap="xs">
          <Text variant="label-lg">Payment method</Text>
          <Text variant="body-sm" tone="muted">
            {paymentMethod
              ? `Card ending ${paymentMethod.last4}`
              : 'No card on file — invoices are emailed.'}
          </Text>
        </Stack>
        <AddPaymentMethodDialog />
      </Stack>
    </Surface>
  );
};

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
      <PaymentMethodCard />
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
