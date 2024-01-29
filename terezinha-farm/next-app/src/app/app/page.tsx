'use client';

import * as React from 'react';
import { Button } from '@ttoss/ui';
import { useAuth } from '@ttoss/react-auth';

const AppPage = () => {
  const { signOut } = useAuth();

  return (
    <>
      <div>App Page - You are authenticated.</div>
      <Button onClick={signOut}>Sign Out</Button>
    </>
  );
};

export default AppPage;
