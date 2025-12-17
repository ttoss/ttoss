import { render, screen } from '@ttoss/test-utils/react';

import { PlanCard } from '../../../src';

test('renders required content and keeps section order', () => {
  render(
    <PlanCard
      title="Starter"
      subtitle="For individuals getting started"
      metadata={[
        {
          label: 'Service Metadata',
          parameters: [
            { name: 'monthlySpendMax: ', value: '$1,000' },
            { name: 'maxAdAccounts: ', value: '2' },
          ],
          icon: '',
        },
      ]}
      price={{ value: 29, interval: '/month', description: 'Billed monthly' }}
      features={['✓ Basic reporting']}
      buttonProps={{ label: 'Assine agora' }}
    />
  );

  const title = screen.getByText('Starter');
  const subtitle = screen.getByText('For individuals getting started');
  const label1 = screen.getByText('monthlySpendMax:');
  const value1 = screen.getByText('$1,000');
  const label2 = screen.getByText('maxAdAccounts:');
  const value2 = screen.getByText('2');
  const priceValue = screen.getByText('29');
  const priceInterval = screen.getByText('/month');
  const priceDescription = screen.getByText('Billed monthly');
  const feature = screen.getByText('✓ Basic reporting');
  const cta = screen.getByRole('button', { name: 'Assine agora' });

  expect(title).toBeInTheDocument();
  expect(subtitle).toBeInTheDocument();
  expect(label1).toBeInTheDocument();
  expect(value1).toBeInTheDocument();
  expect(label2).toBeInTheDocument();
  expect(value2).toBeInTheDocument();
  expect(priceValue).toBeInTheDocument();
  expect(priceInterval).toBeInTheDocument();
  expect(priceDescription).toBeInTheDocument();
  expect(feature).toBeInTheDocument();
  expect(cta).toBeInTheDocument();

  expect(
    title.compareDocumentPosition(subtitle) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(
    subtitle.compareDocumentPosition(label1) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(
    label1.compareDocumentPosition(priceValue) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(
    priceValue.compareDocumentPosition(feature) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(
    feature.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
});

test('optional sections are omitted when not provided', () => {
  render(
    <PlanCard title="Starter" price={{ value: 29, interval: '/month' }} />
  );

  expect(screen.getByText('Starter')).toBeInTheDocument();
  expect(screen.queryByText('/month')).toBeInTheDocument();
  expect(screen.queryByText('For individuals getting started')).toBeNull();
  expect(screen.queryByText('monthlySpendMax: ')).toBeNull();
  expect(screen.queryByText('✓ Basic reporting')).toBeNull();
});

test('CTA label defaults to Assine agora', () => {
  render(
    <PlanCard
      title="Starter"
      price={{ value: 29, interval: '/month' }}
      buttonProps={{
        onClick: () => {
          return undefined;
        },
      }}
    />
  );

  expect(
    screen.getByRole('button', { name: 'Assine agora' })
  ).toBeInTheDocument();
});
