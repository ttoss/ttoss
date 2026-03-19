import type { Meta, Story } from '@storybook/react-webpack5';
import {
  type CountryCodeOption,
  Form,
  FormFieldPhone,
  useForm,
  z,
  zodResolver,
} from '@ttoss/forms';
import { FormFieldPhone as BrazilFormFieldPhone } from '@ttoss/forms/brazil';
import { Button, Flex } from '@ttoss/ui';
import * as React from 'react';
import { action } from 'storybook/actions';

export default {
  title: 'Forms/FormFieldPhone',
  component: FormFieldPhone,
} as Meta;

const schema = z.object({
  phone: z.string().min(1, 'Value is required'),
});

/**
 * Generic phone field with a US country code (+1).
 */
const GenericTemplate: Story = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: zodResolver(schema),
  });

  React.useEffect(() => {
    formMethods.setError('phone', { message: 'Value is required' });
  }, []);

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldPhone
          name="phone"
          label="Phone (US):"
          countryCode="+1"
          format="(###) ###-####"
          placeholder="(555) 555-5555"
        />
        <FormFieldPhone
          name="phoneDisabled"
          label="Phone (disabled):"
          countryCode="+1"
          format="(###) ###-####"
          placeholder="(555) 555-5555"
          disabled
        />
        <FormFieldPhone
          name="phoneWarning"
          label="Phone (warning):"
          countryCode="+1"
          format="(###) ###-####"
          placeholder="(555) 555-5555"
          warning="WARNING"
        />
      </Flex>
      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const GenericWithCountryCode = GenericTemplate.bind({});
GenericWithCountryCode.storyName = 'Generic (US +1)';

/**
 * Brazilian phone field that uses the generic component with +55 fixed.
 */
const BrazilTemplate: Story = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: zodResolver(schema),
  });

  React.useEffect(() => {
    formMethods.setError('phone', { message: 'Value is required' });
  }, []);

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <BrazilFormFieldPhone name="phone" label="Phone:" />
        <BrazilFormFieldPhone
          name="phoneDisabled"
          label="Phone (disabled):"
          disabled
        />
        <BrazilFormFieldPhone
          name="phoneWarning"
          label="Phone (warning):"
          warning="WARNING"
        />
      </Flex>
      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Brazil = BrazilTemplate.bind({});
Brazil.storyName = 'Brazil (+55)';

/**
 * Generic phone field without a country code.
 */
const NoCountryCodeTemplate: Story = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: zodResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldPhone
          name="phone"
          label="Phone (no country code):"
          format="(###) ###-####"
          placeholder="(555) 555-5555"
        />
      </Flex>
      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const NoCountryCode = NoCountryCodeTemplate.bind({});
NoCountryCode.storyName = 'No Country Code';

const COUNTRY_CODE_OPTIONS: CountryCodeOption[] = [
  { label: '🇺🇸 +1', value: '+1' },
  { label: '🇬🇧 +44', value: '+44' },
  { label: '🇧🇷 +55', value: '+55' },
  { label: '🇩🇪 +49', value: '+49' },
];

/**
 * Selectable country code — the user can change the calling code via a
 * dropdown rendered alongside the phone input.
 */
const EditableCountryCodeTemplate: Story = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: zodResolver(schema),
  });

  const [countryCode, setCountryCode] = React.useState('+1');

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormFieldPhone
        name="phone"
        label="Phone:"
        countryCode={countryCode}
        onCountryCodeChange={setCountryCode}
        countryCodeOptions={COUNTRY_CODE_OPTIONS}
        format="(###) ###-####"
        placeholder="(555) 555-5555"
      />
      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const EditableCountryCode = EditableCountryCodeTemplate.bind({});
EditableCountryCode.storyName = 'Editable Country Code';
