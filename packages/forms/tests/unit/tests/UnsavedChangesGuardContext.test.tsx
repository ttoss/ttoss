import { render, screen, userEvent } from '@ttoss/test-utils/react';
import {
  UnsavedChangesGuardProvider,
  useUnsavedChangesGuardContext,
} from 'src/UnsavedChangesGuardContext';

describe('UnsavedChangesGuardContext', () => {
  test('should provide safe default context without provider', async () => {
    const user = userEvent.setup({ delay: null });

    const ConsumerWithoutProvider = () => {
      const { trackedFields, registerField, unregisterField } =
        useUnsavedChangesGuardContext();

      return (
        <>
          <div data-testid="tracked-fields">{trackedFields.join(',')}</div>
          <button
            onClick={() => {
              registerField({ name: 'email' });
            }}
          >
            Register
          </button>
          <button
            onClick={() => {
              unregisterField({ name: 'email' });
            }}
          >
            Unregister
          </button>
        </>
      );
    };

    render(<ConsumerWithoutProvider />);

    expect(screen.getByTestId('tracked-fields')).toHaveTextContent('');

    await user.click(screen.getByText('Register'));
    await user.click(screen.getByText('Unregister'));

    expect(screen.getByTestId('tracked-fields')).toHaveTextContent('');
  });

  test('should register fields once and allow unregister behavior', async () => {
    const user = userEvent.setup({ delay: null });

    const ConsumerWithProvider = () => {
      const { trackedFields, registerField, unregisterField } =
        useUnsavedChangesGuardContext();

      return (
        <>
          <div data-testid="tracked-fields">{trackedFields.join(',')}</div>
          <button
            onClick={() => {
              registerField({ name: 'email' });
            }}
          >
            Register Email
          </button>
          <button
            onClick={() => {
              registerField({ name: 'email' });
            }}
          >
            Register Email Again
          </button>
          <button
            onClick={() => {
              unregisterField({ name: 'name' });
            }}
          >
            Unregister Missing
          </button>
          <button
            onClick={() => {
              unregisterField({ name: 'email' });
            }}
          >
            Unregister Email
          </button>
        </>
      );
    };

    render(
      <UnsavedChangesGuardProvider>
        <ConsumerWithProvider />
      </UnsavedChangesGuardProvider>
    );

    await user.click(screen.getByText('Register Email'));
    expect(screen.getByTestId('tracked-fields')).toHaveTextContent('email');

    await user.click(screen.getByText('Register Email Again'));
    expect(screen.getByTestId('tracked-fields')).toHaveTextContent('email');

    await user.click(screen.getByText('Unregister Missing'));
    expect(screen.getByTestId('tracked-fields')).toHaveTextContent('email');

    await user.click(screen.getByText('Unregister Email'));
    expect(screen.getByTestId('tracked-fields')).toHaveTextContent('');
  });
});
