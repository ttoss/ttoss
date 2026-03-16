import { defineMessages, useI18n } from '@ttoss/react-i18n';
import * as React from 'react';
import { useFormContext } from 'react-hook-form';

import { useUnsavedChangesGuardContext } from './UnsavedChangesGuardContext';

const messages = defineMessages({
  leaveWarning: {
    defaultMessage: 'You have unsaved changes. Are you sure you want to leave?',
    description: 'Browser native dialog message for unsaved changes',
  },
});

const getPathValue = ({ object, path }: { object: unknown; path: string }) => {
  return path.split('.').reduce<unknown>((value, pathPart) => {
    if (value === null || value === undefined) {
      return undefined;
    }

    if (typeof value !== 'object') {
      return undefined;
    }

    return (value as Record<string, unknown>)[pathPart];
  }, object);
};

const hasDirtyTrackedFields = ({
  dirtyFields,
  trackedFields,
}: {
  dirtyFields: unknown;
  trackedFields: string[];
}) => {
  return trackedFields.some((fieldName) => {
    return Boolean(
      getPathValue({
        object: dirtyFields,
        path: fieldName,
      })
    );
  });
};

export type UnsavedNavigationHandlerOptions = {
  onProceed?: () => void;
};

export type CreateUnsavedNavigationHandlerOptions = {
  onProceed: () => void;
};

export type UseUnsavedChangesOptions = {
  /**
   * Whether to enable the unsaved changes protection
   * @default true
   */
  enabled?: boolean;
  /**
   * Custom message to show in the browser's native beforeunload dialog
   */
  message?: string;
  /**
   * Callback when user attempts to leave with unsaved changes
   */
  onAttemptLeave?: () => void;
};

export type UseUnsavedChangesReturn = {
  /**
   * Whether the modal should be shown.
   */
  showModal: boolean;
  /**
   * Whether the form has unsaved changes.
   */
  isDirty: boolean;
  /**
   * Handler for when user wants to discard changes.
   */
  handleDiscard: () => void;
  /**
   * Handler for when user wants to keep editing.
   */
  handleKeepEditing: () => void;
  /**
   * Handler to call when user attempts navigation.
   * Returns true if navigation should be blocked.
   */
  handleAttemptNavigation: (
    options?: UnsavedNavigationHandlerOptions
  ) => boolean;
  /**
   * Creates a guarded navigation handler that can be used in links or buttons.
   */
  createNavigationHandler: (
    options: CreateUnsavedNavigationHandlerOptions
  ) => () => void;
};

/**
 * Hook that provides unsaved changes protection for forms.
 * Tracks form dirty state and prevents page navigation when there are unsaved changes.
 *
 * **IMPORTANT**: This hook must be used inside a component that is a child of a Form component
 * (or FormProvider), as it relies on the form context.
 *
 * @example
 * ```tsx
 * const MyFormContent = () => {
 *   const {
 *     showModal,
 *     handleDiscard,
 *     handleKeepEditing,
 *     createNavigationHandler,
 *   } = useUnsavedChanges();
 *
 *   const goToDashboard = createNavigationHandler({
 *     onProceed: () => {
 *       navigate('/dashboard');
 *     },
 *   });
 *
 *   return (
 *     <>
 *       <FormFieldInput
 *         name="email"
 *         label="Email"
 *         unsavedChangesGuard={true}
 *       />
 *       <Button type="button" onClick={goToDashboard}>Go to Dashboard</Button>
 *       <UnsavedChangesModal
 *         isOpen={showModal}
 *         onDiscard={handleDiscard}
 *         onKeepEditing={handleKeepEditing}
 *       />
 *     </>
 *   );
 * };
 *
 * const MyForm = () => {
 *   const formMethods = useForm();
 *   return (
 *     <Form {...formMethods}>
 *       <MyFormContent />
 *     </Form>
 *   );
 * };
 * ```
 */
export const useUnsavedChanges = ({
  enabled = true,
  message,
  onAttemptLeave,
}: UseUnsavedChangesOptions = {}): UseUnsavedChangesReturn => {
  const { intl } = useI18n();
  const { trackedFields } = useUnsavedChangesGuardContext();

  // Get form context - will be null if not inside a FormProvider
  const formContext = useFormContext();
  const isFormDirty = formContext?.formState?.isDirty ?? false;

  const [pendingNavigation, setPendingNavigation] = React.useState<
    (() => void) | null
  >(null);

  const trackedFieldsDirty = hasDirtyTrackedFields({
    dirtyFields: formContext?.formState?.dirtyFields,
    trackedFields,
  });

  const isDirty = trackedFields.length > 0 ? trackedFieldsDirty : isFormDirty;

  const [showModal, setShowModal] = React.useState(false);

  const defaultMessage = intl.formatMessage(messages.leaveWarning);

  const warningMessage = message || defaultMessage;

  // Handle browser beforeunload event
  React.useEffect(() => {
    if (!enabled || !isDirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Modern browsers ignore the custom message and show their own
      event.returnValue = warningMessage;
      onAttemptLeave?.();
      return warningMessage;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, isDirty, warningMessage, onAttemptLeave]);

  /**
   * Open the modal when user attempts to navigate
   */
  const handleAttemptNavigation = React.useCallback(
    ({ onProceed }: UnsavedNavigationHandlerOptions = {}) => {
      if (enabled && isDirty) {
        setPendingNavigation(() => {
          return onProceed ?? null;
        });
        setShowModal(true);
        onAttemptLeave?.();
        return true; // Indicates navigation should be blocked
      }

      onProceed?.();
      return false; // Allow navigation
    },
    [enabled, isDirty, onAttemptLeave]
  );

  const createNavigationHandler = React.useCallback(
    ({ onProceed }: CreateUnsavedNavigationHandlerOptions) => {
      return () => {
        handleAttemptNavigation({ onProceed });
      };
    },
    [handleAttemptNavigation]
  );

  /**
   * Close modal and allow user to continue editing
   */
  const handleKeepEditing = React.useCallback(() => {
    setPendingNavigation(null);
    setShowModal(false);
  }, []);

  /**
   * Close modal and proceed with discard action
   */
  const handleDiscard = React.useCallback(() => {
    const navigationAction = pendingNavigation;

    setPendingNavigation(null);
    setShowModal(false);

    navigationAction?.();
  }, [pendingNavigation]);

  return {
    showModal,
    isDirty,
    handleDiscard,
    handleKeepEditing,
    handleAttemptNavigation,
    createNavigationHandler,
  };
};
