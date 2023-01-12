import { AuthProvider, useAuth } from '../../src';
import { act, render, screen, waitFor } from '@ttoss/test-utils';

jest.mock('aws-amplify', () => {
  return {
    Auth: {
      currentAuthenticatedUser: jest.fn().mockResolvedValue({}),
    },
    Hub: {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      listen: jest.fn().mockReturnValue(() => {}),
    },
  };
});

test('isAuthenticated returns undefined on first render', async () => {
  const Component = () => {
    const { isAuthenticated } = useAuth();
    return <div>{JSON.stringify({ isAuthenticated })}</div>;
  };

  render(
    <AuthProvider>
      <Component />
    </AuthProvider>
  );

  /**
   * The first render will return nothing because the AuthProvider is still
   * loading `isAuthenticated`.
   */
  await act(async () => {
    await waitFor(() => {
      expect(screen.queryByText('isAuthenticated')).not.toBeInTheDocument();
    });
  });

  expect(screen.getByText(/isAuthenticated/)).toBeInTheDocument();
  expect(screen.getByText(/false/)).toBeInTheDocument();
});
