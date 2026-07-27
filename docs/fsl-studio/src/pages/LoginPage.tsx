import {
  Form,
  FormActions,
  FormSubmit,
  Heading,
  Stack,
  Surface,
  Text,
  TextField,
  TextFieldControl,
  TextFieldError,
  TextFieldLabel,
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
     * no in-system expression — Container centers inline only and no
     * primitive fills the viewport block size (FRICTION F-004, open).
     */
    <div
      style={{ minBlockSize: '100dvh', display: 'grid', placeItems: 'center' }}
    >
      {/*
       * Bespoke rule (card cap): no named narrow width step exists in the
       * sizing vocabulary — Box.maxWidth offers only surface|reading
       * (FRICTION F-004, open).
       */}
      <div style={{ inlineSize: 'min(24rem, calc(100% - 2rem))' }}>
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
              <Form onSubmit={handleSubmit}>
                <TextField
                  name="email"
                  type="email"
                  autoComplete="email"
                  validate={validateEmail}
                >
                  <TextFieldLabel>Email</TextFieldLabel>
                  <TextFieldControl />
                  <TextFieldError />
                </TextField>
                <TextField
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  validate={validatePassword}
                >
                  <TextFieldLabel>Password</TextFieldLabel>
                  <TextFieldControl />
                  <TextFieldError />
                </TextField>
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
      </div>
    </div>
  );
};
