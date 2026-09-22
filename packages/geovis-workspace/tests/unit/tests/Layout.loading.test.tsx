/**
 * What the app draws over the map while a variation is being served. The lock
 * on the menus themselves is covered in LeftSidebar.pendingVariation.test.tsx.
 *
 * Variation-only falls out of the mechanism rather than from a gate here:
 * `blocking` is what arms the wait, and only the two variation controls pass
 * it. That the timeline does not is pinned in LeftSidebar.pendingVariation.
 */

import { act, render, screen, waitFor } from '@ttoss/test-utils/react';
import type * as React from 'react';
import { GeovisWorkspace } from 'src';

import {
  click,
  type Preview,
  Provider,
  visualizationSpec,
} from './leftSidebarTestUtils';

jest.mock('@ttoss/geovis', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the factory is hoisted above imports
  return require('./leftSidebarTestUtils').createGeoVisMock();
});

/** A variation menu and a settings slider, so the two waits can be told apart. */
const preview: Preview = {
  sections: [
    {
      id: 'controles',
      header: { title: 'Controles', icon: 'lucide:sliders-horizontal' },
      body: {
        kind: 'filters',
        blocks: [
          {
            id: 'indicador',
            title: 'Indicador',
            control: {
              kind: 'variations',
              menuId: 'variable',
              defaultValue: 'renda',
              variations: [
                { value: 'renda', label: 'Renda média' },
                { value: 'gini', label: 'Índice de Gini' },
              ],
            },
          },
        ],
      },
    },
  ],
};

const Spinner = () => {
  return <div data-testid="spinner">carregando</div>;
};

const renderPreview = (
  props: Partial<React.ComponentProps<typeof GeovisWorkspace>> = {},
  renderLoading?: () => React.ReactNode
) => {
  return render(
    <GeovisWorkspace
      config={{
        leftSidebar: { initialState: 'open', ...preview },
        renderLoading,
      }}
      visualizationSpec={visualizationSpec}
      {...props}
    />,
    { wrapper: Provider }
  );
};

/** A promise held open until the test decides how it ends. */
const deferred = () => {
  let resolve!: (value?: unknown) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise((res, rej) => {
    resolve = res as typeof resolve;
    reject = rej;
  });

  return { promise, resolve, reject };
};

const pickGini = async () => {
  await click(screen.getByRole('button', { name: 'Índice de Gini' }));
};

test('draws nothing before a pick', async () => {
  renderPreview({}, () => {
    return <Spinner />;
  });

  expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
});

test('draws what the app asks for while the variation is in flight', async () => {
  const wait = deferred();
  renderPreview(
    {
      onVariableChange: () => {
        return wait.promise;
      },
    },
    () => {
      return <Spinner />;
    }
  );

  await pickGini();

  expect(screen.getByTestId('spinner')).toBeInTheDocument();

  await act(async () => {
    wait.resolve();
  });

  await waitFor(() => {
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });
});

/*
 * A request that failed is a reason to let the user pick again, so the overlay
 * has to come down on a rejection exactly as it does on a resolve — otherwise
 * the map stays covered with no way back.
 */
test('takes the overlay down when the request fails', async () => {
  const wait = deferred();
  renderPreview(
    {
      onVariableChange: () => {
        return wait.promise.catch(() => {
          return undefined;
        });
      },
    },
    () => {
      return <Spinner />;
    }
  );

  await pickGini();
  expect(screen.getByTestId('spinner')).toBeInTheDocument();

  await act(async () => {
    wait.reject(new Error('nope'));
  });

  await waitFor(() => {
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });
});

/* Optional by design: a config that declares nothing keeps the old behaviour. */
test('draws nothing when the config declares no overlay', async () => {
  const wait = deferred();
  renderPreview({
    onVariableChange: () => {
      return wait.promise;
    },
  });

  await pickGini();

  expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();

  await act(async () => {
    wait.resolve();
  });
});

/*
 * The map underneath must not answer gestures: a pan towards something while
 * the answer is still coming would be spent on a view about to be repainted.
 */
test('covers the map rather than merely sitting over it', async () => {
  const wait = deferred();
  renderPreview(
    {
      onVariableChange: () => {
        return wait.promise;
      },
    },
    () => {
      return <Spinner />;
    }
  );

  await pickGini();

  const overlay = screen.getByTestId('spinner').parentElement;

  expect(overlay).toHaveStyle({ pointerEvents: 'auto' });
  expect(overlay).toHaveAttribute('aria-busy', 'true');

  await act(async () => {
    wait.resolve();
  });
});
