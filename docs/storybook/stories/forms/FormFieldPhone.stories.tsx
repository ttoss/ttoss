import type { Meta, StoryFn } from '@storybook/react-webpack5';
import {
  COMMON_PHONE_COUNTRY_CODES,
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
 * Default usage — country-code dropdown is pre-populated with
 * `COMMON_PHONE_COUNTRY_CODES`. The component manages the selected country
 * code internally; no external state is needed.
 * On submit the form value includes the country code prefix
 * (e.g. `{ phone: '+15555555555' }`).
 */
const DefaultTemplate: StoryFn = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: zodResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormFieldPhone
        name="phone"
        label="Phone:"
        defaultCountryCode={COMMON_PHONE_COUNTRY_CODES[1].value}
      />
      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Default = DefaultTemplate.bind({});
Default.storyName = 'Default (with country dropdown)';

/**
 * Generic phone field with a fixed US country code (+1) and no dropdown.
 */
const GenericTemplate: StoryFn = () => {
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
          defaultCountryCode="+1"
          format="(###) ###-####"
          placeholder="(555) 555-5555"
          countryCodeOptions={[]}
        />
        <FormFieldPhone
          name="phoneDisabled"
          label="Phone (disabled):"
          defaultCountryCode="+1"
          format="(###) ###-####"
          placeholder="(555) 555-5555"
          countryCodeOptions={[]}
          disabled
        />
        <FormFieldPhone
          name="phoneWarning"
          label="Phone (warning):"
          defaultCountryCode="+1"
          format="(###) ###-####"
          placeholder="(555) 555-5555"
          countryCodeOptions={[]}
          warning="WARNING"
        />
      </Flex>

      <Form.Actions>
        <Button type="submit">Submit</Button>
      </Form.Actions>
    </Form>
  );
};

export const GenericWithCountryCode = GenericTemplate.bind({});
GenericWithCountryCode.storyName = 'Generic (US +1, no dropdown)';

/**
 * Brazilian phone field that uses the generic component with +55 fixed.
 */
const BrazilTemplate: StoryFn = () => {
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
 * Selectable country code using COMMON_PHONE_COUNTRY_CODES — the user can
 * pick from the built-in list of 15 common countries (+ Manual). The phone
 * number format updates automatically when the country changes, and the phone
 * field is cleared on each country switch. The component manages the selected
 * code internally. On submit the value includes the
 * country code prefix (e.g. `{ phone: '+15555555555' }`).
 */
const EditableCountryCodeTemplate: StoryFn = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: zodResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormFieldPhone
        name="phone"
        label="Phone:"
        defaultCountryCode={COMMON_PHONE_COUNTRY_CODES[1].value}
        countryCodeOptions={COMMON_PHONE_COUNTRY_CODES}
      />
      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const EditableCountryCode = EditableCountryCodeTemplate.bind({});
EditableCountryCode.storyName = 'Editable Country Code (Common List)';

/**
 * Minimal usage — only `name` and `label` are provided.
 * The component defaults to `COMMON_PHONE_COUNTRY_CODES` and starts in
 * Manual mode (the first entry), so the user can type any international
 * number freely without a pattern mask.
 */
const MinimalTemplate: StoryFn = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: zodResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormFieldPhone name="phone" label="Phone:" />
      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Minimal = MinimalTemplate.bind({});
Minimal.storyName = 'Minimal (name + label only)';

/**
 * When `countryCodeName` is set the selected calling code is stored as a
 * separate form field. The submitted data will contain both:
 * `{ phone: '+15555555555', countryCode: '+1' }`.
 * This is useful when you want to persist the country code independently
 * in your database alongside the phone number.
 */
const WithCountryCodeNameTemplate: StoryFn = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: zodResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormFieldPhone
        name="phone"
        label="Phone:"
        defaultCountryCode={COMMON_PHONE_COUNTRY_CODES[1].value}
        countryCodeName="countryCode"
      />
      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const WithCountryCodeName = WithCountryCodeNameTemplate.bind({});
WithCountryCodeName.storyName =
  'Country Code as Separate Field (countryCodeName)';

/**
 * Pre-populating both the phone number and the country code via
 * `useForm`'s `defaultValues`. The `countryCodeName` prop tells the
 * component which form field stores the country code, so both values
 * are read from the form on mount.
 *
 * Submitted data: `{ phone: '+5511999887766', countryCode: '+55' }`
 */
const WithInitialValuesTemplate: StoryFn = () => {
  const schemaWithCountryCode = z.object({
    phone: z.string().min(1, 'Value is required'),
    countryCode: z.string(),
  });

  const formMethods = useForm({
    mode: 'all',
    resolver: zodResolver(schemaWithCountryCode),
    defaultValues: {
      phone: '+5511999887766',
      countryCode: '+55',
    },
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormFieldPhone
        name="phone"
        label="Phone:"
        countryCodeName="countryCode"
        countryCodeOptions={COMMON_PHONE_COUNTRY_CODES}
      />
      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const WithInitialValues = WithInitialValuesTemplate.bind({});
WithInitialValues.storyName = 'Pre-populated (phone + country code)';
