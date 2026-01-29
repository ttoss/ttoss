import { Modal } from '@ttoss/components/Modal';
import { useI18n } from '@ttoss/react-i18n';
import { Box, Button, Flex, Heading, Text } from '@ttoss/ui';

export type UnsavedChangesModalProps = {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  /**
   * Callback when user clicks "Discard Changes" button
   */
  onDiscard: () => void;
  /**
   * Callback when user clicks "Keep Editing" button or closes the modal
   */
  onKeepEditing: () => void;
  /**
   * Optional custom title for the modal
   */
  title?: string;
  /**
   * Optional custom message for the modal
   */
  message?: string;
};

/**
 * Modal component that warns users about unsaved changes.
 * Uses OCA theme tokens for styling.
 */
export const UnsavedChangesModal = ({
  isOpen,
  onDiscard,
  onKeepEditing,
  title,
  message,
}: UnsavedChangesModalProps) => {
  const { intl } = useI18n();

  const defaultTitle = intl.formatMessage({
    defaultMessage: 'Unsaved Changes',
    description: 'Title for unsaved changes confirmation modal',
  });

  const defaultMessage = intl.formatMessage({
    defaultMessage:
      'You have unsaved changes. Are you sure you want to discard them?',
    description: 'Message for unsaved changes confirmation modal',
  });

  const discardLabel = intl.formatMessage({
    defaultMessage: 'Discard Changes',
    description: 'Button label to discard unsaved changes',
  });

  const keepEditingLabel = intl.formatMessage({
    defaultMessage: 'Keep Editing',
    description: 'Button label to continue editing',
  });

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onKeepEditing}
      shouldCloseOnOverlayClick={true}
      shouldCloseOnEsc={true}
      style={{
        content: {
          maxWidth: '500px',
          minWidth: '300px',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4',
        }}
      >
        <Heading
          as="h2"
          sx={{
            fontSize: '3',
            fontWeight: 'heading',
            color: 'display.text.primary.default',
          }}
        >
          {title || defaultTitle}
        </Heading>

        <Text
          sx={{
            color: 'display.text.secondary.default',
            fontSize: '2',
          }}
        >
          {message || defaultMessage}
        </Text>

        <Flex
          sx={{
            gap: '3',
            justifyContent: 'flex-end',
            marginTop: '2',
          }}
        >
          <Button
            variant="secondary"
            onClick={onKeepEditing}
            sx={{
              paddingX: '4',
              paddingY: '2',
              backgroundColor: 'action.background.muted.default',
              color: 'action.text.muted.default',
              border: 'md',
              borderColor: 'display.border.muted.default',
              '&:hover': {
                backgroundColor: 'display.background.muted.default',
              },
            }}
          >
            {keepEditingLabel}
          </Button>

          <Button
            variant="destructive"
            onClick={onDiscard}
            sx={{
              paddingX: '4',
              paddingY: '2',
              backgroundColor: 'action.background.negative.default',
              color: 'action.text.negative.default',
              '&:hover': {
                opacity: 0.9,
              },
            }}
          >
            {discardLabel}
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
};
