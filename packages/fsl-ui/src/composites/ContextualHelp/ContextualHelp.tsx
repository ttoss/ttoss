import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import { Dialog as RACDialog } from 'react-aria-components';

import {
  ActionButton,
  type ActionButtonOwnProps,
} from '../../components/ActionButton/ActionButton';
import { Icon } from '../../components/Icon';
import type { ComponentMeta } from '../../semantics';
import { Popover, PopoverTrigger } from '../Popover/Popover';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Action → the identity a caller reaches for is the *trigger*: the
// small ⓘ beside a field's label that reveals explanatory content. The surface
// it opens keeps its own identity (`Popover`, an Overlay) — one meta, two
// composed identities, the `ActionMenu` precedent verbatim.
//
// The rendered root is the button, re-scoped to `contextual-help` through
// `ActionButton`'s documented `data-scope` override.
// ---------------------------------------------------------------------------

/** Formal semantic identity — ContextualHelp trigger (Action entity). */
export const contextualHelpMeta = {
  displayName: 'ContextualHelp',
  entity: 'Action',
  structure: 'root',
} as const satisfies ComponentMeta<'Action'>;

// The reference names a minimum for this surface (`contextual-help-minimum-
// width: 268px`): explanatory copy a sentence long should wrap as a paragraph,
// not as a ribbon. Layout constant per CONTRIBUTING §4; the Popover's own
// `--fsl-popover-max-width` knob still caps it.
const CONTENT_MIN_WIDTH = '16.75rem';

/**
 * Props for the ContextualHelp composite.
 *
 * Deliberately a **narrow** surface over the two components it composes: the
 * open state, the placement, and the trigger's emphasis. Anything past that is
 * a sign the caller wants a different trigger or a different surface — compose
 * `PopoverTrigger` + `ActionButton` + `Popover` directly then.
 */
export interface ContextualHelpProps {
  /**
   * Accessible name for the trigger — **required**, and supplied already
   * localized (fsl-ui never depends on an i18n runtime, ADR-001).
   *
   * There is no default: the reference system falls back to a translated
   * "Help", which it can because it ships an i18n runtime. Ours cannot, and an
   * unnamed icon-only trigger is announced as just "button".
   */
  'aria-label': string;
  /**
   * The explanatory content. Free-form on purpose: a heading plus a short
   * paragraph is the common shape (`Heading` + `Text`), but the surface does
   * not police it.
   */
  children: React.ReactNode;
  /**
   * Semantic emphasis of the trigger. `muted` is the default — a help glyph
   * beside a label is ambient by definition and should materialise on hover.
   * Read F-024's caveat first: the quiet rung's resting fill is the *page*
   * surface (the owner-ruled "always paint" posture), so on a raised dark
   * surface it shows as a patch until the stratum-aware value lands.
   *
   * @default 'muted'
   */
  evaluation?: ActionButtonOwnProps['evaluation'];
  /** Whether the trigger is disabled. */
  isDisabled?: boolean;
  /** Whether the popover is open (controlled). */
  isOpen?: boolean;
  /** Whether the popover is open by default (uncontrolled). */
  defaultOpen?: boolean;
  /** Handler called when the popover's open state changes. */
  onOpenChange?: (isOpen: boolean) => void;
  /**
   * Where the popover anchors relative to the trigger.
   * @default 'bottom start'
   */
  placement?: React.ComponentProps<typeof Popover>['placement'];
}

/**
 * Contextual help: a small `action.help` trigger that reveals explanatory
 * content in an anchored popover — the ⓘ beside a field's label.
 *
 * Composes `PopoverTrigger` + an icon-only `ActionButton` + `Popover`, with
 * the content wrapped in a bare dialog so focus moves into the surface and
 * Escape/outside-click dismiss it (React Aria's own pattern for rich popover
 * content).
 *
 * Why it is a component rather than a documented composition: the affordance
 * is a *convention*. The glyph must be the help glyph (`action.help`), the
 * trigger must be the utility icon-only square with an accessible name, and
 * the surface must be a dialog — left to each call site, all three drift
 * (the `ActionMenu` rationale, one affordance over).
 *
 * Reach for it when the explanation is too long for a `description` line and
 * matters too rarely to spend the space permanently. A one-line constraint
 * belongs in `description`; what a field's value *does* belongs here.
 *
 * Entity = Action (the trigger); the surface keeps `Popover`'s Overlay
 * identity. The trigger renders `data-scope="contextual-help"`.
 *
 * @example
 * ```tsx
 * <TextField
 *   label="Region"
 *   contextualHelp={
 *     <ContextualHelp aria-label={aboutRegionLabel}>
 *       <Heading level={2} size="title-sm">Choosing a region</Heading>
 *       <Text>Deploys run in this region. Changing it migrates data.</Text>
 *     </ContextualHelp>
 *   }
 * />
 * ```
 */
export const ContextualHelp = ({
  'aria-label': ariaLabel,
  children,
  evaluation = 'muted',
  isDisabled,
  isOpen,
  defaultOpen,
  onOpenChange,
  placement = 'bottom start',
}: ContextualHelpProps) => {
  return (
    <PopoverTrigger
      isOpen={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <ActionButton
        aria-label={ariaLabel}
        data-scope="contextual-help"
        evaluation={evaluation}
        icon={<Icon intent="action.help" />}
        isDisabled={isDisabled}
        // Opt out of any ambient RAC ButtonContext. Found by the class guard:
        // inside a NumberField the context demands a slot ("increment" or
        // "decrement") from every RAC Button in the subtree, and the help
        // trigger is neither — `slot={null}` is RAC's documented refusal.
        slot={null}
      />
      <Popover placement={placement}>
        {/* Bare (unstyled) dialog: the Popover paints the surface chrome, the
            dialog contributes the role and focus containment. `aria-label`
            names the surface with the same words that name the trigger. */}
        <RACDialog
          aria-label={ariaLabel}
          data-scope="contextual-help"
          data-part="content"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: vars.spacing.gap.stack.xs,
            minInlineSize: CONTENT_MIN_WIDTH,
            outline: 'none',
          }}
        >
          {children}
        </RACDialog>
      </Popover>
    </PopoverTrigger>
  );
};
ContextualHelp.displayName = contextualHelpMeta.displayName;
