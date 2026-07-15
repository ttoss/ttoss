import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Button as RACButton,
  type QueuedToast,
  Text as RACText,
  type ToastRegionProps as RACToastRegionProps,
  UNSTABLE_Toast as RACToast,
  UNSTABLE_ToastContent as RACToastContent,
  UNSTABLE_ToastQueue as RACToastQueue,
  UNSTABLE_ToastRegion as RACToastRegion,
} from 'react-aria-components';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';
import { focusRingOutline } from '../../tokens/focusRing';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Feedback → CONTRACT.md §1 row:
//   colors: `feedback.{primary|positive|caution|negative}` (uxContext = feedback),
//   radii: `surface`, border: `outline.surface`,
//   sizing: `hit.base` (close trigger), spacing: `inset.surface`,
//   typography: `label.md` (title) + `body.md` (description),
//   elevation: `raised` — first component in the system to consume it,
//   motion: `transition.{enter,exit}`.
//
// ENTITY_EVALUATION.Feedback = ['primary','positive','caution','negative'] —
// no `muted` for this entity; a muted toast would defeat the purpose of
// feedback (demanding the user's attention).
// ---------------------------------------------------------------------------

/** Formal semantic identity — Toast root (Feedback entity). */
export const toastMeta = {
  displayName: 'Toast',
  entity: 'Feedback',
  structure: 'root',
} as const satisfies ComponentMeta<'Feedback'>;

type FeedbackColors = (typeof vars.colors.feedback)[EvaluationsFor<'Feedback'>];

// Layout constants (CONTRIBUTING §4 layout-literal rule) — toast geometry.
// 240px keeps a short toast from collapsing to its title width; the region
// clamp (420px / viewport minus breathing room) keeps long toasts readable
// without spanning the whole screen.
const TOAST_MIN_WIDTH = '240px';
const TOAST_REGION_MAX_WIDTH = 'min(420px, calc(100vw - 2rem))';

/** Root surface style — raised feedback card chrome. */
const buildToastRootStyle = (c: FeedbackColors): React.CSSProperties => {
  return {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'flex-start',
    gap: vars.spacing.gap.inline.md,
    minWidth: TOAST_MIN_WIDTH,
    padding: vars.spacing.inset.surface.md,
    borderRadius: vars.radii.surface,
    borderWidth: vars.border.outline.surface.width,
    borderStyle: vars.border.outline.surface.style,
    borderColor: c?.border?.default,
    backgroundColor: c?.background?.default,
    color: c?.text?.default,
    boxShadow: vars.elevation.surface.raised,
    outline: 'none',
  };
};

/** Close-button (closeTrigger) style — icon button, transparent by default. */
const buildCloseTriggerStyle = ({
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
  const text = c?.text ?? {};
  return {
    boxSizing: 'border-box',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: vars.sizing.icon.lg,
    height: vars.sizing.icon.lg,
    padding: 0,
    border: 'none',
    borderRadius: vars.radii.control,
    background: resolveInteractiveStyle(c?.background, flags) ?? 'transparent',
    color: resolveInteractiveStyle(text, flags) ?? text.default,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? vars.opacity.disabled : undefined,
    outline: focusRingOutline(isFocusVisible),
    outlineOffset: '2px',
  };
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
}

// ---------------------------------------------------------------------------
// createToastQueue — typed alias over RAC's UNSTABLE_ToastQueue
// ---------------------------------------------------------------------------

/**
 * Factory for a typed toast queue. Call once (typically at module scope of
 * your app) and pass the result to `<ToastRegion queue={queue} />`.
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
 * ```
 */
export const createToastQueue = (options?: {
  maxVisibleToasts?: number;
}): RACToastQueue<ToastContent> => {
  return new RACToastQueue<ToastContent>(options);
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
 * A single Feedback toast surface. Renders `title`, `description`, and a
 * dismiss button.
 *
 * This component is rendered by `ToastRegion` for each queued item — you
 * rarely instantiate it directly. Use `createToastQueue` + `queue.add(...)`
 * in application code, and place a single `<ToastRegion />` at the root.
 */
export const Toast = ({ toast }: ToastProps) => {
  const evaluation = toast.content.evaluation ?? 'primary';
  const c = vars.colors.feedback[evaluation];
  const textColor = c?.text?.default;

  return (
    <RACToast<ToastContent>
      toast={toast}
      data-scope="toast"
      data-part="root"
      data-evaluation={evaluation}
      style={buildToastRootStyle(c)}
    >
      <RACToastContent
        data-scope="toast"
        data-part="content"
        style={
          {
            flex: 1,
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
              ...(vars.text.label.md as React.CSSProperties),
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

      <RACButton
        slot="close"
        data-scope="toast"
        data-part="closeTrigger"
        style={({ isHovered, isPressed, isDisabled, isFocusVisible }) => {
          return buildCloseTriggerStyle({
            c,
            isHovered,
            isPressed,
            isDisabled,
            isFocusVisible,
          });
        }}
      >
        <span aria-hidden>{String.fromCharCode(0x2715) /* ✕ */}</span>
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
