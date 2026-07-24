import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PLANS, USAGE } from 'src/data';
import { BillingPage, formatPrice } from 'src/pages/BillingPage';
import { resetWorkspace } from 'src/store';

beforeEach(() => {
  resetWorkspace();
});

describe('formatPrice', () => {
  test.each([
    [0, 'Free'],
    [20, '$20'],
    [250, '$250'],
  ])('%s → %s', (price, expected) => {
    expect(formatPrice(price)).toBe(expected);
  });
});

describe('BillingPage', () => {
  test('renders the current plan with usage meters', () => {
    render(<BillingPage />);

    expect(screen.getByText('Pro plan')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    for (const item of USAGE) {
      expect(
        screen.getByRole('meter', { name: item.label })
      ).toBeInTheDocument();
      expect(screen.getByText(item.detail)).toBeInTheDocument();
    }
  });

  test('renders the three plan tiers with their features', () => {
    render(<BillingPage />);

    for (const plan of PLANS) {
      for (const feature of plan.features) {
        // Tiers share features (e.g. "Unlimited deploys") — allow duplicates.
        expect(screen.getAllByText(feature).length).toBeGreaterThan(0);
      }
    }
    // Badge on the tier card + the disabled action both say "Current plan".
    expect(screen.getAllByText('Current plan')).toHaveLength(2);
  });

  test('upgrading moves the workspace to the new plan', async () => {
    const user = userEvent.setup();
    render(<BillingPage />);

    await user.click(screen.getByRole('button', { name: 'Upgrade to Scale' }));

    const dialog = await screen.findByRole('dialog');
    await user.click(
      within(dialog).getByRole('button', { name: 'Switch to Scale' })
    );

    expect(await screen.findByText('Scale plan')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Downgrade to Pro' })
    ).toBeInTheDocument();
  });
});
