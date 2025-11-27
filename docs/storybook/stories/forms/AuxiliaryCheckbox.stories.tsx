import { Meta, StoryFn } from '@storybook/react-webpack5';
import {
  Form,
  FormFieldInput,
  FormFieldNumericFormat,
  FormFieldPassword,
  FormFieldPatternFormat,
  FormFieldTextarea,
  useForm,
  yup,
  yupResolver,
} from '@ttoss/forms';
import { Button, Flex, Text } from '@ttoss/ui';
import { action } from 'storybook/actions';

export default {
  title: 'Forms/AuxiliaryCheckbox',
} as Meta;

/**
 * Basic example showing an auxiliary checkbox for email confirmation.
 */
const BasicExample: StoryFn = () => {
  const schema = yup.object({
    email: yup.string().email('Invalid email').required('Email is required'),
    confirmEmail: yup
      .boolean()
      .oneOf([true], 'You must confirm your email address'),
  });

  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '4' }}>
        <FormFieldInput
          name="email"
          label="Email Address"
          placeholder="user@example.com"
          auxiliaryCheckbox={{
            name: 'confirmEmail',
            label: 'I confirm this is my email address',
          }}
        />
        <Button type="submit">Submit</Button>
      </Flex>
    </Form>
  );
};

export const Basic = BasicExample.bind({});

/**
 * Example showing error priority - FormField error shows first,
 * then auxiliaryCheckbox error when FormField error is resolved.
 */
const ErrorPriorityExample: StoryFn = () => {
  const schema = yup.object({
    email: yup.string().email('Invalid email').required('Email is required'),
    confirmEmail: yup
      .boolean()
      .oneOf([true], 'You must confirm your email address'),
  });

  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '4' }}>
        <Text>
          Try submitting without filling the email first. Then fill a valid
          email but don&apos;t check the checkbox.
        </Text>
        <FormFieldInput
          name="email"
          label="Email Address"
          placeholder="user@example.com"
          auxiliaryCheckbox={{
            name: 'confirmEmail',
            label: 'I confirm this is my email address',
          }}
        />
        <Button type="submit">Submit</Button>
      </Flex>
    </Form>
  );
};

export const ErrorPriority = ErrorPriorityExample.bind({});

/**
 * Example with password field and terms acceptance.
 */
const PasswordWithTermsExample: StoryFn = () => {
  const schema = yup.object({
    password: yup
      .string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required'),
    acceptTerms: yup.boolean().oneOf([true], 'You must accept the terms'),
  });

  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '4' }}>
        <FormFieldPassword
          name="password"
          label="Password"
          placeholder="Enter your password"
          auxiliaryCheckbox={{
            name: 'acceptTerms',
            label: 'I accept the terms and conditions',
          }}
        />
        <Button type="submit">Sign Up</Button>
      </Flex>
    </Form>
  );
};

export const PasswordWithTerms = PasswordWithTermsExample.bind({});

/**
 * Example with textarea for message confirmation.
 */
const TextareaWithConfirmationExample: StoryFn = () => {
  const schema = yup.object({
    message: yup
      .string()
      .min(10, 'Message must be at least 10 characters')
      .required('Message is required'),
    confirmMessage: yup.boolean().oneOf([true], 'Please confirm your message'),
  });

  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '4' }}>
        <FormFieldTextarea
          name="message"
          label="Your Message"
          placeholder="Type your message here..."
          auxiliaryCheckbox={{
            name: 'confirmMessage',
            label: 'I have reviewed my message and it is ready to send',
          }}
        />
        <Button type="submit">Send Message</Button>
      </Flex>
    </Form>
  );
};

export const TextareaWithConfirmation = TextareaWithConfirmationExample.bind(
  {}
);

/**
 * Example with numeric format for amount confirmation.
 */
const NumericFormatWithConfirmationExample: StoryFn = () => {
  const schema = yup.object({
    amount: yup.number().min(1, 'Amount must be positive').required(),
    confirmAmount: yup
      .boolean()
      .oneOf([true], 'Please confirm the transfer amount'),
  });

  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '4' }}>
        <FormFieldNumericFormat
          name="amount"
          label="Transfer Amount"
          prefix="$ "
          decimalScale={2}
          fixedDecimalScale
          thousandSeparator=","
          allowNegative={false}
          auxiliaryCheckbox={{
            name: 'confirmAmount',
            label: 'I confirm this transfer amount is correct',
          }}
        />
        <Button type="submit">Transfer</Button>
      </Flex>
    </Form>
  );
};

export const NumericFormatWithConfirmation =
  NumericFormatWithConfirmationExample.bind({});

/**
 * Example with pattern format for phone confirmation.
 */
const PatternFormatWithConfirmationExample: StoryFn = () => {
  const schema = yup.object({
    phone: yup
      .string()
      .length(10, 'Phone must be 10 digits')
      .required('Phone is required'),
    confirmPhone: yup
      .boolean()
      .oneOf([true], 'Please confirm your phone number'),
  });

  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '4' }}>
        <FormFieldPatternFormat
          name="phone"
          label="Phone Number"
          format="(###) ###-####"
          mask="_"
          auxiliaryCheckbox={{
            name: 'confirmPhone',
            label: 'I confirm this is my phone number',
          }}
        />
        <Button type="submit">Verify Phone</Button>
      </Flex>
    </Form>
  );
};

export const PatternFormatWithConfirmation =
  PatternFormatWithConfirmationExample.bind({});

/**
 * Example with default value for the checkbox.
 */
const WithDefaultValueExample: StoryFn = () => {
  const schema = yup.object({
    email: yup.string().email('Invalid email').required('Email is required'),
    newsletter: yup.boolean(),
  });

  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '4' }}>
        <FormFieldInput
          name="email"
          label="Email Address"
          placeholder="user@example.com"
          auxiliaryCheckbox={{
            name: 'newsletter',
            label: 'Subscribe to our newsletter',
            defaultValue: true,
          }}
        />
        <Button type="submit">Subscribe</Button>
      </Flex>
    </Form>
  );
};

export const WithDefaultValue = WithDefaultValueExample.bind({});

/**
 * Example with disabled form field - checkbox inherits disabled state.
 */
const DisabledExample: StoryFn = () => {
  const formMethods = useForm();

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '4' }}>
        <FormFieldInput
          name="email"
          label="Email Address"
          placeholder="user@example.com"
          defaultValue="user@example.com"
          disabled
          auxiliaryCheckbox={{
            name: 'confirmEmail',
            label: 'I confirm this is my email address',
          }}
        />
        <Button type="submit">Submit</Button>
      </Flex>
    </Form>
  );
};

export const Disabled = DisabledExample.bind({});

/**
 * Multiple fields with auxiliary checkboxes.
 */
const MultipleFieldsExample: StoryFn = () => {
  const schema = yup.object({
    email: yup.string().email('Invalid email').required('Email is required'),
    confirmEmail: yup
      .boolean()
      .oneOf([true], 'You must confirm your email address'),
    phone: yup.string().required('Phone is required'),
    confirmPhone: yup.boolean().oneOf([true], 'You must confirm your phone'),
  });

  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '4' }}>
        <FormFieldInput
          name="email"
          label="Email Address"
          placeholder="user@example.com"
          auxiliaryCheckbox={{
            name: 'confirmEmail',
            label: 'I confirm this is my email address',
          }}
        />
        <FormFieldPatternFormat
          name="phone"
          label="Phone Number"
          format="(###) ###-####"
          mask="_"
          auxiliaryCheckbox={{
            name: 'confirmPhone',
            label: 'I confirm this is my phone number',
          }}
        />
        <Button type="submit">Submit</Button>
      </Flex>
    </Form>
  );
};

export const MultipleFields = MultipleFieldsExample.bind({});
