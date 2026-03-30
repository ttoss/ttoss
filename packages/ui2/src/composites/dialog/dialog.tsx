import {
  Dialog as ArkDialog,
  type DialogContentProps as ArkDialogContentProps,
  type DialogRootProps,
  type DialogTriggerProps as ArkDialogTriggerProps,
} from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import * as React from 'react';

import { cn } from '../../_shared/cn';

/**
 * Props for the Dialog component.
 *
 * Responsibility: Overlay
 * Host: SurfaceFrame (title, description, body, actions)
 * Semantic tokens: content.primary.*, elevation.modal
 */
export interface DialogProps extends ArkDialogContentProps {
  /** Dialog title (rendered as heading). */
  title?: string;
  /** Dialog description text. */
  description?: string;
  /** Whether to show the close button. @default true */
  showClose?: boolean;
}

/**
 * Props for the DialogTrigger component.
 */
export type DialogTriggerProps = ArkDialogTriggerProps;

/**
 * Props for the DialogBody component.
 *
 * SurfaceFrame.body — main content area of the dialog.
 */
export type DialogBodyProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Props for the DialogFooter component.
 *
 * Host: ActionSet — groups action buttons with semantic roles.
 * Children should be Button components whose variants map to ActionSet roles:
 *   - variant="solid"   → ActionSet.primary
 *   - variant="outline" → ActionSet.secondary
 *   - variant="ghost"   → ActionSet.dismiss
 */
export type DialogFooterProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Accessible modal dialog built on Ark UI.
 *
 * Responsibility: **Overlay** — temporary layered UI above the interface.
 * Host: **SurfaceFrame** — structured surface with heading, body, and actions.
 *
 * @example
 * ```tsx
 * <Dialog.Root>
 *   <Dialog.Trigger>Open</Dialog.Trigger>
 *   <Dialog.Content title="Confirm" description="Are you sure?">
 *     <Dialog.Body>
 *       <p>Your changes will be lost if you don't save.</p>
 *     </Dialog.Body>
 *     <Dialog.Footer>
 *       <Button variant="ghost">Discard</Button>
 *       <Button variant="outline">Back</Button>
 *       <Button variant="solid">Save</Button>
 *     </Dialog.Footer>
 *   </Dialog.Content>
 * </Dialog.Root>
 * ```
 */
const DialogRoot = (props: DialogRootProps) => {
  return <ArkDialog.Root {...props} />;
};

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <ArkDialog.Trigger
        ref={ref}
        className={cn('ui2-dialog__trigger', className)}
        {...props}
      >
        {children}
      </ArkDialog.Trigger>
    );
  }
);
DialogTrigger.displayName = 'Dialog.Trigger';

const DialogContent = React.forwardRef<HTMLDivElement, DialogProps>(
  (
    { title, description, children, showClose = true, className, ...props },
    ref
  ) => {
    return (
      <Portal>
        <ArkDialog.Backdrop className="ui2-dialog__backdrop" />
        <ArkDialog.Positioner className="ui2-dialog__positioner">
          <ArkDialog.Content
            ref={ref}
            className={cn('ui2-dialog__content', className)}
            {...props}
          >
            {title && (
              <ArkDialog.Title className="ui2-dialog__title">
                {title}
              </ArkDialog.Title>
            )}
            {description && (
              <ArkDialog.Description className="ui2-dialog__description">
                {description}
              </ArkDialog.Description>
            )}
            {children}
            {showClose && (
              <ArkDialog.CloseTrigger className="ui2-dialog__close-trigger">
                ✕
              </ArkDialog.CloseTrigger>
            )}
          </ArkDialog.Content>
        </ArkDialog.Positioner>
      </Portal>
    );
  }
);
DialogContent.displayName = 'Dialog.Content';

/**
 * Dialog body — wraps the main content area.
 *
 * SurfaceFrame.body: color: content.primary, textStyle: body.md
 */
const DialogBody = React.forwardRef<HTMLDivElement, DialogBodyProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('ui2-dialog__body', className)} {...props} />
    );
  }
);
DialogBody.displayName = 'Dialog.Body';

/**
 * Dialog footer — ActionSet host for action buttons.
 *
 * Composition: ActionSet
 * Button children map to ActionSet roles via their variant:
 *   - variant="solid"   → ActionSet.primary   (action.primary tokens)
 *   - variant="outline" → ActionSet.secondary  (action.secondary tokens)
 *   - variant="ghost"   → ActionSet.dismiss    (action.muted tokens)
 */
const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('ui2-dialog__footer', className)}
        {...props}
      />
    );
  }
);
DialogFooter.displayName = 'Dialog.Footer';

export const Dialog = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Content: DialogContent,
  Body: DialogBody,
  Footer: DialogFooter,
};
