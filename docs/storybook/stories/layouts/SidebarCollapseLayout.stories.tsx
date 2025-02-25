import { Meta, StoryObj } from '@storybook/react';
import { Layout, SidebarCollapseLayout } from '@ttoss/layouts';
import { Flex, Image, Stack } from '@ttoss/ui';

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
      <Layout.Sidebar>
        <Flex
          sx={{
            flexDirection: 'column',
            gap: '6',
          }}
        >
          <Flex>Sidebar item 1 </Flex>
          <Flex>Sidebar item 2 </Flex>
          <Flex>Sidebar item 3 </Flex>
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
