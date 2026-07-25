import { vars } from '@ttoss/fsl-theme/vars';
import * as React from 'react';
import {
  Button as RACButton,
  type ButtonProps as RACButtonProps,
} from 'react-aria-components';

import type {
  ComponentMeta,
  CompositionsFor,
  ConsequencesFor,
  EvaluationsFor,
} from '../../semantics';
import { FOCUS_RING_OFFSET, focusRingOutline } from '../../tokens/focusRing';
import { ICON_SLOT_STYLE } from '../../tokens/iconSlot';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';
// Type-only import: Button must never pull the Icon implementation (and with
// it the whole glyph registry) into a consumer that only ever renders text —
// the package's tree-shaking guarantee (README, ADR-006) depends on it. The
// caller passes a real `<Icon>` element; the type keeps the intent vocabulary
// enforced (anything without an `intent` prop fails to compile).
import type { IconProps } from '../Icon';

/**
 * Formal semantic identity — what this component *is* (Layer 1).
 */
export const buttonMeta = {
  displayName: 'Button',
  entity: 'Action',
  structure: 'root',
} as const satisfies ComponentMeta<'Action'>;

/**
 * Where the icon sits relative to the label. Both placements are legal
 * `icon` structural roles on Action — the choice is semantic, not decorative:
 *
 * - `leading` (default) — the glyph *reinforces* the command ("Delete" with a
 *   trash glyph). This is the common case.
 * - `trailing` — the glyph *announces what follows* the press: a disclosure
 *   chevron, an external-link arrow, a "next step" direction. Reach for it
 *   only when the glyph describes the consequence, not the action itself.
 */
export type ButtonIconPlacement = 'leading' | 'trailing';

/**
 * Button props *except* the labelling contract — the reusable half.
 *
 * Composites that always render a visible label (e.g. `FormSubmit`) extend
 * this and declare `children` themselves, instead of carrying the
 * icon-only branch of `ButtonProps` they can never take.
 */
export interface ButtonOwnProps extends Omit<
  RACButtonProps,
  'style' | 'children' | 'aria-label'
> {
  /**
   * Semantic emphasis.
   * @default 'primary'
   */
  evaluation?: EvaluationsFor<(typeof buttonMeta)['entity']>;
  /**
   * Effect on state this button's action produces. Emitted as
   * `data-consequence` on the DOM so host integrations (confirm wrappers,
   * telemetry, undo/redo hooks) and tests can observe the contract.
   *
   * NOT used for coloring — visual distinction (if any) is a theme /
   * host-CSS concern, matching the same contract as `MenuItem`.
   *
   * @default 'neutral'
   */
  consequence?: ConsequencesFor<(typeof buttonMeta)['entity']>;
  /**
   * Slot this button occupies inside a parent composite (FSL §4).
   * Emitted as `data-composition` on the DOM and consumed at runtime by
   * composites that need to reorder or style actions by role — notably
   * `DialogActions`, which reorders children per platform convention
   * (iOS vs Windows).
   *
   * Orthogonal to `evaluation` (authorial voice) and `consequence`
   * (effect on state): composition is purely *positional* semantics.
   */
  composition?: CompositionsFor<(typeof buttonMeta)['entity']>;
  /**
   * An `<Icon>` element naming the glyph by intent. Button forces the `sm`
   * size step so the glyph reads as a companion to the label, never as the
   * subject — pass the intent, let the button own the scale.
   *
   * Omit `children` to render an **icon-only** button: the control collapses
   * to a square at the `hit` floor and `aria-label` becomes required.
   *
   * @example
   * ```tsx
   * <Button icon={<Icon intent="action.search" />}>Search</Button>
   * ```
   */
  icon?: React.ReactElement<IconProps>;
  /**
   * Which side of the label the `icon` sits on.
   * @default 'leading'
   */
  iconPlacement?: ButtonIconPlacement;
  /**
   * Data scope identifier for the button.
   * @default 'button'
   */
  'data-scope'?: string;
}

/**
 * Labelling contract. A button must be nameable: either it renders a visible
 * label (`children`) or — in the icon-only form — it supplies `aria-label`.
 * The union makes `tsc` enforce it, the same mechanism `ConfirmationDialog`
 * uses for its flow-critical labels (ADR-001).
 */
type ButtonLabellingProps =
  | {
      /** Visible label. */
      children: React.ReactNode;
      /** Accessible name override — optional when a visible label exists. */
      'aria-label'?: string;
    }
  | {
      /** Icon-only button — no visible label. */
      children?: undefined;
      /**
       * Accessible name, required when there is no visible label. Supply it
       * already localized (fsl-ui never depends on an i18n runtime — ADR-001).
       */
      'aria-label': string;
    };

/**
 * Displays a semantic action trigger (entity: Action).
 *
 * Entity = Action → colors: `action`, radii: `action`, border: `outline.control`,
 * sizing: `hit` (ergonomic floor — drives both height and the square
 * minimum width), spacing: `inset.control` (`sm` block / `lg` inline) plus
 * `gap.inline.xs` between glyph and label, typography: `action.md`,
 * motion: `feedback`.
 *
 * Anatomy (`data-part`): `root` · `icon` · `label` — both sub-parts are
 * lawful `icon` / `label` structural roles for Action, so the glyph and the
 * text are observable identities rather than anonymous spans.
 */
export type ButtonProps = ButtonOwnProps & ButtonLabellingProps;

/** The evaluation's color subtree — one row of `vars.colors.action`. */
type ActionColors = (typeof vars.colors.action)[EvaluationsFor<
  (typeof buttonMeta)['entity']
>];

/** React Aria's state flags for a button render callback. */
interface ButtonRenderState {
  isHovered?: boolean;
  isPressed?: boolean;
  isDisabled?: boolean;
  isFocusVisible?: boolean;
}

/**
 * Root style — hoisted out of the render callback so the state cascade stays
 * readable (and so the callback keeps a single responsibility: pass state in).
 */
const buildRootStyle = ({
  colors,
  hasIcon,
  isIconOnly,
  state,
}: {
  colors: ActionColors;
  hasIcon: boolean;
  isIconOnly: boolean;
  state: ButtonRenderState;
}): React.CSSProperties => {
  const { isHovered, isPressed, isDisabled, isFocusVisible } = state;

  return {
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hasIcon ? vars.spacing.gap.inline.xs : undefined,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    // Command silhouette: `radii.action` (pill in the base theme) and
    // `text.action` (semibold) — CTAs read assertive while fields and
    // choice controls stay at the quieter `control`/`label` pair.
    borderRadius: vars.radii.action,
    borderWidth: vars.border.outline.control.width,
    borderStyle: vars.border.outline.control.style,
    minHeight: vars.sizing.hit,
    // The `hit` floor doubles as a square minimum on the inline axis, so a
    // one-glyph or one-character button stays balanced instead of collapsing
    // to its content width (the icon-only form is exactly this square).
    minWidth: vars.sizing.hit,
    // Block padding is intentionally tight (`inset.control.sm`) so the
    // rem-anchored `hit` floor binds and drives height (~32–36px on the
    // desktop); a wider inline inset (`lg`) gives visual breathing (matches
    // MUI/Bootstrap/Tailwind ~1:3 vertical:horizontal ratio). Icon-only drops
    // the inline inset: the square already supplies the breathing room, and
    // padding would push the glyph off-centre.
    paddingBlock: vars.spacing.inset.control.sm,
    paddingInline: isIconOnly ? undefined : vars.spacing.inset.control.lg,
    ...(vars.text.action.md as React.CSSProperties),
    transitionDuration: vars.motion.feedback.duration,
    transitionTimingFunction: vars.motion.feedback.easing,
    transitionProperty: 'background-color, border-color, color',
    backgroundColor: resolveInteractiveStyle(colors?.background, {
      isHovered,
      isPressed,
      isDisabled,
    }),
    borderColor: resolveInteractiveStyle(colors?.border, {
      isDisabled,
      isFocusVisible,
    }),
    color:
      resolveInteractiveStyle(colors?.text, {
        isHovered,
        isPressed,
        isDisabled,
      }) ?? colors?.text?.default,
    outline: focusRingOutline(isFocusVisible),
    outlineOffset: FOCUS_RING_OFFSET,
  } as React.CSSProperties;
};

/**
 * Ordered content of the button: the glyph on its declared side, the label
 * when there is one. Internal (not exported) — its whole job is to keep the
 * placement branching out of `Button` itself.
 *
 * The button owns the glyph scale (`sm`); everything else the caller set on
 * the element — intent, and `label` when the glyph carries meaning — is
 * preserved. The wrapper carries the host scope so the glyph reads as
 * Button's `icon` part (the Select precedent) rather than a nested scope.
 */
const ButtonContent = ({
  dataScope,
  icon,
  iconPlacement,
  children,
}: {
  dataScope: string;
  icon?: React.ReactElement<IconProps>;
  iconPlacement: ButtonIconPlacement;
  children?: React.ReactNode;
}) => {
  const glyph = icon ? (
    <span
      data-scope={dataScope}
      data-part="icon"
      aria-hidden
      style={ICON_SLOT_STYLE}
    >
      {React.cloneElement(icon, { size: 'sm' })}
    </span>
  ) : null;

  return (
    <>
      {iconPlacement === 'leading' && glyph}
      {children !== undefined && (
        <span data-scope={dataScope} data-part="label">
          {children}
        </span>
      )}
      {iconPlacement === 'trailing' && glyph}
    </>
  );
};

/**
 * A semantic action button built on React Aria.
 *
 * @example
 * ```tsx
 * <Button evaluation="accent">Save changes</Button>
 * <Button icon={<Icon intent="action.close" />} evaluation="muted">Dismiss</Button>
 * <Button icon={<Icon intent="disclosure.expand" />} iconPlacement="trailing">
 *   More
 * </Button>
 * <Button icon={<Icon intent="action.close" />} aria-label={closeLabel} />
 * ```
 */
export const Button = ({
  evaluation = 'primary',
  consequence = 'neutral',
  composition,
  icon,
  iconPlacement = 'leading',
  children,
  'data-scope': dataScope = 'button',
  ...props
}: ButtonProps) => {
  const colors = vars.colors.action[evaluation];
  const hasIcon = icon !== undefined;
  const isIconOnly = hasIcon && children === undefined;

  return (
    <RACButton
      {...props}
      data-scope={dataScope}
      data-part="root"
      data-evaluation={evaluation}
      data-consequence={consequence}
      data-composition={composition}
      data-icon-placement={hasIcon ? iconPlacement : undefined}
      style={(state) => {
        return buildRootStyle({
          colors,
          hasIcon,
          isIconOnly,
          state,
        });
      }}
    >
      <ButtonContent
        dataScope={dataScope}
        icon={icon}
        iconPlacement={iconPlacement}
      >
        {children}
      </ButtonContent>
    </RACButton>
  );
};
Button.displayName = buttonMeta.displayName;
