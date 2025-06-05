import { Meta, StoryObj } from '@storybook/react';
import {
  Notification,
  NotificationsMenu,
} from '@ttoss/components/NotificationsMenu';
import { Layout, SidebarCollapseLayout } from '@ttoss/layouts';
import { Box, Flex, Image, Stack } from '@ttoss/ui';

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
      <Layout.Main>{mainContent}</Layout.Main>
    </SidebarCollapseLayout>
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
    title: 'Campanha criada com sucesso',
    message: 'Sua campanha "Promoção de Verão" foi criada e está ativa.',
    presentation: 'SIMPLE',
    actions: [
      {
        action: 'open_url',
        url: 'https://example.com/campaign',
        label: 'Ver campanha',
      },
    ],
    createdAt: 'há 3h',
  },
  {
    id: '2',
    type: 'warning',
    title: 'Orçamento próximo do limite',
    message: 'Sua conta está utilizando 85% do orçamento mensal.',
    presentation: 'LOCKED',
    createdAt: 'há 25 min',
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
        <Layout.Main>{args.content || 'Main starts here'}</Layout.Main>
      </SidebarCollapseLayout>
    );
  },
  args: {
    showSidebarButton: true,
    sidebarSlot: terezinhaLogo,
  },
};
