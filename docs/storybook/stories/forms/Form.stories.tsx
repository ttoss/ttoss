import alertIcon from '@iconify-icons/mdi-light/alert';
import { Meta, StoryFn } from '@storybook/react-webpack5';
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
import { action } from 'storybook/actions';

const loadLocaleData = async (locale: string) => {
  switch (locale) {
    case 'pt-BR': {
      return (await import('../../i18n/compiled/pt-BR.json')).default;
    }
    default: {
      return (await import('../../i18n/compiled/en.json')).default;
    }
  }
};

export default {
  title: 'Forms/Form',
  component: Form,
  parameters: {
    docs: {
      description: {
        component:
          'Complete form component built on React Hook Form with yup validation, i18n support, and theme integration. Provides validation states, error handling, and accessibility features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showTooltip: {
      control: 'boolean',
      description: 'Show validation tooltips on form fields',
    },
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

type StoryArguments = {
  showTooltip: boolean;
};

const Template: StoryFn<StoryArguments> = (properties: StoryArguments) => {
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

  const tooltip = properties.showTooltip
    ? {
        children: 'tooltip message',
        place: 'top' as const,
        openOnClick: false,
        clickable: true,
      }
    : undefined;

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '4' }}>
        <FormFieldInput
          warning={
            <>
              {'Warning message'}
              <a className="warning" href="https://example.com">
                {'Saiba mais'}
              </a>
            </>
          }
          name="firstName"
          label="First Name"
          placeholder="First Name"
          trailingIcon={alertIcon}
          leadingIcon="ic:baseline-supervised-user-circle"
          tooltip={tooltip}
        />
        <FormFieldInput
          name="age"
          label="Age"
          placeholder="Age"
          tooltip={tooltip}
        />
        <FormFieldPassword
          name="password"
          label="Password"
          placeholder="Password"
          showPasswordByDefault
          tooltip={tooltip}
        />
        <FormFieldCheckbox
          name="receiveAlertEmails"
          label="Receive Alert Emails"
          tooltip={tooltip}
        />
        <FormFieldSwitch
          name="receiveMarketingEmails"
          label="Receive Marketing Emails"
          tooltip={tooltip}
        />
        <FormFieldRadio
          name="emailFrequency"
          label="Email Frequency"
          tooltip={tooltip}
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
          />

          <FormFieldSelect
            name="lastName"
            label="Last Name"
            placeholder="Last Name"
            options={options}
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

  const tooltip = {
    children: 'tooltip message',
    place: 'top' as const,
    openOnClick: false,
    clickable: true,
  };

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
            tooltip={tooltip}
          />
          <FormFieldInput
            name="age"
            label="Age"
            placeholder="Age"
            type="number"
            tooltip={tooltip}
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
