import { fireEvent, render, screen } from '@ttoss/test-utils/react';
import type { WizardStep } from 'src/types';
import { WizardStepList } from 'src/WizardStepList';

describe('WizardStepList', () => {
  test('supports click and keyboard navigation for completed steps only', () => {
    const onStepClick = jest.fn();
    const steps: WizardStep[] = [
      {
        title: 'Completed step',
        description: 'Already done',
        content: <div data-testid="completed-step-content" />,
      },
      {
        title: 'Active step',
        description: 'Current',
        content: <div data-testid="active-step-content" />,
      },
      {
        title: '',
        content: <div data-testid="upcoming-step-content" />,
      },
    ];

    render(
      <WizardStepList
        steps={steps}
        currentStep={1}
        layout="left"
        variant="accent"
        allowStepClick
        getStepStatus={({ stepIndex }) => {
          if (stepIndex === 0) {
            return 'completed';
          }

          if (stepIndex === 1) {
            return 'active';
          }

          return 'upcoming';
        }}
        onStepClick={onStepClick}
      />
    );

    const [completedButton, activeButton, upcomingButton] =
      screen.getAllByRole('button');

    expect(completedButton).toHaveAttribute('tabindex', '0');
    expect(activeButton).toHaveAttribute('aria-current', 'step');
    expect(upcomingButton).toHaveAttribute('tabindex', '-1');
    expect(screen.getByText('Completed step')).toBeInTheDocument();
    expect(screen.queryByText('Upcoming step')).not.toBeInTheDocument();

    fireEvent.click(completedButton);
    fireEvent.keyDown(completedButton, { key: 'Enter' });
    fireEvent.keyDown(completedButton, { key: ' ' });
    fireEvent.click(upcomingButton);
    fireEvent.keyDown(upcomingButton, { key: 'Enter' });

    expect(onStepClick).toHaveBeenNthCalledWith(1, { stepIndex: 0 });
    expect(onStepClick).toHaveBeenNthCalledWith(2, { stepIndex: 0 });
    expect(onStepClick).toHaveBeenNthCalledWith(3, { stepIndex: 0 });
    expect(onStepClick).toHaveBeenCalledTimes(3);
  });

  test('keeps completed steps non-clickable when clicking is disabled', () => {
    const onStepClick = jest.fn();
    const steps: WizardStep[] = [
      {
        title: 'Completed step',
        content: <div data-testid="completed-step-content" />,
      },
      {
        title: 'Active step',
        content: <div data-testid="active-step-content" />,
      },
    ];

    render(
      <WizardStepList
        steps={steps}
        currentStep={1}
        layout="top"
        variant="secondary"
        allowStepClick={false}
        getStepStatus={({ stepIndex }) => {
          return stepIndex === 0 ? 'completed' : 'active';
        }}
        onStepClick={onStepClick}
      />
    );

    const [completedButton] = screen.getAllByRole('button');

    expect(completedButton).toHaveAttribute('tabindex', '-1');

    fireEvent.click(completedButton);
    fireEvent.keyDown(completedButton, { key: 'Enter' });

    expect(onStepClick).not.toHaveBeenCalled();
  });
});
