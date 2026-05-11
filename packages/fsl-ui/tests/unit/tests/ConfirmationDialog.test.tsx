/**
 * ConfirmationDialog — runtime consequence-driven confirmation mechanism.
 *
 * These tests are the evidence that the FSL `Consequence` dimension is
 * behavior-driving, not decorative: `ConfirmationDialog` reads its
 * `consequence` prop at runtime and selects the confirm mechanism — single
 * click for `neutral` / `committing`, two-click arming for `destructive`.
 *
 * If this suite is deleted and nothing else dispatches on `consequence`,
 * the dimension collapses to documented convention and belongs out of
 * `ComponentMeta`. See ISSUE.md §2.3.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Button, ConfirmationDialog } from 'src/index';

const openDialog = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Open' }));
};

const getConfirmButton = (label = 'Delete'): HTMLButtonElement => {
  return screen.getByRole('button', { name: label });
};

describe('ConfirmationDialog — consequence-driven mechanism', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('consequence="neutral"', () => {
    test('single click fires onConfirm', () => {
      const onConfirm = jest.fn();
      render(
        <ConfirmationDialog
          trigger={<Button>Open</Button>}
          title="Archive post?"
          confirmLabel="Archive"
          consequence="neutral"
          onConfirm={onConfirm}
        >
          Body
        </ConfirmationDialog>
      );
      openDialog();
      fireEvent.click(getConfirmButton('Archive'));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('consequence="committing"', () => {
    test('single click fires onConfirm', () => {
      const onConfirm = jest.fn();
      render(
        <ConfirmationDialog
          trigger={<Button>Open</Button>}
          title="Publish?"
          confirmLabel="Publish"
          consequence="committing"
          onConfirm={onConfirm}
        >
          Body
        </ConfirmationDialog>
      );
      openDialog();
      fireEvent.click(getConfirmButton('Publish'));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('consequence="destructive"', () => {
    const renderDestructive = (overrides: { armWindowMs?: number } = {}) => {
      const onConfirm = jest.fn();
      const utils = render(
        <ConfirmationDialog
          trigger={<Button>Open</Button>}
          title="Delete?"
          confirmLabel="Delete"
          armedLabel="Click again"
          consequence="destructive"
          onConfirm={onConfirm}
          {...overrides}
        >
          Body
        </ConfirmationDialog>
      );
      return { onConfirm, ...utils };
    };

    test('first click DOES NOT fire onConfirm', () => {
      const { onConfirm } = renderDestructive();
      openDialog();
      fireEvent.click(getConfirmButton('Delete'));
      expect(onConfirm).not.toHaveBeenCalled();
    });

    test('first click arms the button (data-arming="true" + armed label)', () => {
      renderDestructive();
      openDialog();
      fireEvent.click(getConfirmButton('Delete'));
      const armed = screen.getByRole('button', { name: 'Click again' });
      expect(armed.dataset.arming).toBe('true');
    });

    test('second click within window fires onConfirm exactly once', () => {
      const { onConfirm } = renderDestructive();
      openDialog();
      fireEvent.click(getConfirmButton('Delete'));
      fireEvent.click(screen.getByRole('button', { name: 'Click again' }));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    test('arming resets after armWindowMs elapses', () => {
      const { onConfirm } = renderDestructive({ armWindowMs: 500 });
      openDialog();
      fireEvent.click(getConfirmButton('Delete'));
      expect(screen.getByRole('button', { name: 'Click again' })).toBeTruthy();
      act(() => {
        jest.advanceTimersByTime(500);
      });
      // Label reverts to the original confirmLabel; a single subsequent
      // click should not fire (it only re-arms).
      expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
      fireEvent.click(getConfirmButton('Delete'));
      expect(onConfirm).not.toHaveBeenCalled();
    });

    test('pressing Cancel while armed clears arming (no confirm leak)', () => {
      const { onConfirm } = renderDestructive();
      openDialog();
      fireEvent.click(getConfirmButton('Delete'));
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      // Reopen; the button must be in its disarmed state.
      openDialog();
      const reopened = getConfirmButton('Delete');
      expect(reopened.dataset.arming).toBeUndefined();
      fireEvent.click(reopened);
      expect(onConfirm).not.toHaveBeenCalled();
    });

    test('DOM emits data-consequence="destructive" on the confirm button', () => {
      renderDestructive();
      openDialog();
      const confirm = getConfirmButton('Delete');
      expect(confirm.dataset.consequence).toBe('destructive');
    });
  });

  describe('consequence drives mechanism — the core invariant', () => {
    test('flipping consequence alone flips the mechanism', () => {
      const onConfirm = jest.fn();
      const { rerender } = render(
        <ConfirmationDialog
          trigger={<Button>Open</Button>}
          title="Act?"
          confirmLabel="Go"
          consequence="neutral"
          onConfirm={onConfirm}
        />
      );
      openDialog();
      fireEvent.click(getConfirmButton('Go'));
      expect(onConfirm).toHaveBeenCalledTimes(1);

      // Same component instance, same props except `consequence`.
      onConfirm.mockClear();
      rerender(
        <ConfirmationDialog
          trigger={<Button>Open</Button>}
          title="Act?"
          confirmLabel="Go"
          consequence="destructive"
          onConfirm={onConfirm}
        />
      );
      openDialog();
      fireEvent.click(getConfirmButton('Go'));
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });
});
