import { setOptions } from '@ttoss/test-utils/react';
import { ThemeProvider } from '@ttoss/ui';
import type * as React from 'react';

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider
      theme={{
        colors: {
          primary: '#000',
          secondary: '#fff',
        },
      }}
    >
      {children}
    </ThemeProvider>
  );
};

setOptions({ wrapper: Providers });
