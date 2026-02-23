import * as dashboard from 'src/index';

describe('index exports', () => {
  test('should export public dashboard API', () => {
    expect(dashboard.Dashboard).toBeDefined();
    expect(dashboard.DashboardCard).toBeDefined();
    expect(dashboard.DashboardFilters).toBeDefined();
    expect(dashboard.DashboardGrid).toBeDefined();
    expect(dashboard.DashboardHeader).toBeDefined();
    expect(dashboard.DashboardProvider).toBeDefined();
    expect(dashboard.DashboardSectionDivider).toBeDefined();
    expect(dashboard.createGridItemWithPlacement).toBeDefined();
    expect(dashboard.DEFAULT_CARD_CATALOG).toBeDefined();
    expect(dashboard.useDashboard).toBeDefined();
  });
});
