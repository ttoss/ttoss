import {
  Box,
  Container,
  Grid,
  Heading,
  Stack,
  Surface,
  Text,
} from '@ttoss/fsl-ui';

import { LoginBlock } from '../blocks/LoginBlock';
import { SettingsBlock } from '../blocks/SettingsBlock';

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
        <Stack gap="md">
          <Heading level={3} size="title-md">
            Settings
          </Heading>
          <SettingsBlock />
          <Box maxWidth="reading">
            <Surface level="flat" padding="lg">
              <Stack gap="sm">
                <Heading level={4} size="title-sm">
                  What this block proves
                </Heading>
                <Text variant="body-sm" tone="muted">
                  A CRUD flow end-to-end: Collection rows with mixed content
                  (GridList), a Dialog hosting a validated invite form, the
                  consequence-driven two-click destructive confirm
                  (ConfirmationDialog), and Toast feedback from a shared queue.
                </Text>
                <Text variant="body-sm" tone="muted">
                  Try it: invite a member (empty submit shows the invalid
                  pipeline, including the Select role), then remove one — the
                  destructive confirm arms on the first click and commits on the
                  second.
                </Text>
              </Stack>
            </Surface>
          </Box>
        </Stack>
        <Text variant="body-sm" tone="muted">
          Next blocks, in order: Dashboard (dataviz tokens), Pricing (marketing
          composition).
        </Text>
      </Stack>
    </Container>
  );
};
