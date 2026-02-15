import { act, render, screen, waitFor } from '@ttoss/test-utils/react';
import * as React from 'react';
import { useWizard, Wizard } from 'src/index';
import type { WizardStep } from 'src/types';

describe('Wizard - setStepValidation', () => {
  test('setStepValidation allows component to control step navigation', async () => {
    const ComplexForm = () => {
      const { setStepValidation } = useWizard();
      const [isValid, setIsValid] = React.useState(false);

      React.useEffect(() => {
        const validate = () => {
          return isValid;
        };
        setStepValidation(validate);
      }, [isValid, setStepValidation]);

      return (
        <div>
          <div>Complex Form Content</div>
          <button
            onClick={() => {
              return setIsValid(true);
            }}
          >
            Make Valid
          </button>
        </div>
      );
    };

    const steps: WizardStep[] = [
      {
        title: 'Step 1',
        content: <ComplexForm />,
      },
      {
        title: 'Step 2',
        content: <div>Step 2 Content</div>,
      },
    ];

    render(<Wizard steps={steps} />);

    await waitFor(() => {
      expect(screen.getByText('Complex Form Content')).toBeInTheDocument();
    });

    // Try to navigate without validation passing
    await act(async () => {
      screen.getByText('Next').click();
    });

    // Should still be on step 1
    expect(screen.getByText('Complex Form Content')).toBeInTheDocument();
    expect(screen.queryByText('Step 2 Content')).not.toBeInTheDocument();

    // Make form valid
    await act(async () => {
      screen.getByText('Make Valid').click();
    });

    // Now navigation should work
    await act(async () => {
      screen.getByText('Next').click();
    });

    // Should be on step 2
    expect(screen.queryByText('Complex Form Content')).not.toBeInTheDocument();
    expect(screen.getByText('Step 2 Content')).toBeInTheDocument();
  });

  test('setStepValidation works with async validation', async () => {
    const AsyncForm = () => {
      const { setStepValidation } = useWizard();
      const [shouldPass, setShouldPass] = React.useState(false);

      React.useEffect(() => {
        const validate = async () => {
          // Simulate async validation (e.g., API call)
          await new Promise((resolve) => {
            return setTimeout(resolve, 10);
          });
          return shouldPass;
        };
        setStepValidation(validate);
      }, [shouldPass, setStepValidation]);

      return (
        <div>
          <div>Async Form</div>
          <div data-testid="should-pass">
            {shouldPass ? 'Pass Enabled' : 'Pass Disabled'}
          </div>
          <button
            onClick={() => {
              return setShouldPass(true);
            }}
          >
            Enable Pass
          </button>
        </div>
      );
    };

    const steps: WizardStep[] = [
      {
        title: 'Step 1',
        content: <AsyncForm />,
      },
      {
        title: 'Step 2',
        content: <div>Step 2 Content</div>,
      },
    ];

    render(<Wizard steps={steps} />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Async Form')).toBeInTheDocument();
    });

    // Try to navigate before async validation passes
    await act(async () => {
      screen.getByText('Next').click();
    });

    // Should still be on step 1
    expect(screen.getByText('Async Form')).toBeInTheDocument();

    // Enable validation to pass
    await act(async () => {
      screen.getByText('Enable Pass').click();
    });

    // Wait for the state to update
    await waitFor(() => {
      expect(screen.getByTestId('should-pass')).toHaveTextContent(
        'Pass Enabled'
      );
    });

    // Now navigation should work
    await act(async () => {
      screen.getByText('Next').click();
    });

    // Should be on step 2
    await waitFor(() => {
      expect(screen.getByText('Step 2 Content')).toBeInTheDocument();
    });
  });

  test('setStepValidation is cleared when moving to a new step', async () => {
    const step1ValidationSpy = jest.fn(() => {
      return true;
    });
    const step2ValidationSpy = jest.fn(() => {
      return true;
    });

    const Step1Form = () => {
      const { setStepValidation } = useWizard();

      React.useEffect(() => {
        setStepValidation(step1ValidationSpy);
      }, [setStepValidation]);

      return <div>Step 1 Form</div>;
    };

    const Step2Form = () => {
      const { setStepValidation } = useWizard();

      React.useEffect(() => {
        setStepValidation(step2ValidationSpy);
      }, [setStepValidation]);

      return <div>Step 2 Form</div>;
    };

    const steps: WizardStep[] = [
      {
        title: 'Step 1',
        content: <Step1Form />,
      },
      {
        title: 'Step 2',
        content: <Step2Form />,
      },
      {
        title: 'Step 3',
        content: <div>Step 3 Content</div>,
      },
    ];

    render(<Wizard steps={steps} />);

    // Navigate to step 2
    await act(async () => {
      screen.getByText('Next').click();
    });

    expect(step1ValidationSpy).toHaveBeenCalledTimes(1);

    // Navigate to step 3 (should call step 2 validation, not step 1)
    await act(async () => {
      screen.getByText('Next').click();
    });

    expect(step2ValidationSpy).toHaveBeenCalledTimes(1);
    expect(step1ValidationSpy).toHaveBeenCalledTimes(1); // Should not be called again
  });

  test('setStepValidation works alongside onNext callback', async () => {
    const setStepValidationSpy = jest.fn(() => {
      return true;
    });
    const onNextSpy = jest.fn(() => {
      return true;
    });

    const FormWithValidation = () => {
      const { setStepValidation } = useWizard();

      React.useEffect(() => {
        setStepValidation(setStepValidationSpy);
      }, [setStepValidation]);

      return <div>Form Content</div>;
    };

    const steps: WizardStep[] = [
      {
        title: 'Step 1',
        content: <FormWithValidation />,
        onNext: onNextSpy,
      },
      {
        title: 'Step 2',
        content: <div>Step 2 Content</div>,
      },
    ];

    render(<Wizard steps={steps} />);

    await act(async () => {
      screen.getByText('Next').click();
    });

    // Both validations should be called
    expect(setStepValidationSpy).toHaveBeenCalledTimes(1);
    expect(onNextSpy).toHaveBeenCalledTimes(1);

    // Should have moved to step 2
    expect(screen.getByText('Step 2 Content')).toBeInTheDocument();
  });

  test('setStepValidation blocks navigation even if onNext passes', async () => {
    const setStepValidationSpy = jest.fn(() => {
      return false;
    });
    const onNextSpy = jest.fn(() => {
      return true;
    });

    const FormWithValidation = () => {
      const { setStepValidation } = useWizard();

      React.useEffect(() => {
        setStepValidation(setStepValidationSpy);
      }, [setStepValidation]);

      return <div>Form Content</div>;
    };

    const steps: WizardStep[] = [
      {
        title: 'Step 1',
        content: <FormWithValidation />,
        onNext: onNextSpy,
      },
      {
        title: 'Step 2',
        content: <div>Step 2 Content</div>,
      },
    ];

    render(<Wizard steps={steps} />);

    await act(async () => {
      screen.getByText('Next').click();
    });

    // setStepValidation should be called first and block
    expect(setStepValidationSpy).toHaveBeenCalledTimes(1);
    // onNext should not be called because setStepValidation returned false
    expect(onNextSpy).not.toHaveBeenCalled();

    // Should still be on step 1
    expect(screen.getByText('Form Content')).toBeInTheDocument();
    expect(screen.queryByText('Step 2 Content')).not.toBeInTheDocument();
  });

  test('setStepValidation with complex validation logic', async () => {
    const ComplexValidationForm = () => {
      const { setStepValidation } = useWizard();
      const [formData, setFormData] = React.useState({
        username: '',
        password: '',
      });
      const [errors, setErrors] = React.useState<Record<string, string>>({});

      React.useEffect(() => {
        const validate = () => {
          const newErrors: Record<string, string> = {};

          if (!formData.username || formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
          }

          if (!formData.password || formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
          }

          setErrors(newErrors);
          return Object.keys(newErrors).length === 0;
        };

        setStepValidation(validate);
      }, [formData, setStepValidation]);

      return (
        <div>
          <input
            placeholder="Username"
            value={formData.username}
            onChange={(e) => {
              return setFormData({ ...formData, username: e.target.value });
            }}
          />
          <input
            placeholder="Password"
            type="password"
            value={formData.password}
            onChange={(e) => {
              return setFormData({ ...formData, password: e.target.value });
            }}
          />
          {errors.username && <div>{errors.username}</div>}
          {errors.password && <div>{errors.password}</div>}
        </div>
      );
    };

    const steps: WizardStep[] = [
      {
        title: 'Account Setup',
        content: <ComplexValidationForm />,
      },
      {
        title: 'Complete',
        content: <div>Setup Complete</div>,
      },
    ];

    render(<Wizard steps={steps} />);

    // Try to navigate with invalid data
    await act(async () => {
      screen.getByText('Next').click();
    });

    // Should show validation errors
    expect(
      screen.getByText('Username must be at least 3 characters')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Password must be at least 8 characters')
    ).toBeInTheDocument();

    // Fill in valid username
    await act(async () => {
      const usernameInput = screen.getByPlaceholderText('Username');
      usernameInput.setAttribute('value', 'john');
      usernameInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Try again - should still fail because password is invalid
    await act(async () => {
      screen.getByText('Next').click();
    });

    expect(screen.queryByText('Setup Complete')).not.toBeInTheDocument();

    // Fill in valid password
    await act(async () => {
      const passwordInput = screen.getByPlaceholderText('Password');
      passwordInput.setAttribute('value', 'password123');
      passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Now should be able to navigate
    await act(async () => {
      screen.getByText('Next').click();
    });

    expect(screen.getByText('Setup Complete')).toBeInTheDocument();
  });

  test('setStepValidation does not affect steps without validation', async () => {
    const steps: WizardStep[] = [
      {
        title: 'Step 1',
        content: <div>No Validation Step</div>,
      },
      {
        title: 'Step 2',
        content: <div>Step 2 Content</div>,
      },
    ];

    render(<Wizard steps={steps} />);

    // Should navigate freely without any validation
    await act(async () => {
      screen.getByText('Next').click();
    });

    expect(screen.getByText('Step 2 Content')).toBeInTheDocument();
  });
});
