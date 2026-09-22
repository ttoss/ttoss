/**
 * Building and dismissing a color ramp. The list itself — marking, publishing,
 * falling back — is covered in LeftSidebar.settings.test.tsx.
 */

import { fireEvent, render, screen } from '@ttoss/test-utils/react';
import type * as React from 'react';
import type {
  GeovisWorkspaceConfig,
  GeovisWorkspaceSidebarColorRampCreate,
} from 'src';
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

const BASE_COLORS = [
  { id: 'azul', name: 'Azul', color: '#2171B5' },
  { id: 'verde', name: 'Verde', color: '#238B45' },
];

const buildConfig = ({
  create,
  onRemove,
  removable = false,
  options,
}: {
  create?: GeovisWorkspaceSidebarColorRampCreate;
  onRemove?: (params: { id: string }) => void;
  removable?: boolean;
  /** Empty models a ramp list computed from data that came back with none. */
  options?: {
    id: string;
    label: string;
    colors: string[];
    removable?: boolean;
  }[];
}): GeovisWorkspaceConfig => {
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
                  options: options ?? [
                    {
                      id: 'azuis',
                      label: 'Azuis',
                      colors: ['#C6DBEF', '#6BAED6', '#2171B5', '#08306B'],
                      removable,
                    },
                  ],
                  create,
                  onRemove,
                },
              },
            ],
          },
        },
      ],
    },
  };
};

const renderRamp = (
  config: GeovisWorkspaceConfig,
  props: Partial<React.ComponentProps<typeof GeovisWorkspace>> = {}
) => {
  return render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={visualizationSpec}
      {...props}
    />,
    { wrapper: Provider }
  );
};

const newScale = () => {
  return screen.getByRole('button', { name: 'Nova escala de cor' });
};

const open = async () => {
  await openConfig();
  await click(newScale());
};

const type = async (element: HTMLElement, value: string) => {
  await click(element);
  fireEvent.change(element, { target: { value } });
};

describe('building a color ramp', () => {
  /* The affordance is opt-in: a setting without `create` is exactly as before. */
  test('offers nothing when the setting declares no create', async () => {
    renderRamp(buildConfig({}));
    await openConfig();

    expect(
      screen.queryByRole('button', { name: 'Nova escala de cor' })
    ).not.toBeInTheDocument();
  });

  test('replaces the affordance with the editor, and puts it back on cancel', async () => {
    renderRamp(
      buildConfig({ create: { baseColors: BASE_COLORS, onCreate: jest.fn() } })
    );
    await open();

    expect(
      screen.queryByRole('button', { name: 'Nova escala de cor' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Escolha a cor base')).toBeInTheDocument();

    await click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(newScale()).toBeInTheDocument();
    expect(screen.queryByText('Escolha a cor base')).not.toBeInTheDocument();
  });

  /*
   * A nameless ramp would land in the list as a blank row, so the commit is
   * held until there is something to call it.
   */
  test('holds the commit until the scale is named', async () => {
    const onCreate = jest.fn();
    renderRamp(buildConfig({ create: { baseColors: BASE_COLORS, onCreate } }));
    await open();

    await click(screen.getByRole('button', { name: 'Adicionar' }));
    expect(onCreate).not.toHaveBeenCalled();

    await type(screen.getByLabelText('Nome da escala'), 'Minha escala');
    await click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  test('reports a complete, removable option built from the chosen base', async () => {
    const onCreate = jest.fn();
    renderRamp(buildConfig({ create: { baseColors: BASE_COLORS, onCreate } }));
    await open();

    await click(screen.getByRole('button', { name: 'Verde' }));
    await type(screen.getByLabelText('Nome da escala'), 'Minha escala');
    await click(screen.getByRole('button', { name: 'Adicionar' }));

    const { option, baseColor } = onCreate.mock.calls[0][0];

    expect(baseColor).toBe('#238B45');
    expect(option).toEqual(
      expect.objectContaining({ label: 'Minha escala', removable: true })
    );
    expect(option.id).toBeTruthy();
    // Four classes, matching the only option already in the list.
    expect(option.colors).toHaveLength(4);
  });

  /* `classes` wins over the list's width when the spec names one. */
  test('honours the class count the spec asks for', async () => {
    const onCreate = jest.fn();
    renderRamp(
      buildConfig({
        create: { baseColors: BASE_COLORS, classes: 7, onCreate },
      })
    );
    await open();

    await type(screen.getByLabelText('Nome da escala'), 'Sete');
    await click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(onCreate.mock.calls[0][0].option.colors).toHaveLength(7);
  });

  /* What the preview drew is what the app is handed — no second generation. */
  test('saves the ramp the spec built for the preview', async () => {
    const onCreate = jest.fn();
    const rampFrom = jest.fn().mockReturnValue(['#111111', '#222222']);

    renderRamp(
      buildConfig({
        create: { baseColors: BASE_COLORS, rampFrom, onCreate },
      })
    );
    await open();

    await type(screen.getByLabelText('Nome da escala'), 'Custom');
    await click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(rampFrom).toHaveBeenCalledWith({
      baseColor: '#2171B5',
      classes: 4,
    });
    expect(onCreate.mock.calls[0][0].option.colors).toEqual([
      '#111111',
      '#222222',
    ]);
  });

  /* The reader should not have to hunt for the ramp they just built. */
  test('makes the new ramp the active one', async () => {
    const onVariableChange = jest.fn();
    renderRamp(
      buildConfig({ create: { baseColors: BASE_COLORS, onCreate: jest.fn() } }),
      { onVariableChange }
    );
    await open();

    await type(screen.getByLabelText('Nome da escala'), 'Minha escala');
    await click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(onVariableChange).toHaveBeenCalledWith(
      expect.objectContaining({ cores: expect.stringContaining('custom-') })
    );
  });

  test('closes the editor once the ramp is committed', async () => {
    renderRamp(
      buildConfig({ create: { baseColors: BASE_COLORS, onCreate: jest.fn() } })
    );
    await open();

    await type(screen.getByLabelText('Nome da escala'), 'Minha escala');
    await click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(screen.queryByText('Escolha a cor base')).not.toBeInTheDocument();
    expect(newScale()).toBeInTheDocument();
  });

  /* The presets are a shortcut, not the whole range the reader may want. */
  test('builds from a color picked outside the presets', async () => {
    const onCreate = jest.fn();
    renderRamp(buildConfig({ create: { baseColors: BASE_COLORS, onCreate } }));
    await open();

    fireEvent.change(screen.getByLabelText('Cor personalizada'), {
      target: { value: '#cb181d' },
    });
    await type(screen.getByLabelText('Nome da escala'), 'Minha escala');
    await click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(onCreate.mock.calls[0][0].baseColor).toBe('#cb181d');
  });

  /* An app with its own color story may not want the free input at all. */
  test('drops the free color input when the spec opts out', async () => {
    renderRamp(
      buildConfig({
        create: {
          baseColors: BASE_COLORS,
          allowCustomColor: false,
          onCreate: jest.fn(),
        },
      })
    );
    await open();

    expect(
      screen.queryByLabelText('Cor personalizada')
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Azul' })).toBeInTheDocument();
  });

  /*
   * Presets computed from data can come back empty. The editor still opens on
   * a usable color rather than on nothing, and the free input carries it.
   */
  test('opens on a usable color when the spec offers no presets', async () => {
    const onCreate = jest.fn();
    renderRamp(buildConfig({ create: { baseColors: [], onCreate } }));
    await open();

    await type(screen.getByLabelText('Nome da escala'), 'Sem presets');
    await click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(onCreate.mock.calls[0][0].baseColor).toBe('#000000');
  });

  /*
   * With no ramp beside it there is no width to match, so the built one falls
   * to the control's own default rather than to zero classes.
   */
  test('falls back to a default width when the list is empty', async () => {
    const onCreate = jest.fn();
    renderRamp(
      buildConfig({
        options: [],
        create: { baseColors: BASE_COLORS, onCreate },
      })
    );
    await open();

    await type(screen.getByLabelText('Nome da escala'), 'Primeira');
    await click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(onCreate.mock.calls[0][0].option.colors).toHaveLength(5);
  });

  /*
   * Ids are derived from the list's length, so a list that already holds the
   * derived name has to be stepped past — otherwise the new ramp would take an
   * id another one answers to, and picking either would move the same mark.
   */
  test('skips an id the list already holds', async () => {
    const onCreate = jest.fn();
    renderRamp(
      buildConfig({
        options: [{ id: 'custom-2', label: 'Minha', colors: ['#000', '#fff'] }],
        create: { baseColors: BASE_COLORS, onCreate },
      })
    );
    await open();

    await type(screen.getByLabelText('Nome da escala'), 'Outra');
    await click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(onCreate.mock.calls[0][0].option.id).toBe('custom-3');
  });

  /* An unparseable color yields no sweep, so there is nothing to save. */
  test('holds the commit when the base color builds no ramp', async () => {
    const onCreate = jest.fn();
    renderRamp(
      buildConfig({
        create: {
          baseColors: BASE_COLORS,
          rampFrom: () => {
            return [];
          },
          onCreate,
        },
      })
    );
    await open();

    await type(screen.getByLabelText('Nome da escala'), 'Vazia');
    await click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(onCreate).not.toHaveBeenCalled();
  });
});

describe('dismissing a color ramp', () => {
  test('offers no dismissal on a ramp the app ships', async () => {
    renderRamp(buildConfig({ onRemove: jest.fn(), removable: false }));
    await openConfig();

    expect(
      screen.queryByRole('button', { name: 'Remover escala' })
    ).not.toBeInTheDocument();
  });

  /* `removable` without `onRemove` would put an affordance nothing listens to. */
  test('offers no dismissal when the setting cannot report it', async () => {
    renderRamp(buildConfig({ removable: true }));
    await openConfig();

    expect(
      screen.queryByRole('button', { name: 'Remover escala' })
    ).not.toBeInTheDocument();
  });

  /*
   * The affordance is a span with a button role, because a button inside a
   * button is invalid markup — so Enter and Space have to be wired by hand.
   */
  test.each(['Enter', ' '])(
    'dismisses on %p from the keyboard',
    async (key) => {
      const onRemove = jest.fn();
      renderRamp(buildConfig({ onRemove, removable: true }));
      await openConfig();

      fireEvent.keyDown(
        screen.getByRole('button', { name: 'Remover escala' }),
        {
          key,
        }
      );

      expect(onRemove).toHaveBeenCalledWith({ id: 'azuis' });
    }
  );

  test('ignores keys that do not activate', async () => {
    const onRemove = jest.fn();
    renderRamp(buildConfig({ onRemove, removable: true }));
    await openConfig();

    fireEvent.keyDown(screen.getByRole('button', { name: 'Remover escala' }), {
      key: 'a',
    });

    expect(onRemove).not.toHaveBeenCalled();
  });

  /* Dismissing must not first make the ramp the active one. */
  test('reports the id without picking the row', async () => {
    const onRemove = jest.fn();
    const onVariableChange = jest.fn();
    renderRamp(buildConfig({ onRemove, removable: true }), {
      onVariableChange,
    });
    await openConfig();

    // The control publishes its default on mount, so only what the dismissal
    // itself emits is in question here.
    onVariableChange.mockClear();

    await click(screen.getByRole('button', { name: 'Remover escala' }));

    expect(onRemove).toHaveBeenCalledWith({ id: 'azuis' });
    expect(onVariableChange).not.toHaveBeenCalled();
  });
});
