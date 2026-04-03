# @ttoss/react-billing

Billing UI components for React apps.

Built on top of `@ttoss/ui`.

## Installation

```shell
pnpm add @ttoss/react-billing
```

## Quick Start

This package expects your app to be wrapped with `@ttoss/ui` `ThemeProvider`.

### PlanCard

```tsx
import { PlanCard } from '@ttoss/react-billing';

export const Example = () => (
  <PlanCard
    title="Pro"
    subtitle="Best for teams"
    price={{
      value: 'R$ 99,00',
      interval: 'month',
      description: 'Billed monthly',
    }}
    metadata={[
      { title: 'Seats', value: '5', icon: 'fluent:people-24-regular' },
      {
        title: 'Support',
        value: 'Priority',
        icon: 'fluent:chat-help-24-regular',
      },
    ]}
    features={[{ label: 'Unlimited projects' }, { label: 'SSO' }]}
    buttonProps={{ label: 'Choose plan', variant: 'accent' }}
  />
);
```

### PlansPanel

A higher-level component that renders a grid of `PlanCard` components with optional multi-dimensional `SegmentedControl` filters. Plans are shown only when they match all active filter values.

```tsx
import { PlansPanel } from '@ttoss/react-billing';

export const PricingPage = () => (
  <PlansPanel
    filters={[
      {
        id: 'interval',
        label: 'Frequência',
        options: [
          { label: 'Mensal', value: 'monthly' },
          { label: 'Anual', value: 'yearly' },
        ],
        defaultValue: 'monthly',
      },
    ]}
    plans={[
      {
        id: 'plan_basic_monthly',
        filterValues: { interval: 'monthly' },
        title: 'Basic',
        price: {
          value: 'R$ 29',
          interval: '/mês',
          description: 'Cobrado mensalmente',
        },
        features: ['10 propostas/mês'],
        buttonProps: { label: 'Assine agora' },
      },
      {
        id: 'plan_basic_yearly',
        filterValues: { interval: 'yearly' },
        title: 'Basic',
        price: {
          value: 'R$ 24',
          interval: '/mês',
          description: 'Cobrado anualmente',
        },
        features: ['10 propostas/mês'],
        buttonProps: { label: 'Assine agora' },
      },
    ]}
    activePlanId="plan_basic_monthly"
    onSelectPlan={(planId) => console.log('Selected:', planId)}
  />
);
```

Controlled mode (parent owns filter state):

```tsx
const [filterValues, setFilterValues] = React.useState({ interval: 'monthly' });

<PlansPanel
  filters={filters}
  plans={plans}
  filterValues={filterValues}
  onFilterChange={(id, value) =>
    setFilterValues((prev) => ({ ...prev, [id]: value }))
  }
  onSelectPlan={(planId) => checkout(planId)}
/>;
```

### SubscriptionCard

```tsx
import { SubscriptionCard } from '@ttoss/react-billing';

export const Example = () => (
  <SubscriptionCard
    planName="Pro"
    price={{ value: 'R$ 99,00', interval: 'month' }}
    status={{ status: 'active', interval: 'Monthly' }}
    features={[{ label: 'Unlimited projects' }, { label: 'SSO' }]}
    actions={[{ label: 'Manage', onClick: () => {}, variant: 'accent' }]}
    metrics={[
      {
        type: 'date',
        label: 'Renews on',
        date: '2025-01-15',
        icon: 'fluent:calendar-24-regular',
      },
      {
        type: 'percentage',
        label: 'Usage',
        current: 75,
        max: 100,
        icon: 'fluent:data-usage-24-regular',
      },
    ]}
  />
);
```

## Exports

- `PlanCard`
- `PlansPanel`
- `SubscriptionPanel`
- Types: `PlanCardProps`, `PlanCardVariant`, `PlanCardPrice`, `PlanCardMetadata`, `PlanCardButtonProps`, `PlanCardMetadataSlotService` (and related slot types), `PlansPanelProps`, `PlansPanelPlan`, `PlansPanelFilter`, `PlansPanelFilterOption`
