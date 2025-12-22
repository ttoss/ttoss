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
- `SubscriptionCard`
- Types: `PlanCardProps`, `PlanCardVariant`, `PlanCardPrice`, `PlanCardMetadata`, `PlanCardButtonProps`, `PlanCardMetadataSlotService` (and related slot types)
