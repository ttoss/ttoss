import { Box, Button, Flex } from '@ttoss/ui';
import {
  Form,
  FormFieldCheckbox,
  FormFieldInput,
  FormFieldPassword,
  FormFieldSelect,
  FormFieldTextarea,
  FormGroup,
  useForm,
  yup,
  yupResolver,
} from '@ttoss/forms';
import { I18nProvider } from '@ttoss/react-i18n';
import { Meta, StoryFn } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import alertIcon from '@iconify-icons/mdi-light/alert';

const loadLocaleData = async (locale: string) => {
  switch (locale) {
    case 'pt-BR':
      return (await import('../../i18n/compiled/pt-BR.json')).default;
    default:
      return (await import('../../i18n/compiled/en.json')).default;
  }
};

export default {
  title: 'Forms/Form',
  component: Form,
  decorators: [
    (Story) => {
      return (
        <I18nProvider locale="pt-BR" loadLocaleData={loadLocaleData}>
          <Story />
        </I18nProvider>
      );
    },
  ],
} as Meta;

const Template: StoryFn = () => {
  const schema = yup.object({
    firstName: yup.string().required('First Name is required'),
    age: yup.number().required('Age is required'),
    password: yup
      .string()
      .min(6, 'Min of 6 caracteres')
      .required('Password is a required field'),
    receiveEmails: yup
      .boolean()
      .oneOf([true], 'It needs to be checked')
      .required(),
    version: yup.string().required('Version is required'),
  });

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
      <Flex sx={{ flexDirection: 'column', gap: '4' }}>
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

        <FormFieldPassword
          name="password"
          label="Password"
          placeholder="Password"
          showPasswordByDefault
        />
        <FormFieldCheckbox name="receiveEmails" label="Receive Emails" />
        <FormFieldInput name="version" label="Version (disabled)" disabled />
      </Flex>
      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

const Template2: StoryFn = () => {
  const formMethods = useForm();

  const options = [
    {
      label: 'Option 1',
      value: 'option1',
    },
    {
      label: 'Option 2',
      value: 'option2',
    },
    {
      label: 'Option 3',
      value: 'option3',
    },
  ];

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Box
        sx={{
          backgroundColor: 'white',
          padding: '4',
          border: 'default',
          borderColor: 'muted',
        }}
      >
        <FormGroup
          direction="row"
          sx={{
            backgroundColor: 'red',
          }}
        >
          <FormFieldInput
            name="firstName"
            label="First Name"
            placeholder="First Name"
          />

          <FormFieldInput
            name="lastName"
            label="Last Name"
            placeholder="Last Name"
          />
        </FormGroup>
        <FormGroup
          direction="row"
          sx={{
            backgroundColor: 'blue',
          }}
        >
          <FormFieldSelect
            name="firstName"
            label="First Name"
            placeholder="First Name"
            options={options}
            sx={{ flex: 1 }}
          />

          <FormFieldSelect
            name="lastName"
            label="Last Name"
            placeholder="Last Name"
            options={options}
            sx={{ flex: 1 }}
          />
        </FormGroup>
        <FormGroup
          direction="row"
          sx={{
            backgroundColor: 'green',
          }}
        >
          <FormFieldTextarea
            name="note"
            label="Note"
            placeholder="Let your notes here"
          />
        </FormGroup>
      </Box>
    </Form>
  );
};

const TemplateWithInternationalization: StoryFn = () => {
  const schema = yup.object({
    firstName: yup.string().required(),
    age: yup.number().required(),
    password: yup.string().min(6).required(),
    receiveEmails: yup.boolean().oneOf([true]).required(),
    version: yup.string().required(),
  });

  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
    defaultValues: {
      version: 'v15',
      receiveEmails: false,
    },
  });

  return (
    <I18nProvider locale="pt-BR" loadLocaleData={loadLocaleData}>
      <Form {...formMethods} onSubmit={action('onSubmit')}>
        <Flex sx={{ flexDirection: 'column', gap: '4' }}>
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

          <FormFieldPassword
            name="password"
            label="Password"
            placeholder="Password"
            showPasswordByDefault
          />
          <FormFieldCheckbox name="receiveEmails" label="Receive Emails" />
          <FormFieldInput name="version" label="Version (disabled)" disabled />
        </Flex>
        <Button sx={{ marginTop: '4' }} type="submit">
          Submit
        </Button>
      </Form>
    </I18nProvider>
  );
};

export const Example1 = Template.bind({});
export const Example2 = Template2.bind({});
export const WithInternationalization = TemplateWithInternationalization.bind(
  {}
);
