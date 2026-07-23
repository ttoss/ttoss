import { render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@ttoss/fsl-theme/react';
import { axe } from 'jest-axe';

import { PricingBlock } from '../../../src/blocks/PricingBlock';
import { theme } from '../../../src/theme';

const renderBlock = () => {
  return render(
    <ThemeProvider theme={theme}>
      <PricingBlock />
    </ThemeProvider>
  );
};

test('renders three tiers with prices and CTAs, no a11y violations', async () => {
  const { container } = renderBlock();

  expect(
    screen.getByRole('heading', { name: 'Simple, honest pricing' })
  ).toBeInTheDocument();
  for (const name of ['Starter', 'Pro', 'Enterprise']) {
    expect(screen.getByRole('heading', { name })).toBeInTheDocument();
  }
  expect(screen.getByText('$29')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Start free trial' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Contact sales' })
  ).toBeInTheDocument();

  expect(await axe(container)).toHaveNoViolations();
});

test('the popular tier is highlighted', () => {
  renderBlock();

  expect(screen.getByText('Most popular')).toBeInTheDocument();
  const badge = screen
    .getByText('Most popular')
    .closest('[data-scope="badge"]');
  expect(badge).toHaveAttribute('data-evaluation', 'positive');
});

test('feature lists are semantic lists with intent-named check glyphs', () => {
  const { container } = renderBlock();

  const proList = screen.getByRole('list', { name: 'Pro features' });
  expect(within(proList).getAllByRole('listitem')).toHaveLength(4);
  expect(screen.getAllByRole('list')).toHaveLength(3);

  // 3 + 4 + 4 feature rows, each with a decorative status.success Icon.
  const icons = container.querySelectorAll(
    '[data-scope="icon"][icon="fsl-ui:status-success"]'
  );
  expect(icons).toHaveLength(11);
  expect(icons[0]).toHaveAttribute('aria-hidden', 'true');
});
