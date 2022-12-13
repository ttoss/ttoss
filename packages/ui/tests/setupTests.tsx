import * as React from 'react';
import { setOptions } from '@ttoss/test-utils';
import ThemeProvider from '../src/theme/ThemeProvider';

const Providers = ({ children }: { children: React.ReactNode }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};

setOptions({ wrapper: Providers });
