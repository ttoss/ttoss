/**
 * The custom-color picker the ramp editor's pipette opens. Building and
 * dismissing ramps is covered in LeftSidebar.colorRamp.test.tsx.
 */

import { fireEvent, render, screen, within } from '@ttoss/test-utils/react';
import type { GeovisWorkspaceConfig } from 'src';
import { GeovisWorkspace } from 'src';

import {
  click,
  openConfig,
  Provider,
  visualizationSpec,
} from './leftSidebarTestUtils';

jest.mock('@ttoss/geovis', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the factory is hoisted above imports
  return require('./leftSidebarTestUtils').createGeoVisMock();
});

const buildConfig = (onCreate: jest.Mock): GeovisWorkspaceConfig => {
  return {
    leftSidebar: {
      initialState: 'open',
      sections: [
        {
          id: 'Configurações',
          header: { title: 'Configurações', icon: 'lucide:settings' },
          body: {
            kind: 'settings',
            blocks: [
              {
                id: 'cores',
                title: 'Cor da malha',
                control: {
                  kind: 'colorRamp',
                  menuId: 'cores',
                  options: [
                    {
                      id: 'azuis',
                      label: 'Azuis',
                      colors: ['#C6DBEF', '#6BAED6', '#2171B5', '#08306B'],
                    },
                  ],
                  create: {
                    baseColors: [
                      { id: 'azul', name: 'Azul', color: '#2171B5' },
                    ],
                    onCreate,
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };
};

/** Renders the editor open, and returns the `onCreate` spy. */
const openEditor = async () => {
  const onCreate = jest.fn();
  render(
    <GeovisWorkspace
      config={buildConfig(onCreate)}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );
  await openConfig();
  await click(screen.getByRole('button', { name: 'Nova escala de cor' }));
  return onCreate;
};

const pipette = () => {
  return screen.getByRole('button', { name: 'Cor personalizada' });
};

const picker = () => {
  return screen.queryByRole('dialog', { name: 'Cor personalizada' });
};

const hexField = () => {
  return screen.getByLabelText('Hexadecimal') as HTMLInputElement;
};

const nameField = () => {
  return screen.getByLabelText('Nome da escala') as HTMLInputElement;
};

const setHex = (value: string) => {
  fireEvent.change(hexField(), { target: { value } });
};

const apply = async () => {
  await click(screen.getByRole('button', { name: 'Aplicar' }));
};

describe('the custom-color picker', () => {
  test('the pipette says what it does on hover, and toggles the picker', async () => {
    await openEditor();

    expect(pipette()).toHaveAttribute('title', 'Customizar estilos');
    expect(pipette()).toHaveAttribute('aria-expanded', 'false');

    await click(pipette());
    expect(picker()).toBeInTheDocument();
    expect(pipette()).toHaveAttribute('aria-expanded', 'true');

    await click(pipette());
    expect(picker()).not.toBeInTheDocument();
  });

  /* Portaled out of the sidebar, whose transform would otherwise clip it. */
  test('opens on the base color, outside the sidebar', async () => {
    await openEditor();
    await click(pipette());

    expect(picker()?.parentElement).toBe(document.body);
    expect(hexField().value).toBe('2171B5');
  });

  test('takes hex digits only, and holds an incomplete code', async () => {
    await openEditor();
    await click(pipette());

    setHex('zz12ab3');
    expect(hexField().value).toBe('12AB3');
    expect(hexField()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeDisabled();

    fireEvent.keyDown(hexField(), { key: 'Enter' });
    expect(picker()).toBeInTheDocument();
  });

  test('applies a full code on Enter, into the base and the empty name', async () => {
    const onCreate = await openEditor();
    await click(pipette());

    setHex('12ab34');
    fireEvent.keyDown(hexField(), { key: 'a' });
    expect(picker()).toBeInTheDocument();
    fireEvent.keyDown(hexField(), { key: 'Enter' });

    expect(picker()).not.toBeInTheDocument();
    expect(nameField().value).toBe('#12AB34');

    await click(screen.getByRole('button', { name: 'Adicionar' }));
    expect(onCreate.mock.calls[0][0].baseColor).toBe('#12ab34');
  });

  test('keeps a name the reader typed, and replaces its own code', async () => {
    await openEditor();

    await click(pipette());
    setHex('111111');
    await apply();
    await click(pipette());
    setHex('222222');
    await apply();
    expect(nameField().value).toBe('#222222');

    fireEvent.change(nameField(), { target: { value: 'Minha' } });
    await click(pipette());
    setHex('333333');
    await apply();
    expect(nameField().value).toBe('Minha');
  });

  test.each([
    [
      'the cancel button',
      async () => {
        // The editor has a "Cancelar" of its own; this is the picker's.
        await click(
          within(picker()!).getByRole('button', { name: 'Cancelar' })
        );
      },
    ],
    [
      'Escape',
      async () => {
        fireEvent.keyDown(document, { key: 'Escape' });
      },
    ],
    [
      'a press outside',
      async () => {
        fireEvent.pointerDown(document.body);
      },
    ],
  ])('closes on %s without changing the base', async (_name, close) => {
    const onCreate = await openEditor();
    await click(pipette());
    setHex('ff0000');

    await close();

    expect(picker()).not.toBeInTheDocument();
    expect(nameField().value).toBe('');
    await click(screen.getByRole('button', { name: 'Adicionar' }));
    expect(onCreate.mock.calls[0][0].baseColor).toBe('#2171B5');
  });

  test('stays open on a press inside it, or on the pipette', async () => {
    await openEditor();
    await click(pipette());

    fireEvent.pointerDown(hexField());
    fireEvent.pointerDown(pipette());
    fireEvent.keyDown(document, { key: 'Enter' });

    expect(picker()).toBeInTheDocument();
  });

  test('the hue bar steps with the arrows, ten at a time with Shift', async () => {
    await openEditor();
    await click(pipette());
    setHex('ff0000');
    const hue = screen.getByRole('slider', { name: 'Matiz' });

    fireEvent.keyDown(hue, { key: 'ArrowRight' });
    expect(hue).toHaveAttribute('aria-valuenow', '1');
    fireEvent.keyDown(hue, { key: 'ArrowUp', shiftKey: true });
    expect(hue).toHaveAttribute('aria-valuenow', '11');
    fireEvent.keyDown(hue, { key: 'ArrowDown' });
    fireEvent.keyDown(hue, { key: 'ArrowLeft' });
    expect(hue).toHaveAttribute('aria-valuenow', '9');
    fireEvent.keyDown(hue, { key: 'Home' });
    expect(hue).toHaveAttribute('aria-valuenow', '9');
    expect(hexField().value).not.toBe('FF0000');
  });

  test('the square moves saturation and brightness with the arrows', async () => {
    await openEditor();
    await click(pipette());
    setHex('808080');
    const square = screen.getByRole('group', { name: 'Saturação e brilho' });

    fireEvent.keyDown(square, { key: 'ArrowUp', shiftKey: true });
    const brighter = hexField().value;
    expect(brighter).not.toBe('808080');

    fireEvent.keyDown(square, { key: 'ArrowRight' });
    fireEvent.keyDown(square, { key: 'ArrowLeft' });
    fireEvent.keyDown(square, { key: 'ArrowDown' });
    fireEvent.keyDown(square, { key: 'Tab' });
    expect(hexField().value).not.toBe(brighter);
  });

  test('the square and the bar follow a drag', async () => {
    await openEditor();
    await click(pipette());
    setHex('000000');
    const square = screen.getByRole('group', { name: 'Saturação e brilho' });
    const hue = screen.getByRole('slider', { name: 'Matiz' });
    const box = jest.spyOn(Element.prototype, 'getBoundingClientRect');
    box.mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => {
        return {};
      },
    });

    // jsdom has no PointerEvent, so the pointer events are built as mouse
    // events, which carry the coordinates React reads.
    const pointer = (type: string, target: Element, x: number, y: number) => {
      fireEvent(
        target,
        new MouseEvent(type, { bubbles: true, clientX: x, clientY: y })
      );
    };

    // jsdom has no pointer capture either; a browser keeps reporting the drag
    // to the square once the pointer leaves it.
    const capture = jest.fn();
    Object.assign(square, { setPointerCapture: capture });

    // Top-right corner: full saturation, full brightness, still red.
    pointer('pointerdown', square, 100, 0);
    pointer('pointermove', square, 100, 0);
    pointer('pointerup', square, 100, 0);
    // Released: a move no longer drags.
    pointer('pointermove', square, 0, 100);
    expect(hexField().value).toBe('FF0000');
    expect(capture).toHaveBeenCalled();

    pointer('pointerdown', hue, 50, 0);
    pointer('pointerup', hue, 50, 0);
    expect(hue).toHaveAttribute('aria-valuenow', '180');

    box.mockRestore();
  });

  /** A pipette at `left`/`top` in a 1024×768 viewport. */
  const placePipette = (left: number, top: number) => {
    return jest.spyOn(pipette(), 'getBoundingClientRect').mockReturnValue({
      left,
      top,
      width: 26,
      height: 26,
      right: left + 26,
      bottom: top + 26,
      x: left,
      y: top,
      toJSON: () => {
        return {};
      },
    });
  };

  // Placed through `sx`, so the position is in the computed style.
  const cardBox = () => {
    const style = getComputedStyle(picker()!);
    return { top: parseFloat(style.top), left: parseFloat(style.left) };
  };

  test('opens to the right of the pipette when there is room', async () => {
    await openEditor();
    const box = placePipette(200, 300);

    await click(pipette());

    // Beside it, level with it: right of its right edge plus the gap.
    expect(cardBox().left).toBe(226 + 12);
    expect(cardBox().top).toBe(300 + 13 - 40);
    box.mockRestore();
  });

  test('opens below the pipette when the right side has no room', async () => {
    await openEditor();
    const box = placePipette(window.innerWidth - 60, 100);

    await click(pipette());

    expect(cardBox().top).toBe(100 + 26 + 12);
    box.mockRestore();
  });

  test('opens above the pipette when neither side nor below has room', async () => {
    await openEditor();
    const box = placePipette(window.innerWidth - 60, window.innerHeight - 40);

    await click(pipette());

    expect(cardBox().top).toBe(window.innerHeight - 40 - 12 - 272);
    box.mockRestore();
  });
});
