import { CompareVideos } from './components/CompareVideos';
import { Footer, Header, Main, StackedLayout } from '@ttoss/layouts';
import { Heading, Link, Text } from '@ttoss/ui';

export const App = () => {
  return (
    <StackedLayout
      sx={{
        alignItems: 'center',
        gap: '2xl',
      }}
    >
      <Header
        sx={{
          paddingY: 'xl',
          backgroundColor: 'secondary',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Heading as="h1">The Best YouTube Video of All Time</Heading>
      </Header>
      <Main
        sx={{
          paddingY: '3xl',
        }}
      >
        <CompareVideos />
      </Main>
      <Footer
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
      </Footer>
    </StackedLayout>
  );
};
