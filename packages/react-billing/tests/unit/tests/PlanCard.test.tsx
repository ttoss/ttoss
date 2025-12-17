import { render, screen } from '@ttoss/test-utils/react';

import { PlanCard } from '../../../src';

test('renders all required sections and keeps order', () => {
  render(
    <PlanCard>
      <PlanCard.TopTag>{'TRIAL'}</PlanCard.TopTag>
      <PlanCard.Header>{'HEADER'}</PlanCard.Header>
      <PlanCard.Metadata>{'METADATA'}</PlanCard.Metadata>
      <PlanCard.Price>{'PRICE'}</PlanCard.Price>
      <PlanCard.Features>{'FEATURES'}</PlanCard.Features>
      <PlanCard.CTA label="Assine agora" />
    </PlanCard>
  );

  const topTag = screen.getByText('TRIAL');
  const header = screen.getByText('HEADER');
  const metadata = screen.getByText('METADATA');
  const price = screen.getByText('PRICE');
  const features = screen.getByText('FEATURES');
  const cta = screen.getByRole('button', { name: 'Assine agora' });

  expect(
    topTag.compareDocumentPosition(header) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(
    header.compareDocumentPosition(metadata) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(
    metadata.compareDocumentPosition(price) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(
    price.compareDocumentPosition(features) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(
    features.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
});

test('TopTag is optional', () => {
  render(
    <PlanCard>
      <PlanCard.Header>{'HEADER'}</PlanCard.Header>
      <PlanCard.Metadata>{'METADATA'}</PlanCard.Metadata>
      <PlanCard.Price>{'PRICE'}</PlanCard.Price>
      <PlanCard.Features>{'FEATURES'}</PlanCard.Features>
      <PlanCard.CTA label="Buy" />
    </PlanCard>
  );

  expect(screen.queryByText('TRIAL')).toBeNull();
  expect(screen.getByText('HEADER')).toBeInTheDocument();
});

test('CTA label can be customized', () => {
  render(
    <PlanCard>
      <PlanCard.Header>{'HEADER'}</PlanCard.Header>
      <PlanCard.Metadata>{'METADATA'}</PlanCard.Metadata>
      <PlanCard.Price>{'PRICE'}</PlanCard.Price>
      <PlanCard.Features>{'FEATURES'}</PlanCard.Features>
      <PlanCard.CTA label="Upgrade now" />
    </PlanCard>
  );

  expect(
    screen.getByRole('button', { name: 'Upgrade now' })
  ).toBeInTheDocument();
});
