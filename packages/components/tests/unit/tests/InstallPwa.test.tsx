import { InstallPwa, InstallPwaUi } from '@ttoss/components';
import { act, fireEvent, render, screen } from '@ttoss/test-utils/react';

describe('InstallPwaUi', () => {
  test('renders install button', () => {
    render(<InstallPwaUi onInstall={jest.fn()} />);
    expect(
      screen.getByRole('button', { name: /instalar/i })
    ).toBeInTheDocument();
  });

  test('calls onInstall when button clicked', () => {
    const onInstall = jest.fn();
    render(<InstallPwaUi onInstall={onInstall} />);
    fireEvent.click(screen.getByRole('button', { name: /instalar/i }));
    expect(onInstall).toHaveBeenCalledTimes(1);
  });

  test('shows install prompt text', () => {
    render(<InstallPwaUi onInstall={jest.fn()} />);
    expect(
      screen.getByText(/instalar o nosso aplicativo/i)
    ).toBeInTheDocument();
  });
});

describe('InstallPwa', () => {
  test('renders nothing when beforeinstallprompt has not fired', () => {
    const { container } = render(<InstallPwa />);
    expect(container.firstChild).toBeNull();
  });

  test('renders install UI after beforeinstallprompt fires', () => {
    const { container } = render(<InstallPwa />);
    expect(container.firstChild).toBeNull();

    act(() => {
      const event = new Event('beforeinstallprompt');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (event as any).preventDefault = jest.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (event as any).prompt = jest.fn();
      window.dispatchEvent(event);
    });

    expect(
      screen.getByRole('button', { name: /instalar/i })
    ).toBeInTheDocument();
  });
});
