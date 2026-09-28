import { act, render, screen } from '@ttoss/test-utils/react';
import type { LoadLocaleData } from 'src/index';
import { defineMessages, I18nProvider, useI18n } from 'src/index';

const messages = defineMessages({
  otherMessage: {
    description: 'Other message',
    defaultMessage: 'Other message',
  },
});

const Probe = () => {
  const { intl, locale, defaultLocale } = useI18n();
  return (
    <p>
      {locale}|{defaultLocale}|{intl.locale}|
      {intl.formatMessage(messages.otherMessage)}
    </p>
  );
};

const flush = async () => {
  await act(async () => {
    await jest.runAllTimersAsync();
  });
};

const delay = (ms: number) => {
  return new Promise((resolve) => {
    return setTimeout(resolve, ms);
  });
};

test('follows the locale prop after mount', async () => {
  const loadLocaleData: LoadLocaleData = (locale) => {
    return locale === 'pt-BR'
      ? { [messages.otherMessage.id!]: 'Outra mensagem' }
      : {};
  };

  const { rerender } = render(
    <I18nProvider locale="en" loadLocaleData={loadLocaleData}>
      <Probe />
    </I18nProvider>,
    { wrapper: undefined }
  );
  await flush();

  expect(screen.getByText('en|en|en|Other message')).toBeInTheDocument();

  rerender(
    <I18nProvider locale="pt-BR" loadLocaleData={loadLocaleData}>
      <Probe />
    </I18nProvider>
  );
  await flush();

  expect(screen.getByText('pt-BR|en|pt-BR|Outra mensagem')).toBeInTheDocument();
});

test('a slower load for an abandoned locale does not win', async () => {
  const loadLocaleData: LoadLocaleData = async (locale) => {
    if (locale === 'pt-BR') {
      await delay(1000);
      return { [messages.otherMessage.id!]: 'Outra mensagem' };
    }
    await delay(10);
    return { [messages.otherMessage.id!]: 'Otro mensaje' };
  };

  const { rerender } = render(
    <I18nProvider locale="pt-BR" loadLocaleData={loadLocaleData}>
      <Probe />
    </I18nProvider>,
    { wrapper: undefined }
  );

  rerender(
    <I18nProvider locale="es" loadLocaleData={loadLocaleData}>
      <Probe />
    </I18nProvider>
  );
  await flush();

  expect(screen.getByText('es|en|es|Otro mensaje')).toBeInTheDocument();
});

test('defaultLocale sets the source locale and silences its missing translations', async () => {
  const onError = jest.fn();

  render(
    <I18nProvider
      defaultLocale="pt-BR"
      loadLocaleData={() => {
        return {};
      }}
      onError={onError}
    >
      <Probe />
    </I18nProvider>,
    { wrapper: undefined }
  );
  await flush();

  expect(
    screen.getByText('pt-BR|pt-BR|pt-BR|Other message')
  ).toBeInTheDocument();
  expect(onError).not.toHaveBeenCalled();
});

test('reports a failed load to onError', async () => {
  const onError = jest.fn();
  const failure = new Error('network');

  render(
    <I18nProvider
      locale="pt-BR"
      loadLocaleData={() => {
        return Promise.reject(failure);
      }}
      onError={onError}
    >
      <Probe />
    </I18nProvider>,
    { wrapper: undefined }
  );
  await flush();

  expect(onError).toHaveBeenCalledWith(failure);
  expect(screen.getByText('pt-BR|en|en|Other message')).toBeInTheDocument();
});

test('keeps the current locale when the locale prop is removed', async () => {
  const { rerender } = render(
    <I18nProvider locale="pt-BR">
      <Probe />
    </I18nProvider>,
    { wrapper: undefined }
  );
  await flush();

  rerender(
    <I18nProvider>
      <Probe />
    </I18nProvider>
  );
  await flush();

  // Without loadLocaleData nothing loads, so react-intl stays on the default.
  expect(screen.getByText('pt-BR|en|en|Other message')).toBeInTheDocument();
});
