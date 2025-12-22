import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  Form,
  FormFieldSegmentedControl,
  useForm,
  yup,
  yupResolver,
} from '@ttoss/forms';
import { Button, Flex } from '@ttoss/ui';
import * as React from 'react';
import { action } from 'storybook/actions';

export default {
  title: 'Forms/FormFieldSegmentedControl',
  component: FormFieldSegmentedControl,
} as Meta;

const schema = yup.object({
  choice: yup.string().required('Value is required'),
});

const TemplateComponent: React.FC = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
    defaultValues: { choice: 'option1' },
  });

  React.useEffect(() => {
    formMethods.setError('choice', { message: 'Value is required' });
  }, []);

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldSegmentedControl
          name="choice"
          label="Choose an option"
          options={[
            { label: 'Option 1', value: 'option1' },
            { label: 'Option 2', value: 'option2' },
            { label: 'Option 3', value: 'option3' },
          ]}
        />
      </Flex>

      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldSegmentedControl
          name="choiceDisabled"
          label="Disabled"
          options={['A', 'B', 'C']}
          disabled
        />
      </Flex>

      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldSegmentedControl
          name="choiceWarning"
          label="With warning"
          options={['X', 'Y']}
          warning="This is a warning"
        />
      </Flex>

      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

type Story = StoryObj<typeof FormFieldSegmentedControl>;

export const Example: Story = {
  render: () => {
    return <TemplateComponent />;
  },
};
