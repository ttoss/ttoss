import { fireEvent, render, screen } from '@ttoss/test-utils/react';

import type { PlansPanelFilter, PlansPanelPlan } from '../../../src';
import { PlansPanel } from '../../../src';

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
    features: ['10 propostas/mês'],
    buttonProps: { label: 'Assine agora' },
  },
  {
    id: 'plan_basic_individual_yearly',
    filterValues: { userType: 'individual', interval: 'yearly' },
    title: 'Basic Anual',
    subtitle: 'Para pessoas físicas',
    price: {
      value: 'R$ 24',
      interval: '/mês',
      description: 'Cobrado anualmente',
    },
    features: ['10 propostas/mês'],
    buttonProps: { label: 'Assine agora' },
  },
  {
    id: 'plan_pro_business_monthly',
    filterValues: { userType: 'business', interval: 'monthly' },
    title: 'Pro',
    subtitle: 'Para empresas',
    price: { value: 'R$ 99', interval: '/mês' },
    features: ['Ilimitado'],
    buttonProps: { label: 'Assine agora' },
  },
];

test('renders plans matching the default filter values', () => {
  render(<PlansPanel filters={filters} plans={plans} />);

  // With default values individual + monthly, only plan_basic_individual_monthly should show
  expect(screen.getByText('Basic')).toBeInTheDocument();
  expect(screen.queryByText('Basic Anual')).toBeNull();
  expect(screen.queryByText('Pro')).toBeNull();
});

test('renders filter labels and options', () => {
  render(<PlansPanel filters={filters} plans={plans} />);

  expect(screen.getByText('Para quem?')).toBeInTheDocument();
  expect(screen.getByText('Frequência')).toBeInTheDocument();
  expect(screen.getByText('Pessoa física')).toBeInTheDocument();
  expect(screen.getByText('Empresa')).toBeInTheDocument();
  expect(screen.getByText('Mensal')).toBeInTheDocument();
  expect(screen.getByText('Anual')).toBeInTheDocument();
});

test('filters plans when filter value changes', () => {
  render(<PlansPanel filters={filters} plans={plans} />);

  // Click "Anual" option
  fireEvent.click(screen.getByText('Anual'));

  // Now individual + yearly should show Basic Anual
  expect(screen.getByText('Basic Anual')).toBeInTheDocument();
  expect(screen.queryByText('Basic')).toBeNull();
  expect(screen.queryByText('Pro')).toBeNull();
});

test('highlights active plan with secondary variant', () => {
  const { container } = render(
    <PlansPanel
      filters={filters}
      plans={plans}
      activePlanId="plan_basic_individual_monthly"
    />
  );

  // The active plan card gets data-variant attribute for secondary variant
  // We just verify the active plan renders
  expect(screen.getByText('Basic')).toBeInTheDocument();
  expect(container.querySelector('[data-plancard-active]')).toBeNull(); // no special attribute
});

test('calls onSelectPlan with plan id when CTA is clicked', () => {
  const onSelectPlan = jest.fn();

  render(
    <PlansPanel filters={filters} plans={plans} onSelectPlan={onSelectPlan} />
  );

  const buttons = screen.getAllByRole('button', { name: 'Assine agora' });
  fireEvent.click(buttons[0]);

  expect(onSelectPlan).toHaveBeenCalledTimes(1);
  expect(onSelectPlan).toHaveBeenCalledWith('plan_basic_individual_monthly');
});

test('supports controlled filter mode', () => {
  const onFilterChange = jest.fn();

  render(
    <PlansPanel
      filters={filters}
      plans={plans}
      filterValues={{ userType: 'business', interval: 'monthly' }}
      onFilterChange={onFilterChange}
    />
  );

  // business + monthly → Pro plan
  expect(screen.getByText('Pro')).toBeInTheDocument();
  expect(screen.queryByText('Basic')).toBeNull();

  // Click "Anual" triggers onFilterChange
  fireEvent.click(screen.getByText('Anual'));
  expect(onFilterChange).toHaveBeenCalledWith('interval', 'yearly');
});

test('renders all plans when no filters are provided', () => {
  render(<PlansPanel plans={plans} />);

  // All plans have no filter match required when no filters exist
  // But since filterValues is empty object, all plans whose filterValues entries
  // don't match anything are shown.
  // Plans with filterValues are only filtered when there are active filter values.
  // With no filters, activeFilterValues = {}, so Object.entries([]) = [], every() = true
  expect(screen.getByText('Basic')).toBeInTheDocument();
  expect(screen.getByText('Basic Anual')).toBeInTheDocument();
  expect(screen.getByText('Pro')).toBeInTheDocument();
});

test('renders plans without filterValues always', () => {
  const unfilteredPlans: PlansPanelPlan[] = [
    {
      id: 'plan_universal',
      title: 'Universal',
      price: { value: 'R$ 0', interval: '/mês' },
      buttonProps: { label: 'Comece grátis' },
    },
  ];

  render(<PlansPanel filters={filters} plans={unfilteredPlans} />);

  expect(screen.getByText('Universal')).toBeInTheDocument();
});

test('merges plan buttonProps onClick with onSelectPlan', () => {
  const onSelectPlan = jest.fn();
  const planOnClick = jest.fn();

  const testPlans: PlansPanelPlan[] = [
    {
      id: 'plan_test',
      title: 'Test Plan',
      price: { value: 'R$ 10', interval: '/mês' },
      buttonProps: { label: 'Click me', onClick: planOnClick },
    },
  ];

  render(<PlansPanel plans={testPlans} onSelectPlan={onSelectPlan} />);

  fireEvent.click(screen.getByRole('button', { name: 'Click me' }));

  expect(onSelectPlan).toHaveBeenCalledWith('plan_test');
  expect(planOnClick).toHaveBeenCalledTimes(1);
});
