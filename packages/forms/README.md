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

> NOTE: You can also use yup and all of API from react-hook-form importing `import { yup, useForm } from @ttoss/forms`
