import { AuthCard, LogoProvider } from '../../src/AuthCard';
import { render, screen } from '@ttoss/test-utils';

test('render AuthCard with logo', () => {
  const title = 'title';
  const children = 'children';
  const logo = 'logo';
  const buttonLabel = 'button label';
  const extraButtonLabel = 'extra button label';
  const extraButton = <button type="button">{extraButtonLabel}</button>;

  render(
    <LogoProvider logo={logo}>
      <AuthCard
        {...{
          title,
          buttonLabel,
          extraButton,
        }}
      >
        {children}
      </AuthCard>
    </LogoProvider>
  );

  expect(screen.getByText(title)).toBeInTheDocument();
  expect(screen.getByText(logo)).toBeInTheDocument();
  expect(screen.getByText(children)).toBeInTheDocument();
  expect(screen.getByText(extraButtonLabel)).toBeInTheDocument();
});
