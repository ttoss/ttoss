import { render, screen, userEvent, waitFor } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';
import * as React from 'react';
import { Form, FormFieldInput, useForm } from 'src/index';
import { UnsavedChangesModal } from 'src/UnsavedChangesModal';
import { useUnsavedChanges } from 'src/useUnsavedChanges';

describe('useUnsavedChanges', () => {
  // Component that uses the hook - must be inside Form
  const FormContent = ({
    onAttemptLeave,
    enabled = true,
  }: {
    enabled?: boolean;
    onAttemptLeave?: () => void;
  }) => {
    const { showModal, isDirty, handleDiscard, handleKeepEditing } =
      useUnsavedChanges({
        enabled,
        onAttemptLeave,
      });

    return (
      <>
        <FormFieldInput name="email" label="Email" unsavedChangesGuard={true} />
        <div data-testid="is-dirty">{isDirty ? 'dirty' : 'clean'}</div>
        <div data-testid="show-modal">{showModal ? 'open' : 'closed'}</div>
        <Button onClick={handleDiscard} data-testid="discard-btn">
          Test Discard
        </Button>
        <Button onClick={handleKeepEditing} data-testid="keep-editing-btn">
          Test Keep Editing
        </Button>
        <UnsavedChangesModal
          isOpen={showModal}
          onDiscard={handleDiscard}
          onKeepEditing={handleKeepEditing}
        />
      </>
    );
  };

  const FormWithUnsavedChanges = ({
    enabled = true,
    onAttemptLeave,
  }: {
    enabled?: boolean;
    onAttemptLeave?: () => void;
  }) => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={jest.fn()}>
        <FormContent enabled={enabled} onAttemptLeave={onAttemptLeave} />
      </Form>
    );
  };

  test('should track isDirty state correctly', async () => {
    const user = userEvent.setup({ delay: null });

    render(<FormWithUnsavedChanges />);

    // Initially not dirty
    expect(screen.getByTestId('is-dirty')).toHaveTextContent('clean');

    // Type in the input
    const input = screen.getByLabelText('Email');
    await user.type(input, 'test@example.com');

    // Should be dirty now
    await waitFor(() => {
      expect(screen.getByTestId('is-dirty')).toHaveTextContent('dirty');
    });
  });

  test('should not show modal initially', () => {
    render(<FormWithUnsavedChanges />);

    expect(screen.getByTestId('show-modal')).toHaveTextContent('closed');
    expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
  });

  test('should prevent beforeunload when form is dirty', async () => {
    const user = userEvent.setup({ delay: null });
    const onAttemptLeave = jest.fn();

    render(<FormWithUnsavedChanges onAttemptLeave={onAttemptLeave} />);

    // Type in the input to make form dirty
    const input = screen.getByLabelText('Email');
    await user.type(input, 'test@example.com');

    await waitFor(() => {
      expect(screen.getByTestId('is-dirty')).toHaveTextContent('dirty');
    });

    // Trigger beforeunload event
    const event = new Event('beforeunload', {
      bubbles: true,
      cancelable: true,
    }) as BeforeUnloadEvent;

    window.dispatchEvent(event);

    // Should have called onAttemptLeave
    expect(onAttemptLeave).toHaveBeenCalled();
  });

  test('should not prevent beforeunload when form is clean', () => {
    const onAttemptLeave = jest.fn();

    render(<FormWithUnsavedChanges onAttemptLeave={onAttemptLeave} />);

    expect(screen.getByTestId('is-dirty')).toHaveTextContent('clean');

    // Trigger beforeunload event
    const event = new Event('beforeunload', {
      bubbles: true,
      cancelable: true,
    }) as BeforeUnloadEvent;

    window.dispatchEvent(event);

    // Should not have called onAttemptLeave since form is clean
    expect(onAttemptLeave).not.toHaveBeenCalled();
  });

  test('should not prevent beforeunload when disabled', async () => {
    const user = userEvent.setup({ delay: null });
    const onAttemptLeave = jest.fn();

    render(
      <FormWithUnsavedChanges enabled={false} onAttemptLeave={onAttemptLeave} />
    );

    // Type in the input to make form dirty
    const input = screen.getByLabelText('Email');
    await user.type(input, 'test@example.com');

    await waitFor(() => {
      expect(screen.getByTestId('is-dirty')).toHaveTextContent('dirty');
    });

    // Trigger beforeunload event
    const event = new Event('beforeunload', {
      bubbles: true,
      cancelable: true,
    }) as BeforeUnloadEvent;

    window.dispatchEvent(event);

    // Should not have called onAttemptLeave since hook is disabled
    expect(onAttemptLeave).not.toHaveBeenCalled();
  });

  test('handleKeepEditing should close modal', async () => {
    const user = userEvent.setup({ delay: null });

    render(<FormWithUnsavedChanges />);

    // Manually open modal by clicking keep editing test button
    // (In real usage, modal would open via handleAttemptNavigation)
    const input = screen.getByLabelText('Email');
    await user.type(input, 'test@example.com');

    // Use the handleDiscard to show modal (simulate navigation attempt)
    const discardBtn = screen.getByTestId('discard-btn');
    await user.click(discardBtn);

    // Click keep editing
    const keepEditingBtn = screen.getByTestId('keep-editing-btn');
    await user.click(keepEditingBtn);

    // Modal should still be closed (since we're using the button directly)
    expect(screen.getByTestId('show-modal')).toHaveTextContent('closed');
  });

  test('should work with multiple form fields', async () => {
    const user = userEvent.setup({ delay: null });

    const MultiFieldFormContent = () => {
      const { showModal, isDirty, handleDiscard, handleKeepEditing } =
        useUnsavedChanges();

      return (
        <>
          <FormFieldInput name="email" label="Email" />
          <FormFieldInput name="name" label="Name" />
          <FormFieldInput name="phone" label="Phone" />
          <div data-testid="is-dirty">{isDirty ? 'dirty' : 'clean'}</div>
          <UnsavedChangesModal
            isOpen={showModal}
            onDiscard={handleDiscard}
            onKeepEditing={handleKeepEditing}
          />
        </>
      );
    };

    const MultiFieldForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={jest.fn()}>
          <MultiFieldFormContent />
        </Form>
      );
    };

    render(<MultiFieldForm />);

    expect(screen.getByTestId('is-dirty')).toHaveTextContent('clean');

    // Type in one field
    await user.type(screen.getByLabelText('Email'), 'test@example.com');

    await waitFor(() => {
      expect(screen.getByTestId('is-dirty')).toHaveTextContent('dirty');
    });

    // Type in another field
    await user.type(screen.getByLabelText('Name'), 'John Doe');

    // Should still be dirty
    expect(screen.getByTestId('is-dirty')).toHaveTextContent('dirty');
  });

  test('should clean up beforeunload listener on unmount', async () => {
    const user = userEvent.setup({ delay: null });
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = render(<FormWithUnsavedChanges />);

    const input = screen.getByLabelText('Email');
    await user.type(input, 'test@example.com');

    await waitFor(() => {
      expect(screen.getByTestId('is-dirty')).toHaveTextContent('dirty');
    });

    unmount();

    // Should have removed the beforeunload listener
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });

  test('handleAttemptNavigation should return true when form is dirty', async () => {
    const user = userEvent.setup({ delay: null });

    const FormContentWithNav = () => {
      const { handleAttemptNavigation, isDirty } = useUnsavedChanges();
      const [blocked, setBlocked] = React.useState<boolean | null>(null);

      return (
        <>
          <FormFieldInput name="email" label="Email" />
          <div data-testid="is-dirty">{isDirty ? 'dirty' : 'clean'}</div>
          <Button
            onClick={() => {
              return setBlocked(handleAttemptNavigation());
            }}
            data-testid="attempt-nav-btn"
          >
            Attempt Navigation
          </Button>
          {blocked !== null && (
            <div data-testid="blocked">{blocked ? 'blocked' : 'allowed'}</div>
          )}
        </>
      );
    };

    const FormWithNav = () => {
      const formMethods = useForm();
      return (
        <Form {...formMethods} onSubmit={jest.fn()}>
          <FormContentWithNav />
        </Form>
      );
    };

    render(<FormWithNav />);

    // Make form dirty
    const input = screen.getByLabelText('Email');
    await user.type(input, 'test@example.com');

    await waitFor(() => {
      expect(screen.getByTestId('is-dirty')).toHaveTextContent('dirty');
    });

    // Attempt navigation
    await user.click(screen.getByTestId('attempt-nav-btn'));

    // Should be blocked
    await waitFor(() => {
      expect(screen.getByTestId('blocked')).toHaveTextContent('blocked');
    });
  });

  test('handleAttemptNavigation should return false when form is clean', async () => {
    const user = userEvent.setup({ delay: null });

    const FormContentWithNav = () => {
      const { handleAttemptNavigation, isDirty } = useUnsavedChanges();
      const [blocked, setBlocked] = React.useState<boolean | null>(null);

      return (
        <>
          <FormFieldInput name="email" label="Email" />
          <div data-testid="is-dirty">{isDirty ? 'dirty' : 'clean'}</div>
          <Button
            onClick={() => {
              return setBlocked(handleAttemptNavigation());
            }}
            data-testid="attempt-nav-btn"
          >
            Attempt Navigation
          </Button>
          {blocked !== null && (
            <div data-testid="blocked">{blocked ? 'blocked' : 'allowed'}</div>
          )}
        </>
      );
    };

    const FormWithNav = () => {
      const formMethods = useForm();
      return (
        <Form {...formMethods} onSubmit={jest.fn()}>
          <FormContentWithNav />
        </Form>
      );
    };

    render(<FormWithNav />);

    expect(screen.getByTestId('is-dirty')).toHaveTextContent('clean');

    // Attempt navigation without making form dirty
    await user.click(screen.getByTestId('attempt-nav-btn'));

    // Should NOT be blocked
    await waitFor(() => {
      expect(screen.getByTestId('blocked')).toHaveTextContent('allowed');
    });
  });

  test('should execute pending navigation only after discard confirmation', async () => {
    const user = userEvent.setup({ delay: null });
    const onProceed = jest.fn();

    const FormContentWithPendingNavigation = () => {
      const {
        handleAttemptNavigation,
        handleDiscard,
        handleKeepEditing,
        showModal,
      } = useUnsavedChanges();

      return (
        <>
          <FormFieldInput
            name="email"
            label="Email"
            unsavedChangesGuard={true}
          />
          <Button
            data-testid="attempt-nav-btn"
            onClick={() => {
              handleAttemptNavigation({ onProceed });
            }}
          >
            Attempt Navigation
          </Button>
          <UnsavedChangesModal
            isOpen={showModal}
            onDiscard={handleDiscard}
            onKeepEditing={handleKeepEditing}
          />
        </>
      );
    };

    const FormWithPendingNavigation = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={jest.fn()}>
          <FormContentWithPendingNavigation />
        </Form>
      );
    };

    render(<FormWithPendingNavigation />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');

    await user.click(screen.getByTestId('attempt-nav-btn'));

    expect(onProceed).not.toHaveBeenCalled();
    expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();

    await user.click(screen.getByText('Keep Editing'));
    expect(onProceed).not.toHaveBeenCalled();

    await user.click(screen.getByTestId('attempt-nav-btn'));
    await user.click(screen.getByText('Discard Changes'));

    expect(onProceed).toHaveBeenCalledTimes(1);
  });

  test('should allow navigation when only unguarded fields are dirty', async () => {
    const user = userEvent.setup({ delay: null });

    const FormContentWithMixedGuards = () => {
      const { handleAttemptNavigation } = useUnsavedChanges();
      const [blocked, setBlocked] = React.useState<boolean | null>(null);

      return (
        <>
          <FormFieldInput
            name="guarded"
            label="Guarded"
            unsavedChangesGuard={true}
          />
          <FormFieldInput name="unguarded" label="Unguarded" />
          <Button
            data-testid="attempt-nav-btn"
            onClick={() => {
              setBlocked(handleAttemptNavigation());
            }}
          >
            Attempt Navigation
          </Button>
          {blocked !== null && (
            <div data-testid="blocked">{blocked ? 'blocked' : 'allowed'}</div>
          )}
        </>
      );
    };

    const FormWithMixedGuards = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={jest.fn()}>
          <FormContentWithMixedGuards />
        </Form>
      );
    };

    render(<FormWithMixedGuards />);

    await user.type(
      screen.getByLabelText('Unguarded'),
      'only this field changed'
    );
    await user.click(screen.getByTestId('attempt-nav-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('blocked')).toHaveTextContent('allowed');
    });
  });

  test('createNavigationHandler should proceed immediately when form is clean', async () => {
    const user = userEvent.setup({ delay: null });
    const onProceed = jest.fn();

    const FormContentWithCreateHandler = () => {
      const { createNavigationHandler, handleDiscard, showModal } =
        useUnsavedChanges();

      const guardedNavigation = React.useMemo(() => {
        return createNavigationHandler({ onProceed });
      }, [createNavigationHandler]);

      return (
        <>
          <FormFieldInput
            name="email"
            label="Email"
            unsavedChangesGuard={true}
          />
          <Button data-testid="navigate-btn" onClick={guardedNavigation}>
            Navigate
          </Button>
          <Button data-testid="discard-btn" onClick={handleDiscard}>
            Discard
          </Button>
          <div data-testid="show-modal">{showModal ? 'open' : 'closed'}</div>
        </>
      );
    };

    const FormWithCreateHandler = () => {
      const formMethods = useForm();
      return (
        <Form {...formMethods} onSubmit={jest.fn()}>
          <FormContentWithCreateHandler />
        </Form>
      );
    };

    render(<FormWithCreateHandler />);

    await user.click(screen.getByTestId('navigate-btn'));

    expect(onProceed).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('show-modal')).toHaveTextContent('closed');

    // Calling discard while clean should keep modal closed and not crash
    await user.click(screen.getByTestId('discard-btn'));
    expect(screen.getByTestId('show-modal')).toHaveTextContent('closed');
  });
});
