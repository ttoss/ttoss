import { Meta, Story } from '@storybook/react-webpack5';
import {
  Form,
  FormFieldDatePicker,
  useForm,
  yup,
  yupResolver,
} from '@ttoss/forms';
import { Button, Flex } from '@ttoss/ui';
import * as React from 'react';
import { action } from 'storybook/actions';

export default {
  title: 'Forms/FormFieldDatePicker',
  component: FormFieldDatePicker,
  parameters: {
    docs: {
      description: {
        component:
          'Form field wrapper for the DatePicker component. Integrates with React Hook Form for validation and form state management. Supports date range selection with optional presets.',
      },
    },
  },
  tags: ['autodocs'],
} as Meta;

const schema = yup.object({
  dateRange: yup
    .object({
      from: yup.date().nullable(),
      to: yup.date().nullable(),
    })
    .required('Date range is required'),
  optionalDateRange: yup
    .object({
      from: yup.date().nullable(),
      to: yup.date().nullable(),
    })
    .nullable(),
});

const Template: Story = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
    defaultValues: {
      dateRange: undefined,
      optionalDateRange: undefined,
    },
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldDatePicker
          name="dateRange"
          label="Date Range"
          presets={[
            {
              label: 'Last 7 days',
              getValue: () => {
                return {
                  from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  to: new Date(),
                };
              },
            },
            {
              label: 'Last 30 days',
              getValue: () => {
                return {
                  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  to: new Date(),
                };
              },
            },
            {
              label: 'Last 90 days',
              getValue: () => {
                return {
                  from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                  to: new Date(),
                };
              },
            },
          ]}
        />

        <FormFieldDatePicker
          name="optionalDateRange"
          label="Optional Date Range"
          presets={[
            {
              label: 'Last 7 days',
              getValue: () => {
                return {
                  from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  to: new Date(),
                };
              },
            },
            {
              label: 'Last 30 days',
              getValue: () => {
                return {
                  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  to: new Date(),
                };
              },
            },
          ]}
        />

        <FormFieldDatePicker
          name="dateRangeWithoutPresets"
          label="Date Range Without Presets"
        />
      </Flex>
      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Example = Template.bind({});

export const WithDefaultValue: Story = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
    defaultValues: {
      dateRange: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(),
      },
    },
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldDatePicker
          name="dateRange"
          label="Date Range"
          presets={[
            {
              label: 'Last 7 days',
              getValue: () => {
                return {
                  from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  to: new Date(),
                };
              },
            },
            {
              label: 'Last 30 days',
              getValue: () => {
                return {
                  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  to: new Date(),
                };
              },
            },
          ]}
        />
      </Flex>
      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

WithDefaultValue.parameters = {
  docs: {
    description: {
      story:
        'Form field date picker with a default value. The date range is pre-selected when the form loads.',
    },
  },
};

export const WithValidation: Story = () => {
  const validationSchema = yup.object({
    dateRange: yup
      .object({
        from: yup.date().required('Start date is required'),
        to: yup.date().required('End date is required'),
      })
      .required('Date range is required')
      .test('date-range', 'End date must be after start date', (value) => {
        if (!value?.from || !value?.to) {
          return true; // Let required validation handle empty values
        }
        return value.to >= value.from;
      }),
  });

  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(validationSchema),
    defaultValues: {
      dateRange: undefined,
    },
  });

  React.useEffect(() => {
    // Trigger validation to show error state
    formMethods.trigger('dateRange');
  }, []);

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldDatePicker
          name="dateRange"
          label="Date Range"
          presets={[
            {
              label: 'Last 7 days',
              getValue: () => {
                return {
                  from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  to: new Date(),
                };
              },
            },
            {
              label: 'Last 30 days',
              getValue: () => {
                return {
                  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  to: new Date(),
                };
              },
            },
          ]}
        />
      </Flex>
      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

WithValidation.parameters = {
  docs: {
    description: {
      story:
        'Form field date picker with validation. Shows error state when validation fails. Try submitting without selecting a date range.',
    },
  },
};

export const Disabled: Story = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
    defaultValues: {
      dateRange: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(),
      },
    },
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldDatePicker
          name="dateRange"
          label="Date Range (Disabled)"
          disabled
          presets={[
            {
              label: 'Last 7 days',
              getValue: () => {
                return {
                  from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  to: new Date(),
                };
              },
            },
          ]}
        />
      </Flex>
      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

Disabled.parameters = {
  docs: {
    description: {
      story:
        'Disabled form field date picker. The field cannot be interacted with and maintains its value.',
    },
  },
};

export const WithWarning: Story = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
    defaultValues: {
      dateRange: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(),
      },
    },
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldDatePicker
          name="dateRange"
          label="Date Range"
          warning="This date range may not include all available data"
          presets={[
            {
              label: 'Last 7 days',
              getValue: () => {
                return {
                  from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  to: new Date(),
                };
              },
            },
            {
              label: 'Last 30 days',
              getValue: () => {
                return {
                  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  to: new Date(),
                };
              },
            },
          ]}
        />
      </Flex>
      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

WithWarning.parameters = {
  docs: {
    description: {
      story:
        'Form field date picker with a warning message. Useful for displaying non-critical information about the field.',
    },
  },
};
