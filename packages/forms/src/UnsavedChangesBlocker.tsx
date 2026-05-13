import { Modal } from '@ttoss/components/Modal';
import { defineMessages, useI18n } from '@ttoss/react-i18n';
import { Button, Card, Flex, Heading, Text } from '@ttoss/ui';
import * as React from 'react';
import { useFormContext } from 'react-hook-form';

const messages = defineMessages({
  title: {
    defaultMessage: 'Discard changes?',
    description: 'Title for the unsaved changes confirmation modal',
  },
  description: {
    defaultMessage:
      'You have unsaved changes. If you leave now, they will be discarded.',
    description: 'Description for the unsaved changes confirmation modal',
  },
  confirm: {
    defaultMessage: 'Discard',
    description:
      'Confirm button label to discard unsaved changes and navigate away',
  },
  cancel: {
    defaultMessage: 'Keep editing',
    description:
      'Cancel button label to stay on the page and keep editing the form',
  },
});

export type BlockerResult = {
  state: string;
  proceed: () => void;
  reset: () => void;
};

export type UseRouterBlockerFn = (shouldBlock: boolean) => BlockerResult;

/**
 * Allows overriding the default copy shown in the unsaved changes modal.
 */
export interface WarnOnUnsavedChangesOptions {
  /** Custom modal title. */
  title?: React.ReactNode;
  /** Custom modal description. */
  description?: React.ReactNode;
  /** Custom confirm button label. */
  confirmLabel?: React.ReactNode;
  /** Custom cancel button label. */
  cancelLabel?: React.ReactNode;
  /**
   * Optional hook used to block in-app navigation for the router in use.
   *
   * Example with React Router: `useRouterBlocker: useBlocker`
   */
  useRouterBlocker?: UseRouterBlockerFn;
}

const UnsavedChangesModal = ({
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel,
  cancelLabel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
} & WarnOnUnsavedChangesOptions) => {
  const {
    intl: { formatMessage },
  } = useI18n();

  return (
    <Modal
      isOpen
      onRequestClose={onCancel}
      style={{
        content: {
          overflow: 'visible',
        },
      }}
    >
      <Card
        sx={{
          boxShadow: 'none',
          alignItems: 'stretch',
          flexDirection: 'column',
          gap: '4',
          minWidth: '300px',
          maxWidth: '480px',
          paddingX: '5',
          paddingY: '5',
        }}
      >
        <Heading as="h3">{title ?? formatMessage(messages.title)}</Heading>
        <Text>{description ?? formatMessage(messages.description)}</Text>
        <Flex sx={{ justifyContent: 'flex-end', gap: '3' }}>
          <Button variant="secondary" type="button" onClick={onCancel}>
            {cancelLabel ?? formatMessage(messages.cancel)}
          </Button>
          <Button variant="primary" type="button" onClick={onConfirm}>
            {confirmLabel ?? formatMessage(messages.confirm)}
          </Button>
        </Flex>
      </Card>
    </Modal>
  );
};

const BeforeUnloadBlocker = ({ isDirty }: { isDirty: boolean }) => {
  React.useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);

    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [isDirty]);

  return null;
};

/**
 * Error boundary that silently catches errors from RouterBlocker
 * (e.g. when the injected blocker hook requires a router context).
 */
class RouterBlockerErrorBoundary extends React.Component<{
  children: React.ReactNode;
}> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

const RouterBlockerInner = ({
  isDirty,
  onBlocked,
  useBlocker,
}: {
  isDirty: boolean;
  onBlocked: (
    blocker: { proceed: () => void; reset: () => void } | null
  ) => void;
  useBlocker: UseRouterBlockerFn;
}) => {
  const blocker = useBlocker(isDirty);

  React.useEffect(() => {
    if (blocker.state === 'blocked') {
      onBlocked({ proceed: blocker.proceed, reset: blocker.reset });
    }
  }, [blocker.state, blocker.proceed, blocker.reset, onBlocked]);

  return null;
};

const RouterBlocker = ({
  isDirty,
  onBlocked,
  useRouterBlocker,
}: {
  isDirty: boolean;
  onBlocked: (
    blocker: { proceed: () => void; reset: () => void } | null
  ) => void;
  useRouterBlocker?: UseRouterBlockerFn;
}) => {
  if (!useRouterBlocker) {
    return null;
  }

  return (
    <RouterBlockerInner
      isDirty={isDirty}
      onBlocked={onBlocked}
      useBlocker={useRouterBlocker}
    />
  );
};

/**
 * Internal component that blocks navigation when a form has unsaved changes.
 *
 * Uses an injected navigation blocker hook to intercept in-app navigation
 * and `beforeunload` to warn on browser refresh / tab close.
 */
export const UnsavedChangesBlocker = ({
  title,
  description,
  confirmLabel,
  cancelLabel,
  useRouterBlocker,
}: WarnOnUnsavedChangesOptions = {}) => {
  const {
    formState: { isDirty },
  } = useFormContext();

  const [pendingBlocker, setPendingBlocker] = React.useState<{
    proceed: () => void;
    reset: () => void;
  } | null>(null);

  const handleBlocked = React.useCallback(
    (blocker: { proceed: () => void; reset: () => void } | null) => {
      setPendingBlocker(blocker);
    },
    []
  );

  return (
    <>
      <RouterBlockerErrorBoundary>
        <RouterBlocker
          isDirty={isDirty}
          onBlocked={handleBlocked}
          useRouterBlocker={useRouterBlocker}
        />
      </RouterBlockerErrorBoundary>
      <BeforeUnloadBlocker isDirty={isDirty} />
      {pendingBlocker && (
        <UnsavedChangesModal
          title={title}
          description={description}
          confirmLabel={confirmLabel}
          cancelLabel={cancelLabel}
          onConfirm={() => {
            pendingBlocker.proceed();
            setPendingBlocker(null);
          }}
          onCancel={() => {
            pendingBlocker.reset();
            setPendingBlocker(null);
          }}
        />
      )}
    </>
  );
};
