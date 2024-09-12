// import * as React from 'react';
import { Auth, useAuth } from '@ttoss/react-auth';
import { Box, Button, Flex, Stack } from '@ttoss/ui';
import { FarmCorrectPagination } from './modules/Farm/FarmCorrectPagination';
import { FarmWrongPagination } from './modules/Farm/FarmWrongPagination';
import { Markdown } from '@ttoss/components/Markdown';
import { useFeatureFlag } from '@ttoss/react-feature-flags';

const markdown = '# ~Hi~, *Pluto*!';

export const App = () => {
  const { isAuthenticated, user, signOut } = useAuth();

  const isNiceHiEnabled = useFeatureFlag('nice-hi');

  const hi = isNiceHiEnabled ? 'Hi' : 'Hello';

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <Stack>
      <h1>{hi}</h1>
      <p>{JSON.stringify(user, null, 2)}</p>
      <Button
        onClick={() => {
          signOut();
        }}
      >
        Logout
      </Button>
      <Markdown>{markdown}</Markdown>

      <Flex sx={{ paddingX: 'xl' }}>
        <Box sx={{ flex: 1 }}>
          <FarmWrongPagination />
        </Box>

        <Box sx={{ flex: 1 }}>
          <FarmCorrectPagination />
        </Box>
      </Flex>
    </Stack>
  );
};
