import {
  Form,
  FormFieldInput,
  FormFieldSelect,
  FormFieldTextarea,
  useForm,
  z,
  zodResolver,
} from '@ttoss/forms';
import {
  act,
  render,
  screen,
  userEvent,
  waitFor,
} from '@ttoss/test-utils/react';
import { Box, Text } from '@ttoss/ui';
import { Wizard } from 'src/index';
import type { WizardStep } from 'src/types';

/**
 * This test suite demonstrates the integration between @ttoss/react-wizard
 * and @ttoss/forms with Zod validation. It shows how to create a multi-step
 * form where each step validates only its relevant fields before allowing
 * navigation to the next step.
 */

// Define the complete Zod schema for all steps
const schema = z.object({
  // Step 1: Personal Information
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),

  // Step 2: Address
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),

  // Step 3: Additional Info
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  comments: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const TestWizardForm = ({
  onComplete,
  onCancel,
}: {
  onComplete?: (data: FormData) => void;
  onCancel?: () => void;
}) => {
  const formMethods = useForm<FormData>({
    mode: 'onChange',
    resolver: zodResolver(schema),
    shouldUnregister: false, // Keep field values when fields are unmounted
  });

  const { trigger } = formMethods;

  const handleComplete = (data: FormData) => {
    onComplete?.(data);
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
        // Validate only Step 1 fields
        return await trigger(['firstName', 'lastName', 'email']);
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
        // Validate only Step 2 fields
        return await trigger(['street', 'city', 'country']);
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
        // Validate only Step 3 fields
        return await trigger(['phone', 'comments']);
      },
    },
    {
      title: 'Review',
      description: 'Confirm details',
      content: (
        <Box>
          <Text variant="heading">Review Your Information</Text>
        </Box>
      ),
    },
  ];

  return (
    <Form {...formMethods} onSubmit={handleComplete}>
      <Wizard steps={steps} layout="top" onCancel={onCancel} />
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

    // Try to go to next step without filling required fields
    const nextButton = screen.getByText('Next');
    await act(async () => {
      await user.click(nextButton);
    });

    // Should still be on step 1
    await waitFor(() => {
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.queryByLabelText('Street')).not.toBeInTheDocument();
    });

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
    });
  });

  test('allows navigation to next step when step 1 validation passes', async () => {
    const user = userEvent.setup({ delay: null });
    render(<TestWizardForm />);

    // Fill in all required fields
    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email');

    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Doe');
    await user.type(emailInput, 'john.doe@example.com');

    // Wait for values to be set
    await waitFor(() => {
      expect(firstNameInput).toHaveValue('John');
      expect(lastNameInput).toHaveValue('Doe');
      expect(emailInput).toHaveValue('john.doe@example.com');
    });

    // Go to next step
    const nextButton = screen.getByText('Next');
    await act(async () => {
      await user.click(nextButton);
    });

    // Should now be on step 2
    await waitFor(() => {
      expect(screen.getByLabelText('Street')).toBeInTheDocument();
      expect(screen.getByLabelText('City')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  test('shows validation error for invalid email format', async () => {
    const user = userEvent.setup({ delay: null });
    render(<TestWizardForm />);

    await user.type(screen.getByLabelText('First Name'), 'John');
    await user.type(screen.getByLabelText('Last Name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'invalid-email');

    const nextButton = screen.getByText('Next');
    await act(async () => {
      await user.click(nextButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });
  });

  test('prevents navigation from step 2 when validation fails', async () => {
    const user = userEvent.setup({ delay: null });
    render(<TestWizardForm />);

    // Fill step 1 and navigate
    await user.type(screen.getByLabelText('First Name'), 'John');
    await user.type(screen.getByLabelText('Last Name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'john.doe@example.com');

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toHaveValue(
        'john.doe@example.com'
      );
    });

    await act(async () => {
      await user.click(screen.getByText('Next'));
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Street')).toBeInTheDocument();
    });

    // Try to navigate without filling step 2 fields
    await act(async () => {
      await user.click(screen.getByText('Next'));
    });

    // Should still be on step 2
    await waitFor(() => {
      expect(screen.getByLabelText('Street')).toBeInTheDocument();
      expect(screen.getByText('Street is required')).toBeInTheDocument();
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
});

/**
 * Note: Additional comprehensive tests covering full multi-step flows with
 * complex form state preservation across all steps would require more
 * sophisticated test setup to handle edge cases with React Hook Form,
 * Chakra UI Select components, and unmount/remount cycles.
 *
 * The tests above verify the core functionality:
 * - Wizard renders with form fields
 * - Step-by-step validation works correctly
 * - Invalid data prevents navigation
 * - Valid dat allows progression
 * - Cancel functionality works
 */
