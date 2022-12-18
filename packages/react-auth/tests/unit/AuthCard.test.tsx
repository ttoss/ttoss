import { AuthCard, LogoProvider } from '../../src/AuthCard';
import { render, screen } from '@ttoss/test-utils';

test('render AuthCard with logo', () => {
  const title = 'title';
  const children = 'children';
  const logo = 'logo';
  const buttonLabel = 'button label';
  const link1 = 'link1';
  const link2 = 'link2';

  const onClick = jest.fn();

  render(
    <LogoProvider logo={logo}>
      <AuthCard
        {...{
          title,
          buttonLabel,
          links: [
            {
              onClick,
              label: link1,
            },
            {
              onClick,
              label: link2,
            },
          ],
        }}
      >
        {children}
      </AuthCard>
    </LogoProvider>
  );

  expect(screen.getByText(title)).toBeInTheDocument();
  expect(screen.getByText(logo)).toBeInTheDocument();
  expect(screen.getByText(children)).toBeInTheDocument();
  expect(screen.getByText(link1)).toBeInTheDocument();
  expect(screen.getByText(link2)).toBeInTheDocument();
});
