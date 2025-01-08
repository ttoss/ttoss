import { render, screen } from '@ttoss/test-utils';
import { Footer, Header, Main, StackedLayout } from 'src/index';

test('should render stacked layout from StackedLayout components', () => {
  render(
    <StackedLayout>
      <Header>Header</Header>
      <Main>Main</Main>
      <Footer>Footer</Footer>
      <div>Extra</div>
    </StackedLayout>
  );

  expect(screen.getByText('Header')).toBeInTheDocument();
  expect(screen.getByText('Main')).toBeInTheDocument();
  expect(screen.getByText('Footer')).toBeInTheDocument();
  expect(screen.queryByText('Extra')).not.toBeInTheDocument();
});

test('should render stacked layout from Layout component', () => {
  render(
    <StackedLayout>
      <Header>Header</Header>
      <Main>Main</Main>
      <Footer>Footer</Footer>
      <div>Extra</div>
    </StackedLayout>
  );

  expect(screen.getByText('Header')).toBeInTheDocument();
  expect(screen.getByText('Main')).toBeInTheDocument();
  expect(screen.getByText('Footer')).toBeInTheDocument();
  expect(screen.queryByText('Extra')).not.toBeInTheDocument();
});
