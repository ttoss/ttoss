import * as React from 'react';
import { useIntl } from 'react-intl';

import { I18nConfigContext } from './i18Provider';

export const useI18n = () => {
  const intl = useIntl();

  const config = React.useContext(I18nConfigContext);

  return { ...config, intl };
};
