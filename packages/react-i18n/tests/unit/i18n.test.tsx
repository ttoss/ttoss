import {
  DEFAULT_LOCALE,
  FormattedMessage,
  I18nProvider,
  defineMessage,
  defineMessages,
  useI18n,
} from '../../src';
import { act, render, renderHook, screen } from '@ttoss/test-utils';

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
  await act(async () => {
    expect(await screen.findByText('My name is Pedro.')).toBeInTheDocument();
  });
});
