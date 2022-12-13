import * as React from 'react';
import { IntlProvider } from 'react-intl';

export type MessagesType = any;

// eslint-disable-next-line no-unused-vars
export type LoadLocaleData = (locale: string) => Promise<MessagesType>;

export type I18nProviderProps = {
  locale?: string;
  loadLocaleData?: LoadLocaleData;
  children?: React.ReactNode;
};

/**
 * `DEFAULT_LOCALE` must be `en` because is the default of the other modules.
 */
export const DEFAULT_LOCALE = 'en';

type I18nConfigContextProps = Omit<I18nProviderProps, 'LoadLocaleData'> & {
  defaultLocale: string;
  // eslint-disable-next-line no-unused-vars
  setLocale: (language: string) => void;
};

export const I18nConfigContext = React.createContext<I18nConfigContextProps>({
  defaultLocale: DEFAULT_LOCALE,
  setLocale: () => {
    return null;
  },
});

export const I18nProvider = ({
  children,
  locale: initialLocale,
  loadLocaleData,
}: I18nProviderProps) => {
  const [locale, setLocale] = React.useState(initialLocale || DEFAULT_LOCALE);

  const [messages, setMessages] = React.useState<MessagesType>();

  React.useEffect(() => {
    if (loadLocaleData) {
      loadLocaleData(locale).then((message) => {
        return setMessages(message);
      });
    }
  }, [loadLocaleData, locale]);

  return (
    <I18nConfigContext.Provider
      value={{ defaultLocale: DEFAULT_LOCALE, locale, setLocale }}
    >
      <IntlProvider
        defaultLocale={DEFAULT_LOCALE}
        locale={locale}
        messages={messages}
      >
        <>{children}</>
      </IntlProvider>
    </I18nConfigContext.Provider>
  );
};
