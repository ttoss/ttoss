import { act, render, screen, userEvent } from '@ttoss/test-utils/react';
import * as React from 'react';
import { useWizard, Wizard } from 'src/index';
import type { WizardStep } from 'src/types';

/** A promise the test resolves by hand, to hold the wizard mid-navigation. */
const deferred = () => {
  let resolve: (value: boolean) => void = () => {};
  const promise = new Promise<boolean>((r) => {
    resolve = r;
  });

  return { promise, resolve };
};

const NavigationState = () => {
  const { isNavigating } = useWizard();

  return <div>{isNavigating ? 'navigating' : 'idle'}</div>;
};

const threeSteps = (onNext: WizardStep['onNext']): WizardStep[] => {
  return [
    { title: 'Step 1', content: <div>Step 1 Content</div> },
    {
      title: 'Step 2',
      content: (
        <div>
          Step 2 Content
          <NavigationState />
        </div>
      ),
      onNext,
    },
    { title: 'Step 3', content: <div>Step 3 Content</div> },
  ];
};

/** Buttons in the step that drive the wizard through `useWizard`. */
const Controls = () => {
  const { goToNext, goToPrevious, goToStep } = useWizard();
  const [rejection, setRejection] = React.useState<string>();

  return (
    <div>
      <button
        onClick={() => {
          void goToNext();
          void goToNext();
        }}
      >
        next twice
      </button>
      <button
        onClick={() => {
          void goToNext();
          goToPrevious();
          goToStep({ stepIndex: 0 });
        }}
      >
        next then back
      </button>
      <button
        onClick={() => {
          goToNext().catch((error: Error) => {
            setRejection(error.message);
          });
        }}
      >
        next catching
      </button>
      {rejection && <div>rejected: {rejection}</div>}
    </div>
  );
};

const withControls = (steps: WizardStep[]): WizardStep[] => {
  return steps.map((step, index) => {
    return index === 1
      ? {
          ...step,
          content: (
            <div>
              {step.content}
              <Controls />
            </div>
          ),
        }
      : step;
  });
};

describe('Wizard - an async onNext', () => {
  test('shows the next button loading and disables navigation until onNext resolves', async () => {
    const user = userEvent.setup({ delay: null });
    const pending = deferred();
    const onNext = jest.fn(() => {
      return pending.promise;
    });

    render(<Wizard steps={threeSteps(onNext)} initialStep={1} />);

    expect(screen.getByText('idle')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    const next = screen.getByRole('button', { name: 'Next' });
    expect(next).toBeDisabled();
    expect(next).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByText('navigating')).toBeInTheDocument();

    await act(async () => {
      pending.resolve(true);
    });

    expect(screen.getByText('Step 3 Content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finish' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Finish' })).toHaveAttribute(
      'aria-busy',
      'false'
    );
  });

  test('a second click while onNext is pending does not call it again or skip a step', async () => {
    const user = userEvent.setup({ delay: null });
    const pending = deferred();
    const onNext = jest.fn(() => {
      return pending.promise;
    });

    render(<Wizard steps={withControls(threeSteps(onNext))} initialStep={1} />);

    await user.click(screen.getByRole('button', { name: 'next twice' }));

    expect(onNext).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve(true);
    });

    expect(screen.getByText('Step 3 Content')).toBeInTheDocument();
  });

  test('going back or clicking an earlier step is refused while onNext is pending', async () => {
    const user = userEvent.setup({ delay: null });
    const pending = deferred();

    render(
      <Wizard
        steps={withControls(
          threeSteps(() => {
            return pending.promise;
          })
        )}
        initialStep={1}
      />
    );

    await user.click(screen.getByRole('button', { name: 'next then back' }));

    expect(screen.getByText('Step 2 Content')).toBeInTheDocument();

    await act(async () => {
      pending.resolve(false);
    });

    expect(screen.getByText('Step 2 Content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Previous' }));

    expect(screen.getByText('Step 1 Content')).toBeInTheDocument();
  });

  test('a rejected onNext releases the buttons and stays on the step', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <Wizard
        steps={withControls(
          threeSteps(() => {
            return Promise.reject(new Error('save failed'));
          })
        )}
        initialStep={1}
      />
    );

    await user.click(screen.getByRole('button', { name: 'next catching' }));

    expect(
      await screen.findByText('rejected: save failed')
    ).toBeInTheDocument();
    expect(screen.getByText('Step 2 Content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
  });
});
