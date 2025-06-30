import { Layout, StackedLayout } from '@ttoss/layouts';
import { Heading, Link, Text } from '@ttoss/ui';

import { CompareVideos } from './components/CompareVideos';

export const App = () => {
  return (
    <StackedLayout
      sx={{
        alignItems: 'center',
        gap: '2xl',
      }}
    >
      <Layout.Header
        sx={{
          paddingY: 'xl',
          backgroundColor: 'secondary',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Heading as="h1">The Best YouTube Video of All Time</Heading>
      </Layout.Header>
      <Layout.Main
        sx={{
          paddingY: '3xl',
        }}
      >
        <CompareVideos />
      </Layout.Main>
      <Layout.Footer
        sx={{
          width: '100%',
          backgroundColor: 'primary',
          minHeight: '100px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text
          sx={{
            textAlign: 'center',
            color: 'onPrimary',
          }}
        >
          <Link
            sx={{
              ':visited': {
                color: 'onPrimary',
              },
            }}
            href="https://ttoss.dev/docs/challenge/the-project"
            target="_blank"
            rel="noopener noreferrer"
          >
            ttoss Challenge
          </Link>
        </Text>
      </Layout.Footer>
    </StackedLayout>
  );
};
