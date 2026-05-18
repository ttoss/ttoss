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

const RouterBlocker = ({
  isDirty,
  onBlocked,
  useRouterBlocker,
}: {
  isDirty: boolean;
  onBlocked: (
    blocker: { proceed: () => void; reset: () => void } | null
  ) => void;
  useRouterBlocker: UseRouterBlockerFn;
}) => {
  const blocker = useRouterBlocker(isDirty);

  React.useEffect(() => {
    if (blocker.state === 'blocked') {
      onBlocked({ proceed: blocker.proceed, reset: blocker.reset });
    }
  }, [blocker.state, blocker.proceed, blocker.reset, onBlocked]);

  return null;
};

/**
 * Internal component that blocks navigation when a form has unsaved changes.
 *
 * In-app navigation blocking is **router-agnostic**: consumers inject a blocker
 * hook via `warnOnUnsavedChanges.useRouterBlocker` (e.g. `useBlocker` from
 * `react-router-dom`). The hook must be safe to call unconditionally in the
 * current component tree — it is invoked on every render while the form is
 * mounted. If no hook is provided, only the browser `beforeunload` prompt is
 * registered.
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
      {useRouterBlocker && (
        <RouterBlocker
          isDirty={isDirty}
          onBlocked={handleBlocked}
          useRouterBlocker={useRouterBlocker}
        />
      )}
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
