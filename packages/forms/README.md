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

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <I18nProvider>
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldInput name="firstName" label="First Name" />
        <FormFieldInput name="age" label="Age" type="number" />
        <FormFieldCheckbox name="receiveEmails" label="Receive Emails" />
        <Button type="submit">Submit</Button>
      </Form>
    </I18nProvider>
  );
};
```

## React Hook Form Integration

All React Hook Form APIs are re-exported from `@ttoss/forms`, including hooks like `useForm`, `useController`, `useFieldArray`, and `useFormContext`. See the [React Hook Form documentation](https://react-hook-form.com/docs) for complete API details.

## Zod Validation (Recommended)

Import `z` and `zodResolver` directly from `@ttoss/forms` for schema validation using [Zod](https://zod.dev/):

```tsx
import { Form, FormFieldInput, useForm, z, zodResolver } from '@ttoss/forms';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
});

const MyForm = () => {
  const formMethods = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={(data) => console.log(data)}>
      <FormFieldInput name="firstName" label="First Name" defaultValue="" />
      <Button type="submit">Submit</Button>
    </Form>
  );
};
```

### Validation Messages

Invalid fields display default error messages like "Field is required". These messages are defined using i18n and can be customized for each locale.

#### Default Zod Messages

The package provides internationalized default messages for common Zod validation errors. These are automatically extracted when you run `pnpm run i18n`:

- **Required field**: "Field is required"
- **Type mismatch**: "Invalid Value for Field of type {expected}"
- **Minimum length**: "Field must be at least {min} characters"

To customize these messages for your locale, extract the i18n messages and translate them in your application's i18n files (e.g., `i18n/compiled/pt-BR.json`). See the [i18n-CLI documentation](https://ttoss.dev/docs/modules/packages/i18n-cli/) for more details.

### Custom Validations

The package extends Zod with custom validation methods for Brazilian documents:

#### CPF Validation

```tsx
import { z } from '@ttoss/forms';

const schema = z.object({
  cpf: z.string().cpf(), // Uses default message: "Invalid CPF"
  // Or with custom message:
  cpfCustom: z.string().cpf('CPF inválido'),
});
```

#### CNPJ Validation

````

```tsx
import { z } from '@ttoss/forms';

const schema = z.object({
  cnpj: z.string().cnpj(), // Uses default message: "Invalid CNPJ"
  // Or with custom message:
  cnpjCustom: z.string().cnpj('CNPJ inválido'),
});
````

#### Password Validation

```tsx
import { passwordSchema } from '@ttoss/forms';
import { z } from '@ttoss/forms';

const schema = z.object({
  // Required password (minimum 8 characters)
  password: passwordSchema({ required: true }),

  // Optional password (accepts empty string or minimum 8 characters)
  optionalPassword: passwordSchema(),
});
```

## Yup Validation (Deprecated)

> **DEPRECATION WARNING:** Yup support is deprecated and will be removed in a future major version. Please migrate to Zod for new projects. Existing Yup schemas will continue to work, but we recommend planning your migration to Zod.

For legacy projects still using Yup, you can import `yup` and `yupResolver` from `@ttoss/forms`:

```tsx
import { Form, FormFieldInput, useForm, yup, yupResolver } from '@ttoss/forms';

const schema = yup.object({
  firstName: yup.string().required(),
});

const MyForm = () => {
  const formMethods = useForm({
    resolver: yupResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={(data) => console.log(data)}>
      <FormFieldInput name="firstName" label="First Name" />
      <Button type="submit">Submit</Button>
    </Form>
  );
};
```

## Validation Approaches

There are two ways to validate form fields in `@ttoss/forms`: schema-based validation using Zod schemas with `zodResolver`, and field-level validation using the `rules` prop on individual form fields.

**IMPORTANT:** You cannot mix both validation methods for the same field—choose either schema-based or field-level validation per field.

**When to use schema validation:**

- Cross-field validation
- Complex business logic
- Reusable validation patterns
- Type-safe validation with TypeScript

**When to use `rules`:**

- Simple, field-specific validations
- Dynamic validation based on component state
- Quick prototyping
- Single-field conditional logic

### 1. Schema-based Validation (Recommended)

Use Zod schemas with `zodResolver` for complex validation logic:

```tsx
import { z, zodResolver } from '@ttoss/forms';

const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18).max(100),
});

const formMethods = useForm({
  resolver: zodResolver(schema),
});
```

**Advantages:**

- Centralized validation logic
- Type-safe with TypeScript
- Reusable schemas
- Complex validation patterns
- Schema composition

### 2. Field-level Validation

Use the `rules` prop on individual form fields for simpler validations:

```tsx
<FormFieldInput
  name="username"
  label="Username"
  rules={{
    required: 'Username is required',
    minLength: {
      value: 3,
      message: 'Username must be at least 3 characters',
    },
    pattern: {
      value: /^[a-zA-Z0-9_]+$/,
      message: 'Only letters, numbers, and underscores allowed',
    },
  }}
/>

<FormFieldInput
  name="email"
  label="Email"
  rules={{
    required: 'Email is required',
    validate: (value) => {
      return value.includes('@') || 'Invalid email format';
    },
  }}
/>
```

**Available validation rules:**

- `required`: Field is required (string message or boolean)
- `min`: Minimum value (for numbers)
- `max`: Maximum value (for numbers)
- `minLength`: Minimum string length
- `maxLength`: Maximum string length
- `pattern`: RegExp pattern
- `validate`: Custom validation function or object of functions

## Form Field Components

All form field components share common props:

- `name` (required): Field name in the form
- `label`: Field label text
- `disabled`: Disables the field
- `defaultValue`: Initial field value
- `tooltip`: Label tooltip configuration
- `warning`: Warning message displayed below the field
- `auxiliaryCheckbox`: Optional auxiliary checkbox configuration
- `sx`: Theme-UI styling object

### Disabling Form Fields

You can disable form fields in two ways:

**1. Disable the entire form:**

Set `disabled: true` in `useForm` to disable all fields at once:

```tsx
const formMethods = useForm({
  disabled: true, // Disables all fields
});
```

This is particularly useful for preventing user interaction during asynchronous operations:

```tsx
const [isSubmitting, setIsSubmitting] = useState(false);

const formMethods = useForm({
  disabled: isSubmitting, // Disable form during submission
});

const onSubmit = async (data) => {
  setIsSubmitting(true);
  await saveData(data);
  setIsSubmitting(false);
};
```

**2. Disable individual fields:**

Use the `disabled` prop on specific form field components:

```tsx
<FormFieldInput name="email" label="Email" disabled />
```

Field-level `disabled` props override the form-level setting:

```tsx
const formMethods = useForm({
  disabled: false,
});

// This field will be disabled even though the form is enabled
<FormFieldInput name="id" label="ID" disabled />;
```

### Auxiliary Checkbox

Form fields can include an optional auxiliary checkbox rendered between the field and error message. This is useful for input confirmation, terms acceptance, or conditional display of other fields.

```tsx
<FormFieldInput
  name="email"
  label="Email"
  auxiliaryCheckbox={{
    name: 'confirmEmail',
    label: 'Send me promotional emails',
  }}
/>
```

The auxiliary checkbox can be disabled independently of the main field:

```tsx
<FormFieldInput
  name="email"
  label="Email"
  auxiliaryCheckbox={{
    name: 'confirmEmail',
    label: 'Send me promotional emails',
    disabled: true, // Checkbox is disabled, but email field is enabled
  }}
/>
```

**Props for `auxiliaryCheckbox`:**

- `name` (required): Field name for the checkbox
- `label` (required): Checkbox label text
- `disabled`: Disables the checkbox (independent of field disabled state)
- `defaultValue`: Initial checkbox value

The auxiliary checkbox's disabled state is the logical OR of its own `disabled` prop and the field's disabled state.

### FormFieldInput

Text input field supporting all HTML input types.

```tsx
<FormFieldInput
  name="email"
  label="Email"
  type="email"
  placeholder="Enter your email"
/>
```

### FormFieldPassword

Password input with show/hide toggle.

```tsx
<FormFieldPassword name="password" label="Password" />
```

### FormFieldTextarea

Multi-line text input.

```tsx
<FormFieldTextarea name="description" label="Description" rows={4} />
```

### FormFieldCheckbox

Single checkbox or checkbox group.

```tsx
<FormFieldCheckbox name="terms" label="I accept the terms" />
```

### FormFieldSwitch

Toggle switch component.

```tsx
<FormFieldSwitch name="notifications" label="Enable notifications" />
```

### FormFieldRadio

Radio button group.

```tsx
const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
];

<FormFieldRadio name="choice" label="Choose one" options={options} />;
```

### FormFieldRadioCard

Radio buttons styled as cards.

```tsx
<FormFieldRadioCard name="plan" label="Select Plan" options={options} />
```

### FormFieldRadioCardIcony

Radio cards with icon support.

```tsx
const options = [
  { value: 'card', label: 'Credit Card', icon: 'credit-card' },
  { value: 'bank', label: 'Bank Transfer', icon: 'bank' },
];

<FormFieldRadioCardIcony
  name="payment"
  label="Payment Method"
  options={options}
/>;
```

### FormFieldSelect

Dropdown select field.

```tsx
const options = [
  { value: 'ferrari', label: 'Ferrari' },
  { value: 'mercedes', label: 'Mercedes' },
  { value: 'bmw', label: 'BMW' },
];

<FormFieldSelect name="car" label="Choose a car" options={options} />;
```

#### FormFieldSelect Default Values

`FormFieldSelect` defaults to the first option or a specified `defaultValue`:

```tsx
// Defaults to "Ferrari"
<FormFieldSelect name="car" label="Cars" options={options} />

// Defaults to "Mercedes"
<FormFieldSelect
  name="car"
  label="Cars"
  options={options}
  defaultValue="Mercedes"
/>
```

### FormFieldSegmentedControl

Segmented control field wrapping the `SegmentedControl` from `@ttoss/ui`. Use this field when you want a compact set of mutually-exclusive options presented as segmented buttons.

Props are the common form field props plus any `SegmentedControl` props (except `value` and `className`). Notably, the `variant` prop is supported and defaults to `"secondary"` if not provided.

```tsx
<FormFieldSegmentedControl
  name="viewMode"
  label="View"
  options={[
    { value: 'list', label: 'List' },
    { value: 'grid', label: 'Grid' },
  ]}
  variant="primary" // optional, defaults to "secondary"
  defaultValue="list"
/>
```

When using a `placeholder`, an empty option is automatically added if not present:

```tsx
<FormFieldSelect
  name="car"
  label="Cars"
  options={options}
  placeholder="Select a car"
/>
```

**Note:** `placeholder` and `defaultValue` cannot be used together.

For dynamic options from async data, reset the field after loading:

```tsx
const { resetField } = useForm();
const [options, setOptions] = useState([]);

useEffect(() => {
  // Fetch options
  const fetchedOptions = await fetchData();
  setOptions(fetchedOptions);
  resetField('car', { defaultValue: 'Ferrari' });
}, []);
```

### FormFieldNumericFormat

Numeric input with formatting support (decimals, thousands separators).

```tsx
<FormFieldNumericFormat
  name="price"
  label="Price"
  thousandSeparator=","
  decimalScale={2}
/>
```

### FormFieldCurrencyInput

Currency input with locale-based formatting. The decimal and thousand separators are automatically determined by the locale set in the `I18nProvider`.

```tsx
<FormFieldCurrencyInput name="amount" label="Amount" prefix="$" />
```

#### Customizing Separators per Locale

The component uses i18n messages to determine the decimal and thousand separators based on the current locale. You can customize these for each locale in your application:

1. First, extract the i18n messages by running `pnpm run i18n` in your package
2. In your application's i18n files (e.g., `i18n/compiled/pt-BR.json`), add the custom separators:

```json
{
  "JnCaDG": ",", // Decimal separator (default: ".")
  "0+4wTp": "." // Thousand separator (default: ",")
}
```

This approach allows each locale to define its own number formatting rules, which will be automatically applied to all currency inputs.

For more information about the i18n workflow, see the [i18n-CLI documentation](https://ttoss.dev/docs/modules/packages/i18n-cli/).

### FormFieldPatternFormat

Input with custom format patterns.

```tsx
<FormFieldPatternFormat
  name="phone"
  label="Phone"
  format="+1 (###) ###-####"
  mask="_"
/>
```

### FormFieldCreditCardNumber

Credit card input with automatic formatting.

```tsx
<FormFieldCreditCardNumber name="cardNumber" label="Card Number" />
```

### Brazil-Specific Fields

Import from `@ttoss/forms/brazil`:

```tsx
import {
  FormFieldCEP,
  FormFieldCNPJ,
  FormFieldPhone,
} from '@ttoss/forms/brazil';
```

#### FormFieldCEP

Brazilian postal code (CEP) input with automatic formatting.

```tsx
<FormFieldCEP name="cep" label="CEP" />
```

#### FormFieldCNPJ

Brazilian tax ID (CNPJ) input with validation and formatting.

```tsx
<FormFieldCNPJ name="cnpj" label="CNPJ" />
```

The package also exports `isCnpjValid(cnpj: string)` for standalone validation.

#### FormFieldPhone

Brazilian phone number input with formatting.

```tsx
<FormFieldPhone name="phone" label="Phone" />
```

## FormGroup

Groups related fields with optional label and layout direction.

```tsx
<FormGroup label="Personal Information" direction="row">
  <FormFieldInput name="firstName" label="First Name" />
  <FormFieldInput name="lastName" label="Last Name" />
</FormGroup>

<FormGroup label="Address">
  <FormFieldInput name="street" label="Street" />
  <FormFieldInput name="city" label="City" />
</FormGroup>
```

**Props:**

- `label`: Group label
- `direction`: Layout direction (`'row'` | `'column'`)
- `name`: Group name for error messages

## Multistep Forms

Import from `@ttoss/forms/multistep-form`:

```tsx
import { MultistepForm } from '@ttoss/forms/multistep-form';
import { FormFieldInput, z } from '@ttoss/forms';

const steps = [
  {
    label: 'Step 1',
    question: 'What is your name?',
    fields: <FormFieldInput name="name" label="Name" />,
    schema: z.object({
      name: z.string().min(1, 'Name is required'),
    }),
  },
  {
    label: 'Step 2',
    question: 'How old are you?',
    fields: <FormFieldInput type="number" name="age" label="Age" />,
    defaultValues: { age: 18 },
    schema: z.object({
      age: z.number().min(18, 'Must be at least 18'),
    }),
  },
];

const MyForm = () => {
  return (
    <MultistepForm
      steps={steps}
      onSubmit={(data) => console.log(data)}
      footer="© 2024 Company"
      header={{
        variant: 'logo',
        src: '/logo.png',
        onClose: () => console.log('closed'),
      }}
    />
  );
};
```

### MultistepForm Props

- `steps`: Array of step configurations
- `onSubmit`: Handler called with complete form data
- `footer`: Footer text
- `header`: Header configuration (see below)

### Step Configuration

Each step object contains:

- `label`: Step label for navigation
- `question`: Question or instruction text
- `fields`: React element(s) containing form fields
- `schema`: Zod validation schema
- `defaultValues`: Optional default values for step fields

### Header Types

**Logo Header:**

```tsx
{
  variant: 'logo',
  src: '/path/to/logo.png',
  onClose: () => console.log('Close clicked')
}
```

**Titled Header:**

```tsx
{
  variant: 'titled',
  title: 'Form Title',
  leftIcon: 'arrow-left',
  rightIcon: 'close',
  onLeftIconClick: () => console.log('Back'),
  onRightIconClick: () => console.log('Close')
}
```
