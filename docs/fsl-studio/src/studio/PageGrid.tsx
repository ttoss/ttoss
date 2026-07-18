import { Grid, Stack, Surface, Text } from '@ttoss/fsl-ui';

import { EXAMPLE_PAGES } from './components/examplePages';

/**
 * The grid altitude (PRD F1.4): every example page rendered compact,
 * side by side — the semantic-drift view. One theme edit re-themes all of
 * them at once, which is exactly where drift becomes visible.
 */
export const PageGrid = () => {
  return (
    <Grid minColumnWidth="sm" gap="sm">
      {EXAMPLE_PAGES.map((page) => {
        return (
          <section key={page.id} aria-label={page.label}>
            <Surface level="flat" padding="md">
              <Stack gap="sm">
                <Text as="span" variant="label-sm" tone="muted">
                  {page.label}
                </Text>
                {page.render()}
              </Stack>
            </Surface>
          </section>
        );
      })}
    </Grid>
  );
};
