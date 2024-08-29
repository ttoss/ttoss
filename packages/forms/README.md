# @ttoss/forms

**@ttoss/forms** is a library of React form components for building form components. It is built on top of [React Hook Form](https://react-hook-form.com/) and [Yup](https://github.com/jquense/yup).

## ESM Only

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

## Installation

```shell
pnpm i @ttoss/forms @ttoss/react-i18n @ttoss/ui @emotion/react
pnpm i --save-dev @ttoss/i18n-cli
```

Check the [@ttoss/react-i18n](https://ttoss.dev/docs/modules/packages/react-i18n/) docs to see how to configure the i18n.

## Quickstart

```tsx
import { Button } from '@ttoss/ui';
import { Form, FormField, yupResolver, useForm, yup } from '@ttoss/forms';
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

  return (
    <I18nProvider>
      <Form {...formMethods} onSubmit={action('onSubmit')}>
        <FormField.Input name="firstName" label="First Name" />
        <FormField.Input name="age" label="Age" />
        <FormField.Checkbox name="receiveEmails" label="Receive Emails" />
        <Button type="submit">Submit</Button>
      </Form>
    </I18nProvider>
  );
};
```

**WARNING:** I18n is necessary as `Forms` module has some integrations with it.

## React Hook Form

It exposes all the API from react-hook-form, so you can use all the methods and properties from it. Check the [React Hook Form](https://react-hook-form.com/docs) documentation for more details.

## Yup Validation

You can also use yup and all of API from react-hook-form importing `import { yup, useForm } from @ttoss/forms`

```tsx
const FirstNameForm = () => {
  const schema = yup.object({
    firstName: yup.string().required(),
  });

  const formMethods = useForm({
    resolver: yupResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={onSubmit}>
      <FormField
        name="firstName"
        label="First Name"
        defaultValue={''}
        render={({ field }) => {
          return <Input {...field} />;
        }}
      />
      <Button type="submit">Submit</Button>
    </Form>
  );
};
```

When field is invalid according with schema requirements, it gonna return the default. In this example, for required fields, it gonna be `Field is required`.

You can translate the message or change the generic message by configuring the messages in the json i18n definition. To use this, please, refer to the docs on [React-i18n](https://ttoss.dev/docs/modules/packages/react-i18n/) and [i18n-CLI](https://ttoss.dev/docs/modules/packages/i18n-cli/).

### Custom Error messages

You can, also, pass custom error messages to the validation constraints in schema. It's really recommended that you use i18n pattern to create your custom message.

```tsx
const ComponentForm = () => {
  const {
    intl: { formatMessage },
  } = useI18n();

  const schema = useMemo(() => {
    return yup.object({
      name: yup.string().required(
        formatMessage({
          defaultMessage: 'Name must be not null',
          description: 'Name required constraint',
        })
      ),
      age: yup.number().min(
        18,
        formatMessage(
          {
            defaultMessage: 'You should be {age} years old or more',
            description: 'Min Age Constriant message',
          },
          { age: 18 }
        )
      ),
    });
  }, [formatMessage]);

  // ...
};
```

## Components

### FormFieldSelect

#### FormFieldSelect support for Default Value

`FormFieldSelect` has support for default values, by assigning the first option defined or the value passed to it in the parameter `defaultValue`.

```tsx
const RADIO_OPTIONS = [
  { value: 'Ferrari', label: 'Ferrari' },
  { value: 'Mercedes', label: 'Mercedes' },
  { value: 'BMW', label: 'BMW' },
];

// RenderForm gonna use "Ferrari" as defaultValue
const RenderForm = () => {
  const formMethods = useForm();

  return (
    <Form {...formMethods} onSubmit={onSubmit}>
      <FormFieldSelect name="car" label="Cars" options={RADIO_OPTIONS} />
      <Button type="submit">Submit</Button>
    </Form>
  );
};

// RenderForm gonna use "Mercedes" as defaultValue
const RenderForm = () => {
  const formMethods = useForm();

  return (
    <Form {...formMethods} onSubmit={onSubmit}>
      <FormFieldSelect
        name="car"
        label="Cars"
        options={RADIO_OPTIONS}
        defaultValue="Mercedes"
      />
      <Button type="submit">Submit</Button>
    </Form>
  );
};
```

When a placeholder is set, if in the options don't have an empty value, automatically an empty value gonna be injected.

```tsx
const RenderForm = () => {
  const formMethods = useForm();

  // automatically injects an empty value on the "RADIO_OPTIONS"
  return (
    <Form {...formMethods} onSubmit={onSubmit}>
      <FormFieldSelect
        name="car"
        label="Cars"
        options={RADIO_OPTIONS}
        placeholder="Select a car"
      />
      <Button type="submit">Submit</Button>
    </Form>
  );
};
```

**Note that a placeholder cannot be set when an defaultValue is set and vice-versa**

```tsx
// type error!!
return (
  <Form {...formMethods} onSubmit={onSubmit}>
    <FormFieldSelect
      name="car"
      label="Cars"
      options={RADIO_OPTIONS}
      placeholder="Select a car"
      defaultValue="Ferrari"
    />
    <Button type="submit">Submit</Button>
  </Form>
);
```

When your Select options depends on fetched values, the manual defaultValue setting is required.

```tsx
const RenderForm = () => {
  const formMethods = useForm();
  const { resetField } = formMethods;
  const [formOptions, setFormOptions] = useState<
    {
      value: string;
      label: string;
    }[]
  >([]);

  useEffect(() => {
    // some fetch operation here

    setFormOptions(RADIO_OPTIONS);

    // fetch are side effects, so, if the options depends on fetch and have a default value, the field should be reseted in the effect
    resetField('car', { defaultValue: 'Ferrari' });
  }, []);

  return (
    <Form {...formMethods} onSubmit={onSubmit}>
      <FormFieldSelect name="car" label="Cars" options={formOptions} />
      <Button type="submit">Submit</Button>
    </Form>
  );
};
```

### FormGroup

`FormGroup` is a component that groups fields together. It's useful when you need to group fields that are related to each other.

```tsx
const RenderForm = () => {
  const formMethods = useForm();

  return (
    <Form {...formMethods} onSubmit={onSubmit}>
      <FormGroup label="Personal Information" direction="row">
        <FormField.Input name="firstName" label="First Name" />
        <FormField.Input name="lastName" label="Last Name" />
      </FormGroup>
      <FormGroup label="Address">
        <FormField.Input name="street" label="Street" />
        <FormField.Input name="city" label="City" />
      </FormGroup>
      <Button type="submit">Submit</Button>
    </Form>
  );
};
```

#### Props

- `title`: The label of the group.
- `direction`: The direction of the group. It can be `row` or `column`.
- `name`: The name of the group. It is used to render the group error message.

## @ttoss/forms/multistep-form

The `@ttoss/forms/multistep-form` module from the **@ttoss/forms** library provides an efficient and flexible way to create multistep forms in React. This component is ideal for scenarios where filling out a lengthy form needs to be divided into several smaller steps, improving user experience. With support for integrated validations and style customizations, this tool offers everything you need to implement robust multistep forms in your React applications.

### How to Use

To use the `MultistepForm`, you first need to define the steps of the form, each with its own fields, validations, and messages. Here's a basic example of assembling a multistep form:

```tsx
import * as React from 'react';
import { FormFieldInput, yup } from '@ttoss/forms';
import { MultistepForm } from '@ttoss/forms/multistep-form';

// Define your steps
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
    defaultValues: {
      age: 18,
    },
    schema: yup.object({
      age: yup
        .number()
        .min(18, 'Min required age is 18')
        .required('Age is required'),
    }),
  },
  // Add more steps as needed
];

const MyMultistepForm = () => {
  return (
    <MultistepForm
      // ...other props
      steps={steps}
      // submit the full form on submit
      onSubmit={(data) => console.log(data)}
    />
  );
};
```

#### Props

The `MultistepForm` component accepts the following props:

- `steps`: An array of objects representing each step of the form.
- `onSubmit`: A function that is called when the form is completely filled and submitted.
- `footer`: An string with the text to show on form's footer.
- `header`: [Header Props](#header-props)

Each step can have the following properties:

- `label`: The label of the step (used for navigation).
- `question`: The question or instruction presented to the user at this step.
- `fields`: The form fields for this step.
- `schema`: A `yup` schema for validating the fields at this step.
- `defaultValues`: An optional object with default values to this step.

#### Header-Props

- **For Logo Header (`MultistepFormHeaderLogoProps`):**

  - `variant`: Set to `'logo'`.
  - `src`: The source URL for the logo image.
  - `onClose`: A function to handle the close button click event.

- **For Titled Header (`MultistepFormTitledProps`):**
  - `variant`: Set to `'titled'`.
  - `title`: The title text.
  - `leftIcon` and `rightIcon`: Icon types for left and right icons.
  - `onLeftIconClick` and `onRightIconClick`: Functions to handle clicks on left and right icons.

#### Customizing Headers

1. **Logo Header:**

```tsx
const logoHeaderProps = {
  variant: 'logo',
  src: 'path-to-your-logo-image',
  onClose: () => console.log('Close button clicked'),
};
```

2. **Titled Header:**

```tsx
const titledHeaderProps = {
  variant: 'titled',
  title: 'Your Title',
  leftIcon: 'icon-type',
  rightIcon: 'icon-type',
  onLeftIconClick: () => console.log('Left icon clicked'),
  onRightIconClick: () => console.log('Right icon clicked'),
};
```
