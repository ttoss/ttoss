import { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  Notification,
  NotificationsMenu,
} from '@ttoss/components/NotificationsMenu';
import { Layout, SidebarCollapseLayout } from '@ttoss/layouts';
import {
  NotificationsProvider,
  useNotifications,
} from '@ttoss/react-notifications';
import { Box, Flex, Image, Stack } from '@ttoss/ui';
import * as React from 'react';

export default {
  title: 'Layouts/SidebarCollapseLayout',
  parameters: {
    layout: 'fullscreen',
  },
} as Meta;

const SidebarCollapseLayoutTemplate = ({
  showSidebarButton,
  sidebarSlot,
  content,
}: {
  showSidebarButton?: boolean;
  sidebarSlot?: React.ReactNode;
  content?: React.ReactNode;
}) => {
  const mainContent = content || 'Main starts here';

  return (
    <SidebarCollapseLayout>
      <Layout.Header
        showSidebarButton={showSidebarButton}
        sidebarSlot={sidebarSlot}
      >
        Header starts here
      </Layout.Header>
      <Layout.Sidebar showSidebarButtonInDrawer={true} drawerSlot={sidebarSlot}>
        <Flex
          sx={{
            flexDirection: 'column',
            gap: '6',
          }}
        >
          <Flex>Sidebar item 1 </Flex>
          <Flex>Sidebar item 2 </Flex>
          <Flex>Sidebar item 3 </Flex>
          <Flex>Sidebar item 4 </Flex>
          <Flex>Sidebar item 5 </Flex>
          <Flex>Sidebar item 6 </Flex>
          <Flex>Sidebar item 7 </Flex>
          <Flex>Sidebar item 8 </Flex>
          <Flex>Sidebar item 9 </Flex>
        </Flex>
      </Layout.Sidebar>

      <Layout.Main>
        <Layout.Main.Header
          sx={{
            borderBottom: '1px solid gray',
          }}
        >
          Main Header
        </Layout.Main.Header>
        <Layout.Main.Body>{mainContent}</Layout.Main.Body>
        <Layout.Main.Footer
          sx={{
            borderTop: '1px solid gray',
          }}
        >
          Main Footer
        </Layout.Main.Footer>
      </Layout.Main>
    </SidebarCollapseLayout>
  );
};

const HeaderWithNotifications = () => {
  const { addNotification } = useNotifications();

  React.useEffect(() => {
    addNotification({
      message: 'Esta notificação aparece automaticamente no header!',
      type: 'info',
      viewType: 'header',
      title: 'Notificação Automática',
    });
  }, [addNotification]);

  return (
    <Flex sx={{ alignItems: 'center', width: '100%' }}>Header starts here</Flex>
  );
};

const SIDE_IMAGE_URL =
  'https://cdn.triangulos.tech/assets/terezinha_500x500_da67d70b65.webp';

const terezinhaLogo = (
  <Flex
    sx={{
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      backgroundColor: 'black',
    }}
  >
    <Image
      src={SIDE_IMAGE_URL}
      alt="Terezinha"
      sx={{
        height: '100px',
      }}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  </Flex>
);

type Story = StoryObj<typeof SidebarCollapseLayoutTemplate>;

export const WithoutSidebarButton: Story = {
  name: 'Without Sidebar Button',
  render: SidebarCollapseLayoutTemplate,
  args: {
    showSidebarButton: false,
  },
};

export const WithSidebarButton: Story = {
  name: 'With Sidebar Button',
  render: SidebarCollapseLayoutTemplate,
  args: {
    showSidebarButton: true,
  },
};

export const WithSidebarSlot: Story = {
  name: 'With Sidebar Slot',
  render: SidebarCollapseLayoutTemplate,
  args: {
    showSidebarButton: false,
    sidebarSlot: terezinhaLogo,
  },
};

export const WithSidebarButtonAndSlot: Story = {
  name: 'With Sidebar Button and Slot',
  render: SidebarCollapseLayoutTemplate,
  args: {
    showSidebarButton: true,
    sidebarSlot: terezinhaLogo,
  },
};

export const WithLargeContent: Story = {
  name: 'With Large Content',
  render: SidebarCollapseLayoutTemplate,
  args: {
    showSidebarButton: true,
    sidebarSlot: terezinhaLogo,
    content: (
      <Stack sx={{ gap: '4', width: '300px' }}>
        {terezinhaLogo}
        {terezinhaLogo}
        {terezinhaLogo}
        {terezinhaLogo}
        {terezinhaLogo}
        {terezinhaLogo}
        {terezinhaLogo}
      </Stack>
    ),
  },
};

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Campaign created successfully',
    message: 'Your campaign "Summer Promotion" has been created and is active.',
    actions: [
      {
        action: 'open_url',
        url: 'https://example.com/campaign',
        label: 'View campaign',
      },
    ],
    caption: '1 min ago',
    tags: ['New'],
  },
  {
    id: '2',
    type: 'warning',
    title: 'Budget nearing the limit',
    message: 'Your account is using 85% of the monthly budget.',
    caption: '25 min ago',
  },
];

export const WithNotificationsMenu: Story = {
  name: 'With Notifications Menu',
  render: (args) => {
    return (
      <SidebarCollapseLayout>
        <Layout.Header
          showSidebarButton={args.showSidebarButton}
          sidebarSlot={args.sidebarSlot}
        >
          <Flex sx={{ alignItems: 'center', width: '100%' }}>
            Header starts here
            <Box sx={{ ml: 'auto' }}>
              <NotificationsMenu
                notifications={mockNotifications}
                count={
                  mockNotifications.filter((n) => {
                    return !n.tags;
                  }).length
                }
                onClose={() => {}}
              />
            </Box>
          </Flex>
        </Layout.Header>
        <Layout.Sidebar
          showSidebarButtonInDrawer={true}
          drawerSlot={args.sidebarSlot}
        >
          <Flex sx={{ flexDirection: 'column', gap: '6' }}>
            <Flex>Sidebar item 1 </Flex>
            <Flex>Sidebar item 2 </Flex>
            <Flex>Sidebar item 3 </Flex>
            <Flex>Sidebar item 4 </Flex>
            <Flex>Sidebar item 5 </Flex>
            <Flex>Sidebar item 6 </Flex>
          </Flex>
        </Layout.Sidebar>
        <Layout.Main>
          <Layout.Main.Body>
            {args.content || 'Main starts here'}
          </Layout.Main.Body>
        </Layout.Main>
      </SidebarCollapseLayout>
    );
  },
  args: {
    showSidebarButton: true,
    sidebarSlot: terezinhaLogo,
  },
};

export const WithHeaderNotifications: Story = {
  name: 'With Header Notifications',
  render: (args) => {
    return (
      <NotificationsProvider>
        <SidebarCollapseLayout>
          <Layout.Header
            showSidebarButton={args.showSidebarButton}
            sidebarSlot={args.sidebarSlot}
          >
            <HeaderWithNotifications />
          </Layout.Header>
          <Layout.Sidebar
            showSidebarButtonInDrawer={true}
            drawerSlot={args.sidebarSlot}
          >
            <Flex sx={{ flexDirection: 'column', gap: '6' }}>
              <Flex>Sidebar item 1 </Flex>
              <Flex>Sidebar item 2 </Flex>
              <Flex>Sidebar item 3 </Flex>
              <Flex>Sidebar item 4 </Flex>
              <Flex>Sidebar item 5 </Flex>
              <Flex>Sidebar item 6 </Flex>
            </Flex>
          </Layout.Sidebar>
          <Layout.Main>
            <Layout.Main.Body>
              <Box sx={{ p: '4' }}>
                <p>Clique no botão do header para adicionar uma notificação!</p>
                <p>A notificação aparecerá no topo da página.</p>
              </Box>
            </Layout.Main.Body>
          </Layout.Main>
        </SidebarCollapseLayout>
      </NotificationsProvider>
    );
  },
  args: {
    showSidebarButton: true,
    sidebarSlot: terezinhaLogo,
  },
};
