# @ttoss/forms

**@ttoss/forms** provides React form components built on [React Hook Form](https://react-hook-form.com/), with schema validation using [Zod](https://zod.dev/), integrated i18n support, and theme styling.

> **Note:** Yup support is deprecated and will be removed in a future version. Please migrate to Zod for new projects.

## Installation

```shell
pnpm i @ttoss/forms @ttoss/react-i18n @ttoss/ui @emotion/react
pnpm i -D @ttoss/i18n-cli
```

**Note:** This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c). I18n configuration is required—see [@ttoss/react-i18n](https://ttoss.dev/docs/modules/packages/react-i18n/) for setup details.

## Quick Start

```tsx
import { Button } from '@ttoss/ui';
import {
  Form,
  FormFieldCheckbox,
  FormFieldInput,
  useForm,
  z,
  zodResolver,
} from '@ttoss/forms';
import { I18nProvider } from '@ttoss/react-i18n';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  age: z.number(),
  receiveEmails: z.boolean(),
});

export const FormComponent = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: zodResolver(schema),
  });

  return (
    <I18nProvider>
      <Form {...formMethods} onSubmit={(data) => console.log(data)}>
        <FormFieldInput name="firstName" label="First Name" />
        <FormFieldInput name="age" label="Age" type="number" />
        <FormFieldCheckbox name="receiveEmails" label="Receive Emails" />
        <Button type="submit">Submit</Button>
      </Form>
    </I18nProvider>
  );
};
```

All React Hook Form APIs (`useForm`, `useController`, `useFieldArray`, `useFormContext`, etc.) are re-exported from `@ttoss/forms`. See the [React Hook Form documentation](https://react-hook-form.com/docs) for details.

## Zod Validation (Recommended)

Import `z` and `zodResolver` directly from `@ttoss/forms`. Invalid fields display i18n-backed default messages (`"Field is required"`, `"Invalid Value for Field of type {expected}"`, `"Field must be at least {min} characters"`). Run `pnpm run i18n` to extract them and translate per locale in your app's i18n files. See the [i18n-CLI documentation](https://ttoss.dev/docs/modules/packages/i18n-cli/) for details.

### Custom Validations

The package extends Zod with custom validation methods:

```tsx
import { z, passwordSchema } from '@ttoss/forms';

const schema = z.object({
  cpf: z.string().cpf(), // "Invalid CPF"
  cnpj: z.string().cnpj('Invalid CNPJ'), // custom message
  password: passwordSchema({ required: true }), // min 8 chars
  optionalPassword: passwordSchema(), // empty or min 8 chars
});
```

Also exports `isCnpjValid(cnpj: string)` for standalone validation.

## Yup Validation (Deprecated)

> **DEPRECATION WARNING:** Yup support will be removed in a future major version. `yup` and `yupResolver` are still exported from `@ttoss/forms` for legacy projects, but new projects should use Zod.

## Validation Approaches

There are two ways to validate form fields — choose one per field, they cannot be mixed.

**Schema-based validation** (`zodResolver`) is recommended for cross-field validation, complex business logic, and reusable/type-safe schemas.

**Field-level validation** (`rules` prop) suits simple, field-specific cases:

```tsx
<FormFieldInput
  name="username"
  label="Username"
  rules={{
    required: 'Username is required',
    minLength: { value: 3, message: 'Min 3 characters' },
    pattern: {
      value: /^[a-zA-Z0-9_]+$/,
      message: 'Letters, numbers, underscores only',
    },
  }}
/>
```

Available `rules` keys: `required`, `min`, `max`, `minLength`, `maxLength`, `pattern`, `validate`.

## Form Field Components

> **Interactive examples for every component are available at [storybook.ttoss.dev](https://storybook.ttoss.dev/) under the Forms section.**

All form field components share these common props:

- `name` (required): Field name in the form
- `label`: Field label text
- `disabled`: Disables the field (field-level overrides form-level `disabled`)
- `defaultValue`: Initial field value
- `tooltip`: Label tooltip configuration
- `warning`: Warning message displayed below the field
- `auxiliaryCheckbox`: Optional checkbox rendered between the field and error message — useful for confirmation or terms acceptance. Props: `name`, `label`, `disabled`, `defaultValue`.
- `sx`: Theme-UI styling object

To disable all fields at once, pass `disabled` to `useForm`:

```tsx
const formMethods = useForm({ disabled: isSubmitting });
```

### Available Components

| Component                   | Description                                                                                         |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| `FormFieldInput`            | Text input — supports all HTML input types                                                          |
| `FormFieldPassword`         | Password input with show/hide toggle                                                                |
| `FormFieldTextarea`         | Multi-line text input                                                                               |
| `FormFieldCheckbox`         | Single checkbox                                                                                     |
| `FormFieldSwitch`           | Toggle switch                                                                                       |
| `FormFieldRadio`            | Radio button group                                                                                  |
| `FormFieldRadioCard`        | Radio buttons styled as cards                                                                       |
| `FormFieldRadioCardIcony`   | Radio cards with icon support                                                                       |
| `FormFieldSelect`           | Dropdown — defaults to first option; `placeholder` and `defaultValue` cannot be used together       |
| `FormFieldSegmentedControl` | Segmented buttons wrapping `SegmentedControl` from `@ttoss/ui`; `variant` defaults to `"secondary"` |
| `FormFieldNumericFormat`    | Numeric input with decimals/thousands formatting                                                    |
| `FormFieldCurrencyInput`    | Currency input with locale-based separators (see below)                                             |
| `FormFieldPatternFormat`    | Input with custom format patterns                                                                   |
| `FormFieldPhone`            | Phone input with optional country-code dropdown (see below)                                         |
| `FormFieldCreditCardNumber` | Credit card input with automatic formatting                                                         |

### FormFieldCurrencyInput — Locale Separators

The decimal and thousand separators are driven by i18n. To customize per locale, add to your app's i18n file (e.g., `i18n/compiled/pt-BR.json`):

```json
{
  "JnCaDG": ",",
  "0+4wTp": "."
}
```

### FormFieldPhone — Key Props

The submitted value always includes the country code prefix (e.g. `{ phone: '+15555555555' }`). When the user selects the **Manual** entry, the mask is removed and any international number can be typed freely.

- `defaultCountryCode`: Initial calling code (e.g. `'+1'`). Defaults to the first entry in `countryCodeOptions`.
- `format`: Pattern string for the local number part (e.g. `'(###) ###-####'`).
- `countryCodeOptions`: Defaults to `COMMON_PHONE_COUNTRY_CODES`. Pass `[]` to hide the dropdown.
- `onCountryCodeChange`: Callback fired when the user picks a different country code.
- `countryCodeName`: Stores the selected country code as a separate form field (e.g. `{ phone: '+15555555555', countryCode: '+1' }`).

### Brazil-Specific Fields

Import from `@ttoss/forms/brazil`:

```tsx
import {
  FormFieldCEP,
  FormFieldCNPJ,
  FormFieldPhone,
} from '@ttoss/forms/brazil';
```

- `FormFieldCEP` — postal code with automatic formatting
- `FormFieldCNPJ` — tax ID with validation and formatting
- `FormFieldPhone` — phone with `+55` country code pre-set

## FormGroup

Groups related fields with an optional title, description, and layout direction. Pass `name` to display a group-level validation error (e.g. for array fields).

**Props:** `title`, `description`, `direction` (`'row'` | `'column'`, default `'column'`), `name`.

See [Storybook](https://storybook.ttoss.dev/?path=/story/forms-formgroup) for nested group examples.

## Multistep Forms

Import from `@ttoss/forms/multistep-form`. Each step provides its own `schema` (Zod) and `fields` (React elements); data is accumulated and passed to `onSubmit` on the final step.

```tsx
import { MultistepForm } from '@ttoss/forms/multistep-form';
```

**`MultistepForm` props:** `steps`, `onSubmit`, `footer`, `header`.

**Step object:** `label`, `question`, `fields`, `schema`, `defaultValues`.

**`header` variants:** `{ variant: 'logo', src, onClose }` or `{ variant: 'titled', title, leftIcon, rightIcon, onLeftIconClick, onRightIconClick }`.

See [Storybook](https://storybook.ttoss.dev/?path=/story/forms-multistepform) for an interactive example.
