import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PLANS, USAGE } from 'src/data';
import {
  BillingPage,
  cardLast4,
  formatPrice,
  validateCardNumber,
} from 'src/pages/BillingPage';
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

describe('the payment wizard (forms item G consumer)', () => {
  const openWizard = async (user: ReturnType<typeof userEvent.setup>) => {
    render(<BillingPage />);
    await user.click(
      screen.getByRole('button', { name: 'Add payment method' })
    );
    return screen.findByRole('dialog', { name: 'Add payment method' });
  };

  test('an invalid card step blocks the advance through native validation', async () => {
    const user = userEvent.setup();
    const dialog = await openWizard(user);

    await user.click(within(dialog).getByRole('button', { name: 'Next' }));

    // Still on step 1 — the required card number refused the submit and its
    // own message part reports it; the wizard did not advance.
    expect(
      within(dialog).getByRole('textbox', { name: /Card number/ })
    ).toBeInTheDocument();
    expect(
      dialog.querySelector(
        '[data-scope="text-field"][data-part="validationMessage"]'
      )
    ).toHaveTextContent(/\S/);
  });

  test('the Expiry FieldGroup names the cluster and each control', async () => {
    const user = userEvent.setup();
    const dialog = await openWizard(user);

    expect(
      within(dialog).getByRole('group', { name: 'Expiry' })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: /Expiry month/ })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: /Expiry year/ })
    ).toBeInTheDocument();
  });

  test('a complete flow saves the card and shows its last four digits', async () => {
    const user = userEvent.setup();
    const dialog = await openWizard(user);

    await user.type(
      within(dialog).getByRole('textbox', { name: /Card number/ }),
      '4242 4242 4242 4242'
    );
    await user.click(
      within(dialog).getByRole('button', { name: /Expiry month/ })
    );
    await user.click(await screen.findByRole('option', { name: '04' }));
    await user.click(
      within(dialog).getByRole('button', { name: /Expiry year/ })
    );
    await user.click(await screen.findByRole('option', { name: '2028' }));
    await user.click(within(dialog).getByRole('button', { name: 'Next' }));

    // Step 2 — the same forward button is now the last step's submit.
    await user.type(
      within(dialog).getByRole('textbox', { name: /Name on card/ }),
      'Ana Souza'
    );
    await user.type(
      within(dialog).getByRole('textbox', { name: /Billing address/ }),
      'Rua das Flores 100, Lisboa'
    );
    // The format registry's first consumers: typing digits masks as it goes,
    // and each field raised the right keyboard (inputmode) from one name.
    const cep = within(dialog).getByRole('textbox', { name: /CEP/ });
    await user.type(cep, '01310100');
    expect(cep).toHaveValue('01310-100');
    expect(cep).toHaveAttribute('inputmode', 'numeric');
    const cnpj = within(dialog).getByRole('textbox', { name: /CNPJ/ });
    await user.type(cnpj, '12345678000195');
    expect(cnpj).toHaveValue('12.345.678/0001-95');
    await user.click(within(dialog).getByRole('button', { name: 'Save card' }));

    expect(await screen.findByText('Card ending 4242')).toBeInTheDocument();
  });
});

describe('cardLast4 / validateCardNumber', () => {
  test.each([
    ['4242 4242 4242 4242', '4242'],
    ['4111-1111-1111-1111', '1111'],
  ])('%s → last4 %s', (input, expected) => {
    expect(cardLast4(input)).toBe(expected);
  });

  test.each([
    ['4242 4242 4242 4242', null],
    ['4242', 'Enter the 13–19 digits on the front of the card.'],
    ['not a card', 'Enter the 13–19 digits on the front of the card.'],
  ])('%s → %s', (input, expected) => {
    expect(validateCardNumber(input)).toBe(expected);
  });
});
