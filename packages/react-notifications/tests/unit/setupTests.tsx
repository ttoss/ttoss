import 'react-toastify/dist/ReactToastify.css';

import { setOptions } from '@ttoss/test-utils/react';
import { ThemeProvider } from '@ttoss/ui';
import * as React from 'react';

const Providers = ({ children }: { children: React.ReactNode }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};

setOptions({ wrapper: Providers });
