import * as React from 'react';
import { IntlProvider, MessageFormatElement } from 'react-intl';

export type Messages =
  | Record<string, string>
  | Record<string, MessageFormatElement[]>;

export type LoadLocaleData = (locale: string) => Promise<Messages> | Messages;

export type I18nProviderProps = {
  locale?: string;
  loadLocaleData?: LoadLocaleData;
  children?: React.ReactNode;
  onError?: (err: Error) => void;
};

/**
 * `DEFAULT_LOCALE` must be `en` because is the default of the other modules.
 */
export const DEFAULT_LOCALE = 'en';

export type I18nConfigContextProps = Omit<
  I18nProviderProps,
  'LoadLocaleData'
> & {
  defaultLocale: string;
  messages?: Messages;
  setLocale: (language: string) => void;
};

export const I18nConfigContext = React.createContext<I18nConfigContextProps>({
  defaultLocale: DEFAULT_LOCALE,
  messages: {},
  setLocale: () => {
    return null;
  },
});

export const I18nProvider = ({
  children,
  locale: initialLocale,
  loadLocaleData,
  ...intlConfig
}: I18nProviderProps) => {
  /**
   * This is state is a internal state of the I18nProvider. Users modify it
   * through the `setLocale` function or by changing the `locale` prop. It
   * triggers the useEffect below to load the locale data.
   */
  const [locale, setLocale] = React.useState<string>(
    initialLocale || DEFAULT_LOCALE
  );

  /**
   * This state exists because of the `loadLocaleData` async characteristic.
   * It is used to store the locale and the loaded messages because `messages`
   * can be undefined while they are being loaded. This way, we need to sync
   * the `messages` with a `locale` before passing to the IntlProvider.
   * If we pass `locale` defined and `messages` undefined, the IntlProvider
   * will display a MISSING TRANSLATION error on console.
   */
  const [messagesAndLocale, setMessagesAndLocale] = React.useState<{
    messages?: Messages;
    locale: string;
  }>({
    locale: DEFAULT_LOCALE,
  });

  React.useEffect(() => {
    if (loadLocaleData && locale) {
      /**
       * https://stackoverflow.com/a/27760489/8786986
       */
      Promise.resolve(loadLocaleData(locale)).then((messages) => {
        setMessagesAndLocale({ messages, locale });
      });
    }
  }, [loadLocaleData, locale]);

  return (
    <I18nConfigContext.Provider
      value={{
        locale,
        defaultLocale: DEFAULT_LOCALE,
        messages: messagesAndLocale.messages,
        setLocale,
        ...intlConfig,
      }}
    >
      <IntlProvider
        defaultLocale={DEFAULT_LOCALE}
        locale={messagesAndLocale.locale}
        messages={messagesAndLocale.messages}
        {...intlConfig}
      >
        <>{children}</>
      </IntlProvider>
    </I18nConfigContext.Provider>
  );
};
