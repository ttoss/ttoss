import { render, screen, userEvent } from '@ttoss/test-utils';
import { Layout, SidebarCollapseLayout } from 'src/index';

test('should render layout from SidebarCollapseLayout component', () => {
  render(
    <SidebarCollapseLayout>
      <Layout.Header>Header</Layout.Header>
      <Layout.Main>Main</Layout.Main>
      <Layout.Sidebar>Sidebar</Layout.Sidebar>
      <div>Extra</div>
    </SidebarCollapseLayout>
  );

  expect(screen.getByText('Header')).toBeInTheDocument();
  expect(screen.getByText('Main')).toBeInTheDocument();
  expect(screen.getByText('Sidebar')).toBeInTheDocument();
  expect(screen.queryByText('Extra')).not.toBeInTheDocument();
});

test('should toggle sidebar visibility with proper accessibility', async () => {
  const user = userEvent.setup();

  render(
    <SidebarCollapseLayout>
      <Layout.Header showSidebarButton>Header</Layout.Header>
      <Layout.Main>Main</Layout.Main>
      <Layout.Sidebar>Sidebar</Layout.Sidebar>
    </SidebarCollapseLayout>
  );

  const button = screen.getByTestId('sidebar-button');

  // Test button accessibility
  expect(button).toHaveAttribute('aria-label');
  expect(button).toHaveAttribute('aria-expanded', 'true');

  // Test hiding
  await user.click(button);
  expect(screen.queryByText('Sidebar')).not.toBeInTheDocument();
  expect(button).toHaveAttribute('aria-expanded', 'false');

  // Test showing
  await user.click(button);
  expect(screen.getByText('Sidebar')).toBeInTheDocument();
  expect(button).toHaveAttribute('aria-expanded', 'true');
});

test('should support keyboard navigation', async () => {
  const user = userEvent.setup();
  render(
    <SidebarCollapseLayout>
      <Layout.Header showSidebarButton>Header</Layout.Header>
      <Layout.Main>Main</Layout.Main>
      <Layout.Sidebar>Sidebar</Layout.Sidebar>
    </SidebarCollapseLayout>
  );

  const button = screen.getByTestId('sidebar-button');

  // Focus the button
  await user.tab();
  expect(button).toHaveFocus();

  // Toggle with keyboard
  await user.keyboard('{Enter}');
  expect(screen.queryByText('Sidebar')).not.toBeInTheDocument();

  await user.keyboard('{Enter}');
  expect(screen.getByText('Sidebar')).toBeInTheDocument();
});
