import * as React from 'react';
import type { MessageFormatElement } from 'react-intl';
import { IntlProvider } from 'react-intl';

export type Messages =
  Record<string, string> | Record<string, MessageFormatElement[]>;

export type LoadLocaleData = (locale: string) => Promise<Messages> | Messages;

export type I18nProviderProps = {
  /**
   * The locale to render. Changing it after mount loads that locale, exactly
   * as `setLocale` does.
   */
  locale?: string;
  /**
   * The locale the `defaultMessage`s are written in. Defaults to `en`, the
   * source locale of every `@ttoss/*` package; an app authoring in another
   * language sets it, or every untranslated message reports
   * `MISSING_TRANSLATION` and its fallback text is formatted with English
   * rules.
   */
  defaultLocale?: string;
  loadLocaleData?: LoadLocaleData;
  children?: React.ReactNode;
  /**
   * Receives formatting errors from react-intl and errors thrown by
   * `loadLocaleData`.
   */
  onError?: (err: Error) => void;
};

/**
 * `DEFAULT_LOCALE` must be `en` because is the default of the other modules.
 */
export const DEFAULT_LOCALE = 'en';

export type I18nConfigContextProps = Omit<
  I18nProviderProps,
  'loadLocaleData' | 'children'
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
  locale: localeProp,
  defaultLocale = DEFAULT_LOCALE,
  loadLocaleData,
  onError,
}: I18nProviderProps) => {
  /**
   * This is state is a internal state of the I18nProvider. Users modify it
   * through the `setLocale` function or by changing the `locale` prop. It
   * triggers the useEffect below to load the locale data.
   */
  const [locale, setLocale] = React.useState<string>(
    localeProp || defaultLocale
  );

  // Follow a changed `locale` prop while rendering, not in an effect, so the
  // new locale never paints a frame behind the old one.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [previousLocaleProp, setPreviousLocaleProp] =
    React.useState(localeProp);
  if (localeProp !== previousLocaleProp) {
    setPreviousLocaleProp(localeProp);
    if (localeProp) {
      setLocale(localeProp);
    }
  }

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
    locale: defaultLocale,
  });

  // A ref, so a new `onError` identity each render does not reload the
  // locale. Declared before the load effect, so it is current when that runs.
  const onErrorRef = React.useRef(onError);
  React.useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  React.useEffect(() => {
    if (!loadLocaleData || !locale) {
      return;
    }

    /**
     * A slower load for a locale the user already switched away from must
     * not overwrite the newer one.
     */
    let isCurrent = true;

    /**
     * https://stackoverflow.com/a/27760489/8786986
     */
    Promise.resolve()
      .then(() => {
        return loadLocaleData(locale);
      })
      .then(
        (messages) => {
          if (isCurrent) {
            setMessagesAndLocale({ messages, locale });
          }
        },
        (error) => {
          if (!isCurrent) {
            return;
          }
          if (onErrorRef.current) {
            onErrorRef.current(error);
          } else {
            throw error;
          }
        }
      );

    return () => {
      isCurrent = false;
    };
  }, [loadLocaleData, locale]);

  // Passed only when set: an explicit `undefined` would replace react-intl's
  // default handler.
  const errorConfig = onError ? { onError } : {};

  return (
    <I18nConfigContext.Provider
      value={{
        locale,
        defaultLocale,
        messages: messagesAndLocale.messages,
        setLocale,
        ...errorConfig,
      }}
    >
      <IntlProvider
        defaultLocale={defaultLocale}
        locale={messagesAndLocale.locale}
        messages={messagesAndLocale.messages}
        {...errorConfig}
      >
        <>{children}</>
      </IntlProvider>
    </I18nConfigContext.Provider>
  );
};
