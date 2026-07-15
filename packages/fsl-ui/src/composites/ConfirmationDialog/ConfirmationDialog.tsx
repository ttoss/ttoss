import * as React from 'react';

import { Button } from '../../components/Button/Button';
import type {
  ComponentMeta,
  ConsequencesFor,
  EvaluationsFor,
} from '../../semantics';
import {
  Dialog,
  DialogActions,
  type DialogActionsPlatform,
  DialogBody,
  DialogHeading,
  DialogModal,
  DialogTrigger,
} from '../Dialog/Dialog';

// ---------------------------------------------------------------------------
// ConfirmationDialog — consequence-driven composite (Overlay entity, root)
//
// This is the runtime proof that FSL `Consequence` is behavior-driving and
// not merely cosmetic (CONTRIBUTING §2.3, "Consequence dispatch"). The component reads its authorial
// `consequence` prop at runtime to select the confirm *mechanism*:
//
//   neutral     → single click confirms
//   committing  → single click confirms
//   destructive → first click arms the confirm button; a second click
//                 within `armWindowMs` actually confirms. If the window
//                 expires, arming resets. No separate "requireArming"
//                 boolean exists — flipping `consequence` alone flips the
//                 mechanism, which is what makes Consequence a dimension.
//
// If this composite is deleted and nothing else dispatches on `consequence`,
// the dimension collapses to documented convention and belongs out of
// `ComponentMeta` — the analogue of what DialogActions established for
// `composition` (Pattern A).
// ---------------------------------------------------------------------------

/**
 * Formal semantic identity — ConfirmationDialog root (Overlay entity).
 */
export const confirmationDialogMeta = {
  displayName: 'ConfirmationDialog',
  entity: 'Overlay',
  structure: 'root',
} as const satisfies ComponentMeta<'Overlay'>;

/**
 * Owns the consequence-driven confirm mechanism so the component body stays
 * declarative. `destructive` requires a two-click arm→confirm within
 * `armWindowMs`; everything else confirms on the first click. Toggling
 * `consequence` mid-lifetime resets arming via the render-phase adjustment
 * pattern (no extra commit).
 */
const useArmedConfirm = ({
  consequence,
  onConfirm,
  armWindowMs,
}: {
  consequence: ConsequencesFor<'Action'>;
  onConfirm: () => void;
  armWindowMs: number;
}): {
  isArmed: boolean;
  confirm: (close: () => void) => void;
  reset: () => void;
} => {
  const requiresArming = consequence === 'destructive';
  const [isArmed, setIsArmed] = React.useState(false);
  const armTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearArmTimer = React.useCallback(() => {
    if (armTimerRef.current !== null) {
      clearTimeout(armTimerRef.current);
      armTimerRef.current = null;
    }
  }, []);

  const [prevConsequence, setPrevConsequence] = React.useState(consequence);
  if (prevConsequence !== consequence) {
    setPrevConsequence(consequence);
    setIsArmed(false);
  }

  React.useEffect(() => {
    return () => {
      clearArmTimer();
    };
  }, [clearArmTimer]);

  const reset = React.useCallback(() => {
    clearArmTimer();
    setIsArmed(false);
  }, [clearArmTimer]);

  const arm = React.useCallback(() => {
    setIsArmed(true);
    clearArmTimer();
    armTimerRef.current = setTimeout(() => {
      armTimerRef.current = null;
      setIsArmed(false);
    }, armWindowMs);
  }, [armWindowMs, clearArmTimer]);

  const confirm = (close: () => void): void => {
    const definitive = !requiresArming || isArmed;
    if (!definitive) {
      arm();
      return;
    }
    reset();
    onConfirm();
    close();
  };

  return { isArmed, confirm, reset };
};

interface ConfirmationDialogBaseProps {
  /**
   * The element that opens the dialog. Typically a {@link Button}.
   * React Aria's `DialogTrigger` wires open/close state to it.
   */
  trigger: React.ReactElement;
  /** Heading rendered inside the dialog. */
  title: React.ReactNode;
  /** Body content — usually a short explanation of what will happen. */
  children?: React.ReactNode;
  /**
   * Label for the confirm button. **Required** — flow-critical labels
   * have no English default (CONTRIBUTING §6 / ADR-001); the caller
   * supplies localized copy.
   */
  confirmLabel: React.ReactNode;
  /**
   * Label for the cancel / dismiss button. **Required** — see
   * `confirmLabel`.
   */
  cancelLabel: React.ReactNode;
  /**
   * Semantic emphasis for the confirm button (authorial voice, orthogonal
   * to `consequence`). `destructive` consequence does not imply a
   * `negative` evaluation — color is the author's call.
   * @default 'primary'
   */
  evaluation?: EvaluationsFor<'Action'>;
  /** Called only when confirmation is definitive (after arming, if required). */
  onConfirm: () => void;
  /**
   * Time window (ms) during which the *second* click of a destructive
   * confirmation must land. After expiry, arming resets silently.
   * Ignored for non-destructive consequences.
   * @default 2000
   */
  armWindowMs?: number;
  /**
   * Platform convention forwarded to the underlying {@link DialogActions}.
   * @default 'ios'
   */
  platform?: DialogActionsPlatform;
}

interface ConfirmationDialogDestructiveProps extends ConfirmationDialogBaseProps {
  /**
   * Effect on state the confirm action produces. **Selects the confirm
   * mechanism** (see component-level comment): `destructive` requires a
   * two-click arming protocol; `neutral` / `committing` confirm on the
   * first click.
   */
  consequence: Extract<ConsequencesFor<'Action'>, 'destructive'>;
  /**
   * Label shown on the confirm button while it is *armed* (first click
   * already received, awaiting second). **Required** for `destructive` —
   * it is flow-critical copy the user must be able to read.
   */
  armedLabel: React.ReactNode;
}

interface ConfirmationDialogNonDestructiveProps extends ConfirmationDialogBaseProps {
  /**
   * Effect on state the confirm action produces. `neutral` / `committing`
   * confirm on the first click — no arming protocol.
   * @default 'neutral'
   */
  consequence?: Exclude<ConsequencesFor<'Action'>, 'destructive'>;
  /** Only destructive confirmations have an armed state. */
  armedLabel?: never;
}

/**
 * Props for {@link ConfirmationDialog}. A discriminated union on
 * `consequence`: `destructive` requires `armedLabel`; other consequences
 * forbid it. The type system enforces what the arming mechanism needs.
 */
export type ConfirmationDialogProps =
  | ConfirmationDialogDestructiveProps
  | ConfirmationDialogNonDestructiveProps;

/**
 * A Dialog composite that demands confirmation before invoking a side effect.
 *
 * Reads its `consequence` prop at runtime to select the confirm mechanism —
 * this is what makes `Consequence` a behavior-driving FSL dimension and not
 * decoration. For `destructive`, the confirm button emits
 * `data-arming="true"` while awaiting the second click. (`data-pending` is
 * reserved by React Aria for `isPending`, which also toggles
 * `aria-disabled` — unsuitable here because the armed button must remain
 * clickable for the second press.)
 *
 * @example Single-click commit
 * ```tsx
 * <ConfirmationDialog
 *   trigger={<Button>Publish</Button>}
 *   title="Publish post?"
 *   confirmLabel="Publish"
 *   cancelLabel="Cancel"
 *   consequence="committing"
 *   onConfirm={publish}
 * >
 *   Your post will become visible to everyone.
 * </ConfirmationDialog>
 * ```
 *
 * @example Two-click destructive confirm
 * ```tsx
 * <ConfirmationDialog
 *   trigger={<Button evaluation="negative">Delete account</Button>}
 *   title="Delete account?"
 *   confirmLabel="Delete"
 *   armedLabel="Click again to confirm"
 *   cancelLabel="Cancel"
 *   consequence="destructive"
 *   evaluation="negative"
 *   onConfirm={deleteAccount}
 * >
 *   This action cannot be undone.
 * </ConfirmationDialog>
 * ```
 *
 * @example Visually destructive but single-click (escape-hatch pattern)
 *
 * Use `consequence="committing"` with `evaluation="negative"` when the
 * action is irreversible-looking but does **not** warrant two-click arming
 * (e.g. "Remove from list", "Unsubscribe"). The confirm button renders in
 * the negative color without engaging the arming protocol.
 *
 * ```tsx
 * <ConfirmationDialog
 *   trigger={<Button evaluation="negative">Unsubscribe</Button>}
 *   title="Unsubscribe?"
 *   confirmLabel="Unsubscribe"
 *   cancelLabel="Cancel"
 *   consequence="committing"
 *   evaluation="negative"
 *   onConfirm={unsubscribe}
 * />
 * ```
 */
export const ConfirmationDialog = ({
  trigger,
  title,
  children,
  confirmLabel,
  armedLabel,
  cancelLabel,
  consequence = 'neutral',
  evaluation = 'primary',
  onConfirm,
  armWindowMs = 2000,
  platform = 'ios',
}: ConfirmationDialogProps) => {
  const { isArmed, confirm, reset } = useArmedConfirm({
    consequence,
    onConfirm,
    armWindowMs,
  });

  const currentConfirmLabel =
    consequence === 'destructive' && isArmed ? armedLabel : confirmLabel;

  return (
    <DialogTrigger
      onOpenChange={(open) => {
        // Closing the dialog (ESC, backdrop, Cancel) must not leave an
        // armed state behind for the next open.
        if (!open) reset();
      }}
    >
      {trigger}
      <DialogModal>
        <Dialog data-scope="confirmation-dialog" data-consequence={consequence}>
          {({ close }) => {
            return (
              <>
                <DialogHeading>{title}</DialogHeading>
                {children !== undefined && <DialogBody>{children}</DialogBody>}
                <DialogActions platform={platform}>
                  <Button
                    slot="close"
                    composition="dismissAction"
                    evaluation="muted"
                    onPress={() => {
                      return reset();
                    }}
                  >
                    {cancelLabel}
                  </Button>
                  <Button
                    composition="primaryAction"
                    consequence={consequence}
                    evaluation={evaluation}
                    data-arming={isArmed ? 'true' : undefined}
                    onPress={() => {
                      return confirm(close);
                    }}
                  >
                    {currentConfirmLabel}
                  </Button>
                </DialogActions>
              </>
            );
          }}
        </Dialog>
      </DialogModal>
    </DialogTrigger>
  );
};
ConfirmationDialog.displayName = confirmationDialogMeta.displayName;
