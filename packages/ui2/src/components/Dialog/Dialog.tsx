import { vars } from '@ttoss/theme2/vars';
import type * as React from 'react';
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

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
// ---------------------------------------------------------------------------

/**
 * Formal semantic identity — what this component *is* (Layer 1).
 *
 * Entity = Overlay → CONTRACT.md §1 row:
 *   colors: `content`, radii: `surface`, border: `outline.surface`,
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
 */
export interface DialogProps extends Omit<RACDialogProps, 'style'> {
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
export const Dialog = ({ evaluation = 'primary', ...props }: DialogProps) => {
  const colors = vars.colors.informational[evaluation];

  return (
    <RACDialog
      {...props}
      data-scope="dialog"
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
    />
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
          backgroundColor: vars.colors.overlay.scrim,
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
  'style'
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
 */
export const DialogHeading = ({ level = 2, ...props }: DialogHeadingProps) => {
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
DialogHeading.displayName = 'DialogHeading';

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
  'style'
>;

/**
 * The body content area of a Dialog, using `body.md` typography tokens.
 */
export const DialogBody = (props: DialogBodyProps) => {
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
DialogBody.displayName = 'DialogBody';

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
 * Props for the DialogActions component.
 */
export type DialogActionsProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'style'
>;

/**
 * The actions area of a Dialog (buttons, links).
 * Renders as a flex row with gap using gap.inline tokens.
 */
export const DialogActions = (props: DialogActionsProps) => {
  return (
    <div
      {...props}
      data-scope="dialog"
      data-part="actions"
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: vars.spacing.gap.inline.md,
        marginBlockStart: vars.spacing.gap.stack.lg,
      }}
    />
  );
};
DialogActions.displayName = 'DialogActions';
