import { fireEvent, render, screen } from '@testing-library/react';
import { createTheme } from '@ttoss/fsl-theme';
import { ThemeProvider } from '@ttoss/fsl-theme/react';
import { ComponentInspector } from 'src/studio/components/ComponentInspector';
import {
  ComponentStoreProvider,
  useComponentStore,
} from 'src/studio/components/componentStore';

/**
 * Copy-JSX tests live in their own file, driven purely by fireEvent + a store
 * dispatch. `userEvent.setup()` installs a clipboard stub that lingers and
 * shadows our mock, so these tests must not share a file with any
 * userEvent-based test (verified: they pass in isolation, fail when
 * co-located).
 */

const setClipboard = (value: unknown) => {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
};

const InspectorHarness = () => {
  const store = useComponentStore();
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          return store.selectComponent('buttonMeta');
        }}
      >
        select-button
      </button>
      <ComponentInspector />
    </div>
  );
};

const renderInspectorWithButton = () => {
  render(
    <ThemeProvider theme={createTheme()} defaultMode="light">
      <ComponentStoreProvider>
        <InspectorHarness />
      </ComponentStoreProvider>
    </ThemeProvider>
  );
  fireEvent.click(screen.getByRole('button', { name: 'select-button' }));
  expect(screen.getByTestId('component-code').textContent).toContain('<Button');
};

afterEach(() => {
  setClipboard(undefined);
});

test('copy JSX writes to the clipboard on success', async () => {
  renderInspectorWithButton();
  const writeText = jest.fn(() => {
    return Promise.resolve();
  });
  setClipboard({ writeText });
  fireEvent.click(screen.getByRole('button', { name: 'Copy JSX' }));

  expect(writeText).toHaveBeenCalled();
  expect(
    await screen.findByRole('button', { name: 'Copied' })
  ).toBeInTheDocument();
});

test('copy JSX keeps the label on clipboard failure', async () => {
  renderInspectorWithButton();
  const writeText = jest.fn(() => {
    return Promise.reject(new Error('denied'));
  });
  setClipboard({ writeText });
  fireEvent.click(screen.getByRole('button', { name: 'Copy JSX' }));

  expect(writeText).toHaveBeenCalled();
  expect(
    await screen.findByRole('button', { name: 'Copy JSX' })
  ).toBeInTheDocument();
});

test('copy JSX is a no-op without a clipboard', () => {
  renderInspectorWithButton();
  setClipboard(undefined);
  fireEvent.click(screen.getByRole('button', { name: 'Copy JSX' }));

  expect(screen.getByRole('button', { name: 'Copy JSX' })).toBeInTheDocument();
});
