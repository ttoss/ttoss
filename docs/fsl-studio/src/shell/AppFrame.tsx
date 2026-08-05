import { useColorMode } from '@ttoss/fsl-theme/react';
import {
  AppShell,
  Badge,
  Box,
  Button,
  Container,
  Link,
  List,
  ListItem,
  Menu,
  MenuItem,
  MenuTrigger,
  Stack,
  Switch,
  Text,
} from '@ttoss/fsl-ui';
import type * as React from 'react';

import { BillingPage } from '../pages/BillingPage';
import { DashboardPage } from '../pages/DashboardPage';
import { EnvironmentsPage } from '../pages/EnvironmentsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { TeamPage } from '../pages/TeamPage';
import type { Route } from '../router';
import { ROUTES } from '../router';
import type { Session } from '../session';
import { signOut } from '../session';
import { useNavCollapse } from './useNavCollapse';

const PAGES: Record<Route, React.ReactNode> = {
  dashboard: <DashboardPage />,
  environments: <EnvironmentsPage />,
  team: <TeamPage />,
  billing: <BillingPage />,
  settings: <SettingsPage />,
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

const SidebarNav = ({ route }: { route: Route }) => {
  return (
    <Stack gap="xl">
      {/*
       * Primary navigation as links in a real `nav` landmark. It was vertical
       * `Tabs` until `Link` gained `isCurrent` — the F-002 workaround, whose
       * cost turned out to be larger than the missing marker: tab semantics
       * forced the whole frame inside one `Tabs` scope (F-017) and a
       * collection owner cannot be portaled into a drawer (F-042).
       */}
      <nav aria-label="Workspace">
        <List gap="sm">
          {(Object.keys(ROUTES) as Route[]).map((key) => {
            return (
              <ListItem key={key}>
                <Link
                  evaluation="muted"
                  href={ROUTES[key].hash}
                  isCurrent={key === route}
                >
                  {ROUTES[key].label}
                </Link>
              </ListItem>
            );
          })}
        </List>
      </nav>
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
 * navigation, and the routed page inside a centered content column.
 *
 * The frame used to live inside one `Tabs` scope so a sidebar `TabList` could
 * share selection state with a main-region `TabPanel`. That is gone: the nav
 * is links, so the shell is just the shell, and the sidebar can move into a
 * drawer on a narrow viewport (F-002 → F-017 → F-042, closed together).
 */
export const AppFrame = ({
  route,
  session,
}: {
  route: Route;
  session: Session;
}) => {
  // The shell owns the two navigation shapes; the app owns the threshold —
  // the split `families/breakpoints.md` specifies, down to naming this alias.
  const isNavCollapsed = useNavCollapse();

  return (
    <AppShell
      header={
        <Box paddingInline="md" paddingBlock="sm">
          <HeaderBar session={session} />
        </Box>
      }
      sidebar={
        <Box padding="md">
          <SidebarNav route={route} />
        </Box>
      }
      sidebarLabel="Workspace navigation"
      sidebarTriggerLabel="Open workspace navigation"
      sidebarVariant={isNavCollapsed ? 'temporary' : 'permanent'}
    >
      <Box paddingBlock="lg">
        <Container size="surface" gutter="section">
          {PAGES[route]}
        </Container>
      </Box>
    </AppShell>
  );
};
