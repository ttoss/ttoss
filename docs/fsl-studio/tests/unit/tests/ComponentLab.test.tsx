import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTheme } from '@ttoss/fsl-theme';
import { ThemeProvider } from '@ttoss/fsl-theme/react';
import { App } from 'src/App';
import { ComponentInspector } from 'src/studio/components/ComponentInspector';
import { ComponentStageContent } from 'src/studio/components/ComponentStageContent';
import {
  ComponentStoreProvider,
  useComponentStore,
} from 'src/studio/components/componentStore';

const openComponentsLens = async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: /Explore components/ }));
  return user;
};

const navigator = () => {
  return screen.getByRole('complementary', { name: 'Navigator' });
};

const inspector = () => {
  return screen.getByRole('complementary', { name: 'Inspector' });
};

test('navigator lists entity groups, components, and example pages', async () => {
  await openComponentsLens();
  const nav = navigator();
  expect(within(nav).getByText('Action')).toBeInTheDocument();
  expect(within(nav).getByText('Example pages')).toBeInTheDocument();
  expect(
    within(nav).getByRole('button', { name: 'Button' })
  ).toBeInTheDocument();
});

test('selecting a component shows its identity, legal props, and a snippet', async () => {
  const user = await openComponentsLens();
  await user.click(within(navigator()).getByRole('button', { name: 'Button' }));

  const insp = inspector();
  expect(within(insp).getByText('Button')).toBeInTheDocument();
  expect(within(insp).getByText('Action')).toBeInTheDocument();

  // Legal evaluation + consequence chips come from the matrices (Action).
  expect(
    within(insp).getByRole('button', { name: 'primary' })
  ).toBeInTheDocument();
  expect(
    within(insp).getByRole('button', { name: 'negative' })
  ).toBeInTheDocument();
  expect(
    within(insp).getByRole('button', { name: 'destructive' })
  ).toBeInTheDocument();

  // Copy snippet present.
  expect(screen.getByTestId('component-code').textContent).toContain('<Button');
});

test('picking legal props re-renders the preview and resets to default', async () => {
  const user = await openComponentsLens();
  await user.click(within(navigator()).getByRole('button', { name: 'Button' }));

  await user.click(within(inspector()).getByRole('button', { name: 'accent' }));
  let previews = screen.getAllByRole('button', { name: 'Save changes' });
  expect(previews[0]).toHaveAttribute('data-evaluation', 'accent');

  // A consequence is legal on Action — pick one, then reset evaluation to default.
  await user.click(
    within(inspector()).getByRole('button', { name: 'destructive' })
  );
  previews = screen.getAllByRole('button', { name: 'Save changes' });
  expect(previews[0]).toHaveAttribute('data-consequence', 'destructive');

  // The first "default" chip belongs to the evaluation selector.
  await user.click(
    within(inspector()).getAllByRole('button', { name: 'default' })[0]
  );
  previews = screen.getAllByRole('button', { name: 'Save changes' });
  expect(previews[0]).not.toHaveAttribute('data-evaluation', 'accent');
});

test('an entity without evaluation shows the runtime-state note', async () => {
  const user = await openComponentsLens();
  await user.click(within(navigator()).getByRole('button', { name: 'Switch' }));
  expect(within(inspector()).getByText(/carries no/)).toBeInTheDocument();
});

test('a catalog part without a preview shows an identity card', async () => {
  const user = await openComponentsLens();
  await user.click(
    within(navigator()).getByRole('button', { name: 'DialogHeading' })
  );
  expect(
    within(inspector()).getByText(/isn.t in the registry yet/)
  ).toBeInTheDocument();
  // Stage shows the identity card, not a snippet.
  expect(screen.queryByTestId('component-code')).not.toBeInTheDocument();
});

test('selecting an example page renders it on the stage', async () => {
  const user = await openComponentsLens();
  await user.click(
    within(navigator()).getByRole('button', { name: 'Form + validation' })
  );
  expect(
    within(inspector()).getByText(/Rendered live on the stage/)
  ).toBeInTheDocument();
  // The form's email field renders (twice — one per pane).
  expect(screen.getAllByLabelText('Email').length).toBe(2);
});

test('the Generate lens shows its placeholder panels', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(
    screen.getByRole('button', { name: /Generate a composite/ })
  );

  expect(
    within(navigator()).getByText(/session compositions will live here/)
  ).toBeInTheDocument();
  expect(
    within(inspector()).getByText(/prompt bar will live here/)
  ).toBeInTheDocument();
});

test('a missing selection renders nothing (defensive null paths)', async () => {
  const user = userEvent.setup();
  const Harness = () => {
    const store = useComponentStore();
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            return store.selectComponent('__missing__');
          }}
        >
          break
        </button>
        <div data-testid="insp">
          <ComponentInspector />
        </div>
        <div data-testid="stage">
          <ComponentStageContent />
        </div>
      </div>
    );
  };

  render(
    <ThemeProvider theme={createTheme()} defaultMode="light">
      <ComponentStoreProvider>
        <Harness />
      </ComponentStoreProvider>
    </ThemeProvider>
  );

  await user.click(screen.getByRole('button', { name: 'break' }));
  expect(screen.getByTestId('insp')).toBeEmptyDOMElement();
  expect(screen.getByTestId('stage')).toBeEmptyDOMElement();
});
