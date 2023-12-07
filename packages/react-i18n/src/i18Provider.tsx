import * as React from 'react';
import { IntlProvider } from 'react-intl';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MessagesType = any;

// eslint-disable-next-line no-unused-vars
export type LoadLocaleData = (locale: string) => Promise<MessagesType>;

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
  messages: MessagesType;
  // eslint-disable-next-line no-unused-vars
  setLocale: (language: string) => void;
};

export const I18nConfigContext = React.createContext<I18nConfigContextProps>({
  defaultLocale: DEFAULT_LOCALE,
  messages: [],
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
   * locale state exist to setlocale provided by website on 'I18nConfigContext.Provider' and
   * to use in loadLocaleData function
   */
  const [locale, setLocale] = React.useState<string>(
    initialLocale || DEFAULT_LOCALE
  );

  /**
   * messagesAndLocale state exist because locale and messages depend on each other
   * so, they must be defined togheter to load translations correctly
   * if not, the website will take the 'locale' before take the translation package, so the 'message' will be undefined
   * and it will display an MISSING TRANSALTION error on console.
   */
  const [messagesAndLocale, setMessagesAndLocale] = React.useState<{
    messages?: MessagesType;
    locale: string;
  }>({
    locale: DEFAULT_LOCALE,
  });

  React.useEffect(() => {
    if (loadLocaleData && locale) {
      loadLocaleData(locale).then((messages) => {
        setMessagesAndLocale({
          messages,
          locale,
        });
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
