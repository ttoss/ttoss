import {
  AppShell,
  Box,
  Heading,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
} from '@ttoss/fsl-ui';
import type * as React from 'react';

import { BlocksPage } from '../pages/BlocksPage';
import { ComponentsPage } from '../pages/ComponentsPage';
import { OverviewPage } from '../pages/OverviewPage';
import { ThemePage } from '../pages/ThemePage';
import { ModeToggle } from './ModeToggle';
import { type RouteId, ROUTES } from './routes';
import { useHashRoute } from './useHashRoute';

const PAGES: Record<RouteId, React.ReactNode> = {
  overview: <OverviewPage />,
  blocks: <BlocksPage />,
  components: <ComponentsPage />,
  theme: <ThemePage />,
};

/**
 * The Studio frame: a deliberately conventional shell — header, sidebar
 * navigation, main content. Navigation is a vertical `Tabs` (Navigation
 * entity, keyboard + selection from React Aria) whose selected key is bound
 * to the URL hash; the `AppShell` primitive owns the viewport grid.
 *
 * Friction log #2/#3 record why this is Tabs and not a list of `Link`s.
 */
export const Shell = () => {
  const { route, navigate } = useHashRoute();

  return (
    <Tabs
      orientation="vertical"
      selectedKey={route}
      onSelectionChange={(key) => {
        navigate(key as RouteId);
      }}
    >
      <AppShell
        sidebarLabel="Studio sections"
        header={
          <Box paddingInline="md" paddingBlock="sm">
            <Stack
              direction="horizontal"
              gap="md"
              align="center"
              justify="between"
            >
              <Stack direction="horizontal" gap="sm" align="center">
                <Heading level={1} size="title-sm">
                  FSL Studio
                </Heading>
                <Text as="span" variant="label-sm" tone="muted">
                  fsl-theme + fsl-ui proving ground
                </Text>
              </Stack>
              <ModeToggle />
            </Stack>
          </Box>
        }
        sidebar={
          <Box padding="sm">
            <TabList aria-label="Studio sections">
              {ROUTES.map((item) => {
                return (
                  <Tab key={item.id} id={item.id}>
                    {item.label}
                  </Tab>
                );
              })}
            </TabList>
          </Box>
        }
      >
        {ROUTES.map((item) => {
          return (
            <TabPanel key={item.id} id={item.id}>
              {PAGES[item.id]}
            </TabPanel>
          );
        })}
      </AppShell>
    </Tabs>
  );
};
