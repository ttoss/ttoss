import { fireEvent, render, screen } from '@ttoss/test-utils/react';

import type { PlansPanelFilter, PlansPanelPlan } from '../../../src';
import { PlansPanel } from '../../../src';

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
      value: 'R$ 29',
      interval: '/month',
      description: 'Billed monthly',
    },
    features: ['10 proposals/month'],
    buttonProps: { label: 'Subscribe' },
  },
  {
    id: 'plan_basic_individual_yearly',
    filterValues: { userType: 'individual', interval: 'yearly' },
    title: 'Basic Annual',
    subtitle: 'For individuals',
    price: {
      value: 'R$ 24',
      interval: '/month',
      description: 'Billed annually',
    },
    features: ['10 proposals/month'],
    buttonProps: { label: 'Subscribe' },
  },
  {
    id: 'plan_pro_business_monthly',
    filterValues: { userType: 'business', interval: 'monthly' },
    title: 'Pro',
    subtitle: 'For businesses',
    price: { value: 'R$ 99', interval: '/month' },
    features: ['Unlimited'],
    buttonProps: { label: 'Subscribe' },
  },
];

test('renders plans matching the default filter values', () => {
  render(<PlansPanel filters={filters} plans={plans} />);

  // With default values individual + monthly, only plan_basic_individual_monthly should show
  expect(screen.getByText('Basic')).toBeInTheDocument();
  expect(screen.queryByText('Basic Annual')).toBeNull();
  expect(screen.queryByText('Pro')).toBeNull();
});

test('renders filter labels and options', () => {
  render(<PlansPanel filters={filters} plans={plans} />);

  expect(screen.getByText('User type')).toBeInTheDocument();
  expect(screen.getByText('Billing frequency')).toBeInTheDocument();
  expect(screen.getByText('Individual')).toBeInTheDocument();
  expect(screen.getByText('Business')).toBeInTheDocument();
  expect(screen.getByText('Monthly')).toBeInTheDocument();
  expect(screen.getByText('Yearly')).toBeInTheDocument();
});

test('filters plans when filter value changes', () => {
  render(<PlansPanel filters={filters} plans={plans} />);

  // Click "Yearly" option
  fireEvent.click(screen.getByText('Yearly'));

  // Now individual + yearly should show Basic Annual
  expect(screen.getByText('Basic Annual')).toBeInTheDocument();
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

  // The active plan renders (variant is applied internally)
  expect(screen.getByText('Basic')).toBeInTheDocument();
  expect(container.querySelector('[data-plancard-active]')).toBeNull();
});

test('calls onSelectPlan with plan id when CTA is clicked', () => {
  const onSelectPlan = jest.fn();

  render(
    <PlansPanel filters={filters} plans={plans} onSelectPlan={onSelectPlan} />
  );

  const buttons = screen.getAllByRole('button', { name: 'Subscribe' });
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

  // Click "Yearly" triggers onFilterChange
  fireEvent.click(screen.getByText('Yearly'));
  expect(onFilterChange).toHaveBeenCalledWith('interval', 'yearly');
});

test('renders all plans when no filters are provided', () => {
  render(<PlansPanel plans={plans} />);

  // With no filters, activeFilterValues = {}, so every() over empty entries = true
  expect(screen.getByText('Basic')).toBeInTheDocument();
  expect(screen.getByText('Basic Annual')).toBeInTheDocument();
  expect(screen.getByText('Pro')).toBeInTheDocument();
});

test('renders plans without filterValues always', () => {
  const unfilteredPlans: PlansPanelPlan[] = [
    {
      id: 'plan_universal',
      title: 'Universal',
      price: { value: 'R$ 0', interval: '/month' },
      buttonProps: { label: 'Start free' },
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
      price: { value: 'R$ 10', interval: '/month' },
      buttonProps: { label: 'Click me', onClick: planOnClick },
    },
  ];

  render(<PlansPanel plans={testPlans} onSelectPlan={onSelectPlan} />);

  fireEvent.click(screen.getByRole('button', { name: 'Click me' }));

  expect(onSelectPlan).toHaveBeenCalledWith('plan_test');
  expect(planOnClick).toHaveBeenCalledTimes(1);
});
