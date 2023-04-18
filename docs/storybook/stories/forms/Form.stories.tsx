import { Button } from '@ttoss/ui/src';
import {
  Form,
  FormFieldCheckbox,
  FormFieldInput,
  useForm,
  yup,
  yupResolver,
} from '@ttoss/forms/src';
import { Meta, StoryFn } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import alertIcon from '@iconify-icons/mdi-light/alert';

export default {
  title: 'Forms/Form',
  component: Form,
} as Meta;

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  age: yup.number().required('Age is required'),
  receiveEmails: yup
    .boolean()
    .oneOf([true], 'It needs to be checked')
    .required(),
  version: yup.string().required('Version is required'),
});

const Template: StoryFn = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
    defaultValues: {
      version: 'v15',
      receiveEmails: false,
    },
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormFieldInput
        name="firstName"
        label="First Name"
        placeholder="First Name"
        trailingIcon={alertIcon}
        leadingIcon="ic:baseline-supervised-user-circle"
        onTooltipClick={action('onTooltipClick')}
        tooltip
      />
      <FormFieldInput
        name="age"
        label="Age"
        placeholder="Age"
        type="number"
        tooltip
      />
      <FormFieldCheckbox name="receiveEmails" label="Receive Emails" />
      <FormFieldInput name="version" label="Version (disabled)" disabled />
      <Button sx={{ marginTop: 'lg' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Example = Template.bind({});
