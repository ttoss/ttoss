import {
  act,
  render,
  screen,
  userEvent,
  waitFor,
} from '@ttoss/test-utils/react';
import { Box, Text } from '@ttoss/ui';
import type * as React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { Wizard } from 'src/index';
import type { WizardStep } from 'src/types';

const reviewHeading = 'Review Your Information';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  street: string;
  city: string;
  country: string;
  phone: string;
  comments?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type FormFieldName = keyof FormData;

const validateFormData = ({
  values,
  fieldNames,
}: {
  values: Partial<FormData>;
  fieldNames?: string[];
}) => {
  const errors: Record<string, { type: string; message: string }> = {};
  const requestedFieldNames = fieldNames ? new Set(fieldNames) : undefined;
  const shouldValidate = (fieldName: FormFieldName) => {
    return !requestedFieldNames || requestedFieldNames.has(fieldName);
  };

  if (shouldValidate('firstName') && !values.firstName?.trim()) {
    errors.firstName = {
      type: 'required',
      message: 'First name is required',
    };
  }

  if (shouldValidate('lastName') && !values.lastName?.trim()) {
    errors.lastName = {
      type: 'required',
      message: 'Last name is required',
    };
  }

  if (shouldValidate('email') && !values.email?.trim()) {
    errors.email = {
      type: 'required',
      message: 'Email is required',
    };
  } else if (shouldValidate('email') && !emailPattern.test(values.email)) {
    errors.email = {
      type: 'pattern',
      message: 'Invalid email address',
    };
  }

  if (shouldValidate('street') && !values.street?.trim()) {
    errors.street = {
      type: 'required',
      message: 'Street is required',
    };
  }

  if (shouldValidate('city') && !values.city?.trim()) {
    errors.city = {
      type: 'required',
      message: 'City is required',
    };
  }

  if (shouldValidate('country') && !values.country?.trim()) {
    errors.country = {
      type: 'required',
      message: 'Country is required',
    };
  }

  if (shouldValidate('phone') && !values.phone?.trim()) {
    errors.phone = {
      type: 'required',
      message: 'Phone must be at least 10 digits',
    };
  } else if (shouldValidate('phone') && values.phone.trim().length < 10) {
    errors.phone = {
      type: 'minLength',
      message: 'Phone must be at least 10 digits',
    };
  }

  return errors;
};

const formResolver = async (
  values: FormData,
  _context: unknown,
  options?: { names?: string[] }
) => {
  const errors = validateFormData({
    values,
    fieldNames: options?.names,
  });

  return {
    values: Object.keys(errors).length === 0 ? values : {},
    errors,
  };
};

interface TestFormProps extends UseFormReturn<FormData> {
  children: React.ReactNode;
  onSubmit: (values: FormData) => void;
}

const Form = ({ children, onSubmit, ...formMethods }: TestFormProps) => {
  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)}>{children}</form>
    </FormProvider>
  );
};

const FormFieldInput = ({
  name,
  label,
  placeholder,
  type = 'text',
}: {
  name: keyof FormData;
  label: string;
  placeholder?: string;
  type?: string;
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormData>();
  const fieldError = errors[name];

  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        aria-label={label}
        placeholder={placeholder}
        type={type}
        {...register(name)}
      />
      {fieldError?.message && <span>{String(fieldError.message)}</span>}
    </div>
  );
};

const FormFieldSelect = ({
  name,
  label,
  placeholder,
  options,
}: {
  name: keyof FormData;
  label: string;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormData>();
  const fieldError = errors[name];

  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <select id={name} aria-label={label} {...register(name)}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => {
          return (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          );
        })}
      </select>
      {fieldError?.message && <span>{String(fieldError.message)}</span>}
    </div>
  );
};

const FormFieldTextarea = ({
  name,
  label,
  placeholder,
}: {
  name: keyof FormData;
  label: string;
  placeholder?: string;
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormData>();
  const fieldError = errors[name];

  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <textarea
        id={name}
        aria-label={label}
        placeholder={placeholder}
        {...register(name)}
      />
      {fieldError?.message && <span>{String(fieldError.message)}</span>}
    </div>
  );
};

const TestWizardForm = ({
  onComplete,
  onCancel,
}: {
  onComplete?: (data: FormData) => void;
  onCancel?: () => void;
}) => {
  const formMethods = useForm<FormData>({
    mode: 'onChange',
    resolver: formResolver,
    shouldUnregister: false,
  });

  const { getValues, trigger } = formMethods;
  const handleComplete = () => {
    onComplete?.(getValues());
  };

  const steps: WizardStep[] = [
    {
      title: 'Personal Info',
      description: 'Basic information',
      content: (
        <Box>
          <FormFieldInput
            name="firstName"
            label="First Name"
            placeholder="Enter your first name"
          />
          <FormFieldInput
            name="lastName"
            label="Last Name"
            placeholder="Enter your last name"
          />
          <FormFieldInput
            name="email"
            label="Email"
            type="email"
            placeholder="Enter your email"
          />
        </Box>
      ),
      onNext: async () => {
        return trigger(['firstName', 'lastName', 'email']);
      },
    },
    {
      title: 'Address',
      description: 'Location details',
      content: (
        <Box>
          <FormFieldInput
            name="street"
            label="Street"
            placeholder="Enter your street"
          />
          <FormFieldInput
            name="city"
            label="City"
            placeholder="Enter your city"
          />
          <FormFieldSelect
            name="country"
            label="Country"
            placeholder="Select your country"
            options={[
              { value: 'us', label: 'United States' },
              { value: 'br', label: 'Brazil' },
              { value: 'uk', label: 'United Kingdom' },
            ]}
          />
        </Box>
      ),
      onNext: async () => {
        return trigger(['street', 'city', 'country']);
      },
    },
    {
      title: 'Additional Info',
      description: 'Final details',
      content: (
        <Box>
          <FormFieldInput
            name="phone"
            label="Phone"
            placeholder="Enter your phone number"
          />
          <FormFieldTextarea
            name="comments"
            label="Comments (Optional)"
            placeholder="Any additional comments"
          />
        </Box>
      ),
      onNext: async () => {
        return trigger(['phone', 'comments']);
      },
    },
    {
      title: 'Review',
      description: 'Confirm details',
      content: (
        <Box>
          <Text variant="heading">{reviewHeading}</Text>
        </Box>
      ),
    },
  ];

  return (
    <Form {...formMethods} onSubmit={() => {}}>
      <Wizard
        steps={steps}
        layout="top"
        onCancel={onCancel}
        onComplete={handleComplete}
      />
    </Form>
  );
};

describe('Wizard Form Integration', () => {
  test('renders the first step with personal info fields', () => {
    render(<TestWizardForm />);

    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  test('prevents navigation to next step when step 1 validation fails', async () => {
    const user = userEvent.setup({ delay: null });
    render(<TestWizardForm />);

    await act(async () => {
      await user.click(screen.getByText('Next'));
    });

    await waitFor(() => {
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.queryByLabelText('Street')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
    });
  });

  test('allows navigation to next step when step 1 validation passes', async () => {
    const user = userEvent.setup({ delay: null });
    render(<TestWizardForm />);

    await user.type(screen.getByLabelText('First Name'), 'John');
    await user.type(screen.getByLabelText('Last Name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'john.doe@example.com');

    await act(async () => {
      await user.click(screen.getByText('Next'));
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Street')).toBeInTheDocument();
    });
  });

  test('shows validation error for invalid email format', async () => {
    const user = userEvent.setup({ delay: null });
    render(<TestWizardForm />);

    await user.type(screen.getByLabelText('First Name'), 'John');
    await user.type(screen.getByLabelText('Last Name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'invalid-email');

    await act(async () => {
      await user.click(screen.getByText('Next'));
    });

    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });
  });

  test('prevents navigation from step 2 when validation fails', async () => {
    const user = userEvent.setup({ delay: null });
    render(<TestWizardForm />);

    await user.type(screen.getByLabelText('First Name'), 'John');
    await user.type(screen.getByLabelText('Last Name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'john.doe@example.com');

    await act(async () => {
      await user.click(screen.getByText('Next'));
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Street')).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByText('Next'));
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Street')).toBeInTheDocument();
      expect(screen.getByText('Country is required')).toBeInTheDocument();
    });
  });

  test('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    const onCancel = jest.fn();
    render(<TestWizardForm onCancel={onCancel} />);

    await act(async () => {
      await user.click(screen.getByText('Cancel'));
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('navigates back through the completed steps after reaching review', async () => {
    const user = userEvent.setup({ delay: null });

    render(<TestWizardForm />);

    await user.type(screen.getByLabelText('First Name'), 'John');
    await user.type(screen.getByLabelText('Last Name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'john.doe@example.com');

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Next' }));
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Street')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Street'), 'Main Street');
    await user.type(screen.getByLabelText('City'), 'Sao Paulo');
    await user.selectOptions(screen.getByLabelText('Country'), 'br');

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Next' }));
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Phone')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Phone'), '11999999999');
    await user.type(screen.getByLabelText('Comments (Optional)'), 'Ready');

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Next' }));
    });

    await waitFor(() => {
      expect(screen.getByText(reviewHeading)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(reviewHeading)).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Previous' }));
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Phone')).toBeInTheDocument();
      expect(screen.getByLabelText('Comments (Optional)')).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Previous' }));
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Street')).toBeInTheDocument();
      expect(screen.getByLabelText('City')).toBeInTheDocument();
      expect(screen.getByLabelText('Country')).toBeInTheDocument();
    });
  });
});
