# @ttoss/forms

**@ttoss/forms** provides React form components built on [React Hook Form](https://react-hook-form.com/) and [Yup](https://github.com/jquense/yup), with integrated i18n support and theme styling.

## Installation

```shell
pnpm i @ttoss/forms @ttoss/react-i18n @ttoss/ui @emotion/react
pnpm i --save-dev @ttoss/i18n-cli
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
  yup,
  yupResolver,
} from '@ttoss/forms';
import { I18nProvider } from '@ttoss/react-i18n';

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  age: yup.number().required('Age is required'),
  receiveEmails: yup.boolean(),
});

export const FormComponent = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
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

## Yup Validation

Import `yup` and `yupResolver` directly from `@ttoss/forms`:

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
      <FormFieldInput name="firstName" label="First Name" defaultValue="" />
      <Button type="submit">Submit</Button>
    </Form>
  );
};
```

### Validation Messages

Invalid fields display default error messages like "Field is required". Customize these messages via i18n configuration—see [React-i18n](https://ttoss.dev/docs/modules/packages/react-i18n/) and [i18n-CLI](https://ttoss.dev/docs/modules/packages/i18n-cli/).

### Custom Error Messages

Provide custom error messages using i18n patterns:

```tsx
import { useI18n } from '@ttoss/react-i18n';
import { useMemo } from 'react';

const MyForm = () => {
  const {
    intl: { formatMessage },
  } = useI18n();

  const schema = useMemo(
    () =>
      yup.object({
        name: yup.string().required(
          formatMessage({
            defaultMessage: 'Name must not be null',
            description: 'Name required constraint',
          })
        ),
        age: yup.number().min(
          18,
          formatMessage(
            {
              defaultMessage: 'You must be {age} years old or more',
              description: 'Min age constraint message',
            },
            { age: 18 }
          )
        ),
      }),
    [formatMessage]
  );

  // ... rest of form implementation
};
```

## Form Field Components

All form field components share common props:

- `name` (required): Field name in the form
- `label`: Field label text
- `disabled`: Disables the field
- `defaultValue`: Initial field value
- `tooltip`: Label tooltip configuration
- `inputTooltip`: Input field tooltip configuration
- `warning`: Warning message displayed below the field
- `sx`: Theme-UI styling object

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

<FormFieldRadioCardIcony name="payment" label="Payment Method" options={options} />;
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

Currency input with locale-based formatting.

```tsx
<FormFieldCurrencyInput
  name="amount"
  label="Amount"
  prefix="$"
  decimalsLimit={2}
/>
```

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
import { FormFieldInput, yup } from '@ttoss/forms';

const steps = [
  {
    label: 'Step 1',
    question: 'What is your name?',
    fields: <FormFieldInput name="name" label="Name" />,
    schema: yup.object({
      name: yup.string().required('Name is required'),
    }),
  },
  {
    label: 'Step 2',
    question: 'How old are you?',
    fields: <FormFieldInput type="number" name="age" label="Age" />,
    defaultValues: { age: 18 },
    schema: yup.object({
      age: yup
        .number()
        .min(18, 'Must be at least 18')
        .required('Age is required'),
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
- `schema`: Yup validation schema
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
