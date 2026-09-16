/**
 * The settings zone: the two slider shapes, the toggle, and the block layout
 * around them. The rest of the left sidebar is covered in LeftSidebar.test.tsx.
 */

import { fireEvent, render, screen } from '@ttoss/test-utils/react';
import type * as React from 'react';
import { GeovisWorkspace } from 'src';

import {
  click,
  openConfig,
  Provider,
  settingsPreview,
  visualizationSpec,
} from './leftSidebarTestUtils';

jest.mock('@ttoss/geovis', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the factory is hoisted above imports
  return require('./leftSidebarTestUtils').createGeoVisMock();
});

const renderSettings = (
  props: Partial<React.ComponentProps<typeof GeovisWorkspace>> = {}
) => {
  return render(
    <GeovisWorkspace
      config={{ leftSidebar: { initialState: 'open', ...settingsPreview } }}
      visualizationSpec={visualizationSpec}
      {...props}
    />,
    { wrapper: Provider }
  );
};

/** The zone's sliders, in block order: ladder, opacity, plain. */
const sliders = () => {
  return screen.getAllByRole('slider');
};

const steppers = (name: 'Decrease' | 'Increase') => {
  return screen.getAllByRole('button', { name });
};

describe('the settings zone', () => {
  test('renders a tab of its own, beside the variations one', async () => {
    renderSettings();

    expect(
      screen.getByRole('button', { name: 'Configurações' })
    ).toBeInTheDocument();

    await openConfig();

    expect(screen.getByText('Malha')).toBeInTheDocument();
    expect(screen.getByText('Opacidade')).toBeInTheDocument();
  });
});

describe('a ladder slider', () => {
  test('reads the rung it rests on, with its hint', async () => {
    renderSettings();
    await openConfig();

    expect(screen.getByText('160 km')).toBeInTheDocument();
    expect(screen.getByText('40 células')).toBeInTheDocument();
  });

  /*
   * The track runs over rung indices, not the rungs' own values: they are
   * ordered but not evenly spaced, so a track keyed on the values would bunch
   * the handle where they crowd together.
   */
  test('runs its track over rung indices', async () => {
    renderSettings();
    await openConfig();

    const [ladder] = sliders();
    expect(ladder).toHaveAttribute('min', '0');
    expect(ladder).toHaveAttribute('max', '2');
    expect(ladder).toHaveValue('1');
  });

  test('snaps to the rung the track lands on, and publishes its value', async () => {
    const onVariableChange = jest.fn();
    renderSettings({ onVariableChange });
    await openConfig();

    fireEvent.change(sliders()[0], { target: { value: '2' } });

    expect(screen.getByText('80 km')).toBeInTheDocument();
    expect(screen.getByText('160 células')).toBeInTheDocument();
    expect(onVariableChange).toHaveBeenCalledWith(
      expect.objectContaining({ malha: '80' })
    );
  });

  test('steps one rung at a time', async () => {
    renderSettings();
    await openConfig();

    await click(steppers('Increase')[0]);
    expect(screen.getByText('80 km')).toBeInTheDocument();

    await click(steppers('Decrease')[0]);
    expect(screen.getByText('160 km')).toBeInTheDocument();
  });

  test('stops at the ends instead of running off the ladder', async () => {
    renderSettings();
    await openConfig();

    await click(steppers('Decrease')[0]);
    await click(steppers('Decrease')[0]);
    expect(screen.getByText('320 km')).toBeInTheDocument();

    await click(steppers('Increase')[0]);
    await click(steppers('Increase')[0]);
    await click(steppers('Increase')[0]);
    expect(screen.getByText('80 km')).toBeInTheDocument();
  });

  test('names the two ends in one caption', async () => {
    renderSettings();
    await openConfig();

    expect(screen.getByText('Panorâmico — Detalhado')).toBeInTheDocument();
  });
});

describe('a continuous slider', () => {
  test('reads its own number with the unit', async () => {
    renderSettings();
    await openConfig();

    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  test('steps by the control step and clamps at both bounds', async () => {
    const onVariableChange = jest.fn();
    renderSettings({ onVariableChange });
    await openConfig();

    await click(steppers('Increase')[1]);
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(onVariableChange).toHaveBeenCalledWith(
      expect.objectContaining({ opacidade: '90' })
    );

    fireEvent.change(sliders()[1], { target: { value: '30' } });
    await click(steppers('Decrease')[1]);
    expect(screen.getByText('30%')).toBeInTheDocument();

    fireEvent.change(sliders()[1], { target: { value: '100' } });
    await click(steppers('Increase')[1]);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  /*
   * `simples` declares only a `defaultValue`, so the control supplies the
   * track's bounds and granularity. It also carries a caption without steppers
   * — the caption row renders for either, so neither implies the other.
   */
  test('falls back to a 0–100 track, and captions without steppers', async () => {
    renderSettings();
    await openConfig();

    await click(screen.getByRole('button', { name: /Simples/ }));

    const plain = sliders()[2];
    expect(plain).toHaveAttribute('min', '0');
    expect(plain).toHaveAttribute('max', '100');
    expect(plain).toHaveAttribute('step', '1');
    expect(screen.getByText('10')).toBeInTheDocument();

    expect(screen.getByText('Pouco — Muito')).toBeInTheDocument();
    // The two step buttons on screen belong to the other two blocks.
    expect(steppers('Increase')).toHaveLength(2);
  });

  /* Neither a caption nor steppers: the row under the track is not rendered. */
  test('renders track and readout alone when it carries neither', async () => {
    renderSettings();
    await openConfig();

    expect(screen.getByText('4')).toBeInTheDocument();
    // Only `malha` and `opacidade` contribute steppers.
    expect(steppers('Increase')).toHaveLength(2);
    expect(screen.queryByText(/—/)).not.toBeNull();
  });

  test('renders a headed block hint under the control', async () => {
    renderSettings();
    await openConfig();

    await click(screen.getByRole('button', { name: /Simples/ }));

    expect(screen.getByText('Sem passos nem unidade.')).toBeInTheDocument();
  });
});

describe('a toggle setting', () => {
  test('carries its block title in the row, and no header above it', async () => {
    renderSettings();
    await openConfig();

    // Once, not twice: the block skips its header because the row names it.
    expect(screen.getAllByText('Ocultar vazios')).toHaveLength(1);
  });

  test('reports its state through aria-pressed, and flips on click', async () => {
    const onVariableChange = jest.fn();
    renderSettings({ onVariableChange });
    await openConfig();

    const row = screen.getByRole('button', { name: /Ocultar vazios/ });
    expect(row).toHaveAttribute('aria-pressed', 'false');

    await click(row);

    expect(row).toHaveAttribute('aria-pressed', 'true');
    expect(onVariableChange).toHaveBeenCalledWith(
      expect.objectContaining({ ocultar: 'true' })
    );

    await click(row);
    expect(row).toHaveAttribute('aria-pressed', 'false');
  });

  test('renders the block hint under it', async () => {
    renderSettings();
    await openConfig();

    expect(screen.getByText('Células sem registro somem.')).toBeInTheDocument();
  });

  /*
   * `rotulos` carries neither an icon nor a hint, and starts on — the plain
   * shape, which is what most toggles will be.
   */
  test('needs neither an icon nor a hint, and honours a true default', async () => {
    renderSettings();
    await openConfig();

    const row = screen.getByRole('button', { name: 'Rótulos' });
    expect(row).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('a seeded setting', () => {
  /*
   * A controlled value has to win over the control's own default on first
   * render, or an app restoring saved settings would flash its defaults and
   * then publish them back over the restored ones.
   */
  test('starts from the shared selection, not from its default', async () => {
    renderSettings({ variables: { malha: '320', opacidade: '40' } });
    await openConfig();

    expect(screen.getByText('320 km')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });
});
