/* eslint-disable no-console */
/**
 * Wizard — runtime composition-driven step selection.
 *
 * These tests are the evidence that the FSL `Composition` dimension is
 * behavior-driving in a *second* context (ISSUE.md §2.4), distinct from
 * `DialogActions` (§2.2):
 *
 *   - DialogActions dispatches on the `composition` prop of *leaf*
 *     children to REORDER the DOM.
 *   - Wizard dispatches on the fixed `composition` identity of
 *     *sub-part components* (pinned on each `*Meta` and advertised via
 *     a static `.composition` on the component function) to SELECT
 *     which sub-part is rendered.
 *
 * If this suite is deleted and nothing else dispatches on `composition`
 * from fixed-identity sub-parts, the "fixed-slot" mechanism collapses to
 * documented convention.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { Wizard, WizardNavigation, WizardStep, WizardSummary } from 'src/index';

describe('Wizard — composition-driven step selection', () => {
  test('renders only the step at currentStep', () => {
    render(
      <Wizard defaultStep={1} aria-label="Onboarding">
        <WizardStep>First</WizardStep>
        <WizardStep>Second</WizardStep>
        <WizardStep>Third</WizardStep>
      </Wizard>
    );
    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.queryByText('Third')).not.toBeInTheDocument();
  });

  test('advancing past the last step renders WizardSummary, not any step', () => {
    render(
      <Wizard defaultStep={2} aria-label="Onboarding">
        <WizardStep>First</WizardStep>
        <WizardStep>Second</WizardStep>
        <WizardStep>Third</WizardStep>
        <WizardSummary>All done!</WizardSummary>
        <WizardNavigation />
      </Wizard>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(screen.queryByText('Third')).not.toBeInTheDocument();
    expect(screen.getByText('All done!')).toBeInTheDocument();
  });

  test('summary is NOT rendered before the terminal state', () => {
    render(
      <Wizard defaultStep={0} aria-label="Onboarding">
        <WizardStep>First</WizardStep>
        <WizardStep>Second</WizardStep>
        <WizardSummary>All done!</WizardSummary>
      </Wizard>
    );
    expect(screen.queryByText('All done!')).not.toBeInTheDocument();
  });

  test('WizardNavigation is rendered regardless of current step', () => {
    const { rerender } = render(
      <Wizard currentStep={0} aria-label="Onboarding">
        <WizardStep>First</WizardStep>
        <WizardStep>Second</WizardStep>
        <WizardNavigation />
      </Wizard>
    );
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();

    rerender(
      <Wizard currentStep={1} aria-label="Onboarding">
        <WizardStep>First</WizardStep>
        <WizardStep>Second</WizardStep>
        <WizardNavigation />
      </Wizard>
    );
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument();
  });

  test('children order does not affect which sub-part is dispatched', () => {
    render(
      <Wizard defaultStep={0} aria-label="Onboarding">
        <WizardNavigation />
        <WizardSummary>All done!</WizardSummary>
        <WizardStep>First</WizardStep>
        <WizardStep>Second</WizardStep>
      </Wizard>
    );
    // First step is rendered even though steps are NOT first in source order.
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.queryByText('Second')).not.toBeInTheDocument();
    expect(screen.queryByText('All done!')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
  });
});

describe('Wizard — navigation behavior', () => {
  test('Back is disabled on the first step', () => {
    render(
      <Wizard defaultStep={0}>
        <WizardStep>First</WizardStep>
        <WizardStep>Second</WizardStep>
        <WizardNavigation />
      </Wizard>
    );
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
  });

  test('Back enabled after advancing', () => {
    render(
      <Wizard defaultStep={0}>
        <WizardStep>First</WizardStep>
        <WizardStep>Second</WizardStep>
        <WizardNavigation />
      </Wizard>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).not.toBeDisabled();
  });

  test('primary button switches from "Next" to "Finish" on the last step', () => {
    render(
      <Wizard defaultStep={0}>
        <WizardStep>First</WizardStep>
        <WizardStep>Second</WizardStep>
        <WizardNavigation />
      </Wizard>
    );
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Next' })
    ).not.toBeInTheDocument();
  });

  test('onFinish fires on the Finish click, before the wizard completes', () => {
    const onFinish = jest.fn();
    render(
      <Wizard defaultStep={0}>
        <WizardStep>First</WizardStep>
        <WizardStep>Second</WizardStep>
        <WizardSummary>Done</WizardSummary>
        <WizardNavigation onFinish={onFinish} />
      </Wizard>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  test('controlled currentStep: onStepChange fires; host controls state', () => {
    const onStepChange = jest.fn();
    const { rerender } = render(
      <Wizard currentStep={0} onStepChange={onStepChange}>
        <WizardStep>First</WizardStep>
        <WizardStep>Second</WizardStep>
        <WizardNavigation />
      </Wizard>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onStepChange).toHaveBeenCalledWith(1);
    // Host hasn't moved currentStep forward yet — first step still shown.
    expect(screen.getByText('First')).toBeInTheDocument();

    rerender(
      <Wizard currentStep={1} onStepChange={onStepChange}>
        <WizardStep>First</WizardStep>
        <WizardStep>Second</WizardStep>
        <WizardNavigation />
      </Wizard>
    );
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  test('throws a clear error when WizardNavigation renders outside a Wizard', () => {
    // Silence React's error logging for this expected throw.
    const originalError = console.error;
    console.error = jest.fn();
    try {
      expect(() => {
        return render(<WizardNavigation />);
      }).toThrow(/<WizardNavigation> must be rendered inside <Wizard>/);
    } finally {
      console.error = originalError;
    }
  });
});

describe('Wizard — DOM contract', () => {
  test('emits data-scope, data-part, data-current-step, data-total-steps', () => {
    const { container } = render(
      <Wizard defaultStep={1} aria-label="Onboarding">
        <WizardStep>First</WizardStep>
        <WizardStep>Second</WizardStep>
        <WizardStep>Third</WizardStep>
      </Wizard>
    );
    const root = container.querySelector(
      '[data-scope="wizard"][data-part="root"]'
    );
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute('data-current-step', '1');
    expect(root).toHaveAttribute('data-total-steps', '3');
    expect(root).not.toHaveAttribute('data-complete');
  });

  test('root emits data-complete="true" when summary is active', () => {
    const { container } = render(
      <Wizard defaultStep={2}>
        <WizardStep>First</WizardStep>
        <WizardStep>Second</WizardStep>
        <WizardSummary>All done</WizardSummary>
      </Wizard>
    );
    const root = container.querySelector(
      '[data-scope="wizard"][data-part="root"]'
    );
    expect(root).toHaveAttribute('data-complete', 'true');
  });

  test('sub-parts emit data-composition matching their fixed identity', () => {
    render(
      <Wizard defaultStep={0}>
        <WizardStep>First</WizardStep>
        <WizardNavigation />
      </Wizard>
    );
    expect(
      screen.getByText('First').closest('[data-scope="wizard"]')
    ).toHaveAttribute('data-composition', 'step');
    expect(
      screen
        .getByRole('button', { name: 'Back' })
        .closest('[data-scope="wizard"][data-part="actions"]')
    ).toHaveAttribute('data-composition', 'navigation');
  });
});

// ---------------------------------------------------------------------------
// Slot static identity — Pattern B contract
//
// The Wizard host dispatches on each child's `type.composition` literal.
// Two invariants must hold for the mechanism to be reliable:
//
//   1. Every slot component exposes its `composition` as a typed literal,
//      not `string` (caught by TypeScript as well, asserted at runtime
//      here so accidental removal of the assignment fails loudly).
//   2. The dispatcher walks through `React.memo` (and `React.forwardRef`)
//      wrappers — without this, an author memoising a step in user code
//      would silently fall back to "unknown" classification and the step
//      would render as orphan content.
// ---------------------------------------------------------------------------

describe('Wizard — slot static identity (Pattern B contract)', () => {
  test('each slot component advertises its composition literal', () => {
    expect(WizardStep.composition).toBe('step');
    expect(WizardSummary.composition).toBe('summary');
    expect(WizardNavigation.composition).toBe('navigation');
  });

  test('dispatcher classifies React.memo-wrapped slots correctly', () => {
    const MemoStep = React.memo(WizardStep);
    const MemoSummary = React.memo(WizardSummary);
    const MemoNavigation = React.memo(WizardNavigation);

    render(
      <Wizard defaultStep={0} aria-label="Memoised wizard">
        <MemoStep>Memoised step body</MemoStep>
        <MemoStep>Memoised second step</MemoStep>
        <MemoSummary>Memoised summary</MemoSummary>
        <MemoNavigation />
      </Wizard>
    );

    // The first step is rendered (not the second, not the summary).
    expect(screen.getByText('Memoised step body')).toBeInTheDocument();
    expect(screen.queryByText('Memoised second step')).not.toBeInTheDocument();
    expect(screen.queryByText('Memoised summary')).not.toBeInTheDocument();

    // Navigation is rendered alongside the active step (Next, not Finish,
    // since defaultStep=0 with two steps).
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  test('dispatcher classifies React.forwardRef-wrapped slots correctly', () => {
    // forwardRef'd Step that simply forwards props — the static
    // `.composition` lives on the inner render function via Object.assign.
    const ForwardedStep = React.forwardRef<
      HTMLDivElement,
      { children?: React.ReactNode }
    >(
      Object.assign(
        (
          props: { children?: React.ReactNode },
          _ref: React.Ref<HTMLDivElement>
        ) => {
          return <WizardStep>{props.children}</WizardStep>;
        },
        { composition: 'step' as const }
      )
    );

    render(
      <Wizard defaultStep={0} aria-label="Forwarded wizard">
        <ForwardedStep>Forwarded step body</ForwardedStep>
        <ForwardedStep>Forwarded second step</ForwardedStep>
        <WizardNavigation />
      </Wizard>
    );

    expect(screen.getByText('Forwarded step body')).toBeInTheDocument();
    expect(screen.queryByText('Forwarded second step')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  test('dispatcher classifies nested memo(forwardRef(...)) wrappers', () => {
    // Worst-case wrapper stack: memo around forwardRef. The bounded walker
    // must traverse both layers to reach the inner `.composition` literal.
    // Without the loop, the dispatcher would stop at the outer `memo` and
    // the slot would silently fall into `unknown`.
    const ForwardedStep = React.forwardRef<
      HTMLDivElement,
      { children?: React.ReactNode }
    >(
      Object.assign(
        (
          props: { children?: React.ReactNode },
          _ref: React.Ref<HTMLDivElement>
        ) => {
          return <WizardStep>{props.children}</WizardStep>;
        },
        { composition: 'step' as const }
      )
    );
    const NestedStep = React.memo(ForwardedStep);

    render(
      <Wizard defaultStep={0} aria-label="Nested wrapper wizard">
        <NestedStep>Nested step body</NestedStep>
        <NestedStep>Nested second step</NestedStep>
        <WizardNavigation />
      </Wizard>
    );

    expect(screen.getByText('Nested step body')).toBeInTheDocument();
    expect(screen.queryByText('Nested second step')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  test('arbitrary children without composition fall through unclassified', () => {
    // A plain element that is not a Wizard slot must NOT be confused with
    // one. The dispatcher should leave it in the `unknown` bucket — which
    // the host appends after the navigation row.
    render(
      <Wizard defaultStep={0} aria-label="Mixed children wizard">
        <WizardStep>Real step</WizardStep>
        <div data-testid="stranger">unrelated</div>
        <WizardNavigation />
      </Wizard>
    );

    // The active step renders, and the stranger is appended (not selected
    // as the active step body).
    expect(screen.getByText('Real step')).toBeInTheDocument();
    expect(screen.getByTestId('stranger')).toBeInTheDocument();
  });
});
