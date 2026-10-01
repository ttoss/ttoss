/**
 * Adjusting a built ramp tone by tone. The picker itself is covered in
 * LeftSidebar.colorPicker.test.tsx.
 */

import { fireEvent, render, screen } from '@ttoss/test-utils/react';
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

/** A fixed four-tone sweep, so the tones' colors are known. */
const SWEEP = ['#eeeeee', '#bbbbbb', '#888888', '#444444'];

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
                      { id: 'verde', name: 'Verde', color: '#238B45' },
                    ],
                    rampFrom: () => {
                      return SWEEP;
                    },
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

const tone = (index: number) => {
  return document.querySelector(
    `button[data-tone="${index}"]`
  ) as HTMLButtonElement;
};

const picker = () => {
  return screen.queryByRole('dialog', { name: 'Cor personalizada' });
};

const hexField = () => {
  return screen.getByLabelText('Hexadecimal') as HTMLInputElement;
};

const restore = () => {
  return screen.queryByRole('button', { name: 'Restaurar' });
};

/** Opens the picker on a tone and applies `hex` to it. */
const adjust = async (index: number, hex: string) => {
  await click(tone(index));
  fireEvent.change(hexField(), { target: { value: hex } });
  await click(screen.getByRole('button', { name: 'Aplicar' }));
};

describe('adjusting a ramp tone by tone', () => {
  test('lists one tone per class, each named after its place and code', async () => {
    await openEditor();

    expect(screen.getByText('Tons · clique para ajustar')).toBeInTheDocument();
    expect(tone(0)).toHaveAttribute('title', 'Tom 1 · #EEEEEE');
    expect(tone(3)).toHaveAttribute('title', 'Tom 4 · #444444');
    expect(restore()).not.toBeInTheDocument();
  });

  test('a tone opens the picker on its own color, and a second press closes it', async () => {
    await openEditor();

    await click(tone(1));
    expect(picker()).toBeInTheDocument();
    expect(hexField().value).toBe('BBBBBB');
    expect(tone(1)).toHaveAttribute('aria-expanded', 'true');
    // The pipette is for the base, which the picker is not editing.
    expect(
      screen.getByRole('button', { name: 'Cor personalizada' })
    ).toHaveAttribute('aria-expanded', 'false');

    await click(tone(1));
    expect(picker()).not.toBeInTheDocument();
  });

  test('moving to another tone retargets the picker', async () => {
    await openEditor();
    await click(tone(0));

    fireEvent.pointerDown(tone(2));
    await click(tone(2));

    expect(hexField().value).toBe('888888');
    expect(tone(2)).toHaveAttribute('aria-expanded', 'true');
  });

  test('an applied tone is marked, offers a reset, and is what gets saved', async () => {
    const onCreate = await openEditor();

    await adjust(1, '112233');

    expect(picker()).not.toBeInTheDocument();
    expect(tone(1)).toHaveAttribute('title', 'Tom 2 · #112233');
    expect(tone(1).querySelector('[data-adjusted]')).not.toBeNull();
    expect(tone(0).querySelector('[data-adjusted]')).toBeNull();
    expect(restore()).toBeInTheDocument();
    // Adjusting a tone does not name the ramp; only a new base does.
    expect(
      (screen.getByLabelText('Nome da escala') as HTMLInputElement).value
    ).toBe('');

    await click(screen.getByRole('button', { name: 'Adicionar' }));
    expect(onCreate.mock.calls[0][0].option.colors).toEqual([
      '#eeeeee',
      '#112233',
      '#888888',
      '#444444',
    ]);
  });

  test('"Restaurar" puts every tone back to the built one', async () => {
    await openEditor();
    await adjust(0, '112233');
    await adjust(3, 'abc');

    await click(restore()!);

    expect(tone(0)).toHaveAttribute('title', 'Tom 1 · #EEEEEE');
    expect(tone(3)).toHaveAttribute('title', 'Tom 4 · #444444');
    expect(restore()).not.toBeInTheDocument();
  });

  test('a new base, preset or picked, drops the adjustments', async () => {
    await openEditor();

    await adjust(0, '112233');
    await click(screen.getByRole('button', { name: 'Verde' }));
    expect(restore()).not.toBeInTheDocument();

    await adjust(0, '112233');
    await click(screen.getByRole('button', { name: 'Cor personalizada' }));
    fireEvent.change(hexField(), { target: { value: '445566' } });
    await click(screen.getByRole('button', { name: 'Aplicar' }));
    expect(restore()).not.toBeInTheDocument();
    expect(tone(0)).toHaveAttribute('title', 'Tom 1 · #EEEEEE');
  });
});
