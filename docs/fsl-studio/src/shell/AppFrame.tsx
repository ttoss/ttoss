import { useColorMode } from '@ttoss/fsl-theme/react';
import {
  AppShell,
  Badge,
  Box,
  Button,
  Container,
  Link,
  Menu,
  MenuItem,
  MenuTrigger,
  Stack,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
} from '@ttoss/fsl-ui';
import type * as React from 'react';

import { BillingPage } from '../pages/BillingPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TeamPage } from '../pages/TeamPage';
import type { Route } from '../router';
import { navigate, ROUTES } from '../router';
import type { Session } from '../session';
import { signOut } from '../session';

const PAGES: Record<Route, React.ReactNode> = {
  dashboard: <DashboardPage />,
  team: <TeamPage />,
  billing: <BillingPage />,
};

const HeaderBar = ({ session }: { session: Session }) => {
  const { resolvedMode, setMode } = useColorMode();

  return (
    <Stack direction="horizontal" align="center" justify="between">
      <Stack direction="horizontal" align="center" gap="sm">
        <Text variant="label-lg">Meridian</Text>
        <Badge>northline</Badge>
      </Stack>
      <Stack direction="horizontal" align="center" gap="lg">
        <Switch
          isSelected={resolvedMode === 'dark'}
          onChange={(isSelected) => {
            setMode(isSelected ? 'dark' : 'light');
          }}
        >
          Dark
        </Switch>
        <MenuTrigger>
          <Button evaluation="muted">{session.email}</Button>
          <Menu>
            <MenuItem
              onAction={() => {
                signOut();
              }}
            >
              Sign out
            </MenuItem>
          </Menu>
        </MenuTrigger>
      </Stack>
    </Stack>
  );
};

const SidebarNav = () => {
  return (
    <Stack gap="xl">
      {/*
       * Primary navigation as vertical Tabs — the recorded F-002 workaround
       * (Link has no `current`-state affordance). The routed page renders
       * inside the matching TabPanel in the main region, so the tabs control
       * a real panel and the ARIA relationship stays valid (F-017).
       */}
      <TabList aria-label="Workspace">
        {(Object.keys(ROUTES) as Route[]).map((key) => {
          return (
            <Tab key={key} id={key}>
              {ROUTES[key].label}
            </Tab>
          );
        })}
      </TabList>
      <Stack gap="sm">
        <Text variant="label-sm" tone="muted">
          Resources
        </Text>
        <Link href="https://fsl-storybook.ttoss.dev" target="_blank">
          Component docs
        </Link>
        <Link href="https://ttoss.dev/docs/design/" target="_blank">
          Design system
        </Link>
      </Stack>
    </Stack>
  );
};

/**
 * The product chrome: header (brand, workspace, mode, account), sidebar
 * navigation, and the routed page inside a centered content column. The
 * whole frame lives inside one `Tabs` scope so the sidebar TabList and the
 * main-region TabPanel share selection state across AppShell slots.
 */
export const AppFrame = ({
  route,
  session,
}: {
  route: Route;
  session: Session;
}) => {
  return (
    <Tabs
      orientation="vertical"
      selectedKey={route}
      onSelectionChange={(key) => {
        navigate(key as Route);
      }}
    >
      {/*
       * Tabs' root imposes a co-located `flex` row (list | panel); hosting an
       * app frame inside it needs the width restored (FRICTION F-017).
       */}
      <Box width="full">
        <AppShell
          header={
            <Box paddingInline="md" paddingBlock="sm">
              <HeaderBar session={session} />
            </Box>
          }
          sidebar={
            <Box padding="md">
              <SidebarNav />
            </Box>
          }
          sidebarLabel="Workspace navigation"
        >
          <Box paddingBlock="lg">
            <Container size="surface" gutter="section">
              {(Object.keys(ROUTES) as Route[]).map((key) => {
                return (
                  <TabPanel key={key} id={key}>
                    {PAGES[key]}
                  </TabPanel>
                );
              })}
            </Container>
          </Box>
        </AppShell>
      </Box>
    </Tabs>
  );
};
