import { vars } from '@ttoss/theme2/vars';
import * as React from 'react';

import { Button } from '../../components/Button/Button';
import type { ComponentMeta } from '../../semantics';
import { createCompositeScope } from '../scope';

// ---------------------------------------------------------------------------
// Wizard — composition-driven composite (Structure entity, root).
//
// This composite is the second runtime proof that FSL `Composition` is
// behavior-driving (ISSUE.md §2.4), complementing `DialogActions` (§2.2):
//
//   - DialogActions dispatches on the `composition` prop of *leaf* children
//     (runtime value on a `Button`) to REORDER the DOM per platform.
//   - Wizard dispatches on the `composition` identity of *fixed sub-parts*
//     (pinned on each sub-part's `*Meta` and advertised at runtime via a
//     static `composition` property on the component) to SELECT which
//     sub-part is rendered for the current step.
//
// Same FSL dimension, two distinct dispatch mechanisms, both observable in
// tests. If either composite is deleted and no other runtime consumer
// references `composition`, the dimension collapses to documented
// convention and must drop out of `ComponentMeta`.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Static composition advertisement
//
// Sub-parts with a FIXED composition identity attach the value as a static
// property on the component function so the Wizard host can dispatch on it
// at runtime without introspecting React internals. The same value is
// mirrored on `*Meta.composition` for Layer 1 legality, and on the DOM as
// `data-composition` for tests / host CSS.
//
// Two helpers keep this robust:
//
//   1. `defineWizardSlot(Component, composition)` — augments a component
//      function with a typed `.composition` property via `Object.assign`.
//      Replaces the previous cast-and-mutate pattern; the returned type
//      carries `composition` as a literal so `WizardStep.composition` is
//      `'step'` (not `string`), and missing the assignment is a compile
//      error.
//
//   2. `getChildComposition` walks through `React.memo` and
//      `React.forwardRef` wrappers when reading the static identity. A
//      consumer that does `const Memoized = React.memo(WizardStep)` —
//      or even nests them, e.g. `memo(forwardRef(Step))` — will still
//      dispatch correctly. The walk is bounded (depth 8) so an exotic
//      future wrapper type cannot trap the loop.
//
// The well-known React symbols are referenced via `Symbol.for(...)` which
// is the contract documented in the React source (`shared/ReactSymbols`).
// ---------------------------------------------------------------------------

type WizardSlotComposition = 'step' | 'summary' | 'navigation';

type WizardSlotComponent<
  P,
  K extends WizardSlotComposition,
> = React.ComponentType<P> & { composition: K };

/**
 * Tag a component as a Wizard slot. Returns the same component augmented
 * with a typed `.composition` literal — no cast, no post-declaration
 * mutation in the caller.
 */
const defineWizardSlot = <P, K extends WizardSlotComposition>(
  Component: React.ComponentType<P>,
  composition: K
): WizardSlotComponent<P, K> => {
  return Object.assign(Component, { composition });
};

const REACT_MEMO_TYPE = Symbol.for('react.memo');
const REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');

const readComposition = (type: unknown): WizardSlotComposition | undefined => {
  if (
    type === null ||
    (typeof type !== 'object' && typeof type !== 'function')
  ) {
    return undefined;
  }
  const candidate = (type as { composition?: unknown }).composition;
  if (
    candidate === 'step' ||
    candidate === 'summary' ||
    candidate === 'navigation'
  ) {
    return candidate;
  }
  return undefined;
};

const getChildComposition = (
  child: React.ReactNode
): WizardSlotComposition | undefined => {
  if (!React.isValidElement(child)) return undefined;
  // Bounded walk through `React.memo` / `React.forwardRef` wrappers so a
  // consumer can compose them in any order — `memo(forwardRef(Step))`,
  // `forwardRef(memo(Step))`, even nested twice — and still dispatch on
  // the inner component's `.composition`. The depth bound (8) is well
  // above any realistic wrapper stack and prevents pathological loops if
  // a future React version introduces a self-referential exotic type.
  let type: unknown = child.type;
  for (let depth = 0; depth < 8; depth++) {
    const direct = readComposition(type);
    if (direct !== undefined) return direct;
    if (typeof type !== 'object' || type === null) return undefined;
    const wrapped = type as {
      $$typeof?: symbol;
      type?: unknown;
      render?: unknown;
    };
    if (wrapped.$$typeof === REACT_MEMO_TYPE) {
      type = wrapped.type;
      continue;
    }
    if (wrapped.$$typeof === REACT_FORWARD_REF_TYPE) {
      type = wrapped.render;
      continue;
    }
    return undefined;
  }
  return undefined;
};

// ---------------------------------------------------------------------------
// Composite scope — host-presence guard + wizard state surface.
//
// `Wizard` is the host. `WizardStep`, `WizardSummary`, and `WizardNavigation`
// assert this scope at render time — rendered standalone they throw with a
// clear message. `WizardNavigation` additionally consumes the scope value
// to drive its prev/next/finish controls.
// ---------------------------------------------------------------------------

/**
 * Public state surface shared by the {@link Wizard} host with its
 * sub-parts. Consumed by {@link WizardNavigationProps.children} as a
 * render-prop signature so authors can compose custom navigation while
 * still observing the same state machine the default row uses.
 */
export interface WizardState {
  currentStep: number;
  totalSteps: number;
  isFirst: boolean;
  isLast: boolean;
  isComplete: boolean;
  goNext: () => void;
  goPrev: () => void;
  goTo: (step: number) => void;
}

const wizardScope = createCompositeScope<WizardState>('Wizard');

// ---------------------------------------------------------------------------
// Wizard — host (Structure entity, root)
// ---------------------------------------------------------------------------

/**
 * Formal semantic identity — Wizard root (Structure entity, root part).
 */
export const wizardMeta = {
  displayName: 'Wizard',
  entity: 'Structure',
  structure: 'root',
} as const satisfies ComponentMeta<'Structure'>;

/**
 * Props for {@link Wizard}.
 *
 * The Wizard root carries no `evaluation` prop: under the evidence rule
 * (CONTRIBUTING §2.3) a dimension only appears on a component if a runtime
 * dispatches on it. The Wizard root renders a transparent `<section>` —
 * no color tokens are read here — so adding `evaluation` would reserve API
 * surface for a speculative future consumer. Re-introduce it the day a
 * real consumer (e.g. wizard frame chrome) needs it.
 *
 * The composite owns its layout; the root does not accept `style` or
 * `className`. Pass them on a wrapping element instead. See CONTRIBUTING
 * §4.
 */
export interface WizardProps {
  /**
   * Controlled current step index (0-based). When the user has advanced
   * past the last step, `currentStep === numberOfSteps` — this is the
   * terminal state that renders the {@link WizardSummary} sub-part (if
   * provided). Pair with {@link WizardProps.onStepChange}.
   */
  currentStep?: number;
  /**
   * Initial step index when rendering uncontrolled.
   * @default 0
   */
  defaultStep?: number;
  /**
   * Fires whenever the active step changes — controlled or uncontrolled.
   */
  onStepChange?: (step: number) => void;
  /**
   * Accessible name for the wizard region (rendered as `aria-label`).
   */
  'aria-label'?: string;
  /**
   * Expected children: any number of {@link WizardStep} (in order), an
   * optional {@link WizardSummary}, and an optional {@link WizardNavigation}.
   * Children are dispatched on their fixed `composition` identity.
   */
  children?: React.ReactNode;
}

/**
 * A step-at-a-time Structure composite. The host reads each child's
 * fixed `composition` identity at runtime to decide which single step
 * to render, whether to swap in the summary view, and whether to render
 * the navigation row. This is the canonical evidence that FSL
 * `Composition` drives behavior from *fixed-identity sub-parts*
 * (complementing `DialogActions`, which drives behavior from *runtime
 * values on leaves*).
 *
 * @example
 * ```tsx
 * const [step, setStep] = React.useState(0);
 * return (
 *   <Wizard currentStep={step} onStepChange={setStep} aria-label="Onboarding">
 *     <WizardStep>First step content</WizardStep>
 *     <WizardStep>Second step content</WizardStep>
 *     <WizardStep>Third step content</WizardStep>
 *     <WizardSummary>All done!</WizardSummary>
 *     <WizardNavigation />
 *   </Wizard>
 * );
 * ```
 */
export const Wizard = ({
  currentStep,
  defaultStep = 0,
  onStepChange,
  children,
  ...props
}: WizardProps) => {
  const [internalStep, setInternalStep] = React.useState(defaultStep);
  const step = currentStep ?? internalStep;

  const setStep = React.useCallback(
    (next: number) => {
      if (currentStep === undefined) setInternalStep(next);
      onStepChange?.(next);
    },
    [currentStep, onStepChange]
  );

  // Dispatch children by fixed composition identity.
  const classified = React.useMemo(() => {
    const steps: React.ReactElement[] = [];
    let summary: React.ReactElement | null = null;
    let navigation: React.ReactElement | null = null;
    const unknown: React.ReactNode[] = [];

    React.Children.forEach(children, (child) => {
      const composition = getChildComposition(child);
      if (composition === 'step' && React.isValidElement(child)) {
        steps.push(child);
      } else if (composition === 'summary' && React.isValidElement(child)) {
        summary = child;
      } else if (composition === 'navigation' && React.isValidElement(child)) {
        navigation = child;
      } else {
        unknown.push(child);
      }
    });

    return { steps, summary, navigation, unknown };
  }, [children]);

  const totalSteps = classified.steps.length;
  const safeStep = Math.max(0, Math.min(step, totalSteps));
  const isComplete = safeStep >= totalSteps && totalSteps > 0;

  const goTo = React.useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(next, totalSteps));
      setStep(clamped);
    },
    [setStep, totalSteps]
  );
  const goNext = React.useCallback(() => {
    return goTo(safeStep + 1);
  }, [goTo, safeStep]);
  const goPrev = React.useCallback(() => {
    return goTo(safeStep - 1);
  }, [goTo, safeStep]);

  const contextValue = React.useMemo<WizardState>(() => {
    return {
      currentStep: safeStep,
      totalSteps,
      isFirst: safeStep === 0,
      isLast: totalSteps > 0 && safeStep === totalSteps - 1,
      isComplete,
      goNext,
      goPrev,
      goTo,
    };
  }, [safeStep, totalSteps, isComplete, goNext, goPrev, goTo]);

  // Runtime composition dispatch: which step body to render.
  const activeStep = isComplete
    ? classified.summary
    : (classified.steps[safeStep] ?? null);

  return (
    <wizardScope.Provider value={contextValue}>
      <section
        {...props}
        data-scope="wizard"
        data-part="root"
        data-current-step={safeStep}
        data-total-steps={totalSteps}
        data-complete={isComplete ? 'true' : undefined}
        style={
          {
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: vars.spacing.gap.stack.md,
            ...(vars.text.body.md as React.CSSProperties),
          } as React.CSSProperties
        }
      >
        {activeStep}
        {classified.navigation}
        {classified.unknown}
      </section>
    </wizardScope.Provider>
  );
};
Wizard.displayName = wizardMeta.displayName;

// ---------------------------------------------------------------------------
// WizardStep — a single step's body (Structure/content, composition='step')
// ---------------------------------------------------------------------------

/**
 * Formal semantic identity — a step body inside a {@link Wizard}.
 */
export const wizardStepMeta = {
  displayName: 'WizardStep',
  entity: 'Structure',
  structure: 'content',
  composition: 'step',
} as const satisfies ComponentMeta<'Structure'>;

/**
 * Props for {@link WizardStep}.
 */
export interface WizardStepProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'style' | 'className'
> {
  /**
   * Optional accessible label for this step (rendered as `aria-label`).
   */
  'aria-label'?: string;
  /** Step body — freeform content (fields, descriptions, media). */
  children?: React.ReactNode;
}

/**
 * A single step's body inside a Wizard. Only the step at the current
 * index is rendered — selection is the Wizard host's runtime dispatch
 * on this component's fixed `composition` identity.
 */
const WizardStepBase = (props: WizardStepProps) => {
  wizardScope.use(wizardStepMeta.displayName);
  return (
    <div
      {...props}
      data-scope="wizard"
      data-part="content"
      data-composition="step"
      style={
        {
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: vars.spacing.gap.stack.sm,
        } as React.CSSProperties
      }
    />
  );
};
WizardStepBase.displayName = wizardStepMeta.displayName;

export const WizardStep = defineWizardSlot(WizardStepBase, 'step');

// ---------------------------------------------------------------------------
// WizardSummary — terminal/summary view (Structure/content, composition='summary')
// ---------------------------------------------------------------------------

/**
 * Formal semantic identity — summary view shown after the last step.
 */
export const wizardSummaryMeta = {
  displayName: 'WizardSummary',
  entity: 'Structure',
  structure: 'content',
  composition: 'summary',
} as const satisfies ComponentMeta<'Structure'>;

/**
 * Props for {@link WizardSummary}.
 */
export type WizardSummaryProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'style' | 'className'
>;

/**
 * A summary view shown once the user has advanced past the last
 * {@link WizardStep}. Selection is the Wizard host's runtime dispatch on
 * this component's fixed `composition` identity — rendered if and only if
 * `currentStep === totalSteps`.
 */
const WizardSummaryBase = (props: WizardSummaryProps) => {
  wizardScope.use(wizardSummaryMeta.displayName);
  return (
    <div
      {...props}
      data-scope="wizard"
      data-part="content"
      data-composition="summary"
      style={
        {
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: vars.spacing.gap.stack.sm,
        } as React.CSSProperties
      }
    />
  );
};
WizardSummaryBase.displayName = wizardSummaryMeta.displayName;

export const WizardSummary = defineWizardSlot(WizardSummaryBase, 'summary');

// ---------------------------------------------------------------------------
// WizardNavigation — prev/next/finish row (Structure/actions, composition='navigation')
// ---------------------------------------------------------------------------

/**
 * Formal semantic identity — the navigation slot inside a {@link Wizard}.
 */
export const wizardNavigationMeta = {
  displayName: 'WizardNavigation',
  entity: 'Structure',
  structure: 'actions',
  composition: 'navigation',
} as const satisfies ComponentMeta<'Structure'>;

/**
 * Props for {@link WizardNavigation}.
 */
export interface WizardNavigationProps {
  /** Label for the "previous step" button. @default 'Back' */
  prevLabel?: React.ReactNode;
  /** Label for the "next step" button. @default 'Next' */
  nextLabel?: React.ReactNode;
  /** Label for the final-step button. @default 'Finish' */
  finishLabel?: React.ReactNode;
  /**
   * Fires when the user advances past the last step (first click of
   * `Finish`). The Wizard host transitions to the `isComplete` state
   * and renders the {@link WizardSummary} if one is provided.
   */
  onFinish?: () => void;
  /**
   * Replace the default button row with a render-prop so the host can
   * compose custom controls while still reading wizard state from the
   * same context (validation gating, async next, etc.).
   */
  children?: (state: WizardState) => React.ReactNode;
}

/**
 * Default navigation row for a {@link Wizard}. Reads wizard state from
 * React context — rendering is otherwise deterministic: `Back` is
 * disabled on the first step; the primary button switches label from
 * `Next` to `Finish` on the last step and fires `onFinish` before
 * advancing.
 */
const WizardNavigationBase = ({
  prevLabel = 'Back',
  nextLabel = 'Next',
  finishLabel = 'Finish',
  onFinish,
  children,
}: WizardNavigationProps) => {
  const ctx = wizardScope.use(wizardNavigationMeta.displayName);

  const content = children ? (
    children(ctx)
  ) : (
    <>
      <Button
        evaluation="muted"
        onPress={ctx.goPrev}
        isDisabled={ctx.isFirst || ctx.isComplete}
      >
        {prevLabel}
      </Button>
      <Button
        evaluation="primary"
        composition="primaryAction"
        consequence={ctx.isLast ? 'committing' : 'neutral'}
        isDisabled={ctx.isComplete}
        onPress={() => {
          if (ctx.isLast) onFinish?.();
          ctx.goNext();
        }}
      >
        {ctx.isLast ? finishLabel : nextLabel}
      </Button>
    </>
  );

  return (
    <div
      data-scope="wizard"
      data-part="actions"
      data-composition="navigation"
      style={
        {
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: vars.spacing.gap.inline.md,
          marginBlockStart: vars.spacing.gap.stack.sm,
        } as React.CSSProperties
      }
    >
      {content}
    </div>
  );
};
WizardNavigationBase.displayName = wizardNavigationMeta.displayName;

export const WizardNavigation = defineWizardSlot(
  WizardNavigationBase,
  'navigation'
);
