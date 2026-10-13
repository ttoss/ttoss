/**
 * The bearing setting: a compass dial, its ±45° rotate buttons and the
 * back-to-north button, publishing whole degrees under its `menuId`.
 */

import { act, fireEvent, render, screen } from '@ttoss/test-utils/react';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSidebarBearingSetting,
} from 'src';

import { click, Provider, visualizationSpec } from './leftSidebarTestUtils';

jest.mock('@ttoss/geovis', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the factory is hoisted above imports
  return require('./leftSidebarTestUtils').createGeoVisMock();
});

// jsdom has no PointerEvent; without it `fireEvent.pointerDown` drops the
// coordinates the dial reads its angle from.
if (typeof window.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
    }
  }
  window.PointerEvent = PointerEventPolyfill as typeof PointerEvent;
}

const configWith = (
  control: Partial<GeovisWorkspaceSidebarBearingSetting> = {}
): GeovisWorkspaceConfig => {
  return {
    leftSidebar: {
      initialState: 'open',
      sections: [
        {
          id: 'configuracoes',
          header: { title: 'Configurações', icon: 'lucide:settings' },
          body: {
            kind: 'settings',
            blocks: [
              {
                id: 'rotacao',
                title: 'Rotação da câmera',
                hint: 'Arraste o disco.',
                control: { kind: 'bearing', menuId: 'bearing', ...control },
              },
            ],
          },
        },
      ],
    },
  };
};

const renderBearing = async ({
  control,
  variables,
}: {
  control?: Partial<GeovisWorkspaceSidebarBearingSetting>;
  variables?: Record<string, string>;
} = {}) => {
  const onVariableChange = jest.fn();
  render(
    <GeovisWorkspace
      config={configWith(control)}
      visualizationSpec={visualizationSpec}
      variables={variables}
      onVariableChange={onVariableChange}
    />,
    { wrapper: Provider }
  );
  await click(screen.getByRole('button', { name: 'Configurações' }));
  return { onVariableChange };
};

const dial = () => {
  return screen.getByRole('slider', { name: 'Camera rotation' });
};

const published = (bearing: string) => {
  return expect.objectContaining({ bearing });
};

/** A 68×68 dial at the origin, so its centre is (34, 34). */
const placeDial = () => {
  jest.spyOn(dial(), 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 68,
    height: 68,
    right: 68,
    bottom: 68,
    x: 0,
    y: 0,
    toJSON: () => {
      return {};
    },
  });
};

test('starts north up and publishes 0 when no default is given', async () => {
  const { onVariableChange } = await renderBearing();

  expect(dial()).toHaveAttribute('aria-valuenow', '0');
  expect(dial()).toHaveAttribute('aria-valuetext', 'N · 0°');
  expect(screen.getByText('N · 0°')).toBeInTheDocument();
  expect(screen.getByText('Arraste o disco.')).toBeInTheDocument();
  expect(onVariableChange).toHaveBeenCalledWith(published('0'));
  expect(screen.getByRole('button', { name: 'Back to north' })).toBeDisabled();
});

test('starts at the default, wrapped into 0–359', async () => {
  const { onVariableChange } = await renderBearing({
    control: { defaultValue: -25 },
  });

  expect(dial()).toHaveAttribute('aria-valuenow', '335');
  expect(screen.getByText('NW · 335°')).toBeInTheDocument();
  expect(onVariableChange).toHaveBeenCalledWith(published('335'));
  expect(screen.getByTestId('bearing-needle')).toHaveStyle({
    transform: 'rotate(335deg)',
  });
});

test('seeds from the selection, and lands a stray value on the circle', async () => {
  await renderBearing({ variables: { bearing: '400' } });
  expect(dial()).toHaveAttribute('aria-valuenow', '40');

  expect(screen.getByText('NE · 40°')).toBeInTheDocument();
});

test('a non-numeric selection value reads as north', async () => {
  await renderBearing({ variables: { bearing: 'east' } });
  expect(dial()).toHaveAttribute('aria-valuenow', '0');
});

test('the rotate buttons step 45° from the nearest cardinal point', async () => {
  const { onVariableChange } = await renderBearing({
    control: { defaultValue: 37 },
  });

  await click(screen.getByRole('button', { name: 'Rotate 45° right' }));
  expect(dial()).toHaveAttribute('aria-valuenow', '90');
  expect(onVariableChange).toHaveBeenLastCalledWith(published('90'));

  await click(screen.getByRole('button', { name: 'Rotate 45° left' }));
  await click(screen.getByRole('button', { name: 'Rotate 45° left' }));
  await click(screen.getByRole('button', { name: 'Rotate 45° left' }));
  expect(dial()).toHaveAttribute('aria-valuenow', '315');
  expect(screen.getByText('NW · 315°')).toBeInTheDocument();
});

test('back to north levels the bearing at 0', async () => {
  const { onVariableChange } = await renderBearing({
    control: { defaultValue: 120 },
  });
  const north = screen.getByRole('button', { name: 'Back to north' });
  expect(north).toBeEnabled();

  await click(north);

  expect(dial()).toHaveAttribute('aria-valuenow', '0');
  expect(onVariableChange).toHaveBeenLastCalledWith(published('0'));
  expect(north).toBeDisabled();
});

test('the arrow keys step by the control step, Shift by 45°', async () => {
  await renderBearing({ control: { step: 10 } });

  fireEvent.keyDown(dial(), { key: 'ArrowRight' });
  expect(dial()).toHaveAttribute('aria-valuenow', '10');
  fireEvent.keyDown(dial(), { key: 'ArrowUp' });
  expect(dial()).toHaveAttribute('aria-valuenow', '20');
  fireEvent.keyDown(dial(), { key: 'ArrowLeft', shiftKey: true });
  expect(dial()).toHaveAttribute('aria-valuenow', '335');
  fireEvent.keyDown(dial(), { key: 'ArrowDown' });
  expect(dial()).toHaveAttribute('aria-valuenow', '325');
  fireEvent.keyDown(dial(), { key: 'Enter' });
  expect(dial()).toHaveAttribute('aria-valuenow', '325');
});

test('a drag turns the needle to the pointer, snapped to the step', async () => {
  const { onVariableChange } = await renderBearing();
  placeDial();

  // Straight right of the centre: east.
  await act(async () => {
    fireEvent.pointerDown(dial(), { clientX: 60, clientY: 34, pointerId: 1 });
  });
  expect(dial()).toHaveAttribute('aria-valuenow', '90');
  expect(onVariableChange).toHaveBeenLastCalledWith(published('90'));
  // Unanimated while dragged, so the needle stays under the pointer.
  expect(screen.getByTestId('bearing-needle')).toHaveStyle({
    transition: 'none',
  });

  // Down and a little left: 188.7°, snapped to 190°.
  await act(async () => {
    fireEvent.pointerMove(dial(), { clientX: 30, clientY: 60, pointerId: 1 });
  });
  expect(dial()).toHaveAttribute('aria-valuenow', '190');

  await act(async () => {
    fireEvent.pointerUp(dial(), { pointerId: 1 });
  });
  // Released: a move no longer turns it.
  await act(async () => {
    fireEvent.pointerMove(dial(), { clientX: 34, clientY: 0, pointerId: 1 });
  });
  expect(dial()).toHaveAttribute('aria-valuenow', '190');
  expect(screen.getByTestId('bearing-needle')).not.toHaveStyle({
    transition: 'none',
  });
});

test('a cancelled pointer ends the drag', async () => {
  await renderBearing();
  placeDial();

  await act(async () => {
    fireEvent.pointerDown(dial(), { clientX: 34, clientY: 60, pointerId: 1 });
  });
  expect(dial()).toHaveAttribute('aria-valuenow', '180');

  await act(async () => {
    fireEvent.pointerCancel(dial(), { pointerId: 1 });
  });
  await act(async () => {
    fireEvent.pointerMove(dial(), { clientX: 60, clientY: 34, pointerId: 1 });
  });
  expect(dial()).toHaveAttribute('aria-valuenow', '180');
});

test('a block gated on a bearing resolves the default before it publishes', async () => {
  const onVariableChange = jest.fn();
  render(
    <GeovisWorkspace
      config={{
        leftSidebar: {
          initialState: 'open',
          sections: [
            {
              id: 'configuracoes',
              header: { title: 'Configurações', icon: 'lucide:settings' },
              body: {
                kind: 'settings',
                blocks: [
                  {
                    id: 'rotacao',
                    title: 'Rotação',
                    shownWhen: { menuId: 'bearing', values: ['0'] },
                    control: { kind: 'bearing', menuId: 'bearing' },
                  },
                ],
              },
            },
          ],
        },
      }}
      visualizationSpec={visualizationSpec}
      onVariableChange={onVariableChange}
    />,
    { wrapper: Provider }
  );
  await click(screen.getByRole('button', { name: 'Configurações' }));

  expect(dial()).toBeInTheDocument();
});

test('back to north is faded at north and a call to action once turned', async () => {
  await renderBearing();
  const north = screen.getByRole('button', { name: 'Back to north' });
  expect(north).toHaveStyle({ fontWeight: '400' });

  await click(screen.getByRole('button', { name: 'Rotate 45° right' }));

  expect(north).toHaveStyle({ fontWeight: '500' });
});
