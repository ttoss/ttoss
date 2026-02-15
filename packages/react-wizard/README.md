# @ttoss/react-wizard

A React wizard component for guiding users through multi-step flows with configurable step list layouts.

## Installation

```bash
pnpm add @ttoss/react-wizard
```

## Usage

```tsx
import { Wizard } from '@ttoss/react-wizard';

const steps = [
  {
    title: 'Personal Info',
    description: 'Enter your details',
    content: <PersonalInfoForm />,
    onNext: () => validatePersonalInfo(),
  },
  {
    title: 'Address',
    content: <AddressForm />,
  },
  {
    title: 'Review',
    content: <ReviewStep />,
  },
];

const MyWizard = () => {
  return (
    <Wizard
      steps={steps}
      layout="top"
      onComplete={() => console.log('Done!')}
      onCancel={() => console.log('Cancelled')}
    />
  );
};
```

## Props

| Prop             | Type                                      | Default | Description                                            |
| ---------------- | ----------------------------------------- | ------- | ------------------------------------------------------ |
| `steps`          | `WizardStep[]`                            | —       | Array of step definitions.                             |
| `layout`         | `'top' \| 'right' \| 'bottom' \| 'left'`  | `'top'` | Position of the step list relative to content.         |
| `onComplete`     | `() => void`                              | —       | Called when the user finishes the last step.           |
| `onCancel`       | `() => void`                              | —       | Called on cancel. If omitted, cancel button is hidden. |
| `onStepChange`   | `(params: { stepIndex: number }) => void` | —       | Called when the active step changes.                   |
| `initialStep`    | `number`                                  | `0`     | The initially active step index.                       |
| `allowStepClick` | `boolean`                                 | `true`  | Allow clicking completed steps to navigate back.       |

## WizardStep

| Property      | Type                                | Description                                               |
| ------------- | ----------------------------------- | --------------------------------------------------------- |
| `title`       | `string`                            | Title displayed in the step list.                         |
| `description` | `string`                            | Optional description below the title.                     |
| `content`     | `ReactNode`                         | Content rendered when the step is active.                 |
| `onNext`      | `() => boolean \| Promise<boolean>` | Validation callback. Return `false` to prevent advancing. |

## Layouts

The `layout` prop controls where the step list appears:

- **`top`** — Horizontal step list above the content (default).
- **`bottom`** — Horizontal step list below the content.
- **`left`** — Vertical step list on the left side.
- **`right`** — Vertical step list on the right side.

## useWizard Hook

Access the wizard context from within step content:

```tsx
import { useWizard } from '@ttoss/react-wizard';

const StepContent = () => {
  const {
    currentStep,
    totalSteps,
    goToNext,
    goToPrevious,
    isLastStep,
    setStepValidation,
  } = useWizard();

  return (
    <div>
      Step {currentStep + 1} of {totalSteps}
    </div>
  );
};
```

### useWizard Return Value

| Property            | Type                                                    | Description                                                  |
| ------------------- | ------------------------------------------------------- | ------------------------------------------------------------ |
| `currentStep`       | `number`                                                | Current active step index.                                   |
| `totalSteps`        | `number`                                                | Total number of steps.                                       |
| `goToNext`          | `() => Promise<void>`                                   | Navigate to the next step.                                   |
| `goToPrevious`      | `() => void`                                            | Navigate to the previous step.                               |
| `goToStep`          | `(params: { stepIndex: number }) => void`               | Navigate to a specific step.                                 |
| `isFirstStep`       | `boolean`                                               | Whether the wizard is on the first step.                     |
| `isLastStep`        | `boolean`                                               | Whether the wizard is on the last step.                      |
| `getStepStatus`     | `(params: { stepIndex: number }) => WizardStepStatus`   | Get the status of a step by index.                           |
| `setStepValidation` | `(validate: () => boolean \| Promise<boolean>) => void` | Register a validation function for the current step content. |

## Example: Form with Step-by-Step Validation

This example demonstrates using a single form across all wizard steps, with each step validating only its relevant fields using Zod:

```tsx
import { Wizard } from '@ttoss/react-wizard';
import {
  Form,
  FormFieldInput,
  FormFieldSelect,
  FormFieldTextarea,
  useForm,
  z,
  zodResolver,
} from '@ttoss/forms';
import { Button, Box, Text } from '@ttoss/ui';

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

const RegistrationWizard = () => {
  const formMethods = useForm<FormData>({
    mode: 'onChange',
    resolver: zodResolver(schema),
  });

  const { trigger, handleSubmit } = formMethods;

  const handleComplete = handleSubmit((data) => {
    console.log('Form submitted:', data);
    // Handle final submission
  });

  const steps = [
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
          {/* Display summary of all form data */}
        </Box>
      ),
    },
  ];

  return (
    <Form {...formMethods} onSubmit={handleComplete}>
      <Wizard
        steps={steps}
        layout="top"
        onComplete={handleComplete}
        onCancel={() => console.log('Wizard cancelled')}
      />
    </Form>
  );
};
```

**Key Points:**

- **Single Form**: The `<Form>` component wraps the entire wizard, maintaining form state across all steps
- **Step-by-Step Validation**: Each step's `onNext` callback uses `trigger()` to validate only the fields relevant to that step
- **Zod Schema**: Define the complete schema upfront with all fields from all steps
- **Form Methods**: Access `trigger` from `useForm` to programmatically validate specific fields
- **Progressive Flow**: Users can only advance to the next step after passing validation for current step fields

## Example: Complex Component with Internal Validation

This example shows how a complex component can use `useWizard` to handle its own validation directly:

```tsx
import { Wizard, useWizard } from '@ttoss/react-wizard';
import { Box, Text } from '@ttoss/ui';
import { useState, useEffect } from 'react';

// Complex component with internal validation using useWizard
const ComplexForm = () => {
  const { setStepValidation } = useWizard();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Register validation function with the wizard
  useEffect(() => {
    const validate = async () => {
      const newErrors: Record<string, string> = {};

      // Complex validation logic
      if (!formData.username || formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }

      if (!formData.password || formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    setStepValidation(validate);
  }, [formData, setStepValidation]);

  return (
    <Box>
      <Box>
        <Text>Username</Text>
        <input
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
        />
        {errors.username && <Text color="red">{errors.username}</Text>}
      </Box>

      <Box>
        <Text>Password</Text>
        <input
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />
        {errors.password && <Text color="red">{errors.password}</Text>}
      </Box>

      <Box>
        <Text>Confirm Password</Text>
        <input
          type="password"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
        />
        {errors.confirmPassword && (
          <Text color="red">{errors.confirmPassword}</Text>
        )}
      </Box>
    </Box>
  );
};

const WizardWithComplexComponent = () => {
  const steps = [
    {
      title: 'Account Setup',
      description: 'Create your account',
      content: <ComplexForm />,
    },
    {
      title: 'Profile',
      content: <Box>Profile information...</Box>,
    },
    {
      title: 'Complete',
      content: <Box>Setup complete!</Box>,
    },
  ];

  return (
    <Wizard
      steps={steps}
      layout="top"
      onComplete={() => console.log('Wizard complete!')}
    />
  );
};
```

**Key Points:**

- **useWizard Hook**: The complex component uses `setStepValidation` from `useWizard` to register its validation function
- **Automatic Integration**: The wizard automatically calls the registered validation when the user tries to advance
- **No Refs Needed**: Simpler than using refs and forwardRef patterns
- **Self-Contained**: The component manages its own state and validation logic
- **Dynamic Updates**: The validation function updates when formData changes
