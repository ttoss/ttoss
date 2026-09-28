import { fmt, msg } from '@ttoss/i18n-core';
import { act, render, screen } from '@ttoss/test-utils/react';
import { defineMessages, I18nProvider, LocalizedText } from 'src/index';

const messages = defineMessages({
  spent: {
    defaultMessage: 'Campaign {campaign} spent {amount}.',
    description: 'Spend line',
  },
});

// A reference as the backend sends it: JSON, not a live object.
const ref = JSON.parse(
  JSON.stringify(
    msg(messages.spent, {
      campaign: 'Black Friday',
      amount: fmt.currency({ value: 1234.5, currency: 'USD' }),
    })
  )
);

const renderIn = async (locale: string) => {
  render(
    <I18nProvider
      locale={locale}
      loadLocaleData={(requested) => {
        return requested === 'pt-BR'
          ? { [messages.spent.id!]: 'A campanha {campaign} gastou {amount}.' }
          : {};
      }}
    >
      <p data-testid="text">
        <LocalizedText value={ref} />
      </p>
    </I18nProvider>,
    { wrapper: undefined }
  );
  await act(async () => {
    await jest.runAllTimersAsync();
  });
  return screen.getByTestId('text').textContent;
};

test('renders a backend reference in the current locale, keeping its currency', async () => {
  expect(await renderIn('pt-BR')).toBe(
    'A campanha Black Friday gastou US$ 1.234,50.'
  );
});

test('falls back to the reference defaultMessage', async () => {
  expect(await renderIn('en')).toBe('Campaign Black Friday spent $1,234.50.');
});

test('renders a plain string unchanged', async () => {
  render(<LocalizedText value="Texto legado" />);
  expect(screen.getByText('Texto legado')).toBeInTheDocument();
});
