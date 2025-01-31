import { Modal } from '@ttoss/components/Modal';
import { render, screen, userEvent } from '@ttoss/test-utils';
import { Button } from '@ttoss/ui';
import {
  Notification,
  NotificationsProvider,
  useNotifications,
} from 'src/index';

const expectNotBeInDocument = (element: HTMLElement) => {
  expect(() => {
    expect(element).toBeInTheDocument();
  }).toThrow();
};

describe('Modal Notifications Test', () => {
  const user = userEvent.setup({ delay: null });
  const TestModalComponent = ({
    notifications,
  }: {
    notifications: Notification | Notification[];
  }) => {
    const { addNotification } = useNotifications();

    return (
      <>
        <Button
          onClick={() => {
            addNotification(notifications);
          }}
        >
          Click me!!
        </Button>
      </>
    );
  };

  Modal.setAppElement('body');

  test('Should render only one notification', async () => {
    render(
      <NotificationsProvider>
        <TestModalComponent
          notifications={{
            message: 'Test Message',
            type: 'info',
            viewType: 'modal',
          }}
        />
      </NotificationsProvider>
    );

    await user.click(await screen.findByText('Click me!!'));

    const notification = await screen.findByText('Test Message');

    expect(notification).toBeInTheDocument();

    const closeButton = screen.getByLabelText('Close');

    await user.click(closeButton);

    expectNotBeInDocument(notification);
  });

  test('Should close notifications modal', async () => {
    render(
      <NotificationsProvider>
        <TestModalComponent
          notifications={{
            message: 'Test Message',
            type: 'info',
            viewType: 'modal',
          }}
        />
      </NotificationsProvider>
    );

    await user.click(await screen.findByText('Click me!!'));

    const buttons = await screen.findAllByTestId('iconify-icon');

    expect(buttons.length).toBe(2);

    expect((buttons[0] as unknown as { icon: string }).icon).toBe('close');

    const modalClose = buttons[0].parentElement;

    expect(modalClose).toBeInTheDocument();

    const notification = await screen.findByText('Test Message');

    expect(notification).toBeInTheDocument();

    // expect to disappear after click
    if (modalClose) {
      await user.click(modalClose);
    }

    expectNotBeInDocument(notification);

    if (modalClose) {
      expectNotBeInDocument(modalClose);
    }
  });

  test('Should render an array of notifications', async () => {
    render(
      <NotificationsProvider defaultViewType="modal">
        <TestModalComponent
          notifications={[
            { message: 'Test 1', type: 'info' },
            { message: 'Test 2', type: 'warning' },
            { message: 'Test 3', type: 'info' },
          ]}
        />
      </NotificationsProvider>
    );

    await user.click(await screen.findByText('Click me!!'));

    const messages = await Promise.all([
      screen.findByText('Test 1'),
      screen.findByText('Test 2'),
      screen.findByText('Test 3'),
    ]);

    messages.forEach((message) => {
      expect(message).toBeInTheDocument();
    });
  });
});
