import * as React from 'react';
import { ThemeProvider } from '../src';
import { setOptions } from '@ttoss/test-utils';

const Providers = ({ children }: { children: React.ReactNode }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};

setOptions({ wrapper: Providers });
