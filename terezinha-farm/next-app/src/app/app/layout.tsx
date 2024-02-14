'use client';

import * as React from 'react';
import { useAuth } from '@ttoss/react-auth';

const AppLayout = ({
  auth,
  children,
}: {
  auth: React.ReactNode;
  children: React.ReactNode;
}) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{auth}</>;
  }

  return <>{children}</>;
};

export default AppLayout;
