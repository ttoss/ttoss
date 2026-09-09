/**
 * The provider's own view of a pending pick, driven straight through
 * `useGeovisWorkspace` — what the sidebar renders from it is covered in
 * LeftSidebar.pendingVariation.test.tsx.
 */

import { act, render, screen } from '@ttoss/test-utils/react';
import { GeovisWorkspaceProvider, useGeovisWorkspace } from 'src';

/** A promise held open until the test decides how it ends. */
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res as typeof resolve;
  });

  return { promise, resolve };
};

const Probe = () => {
  const { setSelection, pendingSelection } = useGeovisWorkspace();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSelection({ menuId: 'metric', value: 'a', blocking: true });
        }}
      >
        pick a
      </button>
      <button
        type="button"
        onClick={() => {
          setSelection({ menuId: 'metric', value: 'b', blocking: true });
        }}
      >
        pick b
      </button>
      <span data-testid="pending">{pendingSelection?.value ?? 'none'}</span>
    </>
  );
};

const pending = () => {
  return screen.getByTestId('pending').textContent;
};

test('a late settle cannot release a wait that is no longer its own', async () => {
  const first = deferred();
  const second = deferred();
  const queue = [first.promise, second.promise];

  render(
    <GeovisWorkspaceProvider
      config={{}}
      onSelectionChange={() => {
        return queue.shift();
      }}
    >
      <Probe />
    </GeovisWorkspaceProvider>
  );

  // The menus keep a consumer from stacking picks, but the provider is public
  // API: a custom surface can start a second wait while the first is open.
  await act(async () => {
    screen.getByText('pick a').click();
  });
  expect(pending()).toBe('a');

  await act(async () => {
    screen.getByText('pick b').click();
  });
  expect(pending()).toBe('b');

  // The first request lands last. Releasing here would unlock menus that the
  // second wait is still holding.
  await act(async () => {
    first.resolve();
  });
  expect(pending()).toBe('b');

  await act(async () => {
    second.resolve();
  });
  expect(pending()).toBe('none');
});
