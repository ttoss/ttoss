import {
  Button,
  Heading,
  Link,
  Meter,
  Separator,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
} from '@ttoss/fsl-ui';

/**
 * Phase-0/1 stage content: a sample of fsl-ui components proving the theme
 * pipeline end to end. It deliberately exercises brand-driven surfaces
 * (accent button, link, tabs, meter) so that editing the brand color scale
 * visibly cascades — the Studio's headline "wow" (PRD SC-1). Phase 2 replaces
 * this with the component catalog and full example pages (PRD F3.5).
 *
 * Internal to the Studio app — not part of any public package API.
 */
export const StageSample = () => {
  return (
    <div className="stage-sample">
      <div>
        <Heading level={3}>Account settings</Heading>
        <Text variant="body-sm" tone="muted">
          Manage how your workspace behaves.
        </Text>
      </div>
      <div className="stage-sample-row">
        <Button evaluation="primary">Save</Button>
        <Button evaluation="accent">Publish</Button>
        <Button evaluation="muted">Cancel</Button>
        <Button evaluation="negative" consequence="destructive">
          Delete
        </Button>
      </div>
      <div className="stage-sample-row">
        <Switch defaultSelected>Notifications</Switch>
        <Link href="https://ttoss.dev/docs/design/design-system/fsl">
          FSL documentation
        </Link>
      </div>
      <Meter aria-label="Storage used" label="Storage used" value={72} />
      <Separator />
      <Tabs>
        <TabList aria-label="Sample tabs">
          <Tab id="overview">Overview</Tab>
          <Tab id="activity">Activity</Tab>
        </TabList>
        <TabPanel id="overview">Overview content.</TabPanel>
        <TabPanel id="activity">Activity content.</TabPanel>
      </Tabs>
    </div>
  );
};
