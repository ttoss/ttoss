import { Button } from '@ttoss/ui';
import { Form, FormFieldSelect, useForm, yup, yupResolver } from '@ttoss/forms';
import { Meta, StoryFn } from '@storybook/react';
import { action } from '@storybook/addon-actions';

export default {
  title: 'Forms/FormFieldSelect',
  component: FormFieldSelect,
} as Meta;

const schema = yup.object({
  car: yup.string().required('Car is required'),
});

const Template: StoryFn = () => {
  const formMethods = useForm<{ car: string }>({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormFieldSelect
        name="car"
        defaultValue="Mercedes"
        label="What car do you prefer?"
        options={[
          { value: 'Ferrari', label: 'Ferrari' },
          { value: 'Mercedes', label: 'Mercedes' },
          { value: 'BMW', label: 'BMW' },
        ]}
      />

      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Example = Template.bind({});

const Template2: StoryFn = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormFieldSelect
        name="car"
        label="What car do you prefer?"
        options={[
          { value: 'Ferrari', label: 'Ferrari' },
          { value: 'Mercedes', label: 'Mercedes' },
          { value: 'BMW', label: 'BMW' },
        ]}
        placeholder="Please select a car"
      />

      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const WithPlaceholder = Template2.bind({});
