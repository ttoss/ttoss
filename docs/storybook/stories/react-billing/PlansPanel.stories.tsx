import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { PlansPanelFilter, PlansPanelPlan } from '@ttoss/react-billing';
import { PlansPanel } from '@ttoss/react-billing';
import { Box } from '@ttoss/ui';
import * as React from 'react';

const meta: Meta<typeof PlansPanel> = {
  title: 'React Billing/PlansPanel',
  component: PlansPanel,
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      return (
        <Box sx={{ padding: '6', maxWidth: '1200px' }}>
          <Story />
        </Box>
      );
    },
  ],
};

export default meta;

type Story = StoryObj<typeof PlansPanel>;

const filters: PlansPanelFilter[] = [
  {
    id: 'userType',
    label: 'User type',
    options: [
      { label: 'Individual', value: 'individual' },
      { label: 'Business', value: 'business' },
    ],
    defaultValue: 'individual',
  },
  {
    id: 'interval',
    label: 'Billing frequency',
    options: [
      { label: 'Monthly', value: 'monthly' },
      { label: 'Yearly', value: 'yearly' },
    ],
    defaultValue: 'monthly',
  },
];

const plans: PlansPanelPlan[] = [
  {
    id: 'plan_basic_individual_monthly',
    filterValues: { userType: 'individual', interval: 'monthly' },
    title: 'Basic',
    subtitle: 'For individuals',
    price: {
      value: '$29',
      interval: '/month',
      description: 'Billed monthly',
    },
    features: ['10 proposals/month', 'Email support'],
    buttonProps: { label: 'Subscribe' },
  },
  {
    id: 'plan_pro_individual_monthly',
    filterValues: { userType: 'individual', interval: 'monthly' },
    title: 'Pro',
    subtitle: 'For individuals',
    price: {
      value: '$59',
      interval: '/month',
      description: 'Billed monthly',
    },
    features: ['Unlimited proposals', 'Priority support'],
    buttonProps: { label: 'Upgrade' },
  },
  {
    id: 'plan_basic_individual_yearly',
    filterValues: { userType: 'individual', interval: 'yearly' },
    title: 'Basic',
    subtitle: 'For individuals',
    price: {
      value: '$24',
      interval: '/month',
      description: 'Billed annually ($288/year)',
    },
    features: ['10 proposals/month', 'Email support'],
    buttonProps: { label: 'Subscribe' },
  },
  {
    id: 'plan_pro_individual_yearly',
    filterValues: { userType: 'individual', interval: 'yearly' },
    title: 'Pro',
    subtitle: 'For individuals',
    price: {
      value: '$49',
      interval: '/month',
      description: 'Billed annually ($588/year)',
    },
    features: ['Unlimited proposals', 'Priority support'],
    buttonProps: { label: 'Upgrade' },
  },
  {
    id: 'plan_starter_business_monthly',
    filterValues: { userType: 'business', interval: 'monthly' },
    title: 'Starter',
    subtitle: 'For businesses',
    price: {
      value: '$99',
      interval: '/month',
      description: 'Billed monthly',
    },
    features: ['5 users', 'Advanced reports'],
    buttonProps: { label: 'Subscribe' },
  },
  {
    id: 'plan_enterprise_business_monthly',
    filterValues: { userType: 'business', interval: 'monthly' },
    title: 'Enterprise',
    subtitle: 'For businesses',
    price: {
      value: 'Custom',
      interval: '',
      description: 'Request a quote',
    },
    features: ['Unlimited users', 'Dedicated SLA'],
    variant: 'secondary',
    buttonProps: { label: 'Contact us' },
  },
  {
    id: 'plan_starter_business_yearly',
    filterValues: { userType: 'business', interval: 'yearly' },
    title: 'Starter',
    subtitle: 'For businesses',
    price: {
      value: '$83',
      interval: '/month',
      description: 'Billed annually ($996/year)',
    },
    features: ['5 users', 'Advanced reports'],
    buttonProps: { label: 'Subscribe' },
  },
  {
    id: 'plan_enterprise_business_yearly',
    filterValues: { userType: 'business', interval: 'yearly' },
    title: 'Enterprise',
    subtitle: 'For businesses',
    price: {
      value: 'Custom',
      interval: '',
      description: 'Request a quote',
    },
    features: ['Unlimited users', 'Dedicated SLA'],
    variant: 'secondary',
    buttonProps: { label: 'Contact us' },
  },
];

/** Default uncontrolled mode — component manages filter state internally. */
export const Default: Story = {
  args: {
    filters,
    plans,
    activePlanId: 'plan_basic_individual_monthly',
    onSelectPlan: (planId) => {
      // eslint-disable-next-line no-console
      console.log('Selected plan:', planId);
    },
  },
};

/** No filters — all plans are shown at once in a grid. */
export const WithoutFilters: Story = {
  args: {
    plans: plans.slice(0, 3),
    activePlanId: 'plan_basic_individual_monthly',
    onSelectPlan: (planId) => {
      // eslint-disable-next-line no-console
      console.log('Selected plan:', planId);
    },
  },
};

/** Single filter dimension (billing interval only). */
export const SingleFilter: Story = {
  args: {
    filters: [filters[1]],
    plans: [
      plans[0], // basic individual monthly
      plans[2], // basic individual yearly
    ],
    onSelectPlan: (planId) => {
      // eslint-disable-next-line no-console
      console.log('Selected plan:', planId);
    },
  },
};

/** Controlled mode — parent component owns the filter state. */
const ControlledTemplate = (
  args: React.ComponentPropsWithoutRef<typeof PlansPanel>
) => {
  const [filterValues, setFilterValues] = React.useState<
    Record<string, string>
  >({ userType: 'business', interval: 'monthly' });

  return (
    <PlansPanel
      {...args}
      filterValues={filterValues}
      onFilterChange={(id, value) => {
        return setFilterValues((prev) => {
          return { ...prev, [id]: value };
        });
      }}
    />
  );
};

export const Controlled: Story = {
  render: (args) => {
    return <ControlledTemplate {...args} />;
  },
  args: {
    filters,
    plans,
    onSelectPlan: (planId) => {
      // eslint-disable-next-line no-console
      console.log('Selected plan:', planId);
    },
  },
};
