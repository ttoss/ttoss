import { render, screen } from '@ttoss/test-utils';
import { Layout, StackedLayout } from 'src/index';

test('should render stacked layout from StackedLayout components', () => {
  render(
    <StackedLayout>
      <Layout.Header>Header</Layout.Header>
      <Layout.Main>Main</Layout.Main>
      <Layout.Footer>Footer</Layout.Footer>
      <div>Extra</div>
    </StackedLayout>
  );

  expect(screen.getByText('Header')).toBeInTheDocument();
  expect(screen.getByText('Main')).toBeInTheDocument();
  expect(screen.getByText('Footer')).toBeInTheDocument();
  expect(screen.queryByText('Extra')).not.toBeInTheDocument();
});
