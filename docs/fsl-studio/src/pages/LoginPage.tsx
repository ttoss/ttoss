import {
  Container,
  Form,
  FormActions,
  FormSubmit,
  Heading,
  Stack,
  Surface,
  Text,
  TextField,
} from '@ttoss/fsl-ui';
import type * as React from 'react';

import { signIn } from '../session';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (value: string): string | null => {
  if (!value) {
    return 'Enter your email.';
  }
  if (!EMAIL_PATTERN.test(value)) {
    return 'Enter a valid email address.';
  }
  return null;
};

export const validatePassword = (value: string): string | null => {
  if (!value) {
    return 'Enter your password.';
  }
  if (value.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  return null;
};

/**
 * The real entry gate: client-side validation runs for real; any credentials
 * that pass it sign in (BLUEPRINT S2 — the validation pipeline stays
 * demonstrable, the authentication is fictional).
 */
export const LoginPage = () => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '');
    signIn({ email });
  };

  return (
    /*
     * Bespoke rule (viewport centering): a standalone centered auth page has
     * no in-system expression for the block-axis half — Container centers
     * inline only, and no primitive fills the viewport block size. Distinct
     * from the width cap below (FRICTION F-004, which this page used to cite
     * for both halves): that half is now closed by `Container size="card"`;
     * this one is not filed and stays a bespoke rule.
     */
    <div
      style={{ minBlockSize: '100dvh', display: 'grid', placeItems: 'center' }}
    >
      {/*
       * FRICTION F-004, resolved: the narrow centered-card width used to have
       * no in-system cap (Box.maxWidth/Container.size offered only
       * surface|reading) and this page hand-rolled `min(24rem, calc(100% -
       * 2rem))`. `size="card"` (core.sizing.ramp.layout.1) replaces it.
       */}
      <Container size="card" gutter="none">
        <Stack gap="lg">
          <Stack gap="xs" align="center">
            <Text variant="label-lg">Meridian</Text>
            <Text variant="body-sm" tone="muted">
              The deploy platform for web teams
            </Text>
          </Stack>
          <Surface level="raised" padding="lg">
            <Stack gap="lg">
              <Heading level={1} size="title-md">
                Sign in to northline
              </Heading>
              {/*
                The one-line field form: `label` and the validation message are
                props, so each field is one element instead of four. Slot
                composition remains available and is what the Billing page's
                unusual arrangement uses — the two are mutually exclusive per
                field by type, not by convention.
              */}
              <Form onSubmit={handleSubmit}>
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  validate={validateEmail}
                />
                <TextField
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  validate={validatePassword}
                />
                <FormActions>
                  <FormSubmit>Sign in</FormSubmit>
                </FormActions>
              </Form>
            </Stack>
          </Surface>
          <Stack align="center">
            <Text variant="body-sm" tone="muted">
              Demo workspace — any valid credentials sign in.
            </Text>
          </Stack>
        </Stack>
      </Container>
    </div>
  );
};
