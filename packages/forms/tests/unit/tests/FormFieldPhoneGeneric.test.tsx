import { render, screen, userEvent } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';
import * as React from 'react';

import {
  COMMON_PHONE_COUNTRY_CODES,
  type CountryCodeOption,
  Form,
  FormFieldPhone,
  useForm,
  z,
  zodResolver,
} from '../../../src';

test('call onSubmit with correct data using a static format and country code', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldPhone
          name="input1"
          label="input 1"
          countryCode="+1"
          format="(###) ###-####"
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.type(screen.getByLabelText('input 1'), '5555555555');
  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({
    input1: '5555555555',
  });
});

test('call onSubmit with correct data using a dynamic format', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const dynamicFormat = (value: string) => {
    return value.length > 10 ? '(##) #####-####' : '(##) ####-#####';
  };

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldPhone
          name="input1"
          label="input 1"
          countryCode="+55"
          format={dynamicFormat}
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.type(screen.getByLabelText('input 1'), '11111111111');
  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({
    input1: '11111111111',
  });
});

test('call onSubmit with correct data without country code', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldPhone name="input1" label="input 1" format="(###) ###-####" />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.type(screen.getByLabelText('input 1'), '5555555555');
  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({
    input1: '5555555555',
  });
});

test('should display error messages', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const schema = z.object({
    input1: z.string().min(1),
  });

  const RenderForm = () => {
    const formMethods = useForm({
      mode: 'all',
      resolver: zodResolver(schema),
    });

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldPhone
          name="input1"
          label="input 1"
          countryCode="+1"
          format="(###) ###-####"
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);
  await user.click(screen.getByText('Submit'));
  expect(await screen.findByText('Field is required')).toBeInTheDocument();
});

test('calls onCountryCodeChange when the user selects a different country code', async () => {
  const user = userEvent.setup({ delay: null });

  const onCountryCodeChange = jest.fn();

  const countryCodeOptions: CountryCodeOption[] = [
    { label: '🇺🇸 +1', value: '+1', format: '(###) ###-####' },
    { label: '🇧🇷 +55', value: '+55', format: '(##) #####-####' },
  ];

  const RenderForm = () => {
    const [countryCode, setCountryCode] = React.useState('+1');
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={jest.fn()}>
        <FormFieldPhone
          name="input1"
          label="input 1"
          countryCode={countryCode}
          countryCodeOptions={countryCodeOptions}
          onCountryCodeChange={(code) => {
            setCountryCode(code);
            onCountryCodeChange(code);
          }}
        />
      </Form>
    );
  };

  render(<RenderForm />);

  const select = screen.getByRole('combobox');
  await user.selectOptions(select, '+55');

  expect(onCountryCodeChange).toHaveBeenCalledWith('+55');
});

test('resolves format from the selected countryCodeOption', async () => {
  const user = userEvent.setup({ delay: null });
  const onSubmit = jest.fn();

  const countryCodeOptions: CountryCodeOption[] = [
    { label: '🇺🇸 +1', value: '+1', format: '(###) ###-####' },
    { label: '🇮🇳 +91', value: '+91', format: '#####-#####' },
  ];

  const RenderForm = () => {
    const [countryCode, setCountryCode] = React.useState('+91');
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldPhone
          name="input1"
          label="input 1"
          countryCode={countryCode}
          countryCodeOptions={countryCodeOptions}
          onCountryCodeChange={setCountryCode}
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  // India format: #####-#####
  await user.type(screen.getByLabelText('input 1'), '9876543210');
  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ input1: '9876543210' });
});

test('uses the default format fallback when no format is provided and no option format matches', async () => {
  const user = userEvent.setup({ delay: null });
  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        {/* no format prop, no countryCodeOptions — falls back to '(###) ###-####' */}
        <FormFieldPhone name="input1" label="input 1" countryCode="+1" />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.type(screen.getByLabelText('input 1'), '5555555555');
  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ input1: '5555555555' });
});

test('COMMON_PHONE_COUNTRY_CODES exports all expected entries', () => {
  expect(COMMON_PHONE_COUNTRY_CODES.length).toBe(15);
  // Every entry must have label, value, and format
  for (const entry of COMMON_PHONE_COUNTRY_CODES) {
    expect(entry.label).toBeTruthy();
    expect(entry.value).toBeTruthy();
    expect(entry.format).toBeTruthy();
  }
});

test('renders dropdown and uses COMMON_PHONE_COUNTRY_CODES', async () => {
  const user = userEvent.setup({ delay: null });
  const onCountryCodeChange = jest.fn();

  const RenderForm = () => {
    const [countryCode, setCountryCode] = React.useState(
      COMMON_PHONE_COUNTRY_CODES[0].value
    );
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={jest.fn()}>
        <FormFieldPhone
          name="input1"
          label="input 1"
          countryCode={countryCode}
          countryCodeOptions={COMMON_PHONE_COUNTRY_CODES}
          onCountryCodeChange={(code) => {
            setCountryCode(code);
            onCountryCodeChange(code);
          }}
        />
      </Form>
    );
  };

  render(<RenderForm />);

  const select = screen.getByRole('combobox');
  // Dropdown must list all common options
  expect(select.querySelectorAll('option').length).toBe(
    COMMON_PHONE_COUNTRY_CODES.length
  );

  // Switch to Brazil (+55)
  const brazilOption = COMMON_PHONE_COUNTRY_CODES.find((o) => {
    return o.value === '+55';
  });
  await user.selectOptions(select, brazilOption!.value);
  expect(onCountryCodeChange).toHaveBeenCalledWith('+55');
});
