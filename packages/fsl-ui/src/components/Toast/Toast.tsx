import { vars } from '@ttoss/fsl-theme/vars';
import * as React from 'react';
import {
  Button as RACButton,
  type QueuedToast,
  Text as RACText,
  type ToastOptions as RACToastOptions,
  type ToastRegionProps as RACToastRegionProps,
  UNSTABLE_Toast as RACToast,
  UNSTABLE_ToastContent as RACToastContent,
  UNSTABLE_ToastQueue as RACToastQueue,
  UNSTABLE_ToastRegion as RACToastRegion,
  UNSTABLE_ToastStateContext as RACToastStateContext,
} from 'react-aria-components';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';
import { buildHostedTriggerStyle } from '../../tokens/hostedTrigger';
import { buildOccludingSurfaceStyle } from '../../tokens/occludingSurface';
import { VALENCE_GLYPH } from '../../tokens/passiveStatus';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';
import { Icon } from '../Icon';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Feedback → CONTRACT.md §1 row:
//   colors: `feedback.{primary|positive|caution|negative}` (uxContext = feedback),
//   radii: `surface`, border: `outline.surface`,
//   sizing: `hit` (close trigger), spacing: `inset.surface`,
//   typography: `title.sm` (title) + `body.md` (description) — the row gained
//     `title` in F-064; before that the pair inverted, a 16px/400 heading over
//     an 18px/400 paragraph,
//   elevation: `raised` — first component in the system to consume it,
//   motion: `transition.{enter,exit}`.
//
// ENTITY_EVALUATION.Feedback = ['primary','positive','caution','negative',
// 'accent'] — no `muted` for this entity; a muted toast would defeat the
// purpose of feedback (demanding the user's attention). `accent` is the
// informative rung P3 Slice 3 added ("in progress", "new", "info"), and it is
// what the reference calls its `info` toast. It is Emphasis, not a valence
// (FSL Lexicon §5) — which costs a toast nothing, because here the colour is a
// filled voice; it is a passive surface that feels the difference (ADR-043).
//
// Every colour this file reads comes from `vars.colors.feedback` — including
// the two triggers it hosts. That is not a stylistic preference: the
// "entity → ux-context alignment" contract test binds a source file's colour
// reads to the entities it declares, and this file declares Feedback only. It
// is also the right answer visually. A toast is a voiced fill, so a control
// sitting on it must be dressed by the surface it sits on; an `action.*`
// trigger would arrive with the page's palette on top of a saturated red.
//
// The consequence is stated once here because it shapes both triggers:
// `FeedbackColorStates` admits `default | focused | disabled` and no more
// (FSL §7 — feedback surfaces are not interactive triggers). So a control
// inside a toast has **no hover or pressed colour to resolve to**; the
// cascade returns the resting value at every pointer state, by design and
// not by omission. ADR-040 records that, and the theme-level gap it implies,
// as friction rather than working around it here.
// ---------------------------------------------------------------------------

/** Formal semantic identity — Toast root (Feedback entity). */
export const toastMeta = {
  displayName: 'Toast',
  entity: 'Feedback',
  structure: 'root',
} as const satisfies ComponentMeta<'Feedback'>;

type FeedbackEvaluation = EvaluationsFor<'Feedback'>;

type FeedbackColors = (typeof vars.colors.feedback)[FeedbackEvaluation];

// Layout constants (CONTRIBUTING §4 layout-literal rule) — toast geometry.
// 240px keeps a short toast from collapsing to its title width; the region
// clamp (420px / viewport minus breathing room) keeps long toasts readable
// without spanning the whole screen.
//
// F-054 (P3 round 4 leftover, closed): the reference's `toast-maximum-width`
// is 336px desktop / 420px mobile, and this shipped the mobile value at every
// viewport with no stated reason — F-047's shape (Tooltip) without F-047's
// recorded rationale. Same rationale, now verified for Toast too: forcing the
// region to 336px in Chromium wraps "Check the build log for details." from
// one line (27px) to two (54px), because our type ladder runs a step larger
// than the reference's (F-021/F-047). 420px is kept deliberately, uniformly.
const TOAST_MIN_WIDTH = '240px';
const TOAST_REGION_MAX_WIDTH = 'min(420px, calc(100vw - 2rem))';

/**
 * Reading-time floor for an auto-dismissing toast, in milliseconds.
 *
 * A toast that leaves before it can be read is a toast that did not report
 * anything, and the caller is the party least able to judge that — it knows
 * the message but not the reader. So the queue clamps rather than trusts:
 * `timeout` is a request for *at least* this long, never for less.
 *
 * 5000 is the reference's own floor (`Math.max(options.timeout, 5000)` in its
 * Toast, citing its "Auto-dismissible" guidance); its web-component line
 * states 6000 and adds 1000 per further 120 words. We take the lower of the
 * two published floors because the clamp is not the whole mechanism here:
 * React Aria pauses every visible toast's timer while the region is hovered
 * or focused (`pauseAll`/`resumeAll` in `useToastRegion`), so 5000 is the
 * floor on *unattended* display, not on reading time. A reader who is looking
 * at the toast keeps it.
 *
 * The interaction with WCAG 2.2.1 (Timing Adjustable) is the same reasoning
 * one step further, and it is why an actionable toast is exempted from
 * auto-dismissal entirely rather than given a longer timeout — see
 * `resolveToastOptions`.
 */
const TOAST_MIN_TIMEOUT = 5000;

// The valence glyph map moved to `src/tokens/passiveStatus.ts` when
// `InlineAlert` resolved an identical one (ADR-042's consolidation rule: a
// styling decision is stated once). The reasoning — why `primary` is
// glyph-less, why `caution` and `negative` share the triangle, and the
// readmission criterion for splitting them — lives there now.
//
// What a toast must NOT take from that module is `resolveValenceInk`: this
// surface is a voiced fill, the fill *is* the voice, and a mark inked from the
// cross-cutting valence ink would state the valence twice (CONTRACT §1.2).

/** Root surface style — raised feedback card chrome. */
const buildToastRootStyle = (c: FeedbackColors): React.CSSProperties => {
  return {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'flex-start',
    gap: vars.spacing.gap.inline.md,
    minWidth: TOAST_MIN_WIDTH,
    // `md`, not the occluding default `xs` (ADR-031): a Toast frames a
    // title + description the way `Dialog` frames prose, not fixed-height
    // rows the way Menu/Select do — the same exception ADR-031 already
    // carves out for Dialog, now stated for Toast too (F-054, closed).
    //
    // The inset stays UNIFORM, and that was measured rather than assumed
    // (F-058). The reference halves its trailing inset (`paddingStart: 16` /
    // `paddingEnd: 8`) because the close trigger's own box already carries
    // breathing room on that edge, and the same effect is real here: in
    // Chromium at 1280px the leading edge sits 37px from the glyph's ink
    // while the trailing edge sits 41.7px from the close trigger's ink — the
    // trailing side reads 4.7px heavier. Stepping the trailing inset down to
    // `inset.surface.sm` was tried and overshoots to 29.7px, 7.3px light. No
    // step on the ladder lands it symmetric, because the correction owed is
    // half the trigger's internal inset and the ladder has no half-step
    // there. 4.7px heavy beats 7.3px light, so the uniform value stays and
    // the residual is filed, not papered over with a literal.
    padding: vars.spacing.inset.surface.md,
    // A toast floats over content, so it owes the same boundary as every
    // other occluding surface (CONTRACT §3.5) — `raised`, not `overlay`: it
    // lifts off the page plane without covering a specific spot. `plain`, not
    // `voiced`: its filled valences keep their fill, which is what the
    // `feedback` role still drives — a Feedback fill is a voice at every
    // evaluation and never publishes (`surfaceScope` bounds).
    ...buildOccludingSurfaceStyle({
      colors: c,
      elevation: 'raised',
      fill: 'plain',
    }),
    color: c?.text?.default,
  };
};

/**
 * Valence-glyph style — the leading status mark.
 *
 * The wrapper declares the **title's own type** and the glyph is asked for
 * `size="text"`. That is Icon's documented optical rule ("pick `text`
 * whenever the glyph sits on the same line as text"): at 1em the drawn ink
 * lands inside the title's cap-height band instead of overhanging its
 * baseline, and because the wrapper's line box is a line of `label.md`, the
 * mark aligns with the title's first line under the root's `flex-start`
 * without a centring wrapper or a hand-tuned offset.
 */
const buildToastGlyphStyle = (): React.CSSProperties => {
  return {
    flexShrink: 0,
    ...(vars.text.label.md as React.CSSProperties),
  } as React.CSSProperties;
};

/**
 * Close-button (closeTrigger) style — icon button, transparent by default.
 * The box is `hostedTrigger`'s `icon` posture; the colours stay this host's
 * (`feedback.*` — see the file header for why `action.*` is not available).
 */
const buildToastCloseTriggerStyle = ({
  c,
  isHovered,
  isPressed,
  isDisabled,
  isFocusVisible,
}: {
  c: FeedbackColors;
  isHovered?: boolean;
  isPressed?: boolean;
  isDisabled?: boolean;
  isFocusVisible?: boolean;
}): React.CSSProperties => {
  const flags = { isHovered, isPressed, isDisabled, isFocusVisible } as const;
  const text = c?.text;
  return buildHostedTriggerStyle({
    posture: 'icon',
    background: resolveInteractiveStyle(c?.background, flags) ?? 'transparent',
    ink: resolveInteractiveStyle(text, flags) ?? text?.default,
    isDisabled,
    isFocusVisible,
  });
};

/**
 * Action-trigger style — the toast's single command, dressed by the surface.
 *
 * An outline silhouette rather than a fill: the toast is already a fill, and
 * a second one inside it would compete with the surface it sits on. The edge
 * and the ink are both `text.default` — the same neutral the title is set in,
 * so the trigger reads as part of the message's own voice and inherits its
 * measured contrast against every valence (each fill clears AA Normal against
 * `neutral.0`; see the theme's `feedback` block). The reference reaches the
 * same silhouette through a `staticColor="white"` escape; ours falls out of
 * the surface's palette, so no static-colour concept is needed.
 *
 * `text.action.md` (semibold), not the title's `label.md` (regular): the
 * weight-contrast rhythm P3 Slice 3 set for command triggers, which also
 * keeps a one-word command from reading as a second title.
 *
 * `background` resolves through the cascade to the toast's own fill rather
 * than to a literal `transparent` — the F-024 shape, an untokenised "paint
 * nothing" no contrast audit can see (the argument `EMBEDDED_TRIGGER` makes
 * at length). Here it is also simply true: the trigger's interior *is* the
 * toast.
 *
 * The box is `hostedTrigger`'s `outlined` posture. Renamed from the
 * `buildActionTriggerStyle` this file shipped with, which deliberately
 * name-collided with the `ActionTrigger` anatomy's export of the same name —
 * this one is the toast's, dressed by the toast.
 */
const buildToastActionTriggerStyle = ({
  c,
  isHovered,
  isPressed,
  isDisabled,
  isFocusVisible,
}: {
  c: FeedbackColors;
  isHovered?: boolean;
  isPressed?: boolean;
  isDisabled?: boolean;
  isFocusVisible?: boolean;
}): React.CSSProperties => {
  const flags = { isHovered, isPressed, isDisabled, isFocusVisible } as const;
  const text = c?.text;
  const ink = resolveInteractiveStyle(text, flags) ?? text?.default;
  return buildHostedTriggerStyle({
    posture: 'outlined',
    background: resolveInteractiveStyle(c?.background, flags),
    ink,
    isDisabled,
    isFocusVisible,
  });
};

/** Formal semantic identity — ToastRegion (Feedback entity, root host). */
export const toastRegionMeta = {
  displayName: 'ToastRegion',
  entity: 'Feedback',
  structure: 'root',
} as const satisfies ComponentMeta<'Feedback'>;

// ---------------------------------------------------------------------------
// ToastContent — the payload carried on the queue
//
// The queue stores `ToastContent` objects so that the `ToastRegion` renderer
// can map them into `<Toast>` surfaces. The `evaluation` travels with the
// content: each individual toast chooses its own valence.
// ---------------------------------------------------------------------------

/** The payload each toast carries on the queue. */
export interface ToastContent {
  /** Short heading for the toast. */
  title: React.ReactNode;
  /** Optional longer description. */
  description?: React.ReactNode;
  /**
   * Authorial valence. Feedback toasts encode meaning through color.
   * @default 'primary'
   */
  evaluation?: EvaluationsFor<'Feedback'>;
  /**
   * Label for the toast's single action — "Undo", "Retry", "View".
   *
   * Caller-supplied and caller-localized (ADR-001): this package ships no
   * i18n runtime and will not put untranslated English on a button. Omit it
   * and the toast reports without offering, which is the common case.
   *
   * Supplying it changes the toast's dismissal contract — an actionable toast
   * never auto-dismisses. See `resolveToastOptions`.
   */
  actionLabel?: string;
  /**
   * Invoked when the action is pressed. Required in practice whenever
   * `actionLabel` is set — a labelled button that does nothing is worse than
   * no button — but kept optional so a caller can render the label while the
   * handler is still being wired.
   */
  onAction?: () => void;
  /**
   * Whether pressing the action also dismisses the toast.
   *
   * Defaults to `true`, which is where this diverges from the reference (it
   * defaults to `false` and asks callers to opt in). Acting on a report ends
   * the report: the user has answered, and leaving the toast on screen asks
   * them to dismiss the same message twice. Pass `false` for an action whose
   * result the toast should keep narrating.
   *
   * @default true
   */
  shouldCloseOnAction?: boolean;
}

// ---------------------------------------------------------------------------
// createToastQueue — typed alias over RAC's UNSTABLE_ToastQueue
// ---------------------------------------------------------------------------

/**
 * The dismissal contract, resolved once per `add` so it cannot be forgotten
 * at a call site.
 *
 * Two rules, in order:
 *
 * 1. **An actionable toast never auto-dismisses.** WCAG 2.2.1 governs time
 *    limits on interaction, and an offer that expires on a timer is exactly
 *    that — the user cannot press "Undo" after it has gone. The reference
 *    draws the same line. This overrides an explicit `timeout`, which is the
 *    one place the queue refuses what the caller asked for: the alternative
 *    is a call site that silently ships a broken affordance.
 * 2. **Otherwise a supplied timeout is a floor, not a value.** Clamped to
 *    `TOAST_MIN_TIMEOUT`. An omitted timeout still means "stays until
 *    dismissed" — the clamp raises short timeouts, it never invents one.
 *
 * Named rather than inlined into `add` so the rule reads as one thing with
 * one docblock; the unit suite asserts it through `createToastQueue`, where
 * a caller can observe it.
 */
export const resolveToastOptions = (
  content: ToastContent,
  options?: RACToastOptions
): RACToastOptions | undefined => {
  if (content.actionLabel !== undefined) {
    return { ...options, timeout: undefined };
  }

  if (options?.timeout === undefined) {
    return options;
  }

  return { ...options, timeout: Math.max(options.timeout, TOAST_MIN_TIMEOUT) };
};

/**
 * The queue `createToastQueue` returns — React Aria's, with this package's
 * dismissal contract applied on the way in.
 *
 * Subclassing rather than wrapping keeps the object a real `ToastQueue`:
 * `ToastRegion` reads more of its surface than `add` (the state hook
 * subscribes to it), so a façade exposing only the methods we thought of
 * would break the first time React Aria reached for one we did not.
 */
class FslToastQueue extends RACToastQueue<ToastContent> {
  add(content: ToastContent, options?: RACToastOptions): string {
    return super.add(content, resolveToastOptions(content, options));
  }
}

/**
 * Factory for a typed toast queue. Call once (typically at module scope of
 * your app) and pass the result to `<ToastRegion queue={queue} />`.
 *
 * The queue enforces the dismissal contract described in
 * `resolveToastOptions`: a supplied `timeout` is raised to at least 5s, and a
 * toast carrying an `actionLabel` never auto-dismisses.
 *
 * @example
 * ```tsx
 * import { createToastQueue } from '@ttoss/fsl-ui';
 *
 * export const toastQueue = createToastQueue();
 *
 * // Somewhere in your app:
 * toastQueue.add(
 *   { title: 'Saved', description: 'Your changes are live.', evaluation: 'positive' },
 *   { timeout: 5000 }
 * );
 *
 * // Actionable — stays until the user answers it:
 * toastQueue.add({
 *   title: 'Message archived',
 *   actionLabel: undoLabel,
 *   onAction: restoreMessage,
 * });
 * ```
 */
export const createToastQueue = (options?: {
  maxVisibleToasts?: number;
}): RACToastQueue<ToastContent> => {
  return new FslToastQueue(options);
};

/** Re-exported type of the queue produced by `createToastQueue`. */
export type ToastQueue = RACToastQueue<ToastContent>;

// ---------------------------------------------------------------------------
// Toast — a single notification surface
// ---------------------------------------------------------------------------

/**
 * Props for the Toast component.
 */
export interface ToastProps {
  /** The queued toast supplied by the `ToastRegion` render callback. */
  toast: QueuedToast<ToastContent>;
}

/**
 * A single Feedback toast surface. Renders a valence glyph, `title`,
 * `description`, an optional single action, and a dismiss button.
 *
 * This component is rendered by `ToastRegion` for each queued item — you
 * rarely instantiate it directly. Use `createToastQueue` + `queue.add(...)`
 * in application code, and place a single `<ToastRegion />` at the root.
 *
 * The announced region is the message alone: React Aria puts `role="alert"`
 * on the content, so the title and description are what assistive technology
 * reads. The action sits outside it — a live region should announce what
 * happened, not read a button label as part of the sentence.
 */
export const Toast = ({ toast }: ToastProps) => {
  const evaluation = toast.content.evaluation ?? 'primary';
  const c = vars.colors.feedback[evaluation];
  const textColor = c?.text?.default;
  const glyph = VALENCE_GLYPH[evaluation];
  const { actionLabel, onAction, shouldCloseOnAction = true } = toast.content;
  // `QueuedToast` carries no `close()` — dismissal lives on the region's
  // state, which is how React Aria wires the close button's own `onPress`
  // (`useToast` returns `state.close(key)`). The action reaches the same
  // state instead of duplicating the queue's bookkeeping. This is the fifth
  // `UNSTABLE_` export the component consumes; the ADR-003 canary lists it.
  const state = React.useContext(RACToastStateContext);

  return (
    <RACToast<ToastContent>
      toast={toast}
      data-scope="toast"
      data-part="root"
      data-evaluation={evaluation}
      style={buildToastRootStyle(c)}
    >
      {glyph !== undefined && (
        <span
          data-scope="toast"
          data-part="glyph"
          style={buildToastGlyphStyle()}
        >
          <Icon intent={glyph} size="text" />
        </span>
      )}

      <div
        data-scope="toast"
        data-part="content"
        style={
          {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            // A step above the message's own internal gap, and the step is
            // the point: title and description are one utterance, so they sit
            // at `xs`; the action is a different kind of thing and reads as
            // part of the sentence at that distance. Verified in Chromium —
            // at `xs` the button crowds the title on a description-less
            // toast, which is the common actionable shape ("Undo").
            gap: vars.spacing.gap.stack.sm,
            minWidth: 0,
          } as React.CSSProperties
        }
      >
        <RACToastContent
          data-scope="toast"
          data-part="message"
          style={
            {
              display: 'flex',
              flexDirection: 'column',
              gap: vars.spacing.gap.stack.xs,
              minWidth: 0,
            } as React.CSSProperties
          }
        >
          <RACText
            slot="title"
            data-scope="toast"
            data-part="title"
            style={
              {
                // `title.sm`, not the `label.md` ADR-040 shipped. Measured in
                // Chromium: that pair typed a 16px/400 title over an 18px/400
                // description — the title smaller AND no heavier than the prose
                // it introduces. The cause was the §1 row, not this component
                // (F-064): `Feedback` could name a `title` part but not type
                // one, and `label.*` has no step that outranks `body.md`.
                ...(vars.text.title.sm as React.CSSProperties),
                color: textColor,
              } as React.CSSProperties
            }
          >
            {toast.content.title}
          </RACText>
          {toast.content.description !== undefined && (
            <RACText
              slot="description"
              data-scope="toast"
              data-part="body"
              style={
                {
                  ...(vars.text.body.md as React.CSSProperties),
                  color: textColor,
                } as React.CSSProperties
              }
            >
              {toast.content.description}
            </RACText>
          )}
        </RACToastContent>

        {actionLabel !== undefined && (
          <RACButton
            data-scope="toast"
            data-part="actionTrigger"
            onPress={() => {
              onAction?.();
              if (shouldCloseOnAction) {
                state?.close(toast.key);
              }
            }}
            style={({ isHovered, isPressed, isDisabled, isFocusVisible }) => {
              return buildToastActionTriggerStyle({
                c,
                isHovered,
                isPressed,
                isDisabled,
                isFocusVisible,
              });
            }}
          >
            {actionLabel}
          </RACButton>
        )}
      </div>

      <RACButton
        slot="close"
        data-scope="toast"
        data-part="closeTrigger"
        style={({ isHovered, isPressed, isDisabled, isFocusVisible }) => {
          return buildToastCloseTriggerStyle({
            c,
            isHovered,
            isPressed,
            isDisabled,
            isFocusVisible,
          });
        }}
      >
        <Icon intent="action.close" size="sm" />
      </RACButton>
    </RACToast>
  );
};
Toast.displayName = toastMeta.displayName;

// ---------------------------------------------------------------------------
// ToastRegion — the host that renders the queue
// ---------------------------------------------------------------------------

/**
 * Props for the ToastRegion component.
 */
export type ToastRegionProps = Omit<
  RACToastRegionProps<ToastContent>,
  'children' | 'style' | 'className'
>;

/**
 * The Toast host — place once near the root of your app and pass the queue
 * created with `createToastQueue`. Renders each queued toast as a
 * `Toast` surface.
 *
 * Uses `vars.elevation.raised` — the first component in the system that
 * lifts off the page plane without being a full overlay.
 *
 * Placement is the theme's decision and not a prop (CONTRACT §4): a product
 * whose toasts appear bottom-end on one screen and top-center on the next is
 * a product with two notification systems. The reference exposes four
 * placements; ours ships the one, at the trailing bottom corner, where a
 * transient report is furthest from the content the user is reading and from
 * the primary actions they are reaching for.
 *
 * @example
 * ```tsx
 * <ToastRegion queue={toastQueue} />
 * ```
 */
export const ToastRegion = (props: ToastRegionProps) => {
  return (
    <RACToastRegion<ToastContent>
      {...props}
      data-scope="toast-region"
      data-part="root"
      style={
        {
          boxSizing: 'border-box',
          position: 'fixed',
          insetBlockEnd: vars.spacing.inset.surface.md,
          insetInlineEnd: vars.spacing.inset.surface.md,
          display: 'flex',
          flexDirection: 'column',
          gap: vars.spacing.gap.stack.sm,
          zIndex: vars.zIndex.layer.transient,
          maxWidth: TOAST_REGION_MAX_WIDTH,
          outline: 'none',
        } as React.CSSProperties
      }
    >
      {({ toast }) => {
        return <Toast toast={toast} />;
      }}
    </RACToastRegion>
  );
};
ToastRegion.displayName = toastRegionMeta.displayName;
