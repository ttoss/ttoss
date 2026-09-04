import type { Decorator } from '@storybook/react-webpack5';
import { I18nProvider } from '@ttoss/react-i18n';

/**
 * Renders a story under `pt-BR`.
 *
 * Every fixture in this folder is written in Portuguese, so the numbers should
 * be grouped the same way — `108.240 registros`, not `108,240`. Storybook's
 * global provider declares no locale and therefore falls back to `en`.
 *
 * No message bundle comes with it, and none is needed: the sidebar reads the
 * declared locale off the i18n config to format numbers, while react-intl keeps
 * resolving strings against the default locale, which is what its
 * `defaultMessage` fallbacks are already written for.
 */
export const withPtBr: Decorator = (Story) => {
  return (
    <I18nProvider locale="pt-BR">
      <Story />
    </I18nProvider>
  );
};
