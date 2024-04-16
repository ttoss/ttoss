import * as React from 'react';
import { setOptions } from '@ttoss/test-utils';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

setOptions({ wrapper: Providers });
