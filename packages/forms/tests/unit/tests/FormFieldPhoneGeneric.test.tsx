import { render, screen, userEvent } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';

import {
  COMMON_PHONE_COUNTRY_CODES,
  type CountryCodeOption,
  Form,
  FormFieldPhone,
  MANUAL_PHONE_COUNTRY_CODE,
  useForm,
  z,
  zodResolver,
} from '../../../src';

describe('FormFieldPhoneGeneric', () => {
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
            defaultCountryCode="+1"
            format="(###) ###-####"
            countryCodeOptions={[]}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    await user.type(screen.getByLabelText('input 1'), '5555555555');
    await user.click(screen.getByText('Submit'));

    expect(onSubmit).toHaveBeenCalledWith({
      input1: '+15555555555',
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
            defaultCountryCode="+55"
            format={dynamicFormat}
            countryCodeOptions={[]}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    await user.type(screen.getByLabelText('input 1'), '11111111111');
    await user.click(screen.getByText('Submit'));

    expect(onSubmit).toHaveBeenCalledWith({
      input1: '+5511111111111',
    });
  });

  test('call onSubmit with correct data without country code', async () => {
    const user = userEvent.setup({ delay: null });

    const onSubmit = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldPhone
            name="input1"
            label="input 1"
            format="(###) ###-####"
            countryCodeOptions={[]}
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
            defaultCountryCode="+1"
            format="(###) ###-####"
            countryCodeOptions={[]}
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
      { label: 'US +1', value: '+1', format: '(###) ###-####' },
      { label: 'BR +55', value: '+55', format: '(##) #####-####' },
    ];

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={jest.fn()}>
          <FormFieldPhone
            name="input1"
            label="input 1"
            defaultCountryCode="+1"
            countryCodeOptions={countryCodeOptions}
            onCountryCodeChange={onCountryCodeChange}
          />
        </Form>
      );
    };

    render(<RenderForm />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('BR +55'));

    expect(onCountryCodeChange).toHaveBeenCalledWith('+55');
  });

  test('resolves format from the selected countryCodeOption', async () => {
    const user = userEvent.setup({ delay: null });
    const onSubmit = jest.fn();

    const countryCodeOptions: CountryCodeOption[] = [
      { label: 'US +1', value: '+1', format: '(###) ###-####' },
      { label: 'IN +91', value: '+91', format: '#####-#####' },
    ];

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldPhone
            name="input1"
            label="input 1"
            defaultCountryCode="+91"
            countryCodeOptions={countryCodeOptions}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    // India format: #####-#####
    await user.type(screen.getByLabelText('input 1'), '9876543210');
    await user.click(screen.getByText('Submit'));

    expect(onSubmit).toHaveBeenCalledWith({ input1: '+919876543210' });
  });

  test('uses the default format fallback when no format is provided and no option format matches', async () => {
    const user = userEvent.setup({ delay: null });
    const onSubmit = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          {/* no format prop, no countryCodeOptions — falls back to '(###) ###-####' */}
          <FormFieldPhone
            name="input1"
            label="input 1"
            defaultCountryCode="+1"
            countryCodeOptions={[]}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    await user.type(screen.getByLabelText('input 1'), '5555555555');
    await user.click(screen.getByText('Submit'));

    expect(onSubmit).toHaveBeenCalledWith({ input1: '+15555555555' });
  });

  test('COMMON_PHONE_COUNTRY_CODES exports all expected entries in numeric order', () => {
    expect(COMMON_PHONE_COUNTRY_CODES.length).toBe(16);
    // Every country entry (except Manual) must have label, value, and format
    for (const entry of COMMON_PHONE_COUNTRY_CODES) {
      expect(entry.label).toBeTruthy();
      expect(entry.value).toBeTruthy();
      if (entry.value !== MANUAL_PHONE_COUNTRY_CODE) {
        expect(entry.format).toBeTruthy();
      }
    }
    // First entry is Manual
    expect(COMMON_PHONE_COUNTRY_CODES[0].value).toBe(MANUAL_PHONE_COUNTRY_CODE);
    // Remaining entries are sorted by numeric dial code
    const dialCodes = COMMON_PHONE_COUNTRY_CODES.slice(1).map((o) => {
      return parseInt(o.value.replace('+', ''), 10);
    });
    for (let i = 1; i < dialCodes.length; i++) {
      expect(dialCodes[i]).toBeGreaterThanOrEqual(dialCodes[i - 1]);
    }
  });

  test('renders dropdown with COMMON_PHONE_COUNTRY_CODES by default', async () => {
    const user = userEvent.setup({ delay: null });
    const onCountryCodeChange = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={jest.fn()}>
          <FormFieldPhone
            name="input1"
            label="input 1"
            defaultCountryCode={COMMON_PHONE_COUNTRY_CODES[0].value}
            onCountryCodeChange={onCountryCodeChange}
          />
        </Form>
      );
    };

    render(<RenderForm />);

    // Switch to Brazil (+55)
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('🇧🇷 +55 (Brazil)'));
    expect(onCountryCodeChange).toHaveBeenCalledWith('+55');
  });

  test('manual mode allows free-form phone input without mask', async () => {
    const user = userEvent.setup({ delay: null });
    const onSubmit = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldPhone
            name="input1"
            label="input 1"
            defaultCountryCode={MANUAL_PHONE_COUNTRY_CODE}
            countryCodeOptions={[
              { label: 'US +1', value: '+1', format: '(###) ###-####' },
              { label: 'Manual', value: MANUAL_PHONE_COUNTRY_CODE },
            ]}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    // In manual mode, a plain input is rendered (no mask)
    const input = screen.getByLabelText('input 1');
    await user.type(input, '+15551234567');
    await user.click(screen.getByText('Submit'));

    expect(onSubmit).toHaveBeenCalledWith({ input1: '+15551234567' });
  });

  test('resets phone number when user changes country code', async () => {
    const user = userEvent.setup({ delay: null });
    const onSubmit = jest.fn();

    const countryCodeOptions: CountryCodeOption[] = [
      { label: 'US +1', value: '+1', format: '(###) ###-####' },
      { label: 'BR +55', value: '+55', format: '(##) #####-####' },
    ];

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldPhone
            name="input1"
            label="input 1"
            defaultCountryCode="+1"
            countryCodeOptions={countryCodeOptions}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    // Type a US number first
    await user.type(screen.getByLabelText('input 1'), '5555555555');

    // Switch to Brazil — should reset the field
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('BR +55'));

    // Submit without typing anything — phone must be empty
    await user.click(screen.getByText('Submit'));
    expect(onSubmit).toHaveBeenCalledWith({ input1: '' });
  });

  test('renders and submits with only name and label props', async () => {
    const user = userEvent.setup({ delay: null });
    const onSubmit = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldPhone name="phone" label="Phone:" />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    // The label must be accessible
    const input = screen.getByLabelText('Phone:');
    expect(input).toBeInTheDocument();

    // The dropdown with COMMON_PHONE_COUNTRY_CODES must be rendered
    expect(screen.getByRole('combobox')).toBeInTheDocument();

    // Default is Manual mode — free-form input with + prefix
    await user.type(input, '15551234567');
    await user.click(screen.getByText('Submit'));

    expect(onSubmit).toHaveBeenCalledWith({ phone: '+15551234567' });
  });
});
