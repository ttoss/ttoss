import { NotificationsProvider } from 'src/Provider';
import { act, render, renderHook, screen, userEvent } from '@ttoss/test-utils';
import { useNotifications } from 'src/index';

test('should set loading', () => {
  const { result } = renderHook(
    () => {
      return useNotifications();
    },
    {
      wrapper: NotificationsProvider,
    }
  );

  expect(result.current.isLoading).toBe(false);

  act(() => {
    result.current.setLoading(true);
  });

  expect(result.current.isLoading).toBe(true);

  act(() => {
    result.current.setLoading(false);
  });

  expect(result.current.isLoading).toBe(false);
});

test('should render progress bar', async () => {
  const user = userEvent.setup({ delay: null });

  const Component = () => {
    const { setLoading } = useNotifications();

    return (
      <div>
        <p>Some text</p>
        <button
          onClick={() => {
            return setLoading(true);
          }}
        >
          click
        </button>
      </div>
    );
  };

  render(<Component />, { wrapper: NotificationsProvider });

  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

  await act(async () => {
    await user.click(await screen.findByText('click'));
  });

  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});
