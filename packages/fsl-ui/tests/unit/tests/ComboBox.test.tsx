/**
 * ComboBox — Input-entity text field with a filtered option list.
 *
 * The behaviour that justifies the component's existence is typeahead
 * filtering (friction F-008: a 30+ option `Select` popover is scan-only), so
 * the filtering path is tested first and hardest. Overlay suites run on real
 * timers — the global fake timers stall React Aria's positioning.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComboBox, ComboBoxItem } from 'src/index';

const ZONES = [
  ['America/Sao_Paulo', 'São Paulo'],
  ['America/New_York', 'New York'],
  ['Europe/Lisbon', 'Lisbon'],
  ['Europe/Berlin', 'Berlin'],
] as const;

const renderComboBox = (
  props: Partial<React.ComponentProps<typeof ComboBox>> = {}
) => {
  return render(
    <ComboBox label="Timezone" {...props}>
      {ZONES.map(([id, name]) => {
        return (
          <ComboBoxItem key={id} id={id}>
            {name}
          </ComboBoxItem>
        );
      })}
    </ComboBox>
  );
};

describe('ComboBox', () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  test('renders the root identity, label, and the text input', () => {
    renderComboBox();

    expect(
      document.querySelector('[data-scope="combo-box"][data-part="root"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-scope="combo-box"][data-part="label"]')
    ).toHaveTextContent('Timezone');
    expect(screen.getByRole('combobox', { name: 'Timezone' })).toBeVisible();
  });

  test('typing filters the options down to the matches', async () => {
    const user = userEvent.setup();
    renderComboBox();

    await user.type(screen.getByRole('combobox', { name: 'Timezone' }), 'Lis');

    expect(await screen.findByRole('option', { name: 'Lisbon' })).toBeVisible();
    expect(screen.queryByRole('option', { name: 'Berlin' })).toBeNull();
    expect(screen.queryByRole('option', { name: 'New York' })).toBeNull();
  });

  test('picking a filtered option commits it to the input', async () => {
    const user = userEvent.setup();
    const onSelectionChange = jest.fn();
    renderComboBox({ onSelectionChange });

    const input = screen.getByRole('combobox', { name: 'Timezone' });
    await user.type(input, 'Berl');
    await user.click(await screen.findByRole('option', { name: 'Berlin' }));

    expect(onSelectionChange).toHaveBeenCalledWith('Europe/Berlin');
    await waitFor(() => {
      expect(input).toHaveValue('Berlin');
    });
  });

  test('the chevron trigger opens the unfiltered list', async () => {
    const user = userEvent.setup();
    renderComboBox();

    // React Aria composes the trigger's name with the field label, so the
    // announced name is "Show suggestions Timezone" — match the knob only.
    await user.click(screen.getByRole('button', { name: /Show suggestions/ }));

    expect(await screen.findByRole('listbox')).toBeVisible();
    expect(screen.getAllByRole('option')).toHaveLength(ZONES.length);
  });

  test('renders the description and links it to the input', () => {
    renderComboBox({ description: 'Used for deploy timestamps.' });

    const description = document.querySelector(
      '[data-scope="combo-box"][data-part="description"]'
    );
    expect(description).toHaveTextContent('Used for deploy timestamps.');
    expect(screen.getByRole('combobox', { name: 'Timezone' })).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining(description?.id ?? '')
    );
  });

  test('shows the validation message when invalid', () => {
    renderComboBox({ isInvalid: true, errorMessage: 'Pick a timezone.' });

    expect(
      document.querySelector(
        '[data-scope="combo-box"][data-part="validationMessage"]'
      )
    ).toHaveTextContent('Pick a timezone.');
  });

  test('honours a controlled selectedKey', () => {
    renderComboBox({ selectedKey: 'Europe/Lisbon' });

    expect(screen.getByRole('combobox', { name: 'Timezone' })).toHaveValue(
      'Lisbon'
    );
  });

  test('a disabled field exposes no interactive input', () => {
    renderComboBox({ isDisabled: true });

    expect(screen.getByRole('combobox', { name: 'Timezone' })).toBeDisabled();
  });

  test('accepts a caller-localized trigger label', () => {
    renderComboBox({ triggerLabel: 'Ver sugestões' });

    expect(
      screen.getByRole('button', { name: /Ver sugestões/ })
    ).toBeInTheDocument();
  });
});
