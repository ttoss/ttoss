import { Container, Grid, Heading, Stack, Surface, Text } from '@ttoss/fsl-ui';

import { LoginBlock } from '../blocks/LoginBlock';

/**
 * The blocks gallery — the adoption engine (Program P1). Each block is a
 * real application flow built end-to-end with fsl-ui; what a block cannot
 * express cleanly becomes a friction-log entry, and that log is the v1
 * backlog. Roadmap order: Login → Settings/CRUD → Dashboard → Pricing.
 */
export const BlocksPage = () => {
  return (
    <Container size="surface" gutter="page">
      <Stack gap="xl">
        <Stack gap="sm">
          <Heading level={2} size="headline-sm">
            Blocks
          </Heading>
          <Text tone="muted">
            Complete, production-shaped flows built only with fsl-ui. Blocks
            double as adoption evidence: every workaround they need is filed in
            FRICTION.md and becomes package backlog.
          </Text>
        </Stack>
        <Stack gap="md">
          <Heading level={3} size="title-md">
            Login
          </Heading>
          <Grid minColumnWidth="lg" gap="lg" align="start">
            <LoginBlock />
            <Surface level="flat" padding="lg">
              <Stack gap="sm">
                <Heading level={4} size="title-sm">
                  What this block proves
                </Heading>
                <Text variant="body-sm" tone="muted">
                  TextField composition (label, control, error), the runtime
                  invalid State driven by Zod through react-hook-form (fsl-ui
                  ADR-004), Selection semantics for “stay signed in”, and a
                  pending-aware FormSubmit — with zero bespoke CSS.
                </Text>
                <Text variant="body-sm" tone="muted">
                  Try it: submit empty to see the invalid pipeline; a valid
                  email + 8-character password completes the demo flow.
                </Text>
              </Stack>
            </Surface>
          </Grid>
        </Stack>
        <Text variant="body-sm" tone="muted">
          Next blocks, in order: Settings/CRUD (pulls Table and ComboBox),
          Dashboard (dataviz tokens), Pricing (marketing composition).
        </Text>
      </Stack>
    </Container>
  );
};
