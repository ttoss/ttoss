import alertIcon from '@iconify-icons/mdi-light/alert';
import { action } from '@storybook/addon-actions';
import { Meta, StoryFn } from '@storybook/react';
import {
  Form,
  FormFieldCheckbox,
  FormFieldInput,
  FormFieldPassword,
  FormFieldRadio,
  FormFieldSelect,
  FormFieldSwitch,
  FormFieldTextarea,
  FormGroup,
  useForm,
  yup,
  yupResolver,
} from '@ttoss/forms';
import { I18nProvider } from '@ttoss/react-i18n';
import { Box, Button, Flex } from '@ttoss/ui';
import * as React from 'react';

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
  argTypes: {
    showTooltip: { control: 'boolean' },
  },
  args: {
    showTooltip: true,
  },
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

type StoryArgs = {
  showTooltip: boolean;
};

const Template: StoryFn<StoryArgs> = (props: StoryArgs) => {
  const schema = yup.object({
    firstName: yup.string().required('First Name is required'),
    age: yup.number().required('Age is required'),
    password: yup
      .string()
      .min(6, 'Min of 6 caracteres')
      .required('Password is a required field'),
    receiveAlertEmails: yup
      .boolean()
      .oneOf([true], 'It needs to be checked')
      .required(),
    receiveMarketingEmails: yup
      .boolean()
      .oneOf([true], 'It needs to be checked')
      .required(),
    emailFrequency: yup.string().required('Email Frequency is required'),
    version: yup.string().required('Version is required'),
  });

  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
    defaultValues: {
      version: 'v15',
      receiveAlertEmails: false,
      receiveMarketingEmails: false,
    },
  });

  const tooltip = props.showTooltip ? 'tooltip message' : undefined;

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '4' }}>
        <FormFieldInput
          warning={'Warning message'}
          name="firstName"
          label="First Name"
          placeholder="First Name"
          trailingIcon={alertIcon}
          leadingIcon="ic:baseline-supervised-user-circle"
          tooltip={tooltip}
          onTooltipClick={action('onTooltipClick')}
        />
        <FormFieldInput
          name="age"
          label="Age"
          placeholder="Age"
          tooltip={tooltip}
          onTooltipClick={action('onTooltipClick')}
        />
        <FormFieldPassword
          name="password"
          label="Password"
          placeholder="Password"
          showPasswordByDefault
          tooltip={tooltip}
          onTooltipClick={action('onTooltipClick')}
        />
        <FormFieldCheckbox
          name="receiveAlertEmails"
          label="Receive Alert Emails"
          tooltip={tooltip}
          onTooltipClick={action('onTooltipClick')}
        />
        <FormFieldSwitch
          name="receiveMarketingEmails"
          label="Receive Marketing Emails"
          tooltip={tooltip}
          onTooltipClick={action('onTooltipClick')}
        />
        <FormFieldRadio
          name="emailFrequency"
          label="Email Frequency"
          tooltip={tooltip}
          onTooltipClick={action('onTooltipClick')}
          options={[
            {
              label: 'Daily',
              value: 'daily',
            },
            {
              label: 'Weekly',
              value: 'weekly',
            },
            {
              label: 'Monthly',
              value: 'monthly',
            },
          ]}
        />
        <FormFieldInput
          name="version"
          label="Version (disabled)"
          disabled
          tooltip={tooltip}
          onTooltipClick={action('onTooltipClick')}
        />
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
            tooltip={'tooltip message'}
          />
          <FormFieldInput
            name="age"
            label="Age"
            placeholder="Age"
            type="number"
            tooltip={'tooltip message'}
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

/**
 * This story shows how fields are aligned vertically when label has different
 * sizes and an error message is displayed.
 */
export const VerticalAlignment: StoryFn = () => {
  const schema = yup.object({
    firstName: yup.string(),
    middleName: yup.string(),
    lastName: yup.string().required('Last Name is required'),
  });

  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  const { setError } = formMethods;

  React.useEffect(() => {
    setError('lastName', {
      message: 'Some message to break alignment',
    });
  }, [setError]);

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex
        sx={{
          gap: 4,
          display: 'grid',
          gridTemplateRows: '[label] auto [input] auto [error] auto', // Nomeando as linhas
          gridAutoFlow: 'column',
        }}
      >
        <FormFieldInput
          name="firstName"
          label="First Name with big label"
          placeholder="First Name"
          sx={{
            width: '100px',
          }}
        />
        <FormFieldInput
          name="middleName"
          label="Middle Name"
          placeholder="Middle Name"
          sx={{
            width: '100px',
          }}
        />
        <FormFieldInput
          name="lastName"
          label="Last Name"
          placeholder="Last Name"
          sx={{
            width: '100px',
          }}
        />
        <Button sx={{ marginTop: '4' }} type="submit">
          Submit
        </Button>
      </Flex>
    </Form>
  );
};
