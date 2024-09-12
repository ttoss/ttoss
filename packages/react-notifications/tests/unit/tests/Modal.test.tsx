import { Button } from '@ttoss/ui';
import { Modal } from '@ttoss/components/Modal';
import {
  NotificationsModal,
  NotificationsProvider,
  NotifyParams,
  useNotifications,
} from 'src/index';
import { render, screen, userEvent } from '@ttoss/test-utils';

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
    notifications: NotifyParams | NotifyParams[];
  }) => {
    const { setNotifications } = useNotifications();

    return (
      <>
        <Button
          onClick={() => {
            setNotifications(notifications);
          }}
        >
          Click me!!
        </Button>
        <NotificationsModal />
      </>
    );
  };

  Modal.setAppElement('body');

  test('Should render only one notification', async () => {
    render(
      <NotificationsProvider>
        <TestModalComponent
          notifications={{ message: 'Test Message', type: 'info' }}
        />
      </NotificationsProvider>
    );

    await user.click(await screen.findByText('Click me!!'));

    const notification = await screen.findByText('Test Message');

    expect(notification).toBeInTheDocument();

    // expect to disappear after click
    await user.click(notification);

    expectNotBeInDocument(notification);
  });

  test('Should close notifications modal', async () => {
    render(
      <NotificationsProvider>
        <TestModalComponent
          notifications={{ message: 'Test Message', type: 'info' }}
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
      <NotificationsProvider>
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

    await user.click(messages[0]);

    expectNotBeInDocument(messages[0]);

    await user.click(messages[1]);

    expectNotBeInDocument(messages[1]);

    await user.click(messages[2]);

    expectNotBeInDocument(messages[2]);
  });
});
