import { Meta, StoryObj } from '@storybook/react';
import { Layout, SidebarCollapseLayout } from '@ttoss/layouts';
import { Image } from '@ttoss/ui';

export default {
  title: 'Layouts/SidebarCollapseLayout',
  parameters: {
    layout: 'fullscreen',
  },
} as Meta;

const SidebarCollapseLayoutTemplate = ({
  showSidebarButton,
  sidebarSlot,
}: {
  showSidebarButton?: boolean;
  sidebarSlot?: React.ReactNode;
}) => {
  return (
    <SidebarCollapseLayout>
      <Layout.Header
        showSidebarButton={showSidebarButton}
        sidebarSlot={sidebarSlot}
      >
        Header starts here
      </Layout.Header>
      <Layout.Sidebar>Sidebar starts here</Layout.Sidebar>
      <Layout.Main>Main starts here</Layout.Main>
    </SidebarCollapseLayout>
  );
};

const SIDE_IMAGE_URL =
  'https://cdn.triangulos.tech/assets/terezinha_500x500_da67d70b65.webp';

const terezinhaLogo = (
  <Image
    src={SIDE_IMAGE_URL}
    alt="Terezinha"
    sx={{
      height: '100%',
    }}
    onError={(e) => {
      e.currentTarget.style.display = 'none';
    }}
  />
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
    sidebarSlot: terezinhaLogo,
  },
};
