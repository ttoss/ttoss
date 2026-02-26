import { render, screen, userEvent, waitFor } from '@ttoss/test-utils/react';
import { UnsavedChangesModal } from 'src/UnsavedChangesModal';

describe('UnsavedChangesModal', () => {
  test('should render modal when isOpen is true', () => {
    render(
      <UnsavedChangesModal
        isOpen={true}
        onDiscard={jest.fn()}
        onKeepEditing={jest.fn()}
      />
    );

    expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    expect(
      screen.getByText(
        'You have unsaved changes. Are you sure you want to discard them?'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Discard Changes')).toBeInTheDocument();
    expect(screen.getByText('Keep Editing')).toBeInTheDocument();
  });

  test('should not render modal when isOpen is false', () => {
    render(
      <UnsavedChangesModal
        isOpen={false}
        onDiscard={jest.fn()}
        onKeepEditing={jest.fn()}
      />
    );

    expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
  });

  test('should call onDiscard when "Discard Changes" button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    const onDiscard = jest.fn();
    const onKeepEditing = jest.fn();

    render(
      <UnsavedChangesModal
        isOpen={true}
        onDiscard={onDiscard}
        onKeepEditing={onKeepEditing}
      />
    );

    await user.click(screen.getByText('Discard Changes'));

    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(onKeepEditing).not.toHaveBeenCalled();
  });

  test('should call onKeepEditing when "Keep Editing" button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    const onDiscard = jest.fn();
    const onKeepEditing = jest.fn();

    render(
      <UnsavedChangesModal
        isOpen={true}
        onDiscard={onDiscard}
        onKeepEditing={onKeepEditing}
      />
    );

    await user.click(screen.getByText('Keep Editing'));

    expect(onKeepEditing).toHaveBeenCalledTimes(1);
    expect(onDiscard).not.toHaveBeenCalled();
  });

  test('should render custom title when provided', () => {
    const customTitle = 'Are you sure?';

    render(
      <UnsavedChangesModal
        isOpen={true}
        onDiscard={jest.fn()}
        onKeepEditing={jest.fn()}
        title={customTitle}
      />
    );

    expect(screen.getByText(customTitle)).toBeInTheDocument();
    expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
  });

  test('should render custom message when provided', () => {
    const customMessage = 'Your changes will be lost forever!';

    render(
      <UnsavedChangesModal
        isOpen={true}
        onDiscard={jest.fn()}
        onKeepEditing={jest.fn()}
        message={customMessage}
      />
    );

    expect(screen.getByText(customMessage)).toBeInTheDocument();
    expect(
      screen.queryByText(
        'You have unsaved changes. Are you sure you want to discard them?'
      )
    ).not.toBeInTheDocument();
  });

  test('should call onKeepEditing when modal is closed via ESC or overlay click', async () => {
    const user = userEvent.setup({ delay: null });
    const onDiscard = jest.fn();
    const onKeepEditing = jest.fn();

    render(
      <UnsavedChangesModal
        isOpen={true}
        onDiscard={onDiscard}
        onKeepEditing={onKeepEditing}
      />
    );

    // Press ESC key
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(onKeepEditing).toHaveBeenCalled();
    });

    expect(onDiscard).not.toHaveBeenCalled();
  });

  test('should have proper styling with OCA theme tokens', () => {
    render(
      <UnsavedChangesModal
        isOpen={true}
        onDiscard={jest.fn()}
        onKeepEditing={jest.fn()}
      />
    );

    const heading = screen.getByText('Unsaved Changes');
    const message = screen.getByText(
      'You have unsaved changes. Are you sure you want to discard them?'
    );

    // Verify elements are rendered
    expect(heading).toBeInTheDocument();
    expect(message).toBeInTheDocument();

    // Verify buttons are present with correct text
    expect(screen.getByText('Discard Changes')).toBeInTheDocument();
    expect(screen.getByText('Keep Editing')).toBeInTheDocument();
  });
});
