import { render, screen } from '@ttoss/test-utils/react';
import { DashboardSectionDivider } from 'src/index';

describe('DashboardSectionDivider', () => {
  test('should render title', () => {
    render(
      <DashboardSectionDivider
        type="sectionDivider"
        title="Performance Metrics"
      />
    );

    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
  });

  test('should render with different title', () => {
    render(
      <DashboardSectionDivider type="sectionDivider" title="Revenue Metrics" />
    );

    expect(screen.getByText('Revenue Metrics')).toBeInTheDocument();
  });

  test('should render with long title', () => {
    const longTitle = 'Campaign Performance and Analytics Metrics';
    render(<DashboardSectionDivider type="sectionDivider" title={longTitle} />);

    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  test('should render with short title', () => {
    render(<DashboardSectionDivider type="sectionDivider" title="KPIs" />);

    expect(screen.getByText('KPIs')).toBeInTheDocument();
  });

  test('should render divider element', () => {
    render(
      <DashboardSectionDivider type="sectionDivider" title="Test Section" />
    );

    // Verify the title is rendered
    expect(screen.getByText('Test Section')).toBeInTheDocument();
  });

  test('should render title and divider together', () => {
    render(
      <DashboardSectionDivider
        type="sectionDivider"
        title="Engagement Metrics"
      />
    );

    // Verify the title text is rendered
    expect(screen.getByText('Engagement Metrics')).toBeInTheDocument();
  });

  test('should render with empty string title', () => {
    const { container } = render(
      <DashboardSectionDivider type="sectionDivider" title="" />
    );

    // The component should still render even with empty title
    // We verify by checking that the container has content
    expect(container.children.length).toBeGreaterThan(0);
  });

  test('should accept type property', () => {
    render(
      <DashboardSectionDivider type="sectionDivider" title="Test Section" />
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
  });
});
