import { vars } from '@ttoss/fsl-theme/vars';
import * as React from 'react';
import {
  Dialog as RACDialog,
  type DialogProps as RACDialogProps,
  DialogTrigger as RACDialogTrigger,
  type DialogTriggerProps as RACDialogTriggerProps,
  Heading as RACHeading,
  Modal as RACModal,
  ModalOverlay as RACModalOverlay,
  type ModalOverlayProps as RACModalOverlayProps,
} from 'react-aria-components';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';
import { createPresenceScope } from '../scope';

// ---------------------------------------------------------------------------
// Composite scope — presence-only guard.
//
// `Dialog` (the surface) is the host. `DialogHeading`, `DialogBody`, and
// `DialogActions` assert this scope at render time; rendered outside a
// `<Dialog>` they throw with a clear message instead of silently producing
// an unmounted heading or detached actions row.
//
// `DialogModal` is intentionally *not* scoped — it is a low-level wrapper
// that React Aria itself constrains (must live under `DialogTrigger`).
// ---------------------------------------------------------------------------

const dialogScope = createPresenceScope('Dialog');

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
// ---------------------------------------------------------------------------

/**
 * Formal semantic identity — what this component *is* (Layer 1).
 *
 * Entity = Overlay → CONTRACT.md §1 row:
 *   colors: `informational`, radii: `surface`, border: `outline.surface`,
 *   sizing: — (none), spacing: `inset.surface`, typography: `title + body + label`,
 *   motion: `transition`, elevation: `overlay`.
 */
export const dialogMeta = {
  displayName: 'Dialog',
  entity: 'Overlay',
  structure: 'root',
} as const satisfies ComponentMeta<'Overlay'>;

// ---------------------------------------------------------------------------
// DialogTrigger — orchestrator (pass-through, no tokens)
//
// DialogTrigger renders no DOM of its own — it is a pure React Aria
// orchestrator that wires open/close state. Intentionally has no
// *Meta export (ComponentMeta describes a rendered structural part;
// orchestrators have none).
// ---------------------------------------------------------------------------

/**
 * Orchestrates open/close state between a trigger and a Dialog.
 * Pure pass-through to React Aria — no semantic tokens applied.
 */
export const DialogTrigger = (props: RACDialogTriggerProps) => {
  return <RACDialogTrigger {...props} />;
};
DialogTrigger.displayName = 'DialogTrigger';

// ---------------------------------------------------------------------------
// Dialog — the content surface (Overlay entity, root part)
// ---------------------------------------------------------------------------

/**
 * Props for the Dialog content surface.
 *
 * The composite owns its layout; pass `style`/`className` on a wrapping
 * element rather than on the composite root. See CONTRIBUTING §4.
 */
export interface DialogProps extends Omit<
  RACDialogProps,
  'style' | 'className'
> {
  /**
   * Semantic emphasis.
   * @default 'primary'
   */
  evaluation?: EvaluationsFor<(typeof dialogMeta)['entity']>;
}

/**
 * A semantic overlay dialog surface built on React Aria.
 *
 * This component renders the Dialog content area — the surface that holds
 * title, body, and actions. It must be placed inside a `DialogModal`.
 *
 * Entity = Overlay → colors: `informational`, radii: `surface`,
 * border: `outline.surface`, spacing: `inset.surface.md`,
 * typography: `title.md`, `body.md`, `label.md`.
 */
export const Dialog = ({
  evaluation = 'primary',
  'data-scope': dataScope = 'dialog',
  children,
  ...props
}: DialogProps) => {
  const colors = vars.colors.informational[evaluation];

  return (
    <RACDialog
      {...props}
      data-scope={dataScope}
      data-part="root"
      data-evaluation={evaluation}
      style={
        {
          boxSizing: 'border-box',
          outline: 'none',
          padding: vars.spacing.inset.surface.md,
          color: colors?.text?.default,
        } as React.CSSProperties
      }
    >
      {(state) => {
        return (
          <dialogScope.Provider>
            {typeof children === 'function' ? children(state) : children}
          </dialogScope.Provider>
        );
      }}
    </RACDialog>
  );
};
Dialog.displayName = dialogMeta.displayName;

// ---------------------------------------------------------------------------
// DialogModal — modal surface (backdrop + positioner + surface)
//
// Composes ModalOverlay (backdrop) + Modal (surface) from React Aria.
// The ModalOverlay is the backdrop structural part.
// The Modal is the surface structural part (positioning + elevation + radii).
// ---------------------------------------------------------------------------

/**
 * Formal semantic identity for the DialogModal wrapper.
 *
 * DialogModal composes two DOM roots: a backdrop (ModalOverlay) and a
 * surface (Modal). `structure` reflects the *semantically meaningful* part
 * — the surface carries the evaluation tokens, radii, border, elevation,
 * and is what a consumer styles. The backdrop is pure infrastructure (a
 * scrim + positioner) and is not modeled as a separate component.
 */
export const dialogModalMeta = {
  displayName: 'DialogModal',
  entity: 'Overlay',
  structure: 'surface',
} as const satisfies ComponentMeta<'Overlay'>;

/**
 * Props for the DialogModal wrapper.
 */
export interface DialogModalProps extends Omit<
  RACModalOverlayProps,
  'style' | 'className'
> {
  /**
   * Semantic emphasis for the surface colors.
   * @default 'primary'
   */
  evaluation?: EvaluationsFor<(typeof dialogMeta)['entity']>;
}

/**
 * A modal wrapper that renders a scrim backdrop and a positioned surface.
 *
 * Combines React Aria's ModalOverlay (backdrop) and Modal (surface)
 * with semantic tokens from CONTRACT.md §1 (Entity = Overlay).
 *
 * @example
 * ```tsx
 * <DialogTrigger>
 *   <Button>Open</Button>
 *   <DialogModal>
 *     <Dialog>
 *       <DialogHeading>Title</DialogHeading>
 *       <p>Body content here.</p>
 *     </Dialog>
 *   </DialogModal>
 * </DialogTrigger>
 * ```
 */
export const DialogModal = ({
  evaluation = 'primary',
  children,
  ...props
}: DialogModalProps) => {
  const colors = vars.colors.informational[evaluation];

  return (
    <RACModalOverlay
      {...props}
      data-scope="dialog"
      data-part="backdrop"
      style={({ isEntering, isExiting }) => {
        return {
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: vars.zIndex.layer.blocking,
          backgroundColor: vars.overlay.scrim,
          transition:
            isEntering || isExiting
              ? `opacity ${vars.motion.transition[isEntering ? 'enter' : 'exit'].duration} ${vars.motion.transition[isEntering ? 'enter' : 'exit'].easing}`
              : undefined,
          opacity: isExiting ? 0 : 1,
        } as React.CSSProperties;
      }}
    >
      <RACModal
        data-scope="dialog"
        data-part="surface"
        data-evaluation={evaluation}
        style={({ isEntering, isExiting }) => {
          return {
            boxSizing: 'border-box',
            maxWidth: 'min(500px, 90vw)',
            maxHeight: '90vh',
            overflow: 'auto',
            borderRadius: vars.radii.surface,
            borderWidth: vars.border.outline.surface.width,
            borderStyle: vars.border.outline.surface.style,
            borderColor: colors?.border?.default,
            boxShadow: vars.elevation.surface.overlay,
            backgroundColor: colors?.background?.default,
            outline: 'none',
            transition:
              isEntering || isExiting
                ? `transform ${vars.motion.transition[isEntering ? 'enter' : 'exit'].duration} ${vars.motion.transition[isEntering ? 'enter' : 'exit'].easing}, opacity ${vars.motion.transition[isEntering ? 'enter' : 'exit'].duration} ${vars.motion.transition[isEntering ? 'enter' : 'exit'].easing}`
                : undefined,
            transform: isEntering
              ? 'scale(0.95)'
              : isExiting
                ? 'scale(0.95)'
                : 'scale(1)',
            opacity: isEntering || isExiting ? 0 : 1,
          } as React.CSSProperties;
        }}
      >
        {children}
      </RACModal>
    </RACModalOverlay>
  );
};
DialogModal.displayName = 'DialogModal';

// ---------------------------------------------------------------------------
// DialogHeading — title structural part
// ---------------------------------------------------------------------------

/**
 * Formal semantic identity — heading slot inside Dialog (FSL §4).
 */
export const dialogHeadingMeta = {
  displayName: 'DialogHeading',
  entity: 'Overlay',
  structure: 'title',
  composition: 'heading',
} as const satisfies ComponentMeta<'Overlay'>;

/**
 * Props for the DialogHeading component.
 */
export interface DialogHeadingProps extends Omit<
  React.HTMLAttributes<HTMLHeadingElement>,
  'style' | 'className'
> {
  /**
   * HTML heading level.
   * @default 2
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * The title part of a Dialog, using `title.md` typography tokens.
 * Wired to React Aria's `slot="title"` for accessibility.
 *
 * Must be rendered inside a `<Dialog>` — throws otherwise.
 */
export const DialogHeading = ({ level = 2, ...props }: DialogHeadingProps) => {
  dialogScope.use(dialogHeadingMeta.displayName);
  return (
    <RACHeading
      slot="title"
      level={level}
      {...props}
      data-scope="dialog"
      data-part="title"
      style={{
        margin: 0,
        ...(vars.text.title.md as React.CSSProperties),
      }}
    />
  );
};
DialogHeading.displayName = dialogHeadingMeta.displayName;

// ---------------------------------------------------------------------------
// DialogBody — body structural part
// ---------------------------------------------------------------------------

/**
 * Formal semantic identity — body slot inside Dialog (FSL §4).
 */
export const dialogBodyMeta = {
  displayName: 'DialogBody',
  entity: 'Overlay',
  structure: 'body',
  composition: 'body',
} as const satisfies ComponentMeta<'Overlay'>;

/**
 * Props for the DialogBody component.
 */
export type DialogBodyProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'style' | 'className'
>;

/**
 * The body content area of a Dialog, using `body.md` typography tokens.
 *
 * Must be rendered inside a `<Dialog>` — throws otherwise.
 */
export const DialogBody = (props: DialogBodyProps) => {
  dialogScope.use(dialogBodyMeta.displayName);
  return (
    <div
      {...props}
      data-scope="dialog"
      data-part="body"
      style={{
        ...(vars.text.body.md as React.CSSProperties),
        marginBlockStart: vars.spacing.gap.stack.md,
      }}
    />
  );
};
DialogBody.displayName = dialogBodyMeta.displayName;

// ---------------------------------------------------------------------------
// DialogActions — actions structural part
//
// This is a slot *container* — its children (Buttons) carry the composition
// roles (primaryAction / secondaryAction / dismissAction). The container
// itself has no composition role; it is the `actions` structural slot of
// the parent Overlay.
// ---------------------------------------------------------------------------

/**
 * Formal semantic identity — actions slot container inside Dialog.
 */
export const dialogActionsMeta = {
  displayName: 'DialogActions',
  entity: 'Overlay',
  structure: 'actions',
} as const satisfies ComponentMeta<'Overlay'>;

/**
 * Platform convention for action-button ordering inside `DialogActions`.
 *
 * - `ios` (macOS / iOS / Web default) — cancel (`dismissAction`) on the
 *   left, confirm (`primaryAction`) on the right. Matches Apple HIG and
 *   most web design systems.
 * - `windows` — confirm (`primaryAction`) on the left, cancel
 *   (`dismissAction`) on the right. Matches the Windows/Fluent convention.
 */
export type DialogActionsPlatform = 'ios' | 'windows';

/**
 * Logical positions for each action composition role, per platform.
 * Lower number = closer to the start of the flex row (left, when LTR).
 *
 * `justifyContent: 'flex-end'` pushes the row to the right; the platform
 * mapping controls the *relative* order of actions within that row.
 */
const ACTION_ORDER: Record<DialogActionsPlatform, Record<string, number>> = {
  ios: {
    dismissAction: 0,
    secondaryAction: 1,
    primaryAction: 2,
  },
  windows: {
    primaryAction: 0,
    secondaryAction: 1,
    dismissAction: 2,
  },
};

/** Unknown / unclassified children preserve their source order after the ranked ones. */
const UNRANKED = Number.POSITIVE_INFINITY;

const getChildComposition = (child: React.ReactNode): string | undefined => {
  if (!React.isValidElement(child)) return undefined;
  const props = child.props as { composition?: unknown };
  return typeof props.composition === 'string' ? props.composition : undefined;
};

/**
 * Props for the DialogActions component.
 */
export interface DialogActionsProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'style' | 'className'
> {
  /**
   * Platform convention for ordering action children by their
   * `composition` prop. Children without a `composition` keep their
   * source order after the ranked ones.
   *
   * @default 'ios'
   */
  platform?: DialogActionsPlatform;
}

/**
 * The actions area of a Dialog (buttons, links).
 *
 * Runtime behavior: sorts children by their `composition` prop per the
 * selected `platform` convention — this is what makes `composition` a
 * behavior-driving FSL dimension and not mere decoration.
 *
 * @example
 * ```tsx
 * // Defaults to iOS: Cancel | Save
 * <DialogActions>
 *   <Button composition="dismissAction" slot="close">Cancel</Button>
 *   <Button composition="primaryAction">Save</Button>
 * </DialogActions>
 *
 * // Windows convention: Save | Cancel
 * <DialogActions platform="windows">
 *   <Button composition="dismissAction" slot="close">Cancel</Button>
 *   <Button composition="primaryAction">Save</Button>
 * </DialogActions>
 * ```
 */
export const DialogActions = ({
  platform = 'ios',
  children,
  ...props
}: DialogActionsProps) => {
  dialogScope.use(dialogActionsMeta.displayName);
  const table = ACTION_ORDER[platform];

  const sorted = React.Children.toArray(children)
    .map((child, index) => {
      const composition = getChildComposition(child);
      const rank =
        composition !== undefined ? (table[composition] ?? UNRANKED) : UNRANKED;
      return { child, rank, index };
    })
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.index - b.index;
    })
    .map(({ child }) => {
      return child;
    });

  return (
    <div
      {...props}
      data-scope="dialog"
      data-part="actions"
      data-platform={platform}
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: vars.spacing.gap.inline.md,
        marginBlockStart: vars.spacing.gap.stack.lg,
      }}
    >
      {sorted}
    </div>
  );
};
DialogActions.displayName = dialogActionsMeta.displayName;
