import { Container, Heading, Link, Stack, Text } from '@ttoss/fsl-ui';

/**
 * Component catalog placeholder — rebuilt in Program P1 slice ⑥ on the
 * proven shell. Until then the machine-readable catalog is the source of
 * truth.
 */
export const ComponentsPage = () => {
  return (
    <Container size="reading" gutter="page">
      <Stack gap="xl">
        <Stack gap="sm">
          <Heading level={2} size="headline-sm">
            Components
          </Heading>
          <Text tone="muted">
            The interactive catalog returns in a later slice, rebuilt on this
            shell. The ground truth it will render already ships with
            @ttoss/fsl-ui: the component catalog and Entity → token map in
            llms.txt, and the full authoring contract in CONTRACT.md.
          </Text>
        </Stack>
        <Link
          href="https://github.com/ttoss/ttoss/tree/main/packages/fsl-ui"
          target="_blank"
          rel="noreferrer"
        >
          @ttoss/fsl-ui on GitHub
        </Link>
      </Stack>
    </Container>
  );
};
