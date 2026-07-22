import { zodResolver } from '@hookform/resolvers/zod';
import {
  Checkbox,
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
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

/*
 * Forms bridge per fsl-ui ADR-004 (RHF Controller + Zod over fsl-ui
 * controls). Friction log #5: the recipe's `@ttoss/forms` root entry drags
 * the legacy @ttoss/ui field suite and its peers, so the Studio imports
 * react-hook-form / zod / @hookform/resolvers directly.
 */

const schema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Password must have at least 8 characters'),
  remember: z.boolean(),
});

type LoginValues = z.infer<typeof schema>;

/**
 * Block: a complete sign-in flow — email + password with Zod validation,
 * "stay signed in", and a pending-aware submit. The canonical first
 * adoption exercise: it proves TextField composition, the `invalid` State
 * pipeline, and the RHF bridge end-to-end.
 */
export const LoginBlock = () => {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', remember: false },
  });

  const [signedInAs, setSignedInAs] = React.useState<string | null>(null);

  const onValid = (values: LoginValues) => {
    setSignedInAs(values.email);
  };

  return (
    <Surface level="raised" padding="lg">
      <Stack gap="lg">
        <Stack gap="xs">
          <Heading level={4} size="title-sm">
            Sign in
          </Heading>
          <Text variant="body-sm" tone="muted">
            Use your work email to access the workspace.
          </Text>
        </Stack>
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit(onValid)(event);
          }}
        >
          <Stack gap="md">
            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => {
                return (
                  <TextField
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    isInvalid={fieldState.invalid}
                  >
                    <TextFieldLabel>Email</TextFieldLabel>
                    <TextFieldControl type="email" autoComplete="email" />
                    {fieldState.error && (
                      <TextFieldError>
                        {fieldState.error.message}
                      </TextFieldError>
                    )}
                  </TextField>
                );
              }}
            />
            <Controller
              control={control}
              name="password"
              render={({ field, fieldState }) => {
                return (
                  <TextField
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    isInvalid={fieldState.invalid}
                  >
                    <TextFieldLabel>Password</TextFieldLabel>
                    <TextFieldControl
                      type="password"
                      autoComplete="current-password"
                    />
                    {fieldState.error && (
                      <TextFieldError>
                        {fieldState.error.message}
                      </TextFieldError>
                    )}
                  </TextField>
                );
              }}
            />
            <Controller
              control={control}
              name="remember"
              render={({ field }) => {
                return (
                  <Checkbox
                    name={field.name}
                    isSelected={field.value}
                    onChange={field.onChange}
                  >
                    Stay signed in
                  </Checkbox>
                );
              }}
            />
            <FormActions align="end">
              <FormSubmit isPending={isSubmitting}>Sign in</FormSubmit>
            </FormActions>
          </Stack>
        </Form>
        {signedInAs && (
          <Text variant="body-sm" role="status">
            Signed in as {signedInAs} (demo — no request is sent).
          </Text>
        )}
      </Stack>
    </Surface>
  );
};
