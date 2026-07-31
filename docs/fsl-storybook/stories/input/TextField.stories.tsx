import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Stack,
  TextField,
  TextFieldControl,
  TextFieldDescription,
  TextFieldError,
  TextFieldLabel,
} from '@ttoss/fsl-ui';

const meta: Meta<typeof TextField> = {
  title: 'Input/TextField',
  component: TextField,
  tags: ['autodocs'],
  subcomponents: {
    TextFieldLabel,
    TextFieldControl,
    TextFieldDescription,
    TextFieldError,
  },
};

export default meta;

type Story = StoryObj<typeof TextField>;

export const Default: Story = {
  render: () => {
    return (
      <TextField>
        <TextFieldLabel>Email</TextFieldLabel>
        <TextFieldControl />
      </TextField>
    );
  },
};

export const WithDescription: Story = {
  render: () => {
    return (
      <TextField>
        <TextFieldLabel>Display name</TextFieldLabel>
        <TextFieldControl />
        <TextFieldDescription>
          Shown on your public profile.
        </TextFieldDescription>
      </TextField>
    );
  },
};

export const Invalid: Story = {
  render: () => {
    return (
      <TextField isInvalid>
        <TextFieldLabel>Email</TextFieldLabel>
        <TextFieldControl />
        <TextFieldError>Enter a valid email address.</TextFieldError>
      </TextField>
    );
  },
};

export const Disabled: Story = {
  render: () => {
    return (
      <TextField isDisabled>
        <TextFieldLabel>Workspace</TextFieldLabel>
        <TextFieldControl />
      </TextField>
    );
  },
};

/**
 * The one-line form: `label`, `description` and `errorMessage` as props. This is
 * the shape to reach for — one element per field, with the label association and
 * the `aria-describedby` wiring done for you.
 */
export const OneLine: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <TextField
        label="Email"
        name="email"
        type="email"
        description="We never share your email."
        placeholder="you@example.com"
      />
    );
  },
};

/**
 * The same field composed from slots. Use it when the arrangement is unusual —
 * something between the label and the control, or a description that is not
 * plain text. Copy props and `children` are mutually exclusive by type, so the
 * two forms cannot be mixed on one field.
 */
export const Composed: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <TextField name="email" type="email">
        <TextFieldLabel>Email</TextFieldLabel>
        <TextFieldControl placeholder="you@example.com" />
        <TextFieldDescription>We never share your email.</TextFieldDescription>
        <TextFieldError />
      </TextField>
    );
  },
};

/**
 * With no `errorMessage`, the platform supplies the copy: the message slot is
 * always mounted in the one-line form, so a `isRequired` field reports the
 * browser's own constraint message — already localized, and better copy than
 * anything the package could ship untranslated (ADR-001).
 */
export const PlatformValidationCopy: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <TextField
        label="Email"
        name="email"
        type="email"
        isRequired
        isInvalid
        errorMessage="Enter a valid email address."
      />
    );
  },
};

/**
 * A required field marks itself with an asterisk. The marker is `aria-hidden` —
 * the control carries the native `required` attribute, which assistive tech
 * announces on its own, so a second announcement would be noise.
 *
 * A `Form` sets the convention once for every field inside it
 * (`necessityIndicator="none"` drops the marker without making the field
 * optional); a field on its own marks itself, because the marker states a fact
 * about the field rather than a preference about the form.
 */
export const Required: Story = {
  tags: ['autodocs'],
  render: () => {
    return <TextField label="Email" name="email" type="email" isRequired />;
  },
};

/**
 * The format registry (forms item H): a named, locale-scoped format resolves
 * the mask, the touch keyboard and the autofill token together. Validation
 * (a CPF's checksum) stays with the caller's `validate` — a validate message
 * is user-facing copy the package cannot ship (ADR-001). Currency is not a
 * format: grouping moves as digits are typed, which is Intl's job —
 * `NumberField formatOptions={{ style: 'currency', currency: 'BRL' }}`.
 */
export const Formats: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Stack gap="md">
        <TextField label="CEP" name="cep" format="br.cep" />
        <TextField label="CPF" name="cpf" format="br.cpf" />
        <TextField label="CNPJ" name="cnpj" format="br.cnpj" />
        <TextField label="Telefone" name="phone" format="br.phone" />
      </Stack>
    );
  },
};
