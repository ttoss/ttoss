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
    label: 'Para quem?',
    options: [
      { label: 'Pessoa física', value: 'individual' },
      { label: 'Empresa', value: 'business' },
    ],
    defaultValue: 'individual',
  },
  {
    id: 'interval',
    label: 'Frequência',
    options: [
      { label: 'Mensal', value: 'monthly' },
      { label: 'Anual', value: 'yearly' },
    ],
    defaultValue: 'monthly',
  },
];

const plans: PlansPanelPlan[] = [
  {
    id: 'plan_basic_individual_monthly',
    filterValues: { userType: 'individual', interval: 'monthly' },
    title: 'Basic',
    subtitle: 'Para pessoas físicas',
    price: {
      value: 'R$ 29',
      interval: '/mês',
      description: 'Cobrado mensalmente',
    },
    features: ['10 propostas/mês', 'Suporte por e-mail'],
    buttonProps: { label: 'Assine agora' },
  },
  {
    id: 'plan_pro_individual_monthly',
    filterValues: { userType: 'individual', interval: 'monthly' },
    title: 'Pro',
    subtitle: 'Para pessoas físicas',
    price: {
      value: 'R$ 59',
      interval: '/mês',
      description: 'Cobrado mensalmente',
    },
    features: ['Propostas ilimitadas', 'Suporte prioritário'],
    buttonProps: { label: 'Upgrade' },
  },
  {
    id: 'plan_basic_individual_yearly',
    filterValues: { userType: 'individual', interval: 'yearly' },
    title: 'Basic',
    subtitle: 'Para pessoas físicas',
    price: {
      value: 'R$ 24',
      interval: '/mês',
      description: 'Cobrado anualmente (R$ 288/ano)',
    },
    features: ['10 propostas/mês', 'Suporte por e-mail'],
    buttonProps: { label: 'Assine agora' },
  },
  {
    id: 'plan_pro_individual_yearly',
    filterValues: { userType: 'individual', interval: 'yearly' },
    title: 'Pro',
    subtitle: 'Para pessoas físicas',
    price: {
      value: 'R$ 49',
      interval: '/mês',
      description: 'Cobrado anualmente (R$ 588/ano)',
    },
    features: ['Propostas ilimitadas', 'Suporte prioritário'],
    buttonProps: { label: 'Upgrade' },
  },
  {
    id: 'plan_starter_business_monthly',
    filterValues: { userType: 'business', interval: 'monthly' },
    title: 'Starter',
    subtitle: 'Para empresas',
    price: {
      value: 'R$ 99',
      interval: '/mês',
      description: 'Cobrado mensalmente',
    },
    features: ['5 usuários', 'Relatórios avançados'],
    buttonProps: { label: 'Assine agora' },
  },
  {
    id: 'plan_enterprise_business_monthly',
    filterValues: { userType: 'business', interval: 'monthly' },
    title: 'Enterprise',
    subtitle: 'Para empresas',
    price: {
      value: 'Sob consulta',
      interval: '',
      description: 'Solicite um orçamento',
    },
    features: ['Usuários ilimitados', 'SLA dedicado'],
    variant: 'secondary',
    buttonProps: { label: 'Fale conosco' },
  },
  {
    id: 'plan_starter_business_yearly',
    filterValues: { userType: 'business', interval: 'yearly' },
    title: 'Starter',
    subtitle: 'Para empresas',
    price: {
      value: 'R$ 83',
      interval: '/mês',
      description: 'Cobrado anualmente (R$ 996/ano)',
    },
    features: ['5 usuários', 'Relatórios avançados'],
    buttonProps: { label: 'Assine agora' },
  },
  {
    id: 'plan_enterprise_business_yearly',
    filterValues: { userType: 'business', interval: 'yearly' },
    title: 'Enterprise',
    subtitle: 'Para empresas',
    price: {
      value: 'Sob consulta',
      interval: '',
      description: 'Solicite um orçamento',
    },
    features: ['Usuários ilimitados', 'SLA dedicado'],
    variant: 'secondary',
    buttonProps: { label: 'Fale conosco' },
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
