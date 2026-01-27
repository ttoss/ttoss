import 'react-grid-layout/css/styles.css';

import { Box, Flex, Global, Spinner } from '@ttoss/ui';
import { Responsive, WidthProvider } from 'react-grid-layout';

import type { DashboardTemplate } from './Dashboard';
import { DashboardCard } from './DashboardCard';
import { DashboardSectionDivider } from './DashboardSectionDivider';

const ResponsiveGridLayout = WidthProvider(Responsive);

export const DashboardGrid = ({
  loading,
  selectedTemplate,
}: {
  loading: boolean;
  selectedTemplate?: DashboardTemplate;
}) => {
  if (!selectedTemplate) {
    return null;
  }

  // Breakpoints matching theme breakpoints (in pixels)
  const breakpoints = {
    xs: 0,
    sm: 480,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  };

  // Column counts for each breakpoint
  const cols = {
    xs: 2,
    sm: 2,
    md: 12,
    lg: 12,
    xl: 12,
    '2xl': 12,
  };

  // Convert grid items to layout format (without card property)
  const baseLayout = selectedTemplate.grid.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { card, ...layout } = item;
    return layout;
  });

  // Create responsive layouts - for now, use the same layout for all breakpoints
  // The grid will automatically adjust based on column count
  const layouts = {
    xs: baseLayout,
    sm: baseLayout,
    md: baseLayout,
    lg: baseLayout,
    xl: baseLayout,
    '2xl': baseLayout,
  };

  return (
    <Box sx={{ width: '100%', height: 'full' }}>
      <Global
        styles={{
          '.react-grid-item:has([data-tooltip-id]:hover)': {
            zIndex: 1,
          },
        }}
      />
      {loading ? (
        <Flex
          sx={{
            width: '100%',
            height: 'full',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Spinner />
        </Flex>
      ) : (
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={breakpoints}
          cols={cols}
          rowHeight={32}
          margin={[10, 10]}
          containerPadding={[0, 0]}
        >
          {selectedTemplate.grid.map((item) => {
            if (item.card.type === 'sectionDivider') {
              return (
                <div key={item.i}>
                  <DashboardSectionDivider {...item.card} />
                </div>
              );
            }
            return (
              <div key={item.i}>
                <DashboardCard {...(item.card as DashboardCard)} />
              </div>
            );
          })}
        </ResponsiveGridLayout>
      )}
    </Box>
  );
};
