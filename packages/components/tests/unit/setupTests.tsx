import { I18nProvider } from '@ttoss/react-i18n';
import { setOptions } from '@ttoss/test-utils/react';
import * as React from 'react';

const Providers = ({ children }: { children: React.ReactNode }) => {
  return <I18nProvider>{children}</I18nProvider>;
};

setOptions({ wrapper: Providers });
