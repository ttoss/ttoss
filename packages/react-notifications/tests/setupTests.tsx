import * as React from 'react';
import { ThemeProvider } from '@ttoss/ui';
import { setOptions } from '@ttoss/test-utils';

import 'react-toastify/dist/ReactToastify.css';

const Providers = ({ children }: { children: React.ReactNode }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};

setOptions({ wrapper: Providers });
