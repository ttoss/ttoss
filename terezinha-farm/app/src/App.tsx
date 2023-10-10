// import * as React from 'react';
import { Auth, useAuth } from '@ttoss/react-auth';
import { Button, Flex } from '@ttoss/ui';

export const App = () => {
  const { isAuthenticated, user, signOut } = useAuth();

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <Flex>
      <h1>oi</h1>
      <p>{JSON.stringify(user, null, 2)}</p>
      <Button
        onClick={() => {
          signOut();
        }}
      >
        Logout
      </Button>
    </Flex>
  );
};
