import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tab, TabList, TabPanel, Tabs } from '@ttoss/fsl-ui';

const meta: Meta<typeof Tabs> = {
  title: 'Navigation/Tabs',
  component: Tabs,
  subcomponents: { TabList, Tab, TabPanel },
};

export default meta;

type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => {
    return (
      <Tabs>
        <TabList aria-label="Project sections">
          <Tab id="overview">Overview</Tab>
          <Tab id="activity">Activity</Tab>
          <Tab id="settings">Settings</Tab>
        </TabList>
        <TabPanel id="overview">Project overview content.</TabPanel>
        <TabPanel id="activity">Recent activity content.</TabPanel>
        <TabPanel id="settings">Settings content.</TabPanel>
      </Tabs>
    );
  },
};

export const Vertical: Story = {
  render: () => {
    return (
      <Tabs orientation="vertical">
        <TabList aria-label="Project sections">
          <Tab id="overview">Overview</Tab>
          <Tab id="activity">Activity</Tab>
          <Tab id="settings">Settings</Tab>
        </TabList>
        <TabPanel id="overview">Project overview content.</TabPanel>
        <TabPanel id="activity">Recent activity content.</TabPanel>
        <TabPanel id="settings">Settings content.</TabPanel>
      </Tabs>
    );
  },
};
