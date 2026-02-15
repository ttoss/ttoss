import { act, render, screen } from '@ttoss/test-utils/react';
import { useWizard, Wizard } from 'src/index';
import type { WizardStep } from 'src/types';

const createSteps = (overrides?: Partial<WizardStep>[]): WizardStep[] => {
  const defaults: WizardStep[] = [
    {
      title: 'Step 1',
      description: 'First step description',
      content: <div>Step 1 Content</div>,
    },
    {
      title: 'Step 2',
      content: <div>Step 2 Content</div>,
    },
    {
      title: 'Step 3',
      description: 'Final step',
      content: <div>Step 3 Content</div>,
    },
  ];

  if (overrides) {
    return defaults.map((step, index) => {
      return { ...step, ...overrides[index] };
    });
  }

  return defaults;
};

describe('Wizard', () => {
  test('renders the first step by default', () => {
    render(<Wizard steps={createSteps()} />);

    expect(screen.getByText('Step 1 Content')).toBeInTheDocument();
    expect(screen.queryByText('Step 2 Content')).not.toBeInTheDocument();
  });

  test('renders step list with all step titles', () => {
    render(<Wizard steps={createSteps()} />);

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  test('renders step descriptions when provided', () => {
    render(<Wizard steps={createSteps()} />);

    expect(screen.getByText('First step description')).toBeInTheDocument();
    expect(screen.getByText('Final step')).toBeInTheDocument();
  });

  test('navigates to the next step when Next is clicked', async () => {
    render(<Wizard steps={createSteps()} />);

    await act(async () => {
      screen.getByText('Next').click();
    });

    expect(screen.getByText('Step 2 Content')).toBeInTheDocument();
    expect(screen.queryByText('Step 1 Content')).not.toBeInTheDocument();
  });

  test('navigates to the previous step when Previous is clicked', async () => {
    render(<Wizard steps={createSteps()} />);

    await act(async () => {
      screen.getByText('Next').click();
    });

    expect(screen.getByText('Step 2 Content')).toBeInTheDocument();

    await act(async () => {
      screen.getByText('Previous').click();
    });

    expect(screen.getByText('Step 1 Content')).toBeInTheDocument();
  });

  test('Previous button is disabled on the first step', () => {
    render(<Wizard steps={createSteps()} />);

    const previousButton = screen.getByText('Previous');
    expect(previousButton).toBeDisabled();
  });

  test('shows Finish button on the last step', async () => {
    render(<Wizard steps={createSteps()} />);

    await act(async () => {
      screen.getByText('Next').click();
    });

    await act(async () => {
      screen.getByText('Next').click();
    });

    expect(screen.getByText('Finish')).toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  test('calls onComplete when Finish is clicked', async () => {
    const onComplete = jest.fn();
    render(<Wizard steps={createSteps()} onComplete={onComplete} />);

    // Go to last step
    await act(async () => {
      screen.getByText('Next').click();
    });
    await act(async () => {
      screen.getByText('Next').click();
    });

    await act(async () => {
      screen.getByText('Finish').click();
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('calls onCancel when Cancel is clicked', async () => {
    const onCancel = jest.fn();
    render(<Wizard steps={createSteps()} onCancel={onCancel} />);

    await act(async () => {
      screen.getByText('Cancel').click();
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('does not render Cancel button when onCancel is not provided', () => {
    render(<Wizard steps={createSteps()} />);

    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  test('calls onStepChange when navigating steps', async () => {
    const onStepChange = jest.fn();
    render(<Wizard steps={createSteps()} onStepChange={onStepChange} />);

    await act(async () => {
      screen.getByText('Next').click();
    });

    expect(onStepChange).toHaveBeenCalledWith({ stepIndex: 1 });
  });

  test('respects initialStep prop', () => {
    render(<Wizard steps={createSteps()} initialStep={1} />);

    expect(screen.getByText('Step 2 Content')).toBeInTheDocument();
    expect(screen.queryByText('Step 1 Content')).not.toBeInTheDocument();
  });

  test('prevents navigation when onNext returns false', async () => {
    const steps = createSteps([
      {
        onNext: () => {
          return false;
        },
      },
      undefined,
      undefined,
    ]);

    render(<Wizard steps={steps} />);

    await act(async () => {
      screen.getByText('Next').click();
    });

    // Should still be on step 1
    expect(screen.getByText('Step 1 Content')).toBeInTheDocument();
  });

  test('prevents navigation when onNext returns Promise<false>', async () => {
    const steps = createSteps([
      {
        onNext: () => {
          return Promise.resolve(false);
        },
      },
      undefined,
      undefined,
    ]);

    render(<Wizard steps={steps} />);

    await act(async () => {
      screen.getByText('Next').click();
    });

    expect(screen.getByText('Step 1 Content')).toBeInTheDocument();
  });

  test('allows navigation when onNext returns true', async () => {
    const steps = createSteps([
      {
        onNext: () => {
          return true;
        },
      },
      undefined,
      undefined,
    ]);

    render(<Wizard steps={steps} />);

    await act(async () => {
      screen.getByText('Next').click();
    });

    expect(screen.getByText('Step 2 Content')).toBeInTheDocument();
  });
});

describe('Wizard layouts', () => {
  test('renders with top layout by default', () => {
    const { container } = render(<Wizard steps={createSteps()} />);
    expect(container.querySelector('[role="navigation"]')).toBeInTheDocument();
  });

  test('renders with right layout', () => {
    const { container } = render(
      <Wizard steps={createSteps()} layout="right" />
    );
    expect(container.querySelector('[role="navigation"]')).toBeInTheDocument();
  });

  test('renders with bottom layout', () => {
    const { container } = render(
      <Wizard steps={createSteps()} layout="bottom" />
    );
    expect(container.querySelector('[role="navigation"]')).toBeInTheDocument();
  });

  test('renders with left layout', () => {
    const { container } = render(
      <Wizard steps={createSteps()} layout="left" />
    );
    expect(container.querySelector('[role="navigation"]')).toBeInTheDocument();
  });
});

describe('Wizard step click navigation', () => {
  test('allows clicking a completed step to go back', async () => {
    render(<Wizard steps={createSteps()} />);

    // Go to step 2
    await act(async () => {
      screen.getByText('Next').click();
    });

    expect(screen.getByText('Step 2 Content')).toBeInTheDocument();

    // Click on step 1 indicator (the checkmark)
    const stepIndicators = screen.getAllByRole('button');
    const step1Indicator = stepIndicators.find((btn) => {
      return btn.textContent === '✓';
    });

    await act(async () => {
      step1Indicator?.click();
    });

    expect(screen.getByText('Step 1 Content')).toBeInTheDocument();
  });

  test('does not allow clicking steps when allowStepClick is false', async () => {
    render(<Wizard steps={createSteps()} allowStepClick={false} />);

    await act(async () => {
      screen.getByText('Next').click();
    });

    expect(screen.getByText('Step 2 Content')).toBeInTheDocument();

    // Try to click step 1 indicator
    const stepIndicators = screen.getAllByRole('button');
    const step1Indicator = stepIndicators.find((btn) => {
      return btn.textContent === '✓';
    });

    await act(async () => {
      step1Indicator?.click();
    });

    // Should still be on step 2
    expect(screen.getByText('Step 2 Content')).toBeInTheDocument();
  });
});

describe('useWizard hook', () => {
  const StepWithHook = () => {
    const { currentStep, totalSteps, isFirstStep, isLastStep } = useWizard();

    return (
      <div>
        <div data-testid="current-step">{currentStep}</div>
        <div data-testid="total-steps">{totalSteps}</div>
        <div data-testid="is-first">{String(isFirstStep)}</div>
        <div data-testid="is-last">{String(isLastStep)}</div>
      </div>
    );
  };

  test('provides correct context values', () => {
    const steps: WizardStep[] = [
      { title: 'Step 1', content: <StepWithHook /> },
      { title: 'Step 2', content: <div>Step 2</div> },
    ];

    render(<Wizard steps={steps} />);

    expect(screen.getByTestId('current-step').textContent).toBe('0');
    expect(screen.getByTestId('total-steps').textContent).toBe('2');
    expect(screen.getByTestId('is-first').textContent).toBe('true');
    expect(screen.getByTestId('is-last').textContent).toBe('false');
  });

  test('throws error when used outside Wizard', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const BadComponent = () => {
      useWizard();
      return <div />;
    };

    expect(() => {
      render(<BadComponent />);
    }).toThrow('useWizard must be used within a Wizard component.');

    consoleError.mockRestore();
  });
});
