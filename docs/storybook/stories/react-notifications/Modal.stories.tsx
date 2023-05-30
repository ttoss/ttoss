import { Button, Flex } from '@ttoss/ui';
import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from 'react';
import { Meta, Story } from '@storybook/react';
import { Modal } from '@ttoss/components/src';
import {
  NotificationsModal,
  NotificationsProvider,
  useNotifications,
} from '@ttoss/react-notifications/src';

const ZIndexContext = createContext<Dispatch<SetStateAction<number>> | null>(
  null
);

export default {
  title: 'React Notifications/Modal',
  decorators: [
    (Story) => {
      const [zIndex, setZIndex] = useState(0);
      return (
        <NotificationsProvider>
          <ZIndexContext.Provider value={setZIndex}>
            <Story />
            <NotificationsModal style={{ overlay: { zIndex } }} />
          </ZIndexContext.Provider>
        </NotificationsProvider>
      );
    },
  ],
} as Meta;

const Template: Story = () => {
  const { setNotifications } = useNotifications();

  return (
    <Button
      onClick={() => {
        setNotifications({ message: 'Hello', type: 'info' });
      }}
    >
      Click me!!
    </Button>
  );
};

const Template2: Story = () => {
  const { setNotifications } = useNotifications();

  return (
    <Button
      onClick={() => {
        setNotifications([
          { message: 'Hello', type: 'info' },
          { message: 'Second Message', type: 'info' },
          { message: 'More one', type: 'info' },
        ]);
      }}
    >
      Click me!!
    </Button>
  );
};

const Template3: Story = () => {
  const { setNotifications } = useNotifications();
  const [overlayModalOpen, setOverlayModalOpen] = useState(false);
  const setZIndex = useContext(ZIndexContext);

  return (
    <>
      <Modal isOpen={overlayModalOpen} style={{ overlay: { zIndex: 1 } }}>
        <Flex sx={{ gap: 'lg' }}>
          <Button
            onClick={() => {
              setOverlayModalOpen(false);
            }}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              if (!setZIndex) return null;
              return setZIndex(2);
            }}
          >
            Get Notification to Front
          </Button>
        </Flex>
      </Modal>
      <Button
        onClick={() => {
          setNotifications({ type: 'warning', message: 'Hello' });
          setOverlayModalOpen(true);
        }}
      >
        Click me!!
      </Button>
    </>
  );
};

export const SingleNotification = Template.bind({});
export const MultipleNotifications = Template2.bind({});
export const WithOverlayModal = Template3.bind({});
