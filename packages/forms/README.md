# @ttoss/forms

**@ttoss/forms** is a library of React form components for building form components. It is built on top of [React Hook Form](https://react-hook-form.com/) and [Yup](https://github.com/jquense/yup).

## Installation

```shell
yarn add @ttoss/forms
```

## Quick Start

```tsx
import { Button } from '@ttoss/ui';
import { Form, FormField, yupResolver, useForm, yup } from '@ttoss/forms';

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
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormField.Input name="firstName" label="First Name" />
      <FormField.Input name="age" label="Age" />
      <FormField.Checkbox name="receiveEmails" label="Receive Emails" />
      <Button type="submit">Submit</Button>
    </Form>
  );
};
```

## FormFieldSelect support for Default Value

FormFieldSelect has support for default values, by assigning the first option defined or the value passed to it in the parameter `defaultValue`.

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

> NOTE: You can also use yup and all of API from react-hook-form importing `import { yup, useForm } from @ttoss/forms`
