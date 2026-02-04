import { useI18n } from '@ttoss/react-i18n';
import * as React from 'react';
import { useFormContext } from 'react-hook-form';

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
 *   const { showModal, handleDiscard, handleKeepEditing } = useUnsavedChanges();
 *
 *   return (
 *     <>
 *       <FormFieldInput name="email" label="Email" />
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
}: UseUnsavedChangesOptions = {}) => {
  const { intl } = useI18n();

  // Get form context - will be null if not inside a FormProvider
  const formContext = useFormContext();
  const isDirty = formContext?.formState?.isDirty ?? false;

  const [showModal, setShowModal] = React.useState(false);

  const defaultMessage = intl.formatMessage({
    defaultMessage: 'You have unsaved changes. Are you sure you want to leave?',
    description: 'Browser native dialog message for unsaved changes',
  });

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
  const handleAttemptNavigation = React.useCallback(() => {
    if (enabled && isDirty) {
      setShowModal(true);
      onAttemptLeave?.();
      return true; // Indicates navigation should be blocked
    }
    return false; // Allow navigation
  }, [enabled, isDirty, onAttemptLeave]);

  /**
   * Close modal and allow user to continue editing
   */
  const handleKeepEditing = React.useCallback(() => {
    setShowModal(false);
  }, []);

  /**
   * Close modal and proceed with discard action
   */
  const handleDiscard = React.useCallback(() => {
    setShowModal(false);
    // The caller should handle actual discard logic (e.g., reset form, navigate away)
  }, []);

  return {
    /**
     * Whether the modal should be shown
     */
    showModal,
    /**
     * Whether the form has unsaved changes
     */
    isDirty,
    /**
     * Handler for when user wants to discard changes
     */
    handleDiscard,
    /**
     * Handler for when user wants to keep editing
     */
    handleKeepEditing,
    /**
     * Handler to call when user attempts navigation
     * Returns true if navigation should be blocked
     */
    handleAttemptNavigation,
  };
};
