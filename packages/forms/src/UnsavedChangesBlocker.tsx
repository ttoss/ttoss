import { Modal } from '@ttoss/components/Modal';
import { defineMessages, useI18n } from '@ttoss/react-i18n';
import { Button, Flex, Heading, Text } from '@ttoss/ui';
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

const UnsavedChangesModal = ({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  const {
    intl: { formatMessage },
  } = useI18n();

  return (
    <Modal isOpen ariaHideApp={false} onRequestClose={onCancel}>
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '4',
          minWidth: '300px',
          maxWidth: '480px',
        }}
      >
        <Heading as="h3">{formatMessage(messages.title)}</Heading>
        <Text>{formatMessage(messages.description)}</Text>
        <Flex sx={{ justifyContent: 'flex-end', gap: '3' }}>
          <Button variant="secondary" type="button" onClick={onCancel}>
            {formatMessage(messages.cancel)}
          </Button>
          <Button variant="primary" type="button" onClick={onConfirm}>
            {formatMessage(messages.confirm)}
          </Button>
        </Flex>
      </Flex>
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
 * (e.g. when react-router-dom is not installed or not in a Router context).
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

type BlockerResult = {
  state: string;
  proceed: () => void;
  reset: () => void;
};

type UseBlockerFn = (shouldBlock: boolean) => BlockerResult;

let useBlockerFn: UseBlockerFn | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('react-router-dom') as { useBlocker?: UseBlockerFn };
  if (mod.useBlocker) {
    useBlockerFn = mod.useBlocker;
  }
} catch {
  // react-router-dom not installed — in-app blocking unavailable
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
  useBlocker: UseBlockerFn;
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
}: {
  isDirty: boolean;
  onBlocked: (
    blocker: { proceed: () => void; reset: () => void } | null
  ) => void;
}) => {
  if (!useBlockerFn) {
    return null;
  }

  return (
    <RouterBlockerInner
      isDirty={isDirty}
      onBlocked={onBlocked}
      useBlocker={useBlockerFn}
    />
  );
};

/**
 * Internal component that blocks navigation when a form has unsaved changes.
 *
 * Uses `useBlocker` from `react-router-dom` to intercept in-app navigation
 * and `beforeunload` to warn on browser refresh / tab close.
 */
export const UnsavedChangesBlocker = () => {
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
        <RouterBlocker isDirty={isDirty} onBlocked={handleBlocked} />
      </RouterBlockerErrorBoundary>
      <BeforeUnloadBlocker isDirty={isDirty} />
      {pendingBlocker && (
        <UnsavedChangesModal
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
