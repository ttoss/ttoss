import {
  DEFAULT_LOCALE,
  FormattedMessage,
  I18nProvider,
  defineMessage,
  defineMessages,
  useI18n,
} from '../../src';
import { PropsWithChildren } from 'react';
import { act, render, renderHook, screen } from '@ttoss/test-utils';
import { loadLocaleData } from '../setupTests';

const messages = defineMessages({
  myNameIs: {
    description: 'My name is',
    defaultMessage: 'My name is {name}.',
  },
  otherMessage: {
    description: 'Other message',
    defaultMessage: 'Other message',
  },
});

const ProviderWithErrorHandler = ({ children }: PropsWithChildren) => {
  return (
    <I18nProvider
      loadLocaleData={loadLocaleData}
      locale="pt-BR"
      onError={(err) => {
        return;
      }}
    >
      {children}
    </I18nProvider>
  );
};

let languageGetter: jest.SpyInstance;

beforeEach(() => {
  languageGetter = jest.spyOn(window.navigator, 'language', 'get');
  languageGetter.mockReturnValue('en');
});

test('should export components', () => {
  expect(I18nProvider).toBeDefined();
  expect(useI18n).toBeDefined();
  expect(defineMessage).toBeDefined();
  expect(defineMessages).toBeDefined();
});

test('defaultLocale must be defined', async () => {
  const { result } = renderHook(() => {
    return useI18n();
  });

  await act(() => {
    expect(result.current.defaultLocale).toBe(DEFAULT_LOCALE);
  });
});

test('locale must be equal of the browser', async () => {
  languageGetter.mockReturnValue('pt-BR');

  const { result } = renderHook(() => {
    return useI18n();
  });

  await act(() => {
    expect(result.current.locale).toBe('pt-BR');
  });
});

test('formatMessage - default message', async () => {
  const { result } = renderHook(() => {
    return useI18n();
  });

  await act(() => {
    const message = result.current.intl.formatMessage(messages.myNameIs, {
      name: 'John Doe',
    });

    expect(message).toBe('My name is John Doe.');
  });
});

test('formatMessage - change en -> pt-BR -> en', async () => {
  const { result } = renderHook(() => {
    return useI18n();
  });

  expect(result.current.locale).toBe('en');
  expect(result.current.intl.formatMessage(messages.otherMessage)).toBe(
    'Other message'
  );

  await act(() => {
    result.current.setLocale('pt-BR');
  });

  expect(result.current.locale).toBe('pt-BR');
  expect(result.current.intl.formatMessage(messages.otherMessage)).toBe(
    'Outra mensagem'
  );

  await act(() => {
    result.current.setLocale('en');
  });

  expect(result.current.locale).toBe('en');
  expect(result.current.intl.formatMessage(messages.otherMessage)).toBe(
    'Other message'
  );
});

test('FormattedMessage component', async () => {
  const Component = () => {
    return (
      <FormattedMessage {...messages.myNameIs} values={{ name: 'Pedro' }} />
    );
  };

  render(<Component />);

  /**
   * https://testing-library.com/docs/dom-testing-library/api-async/#findby-queries
   */
  expect(await screen.findByText('My name is Pedro.')).toBeInTheDocument();
});

test('Custom Error Handler', async () => {
  const { result } = renderHook(() => {
    return useI18n();
  });
  const { result: errorHandledResult } = renderHook(
    () => {
      return useI18n();
    },
    { wrapper: ProviderWithErrorHandler }
  );

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const mock = jest.spyOn(console, 'error').mockImplementation(() => {});

  await act(async () => {
    await result.current.setLocale('pt-BR');
    await errorHandledResult.current.setLocale('pt-BR');
  });

  result.current.intl.formatMessage({
    defaultMessage: 'Untranslated Message',
    description: 'Untranslated Message',
  });

  // eslint-disable-next-line no-console
  expect(console.error).toHaveBeenCalled();

  // From here, the test verifies if an provider with error handler is working properly

  mock.mockReset();

  errorHandledResult.current.intl.formatMessage({
    defaultMessage: 'Untranslated Message',
    description: 'Untranslated Message',
  });

  /**
   * https://stackoverflow.com/questions/47706157/jest-how-to-assert-that-function-is-not-called
   */
  // eslint-disable-next-line no-console
  expect(console.error).not.toHaveBeenCalled();

  mock.mockRestore();
  mock.mockClear();
});
