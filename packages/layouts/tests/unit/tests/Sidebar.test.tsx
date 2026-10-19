import { render, screen, userEvent } from '@ttoss/test-utils/react';
import { Layout, SidebarCollapseLayout } from 'src/index';
import { useIsDesktop } from 'src/useIsDesktop';

jest.mock('src/useIsDesktop');

const renderLayout = ({
  sidebarProps = {},
}: {
  sidebarProps?: React.ComponentProps<typeof Layout.Sidebar>;
} = {}) => {
  return render(
    <SidebarCollapseLayout>
      <Layout.Header showSidebarButton>Header</Layout.Header>
      <Layout.Main>
        <Layout.Main.Body>Main</Layout.Main.Body>
      </Layout.Main>
      <Layout.Sidebar {...sidebarProps}>Sidebar</Layout.Sidebar>
    </SidebarCollapseLayout>
  );
};

test('sidebar starts closed on mobile', () => {
  jest.mocked(useIsDesktop).mockReturnValue({ isDesktop: false });

  renderLayout();

  expect(screen.queryByText('Sidebar')).not.toBeInTheDocument();
  expect(screen.getByTestId('sidebar-button')).toHaveAttribute(
    'aria-expanded',
    'false'
  );
});

test('sidebar follows screen-size changes', () => {
  jest.mocked(useIsDesktop).mockReturnValue({ isDesktop: false });

  const { rerender } = renderLayout();

  expect(screen.queryByText('Sidebar')).not.toBeInTheDocument();

  jest.mocked(useIsDesktop).mockReturnValue({ isDesktop: true });

  rerender(
    <SidebarCollapseLayout>
      <Layout.Header showSidebarButton>Header</Layout.Header>
      <Layout.Main>
        <Layout.Main.Body>Main</Layout.Main.Body>
      </Layout.Main>
      <Layout.Sidebar>Sidebar</Layout.Sidebar>
    </SidebarCollapseLayout>
  );

  expect(screen.getByText('Sidebar')).toBeInTheDocument();

  jest.mocked(useIsDesktop).mockReturnValue({ isDesktop: false });

  rerender(
    <SidebarCollapseLayout>
      <Layout.Header showSidebarButton>Header</Layout.Header>
      <Layout.Main>
        <Layout.Main.Body>Main</Layout.Main.Body>
      </Layout.Main>
      <Layout.Sidebar>Sidebar</Layout.Sidebar>
    </SidebarCollapseLayout>
  );

  expect(screen.queryByText('Sidebar')).not.toBeInTheDocument();
});

test('mobile sidebar opens in a drawer and closes when clicked', async () => {
  const user = userEvent.setup();

  jest.mocked(useIsDesktop).mockReturnValue({ isDesktop: false });

  renderLayout({
    sidebarProps: {
      showSidebarButtonInDrawer: true,
      drawerSlot: <span>Drawer slot</span>,
    },
  });

  const [headerButton] = screen.getAllByTestId('sidebar-button');

  await user.click(headerButton);

  expect(screen.getByText('Sidebar')).toBeInTheDocument();
  expect(screen.getByText('Drawer slot')).toBeInTheDocument();
  expect(screen.getAllByTestId('sidebar-button')).toHaveLength(2);

  await user.click(screen.getByText('Sidebar'));

  expect(screen.queryByText('Sidebar')).not.toBeInTheDocument();
});

test('mobile drawer renders the sidebar button without a drawer slot', async () => {
  const user = userEvent.setup();

  jest.mocked(useIsDesktop).mockReturnValue({ isDesktop: false });

  renderLayout({ sidebarProps: { showSidebarButtonInDrawer: true } });

  const [headerButton] = screen.getAllByTestId('sidebar-button');

  await user.click(headerButton);

  expect(screen.getByText('Sidebar')).toBeInTheDocument();
  expect(screen.getAllByTestId('sidebar-button')).toHaveLength(2);
});

test('open desktop sidebar keeps the muted border color on its right border', () => {
  jest.mocked(useIsDesktop).mockReturnValue({ isDesktop: true });

  renderLayout();

  const sidebar = screen.getByRole('complementary');
  const rule = Array.from(document.styleSheets)
    .flatMap((sheet) => {
      return Array.from(sheet.cssRules).map((cssRule) => {
        return cssRule.cssText;
      });
    })
    .find((cssText) => {
      return sidebar.className.split(' ').some((className) => {
        return cssText.startsWith(`.${className} `);
      });
    });

  // `border-right` without a color resets `border-right-color`, so the color
  // must be declared after it.
  expect(
    rule?.lastIndexOf('border-color: display.border.muted.default')
  ).toBeGreaterThan(rule?.lastIndexOf('border-right:') ?? Infinity);
});
