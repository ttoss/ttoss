import { setOptions } from '@ttoss/test-utils';
import React from 'react';
import ThemeProvider from './src/theme/ThemeProvider';

const Providers = ({ children }: { children: React.ReactNode }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};

setOptions({ wrapper: Providers });
