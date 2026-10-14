import { setOptions } from '@ttoss/test-utils/react';
import type * as React from 'react';

const Providers = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

setOptions({ wrapper: Providers });
