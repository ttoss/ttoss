import * as React from 'react';
import { I18nConfigContext } from './i18Provider';
import { useIntl } from 'react-intl';

export const useI18n = () => {
  const intl = useIntl();

  const config = React.useContext(I18nConfigContext);

  return { ...config, intl };
};
