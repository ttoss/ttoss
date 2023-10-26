// import * as React from 'react';
import { Auth, useAuth } from '@ttoss/react-auth';
import { Button, Stack } from '@ttoss/ui';
import { Markdown } from '@ttoss/components';

const markdown = '# ~Hi~, *Pluto*!';

export const App = () => {
  const { isAuthenticated, user, signOut } = useAuth();

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <Stack>
      <h1>oi</h1>
      <p>{JSON.stringify(user, null, 2)}</p>
      <Button
        onClick={() => {
          signOut();
        }}
      >
        Logout
      </Button>
      <Markdown>{markdown}</Markdown>
    </Stack>
  );
};
