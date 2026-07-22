import { Container, Heading, Link, Stack, Text } from '@ttoss/fsl-ui';

/**
 * Theme lab placeholder — rebuilt in Program P1 slice ⑥. Mode switching is
 * already live in the header (the whole Studio runs on the base theme).
 */
export const ThemePage = () => {
  return (
    <Container size="reading" gutter="page">
      <Stack gap="xl">
        <Stack gap="sm">
          <Heading level={2} size="headline-sm">
            Theme
          </Heading>
          <Text tone="muted">
            The theme lab returns in a later slice. Everything on screen already
            exercises @ttoss/fsl-theme: the Studio runs the unmodified base
            theme, and the Light / System / Dark switcher in the header drives
            the real mode runtime.
          </Text>
        </Stack>
        <Link
          href="https://github.com/ttoss/ttoss/tree/main/packages/fsl-theme"
          target="_blank"
          rel="noreferrer"
        >
          @ttoss/fsl-theme on GitHub
        </Link>
      </Stack>
    </Container>
  );
};
