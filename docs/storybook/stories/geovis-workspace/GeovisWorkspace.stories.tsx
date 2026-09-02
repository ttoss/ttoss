import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  type RepairOption,
  useGeoVis,
  type VisualizationSpec,
} from '@ttoss/geovis';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  getInitialSelection,
} from '@ttoss/geovis-workspace';
import { Box, Button, Flex, Text } from '@ttoss/ui';
import * as React from 'react';

import {
  buildBrokenSpec,
  buildPolicyViolationSpec,
  buildSpec,
  groupedWorkspaceConfig,
  sidebarPreviewConfig,
} from './GeovisWorkspace.fixtures';

/**
 * Workspace config. The left sidebar exposes two variation tabs whose selection
 * drives the choropleth: `variable` picks the metric (and its color scale),
 * `age` picks the cohort whose values are rendered.
 */
const workspaceConfig: GeovisWorkspaceConfig = {
  leftSidebar: {
    sections: [
      {
        id: 'variable',
        header: { title: 'Variável', icon: 'lucide:layers' },
        body: {
          kind: 'variations',
          menuId: 'variable',
          defaultValue: 'cumulative-rate',
          groups: [
            {
              id: 'metrics',
              label: 'Métricas',
              variations: [
                {
                  value: 'cumulative-rate',
                  label: 'Taxa cumulativa (% do total)',
                },
                {
                  value: 'cumulative-proportion',
                  label: 'Proporção cumulativa (% da pop 65+)',
                },
                { value: 'range', label: 'Faixa (% da pop 65+)' },
              ],
            },
          ],
        },
      },
      {
        id: 'age',
        header: { title: 'Faixa etária', icon: 'lucide:users' },
        body: {
          kind: 'variations',
          menuId: 'age',
          defaultValue: '65-plus',
          groups: [
            {
              id: 'cohorts',
              label: 'Coortes',
              variations: [
                { value: '65-plus', label: '65 anos ou mais' },
                { value: '70-plus', label: '70 anos ou mais' },
                { value: '75-plus', label: '75 anos ou mais' },
              ],
            },
          ],
        },
      },
    ],
  },
  rightSidebar: { title: 'Detalhes' },
};

/**
 * Variant whose right sidebar carries a full color-legend panel — title,
 * description, the map's own runtime-resolved legend and linked data sources.
 * The legend swatches come from `visualizationSpec.legends`, not from this
 * config, so they stay in sync with the map by construction.
 */
const legendWorkspaceConfig: GeovisWorkspaceConfig = {
  leftSidebar: workspaceConfig.leftSidebar,
  rightSidebar: { title: 'POPULAÇÃO 65+ COMO % DA POPULAÇÃO TOTAL' },
  legend: {
    description:
      'Proporção da população total do distrito com 65 anos ou mais.',
    sources: {
      title: 'Fonte dos dados:',
      items: [
        {
          label: 'Projeções populacionais por sexo e idade do SEADE (2025)',
          href: 'https://repositorio.seade.gov.br/dataset/populacao-residente-municipio-de-sao-paulo-evolucao',
        },
        { label: 'Geometria: Distritos Municipais de São Paulo.' },
      ],
    },
  },
};

/**
 * Custom `controls` slot panel that replaces the default sidebar. Reads the
 * live spec through `useGeoVis()` — the same runtime access the default panel
 * gets — to show it is not limited to config-driven content.
 */
const CustomControlsPanel = () => {
  const { spec } = useGeoVis();

  return (
    <Box sx={{ paddingX: '2' }}>
      <Text sx={{ fontSize: 'sm', color: 'display.text.primary.default' }}>
        This map has {spec.layers.length} layer(s).
      </Text>
    </Box>
  );
};

/**
 * Variant whose `controls` slot is overridden with a custom component instead
 * of the config-driven menu list, demonstrating slot override (ADR-0002).
 */
const customControlsConfig: GeovisWorkspaceConfig = {
  slots: { controls: { component: CustomControlsPanel } },
  rightSidebar: workspaceConfig.rightSidebar,
};

/**
 * Drives the workspace: holds the selection state, derives the GeoVis spec from
 * it via `buildSpec`, and feeds both back into `GeovisWorkspace`. Picking a
 * menu item updates the selection, rebuilds the spec, and recolors the map.
 */
const WorkspaceStory = ({ config }: { config: GeovisWorkspaceConfig }) => {
  const [selection, setSelection] = React.useState(() => {
    return getInitialSelection({ config });
  });

  const visualizationSpec = React.useMemo(() => {
    return buildSpec({
      variable: selection.variable ?? 'cumulative-rate',
      age: selection.age ?? '65-plus',
    });
  }, [selection]);

  return (
    <GeovisWorkspace
      config={config}
      visualizationSpec={visualizationSpec}
      variables={selection}
      onVariableChange={setSelection}
    />
  );
};

const meta: Meta<typeof GeovisWorkspace> = {
  title: 'Geovis Workspace/GeovisWorkspace',
  component: GeovisWorkspace,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Composes a left sidebar (config-driven `sections`), a GeoVis map in the main area, and an optional right sidebar — the sidebars driven by `config` and the map driven by `visualizationSpec`. The parent owns the selection state and derives the next `visualizationSpec` from it, so picking a variable or an age range recolors the map live.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof GeovisWorkspace>;

/**
 * End-to-end integration: the workspace selection drives a real GeoVis
 * choropleth. Selecting a variable switches the color scale; selecting an age
 * range rescales the region values. The right sidebar summarizes the selection.
 */
export const Default: Story = {
  render: () => {
    return <WorkspaceStory config={workspaceConfig} />;
  },
};

/**
 * The right sidebar hosts a full color-legend panel: a description and data
 * sources declared in the config (`legend`), plus the map's own runtime-
 * resolved legend swatches — no hand-authored duplicate of what the spec
 * already resolves. Switching the variable changes the map's active legend,
 * and the sidebar's swatches follow with no config edit. Open
 * the details panel to see it.
 */
export const WithColorLegend: Story = {
  render: () => {
    return <WorkspaceStory config={legendWorkspaceConfig} />;
  },
};

/**
 * Only the `controls` slot has content — the right sidebar and its button are
 * absent, since none of its slots (legend/warnings/inspector) do. `metadata`
 * is hidden explicitly here: this spec has a source, so its default panel
 * would otherwise show a source count and pull the right sidebar back in —
 * see the dedicated `MetadataDefaultPanel` story for that behavior.
 */
export const LeftSidebarOnly: Story = {
  render: () => {
    return (
      <WorkspaceStory
        config={{
          leftSidebar: workspaceConfig.leftSidebar,
          slots: { metadata: { hidden: true } },
        }}
      />
    );
  },
};

/**
 * The `controls` slot renders a custom component instead of the default sidebar
 * (`config.slots.controls.component`), while still reading the live
 * GeoVis spec through `useGeoVis()` — the same runtime access the default
 * panel it replaces gets.
 */
export const CustomControlsOverride: Story = {
  render: () => {
    return <WorkspaceStory config={customControlsConfig} />;
  },
};

const BROKEN_MAP_DATA_PATH = 'layers[regions-fill].mapDataId';

/**
 * Toggles between a working spec and `buildBrokenSpec()`'s failing one, so
 * the story demonstrates a real failure *after* a successful resolve: the
 * map keeps showing the last good spec while the warnings panel lists the
 * new issue. `onRepair` applies the chosen `set-value` back onto the layer,
 * the same delegation shape `onVariableChange` already uses.
 */
const BlockingFailureAfterResolveStory = () => {
  const [mapDataId, setMapDataId] = React.useState('choropleth');

  const visualizationSpec = React.useMemo(() => {
    const spec = buildSpec({ variable: 'cumulative-rate', age: '65-plus' });
    return {
      ...spec,
      layers: spec.layers.map((layer) => {
        return { ...layer, mapDataId };
      }),
    };
  }, [mapDataId]);

  const handleRepair = (repair: RepairOption) => {
    if (repair.kind === 'set-value' && repair.path === BROKEN_MAP_DATA_PATH) {
      setMapDataId(String(repair.value));
    }
  };

  return (
    <Flex sx={{ flexDirection: 'column', gap: '3' }}>
      <Button
        type="button"
        onClick={() => {
          setMapDataId((current) => {
            return current === 'choropleth' ? 'does-not-exist' : 'choropleth';
          });
        }}
      >
        {mapDataId === 'choropleth'
          ? 'Break the map data reference'
          : 'Fix the map data reference'}
      </Button>

      <GeovisWorkspace
        config={workspaceConfig}
        visualizationSpec={visualizationSpec}
        onRepair={handleRepair}
      />
    </Flex>
  );
};

/**
 * A failure after a successful mount: the map keeps the last good spec
 * visible while the warnings panel lists the `unknown-map-data-id` issue,
 * with an `allowed-values` repair. Click "Break the map data reference" to
 * trigger it, then use the repair button to fix it via `onRepair`.
 */
export const BlockingFailureAfterResolve: Story = {
  render: () => {
    return <BlockingFailureAfterResolveStory />;
  },
};

/**
 * A failure on first mount, before anything has ever resolved: the `map`
 * slot shows a repair-affordance empty state instead of an uninitialized
 * canvas, since there is no "last good spec" yet to fall back to.
 */
export const ColdStartFailure: Story = {
  render: () => {
    return (
      <GeovisWorkspace
        config={workspaceConfig}
        visualizationSpec={buildBrokenSpec()}
      />
    );
  },
};

/**
 * A resolved result that still carries a non-blocking warning: the spec's
 * `metadata` flags a cartography policy violation, surfaced by the
 * `warnings` slot as a `'warning'`-severity issue with a `set-value` repair
 * to the normalized alternative — the map renders normally throughout.
 */
export const ResolvedWithWarnings: Story = {
  render: () => {
    return (
      <GeovisWorkspace
        config={workspaceConfig}
        visualizationSpec={buildPolicyViolationSpec()}
      />
    );
  },
};

/**
 * Click any region on the map to select it — the `inspector` slot's default
 * panel (right sidebar) shows the layer, its bound value, and the feature
 * id. Dismiss the selection via the panel's own close button, pressing
 * Escape, or clicking empty space on the map: all three clear the same
 * `useGeoVisClick()` selection (and its highlight on the map) at once.
 */
export const InspectFeature: Story = {
  render: () => {
    return <WorkspaceStory config={workspaceConfig} />;
  },
};

/**
 * Drives the layer-control-clearance variant: builds a spec that carries the
 * map's own `control` (the layer-toggle button anchored bottom-left) alongside
 * a togglable outline layer, and starts with the left sidebar open so the
 * shift is visible immediately.
 */
const LayerControlClearsSidebarStory = () => {
  const [selection, setSelection] = React.useState(() => {
    return getInitialSelection({ config: workspaceConfig });
  });

  const visualizationSpec = React.useMemo<VisualizationSpec>(() => {
    const spec = buildSpec({
      variable: selection.variable ?? 'cumulative-rate',
      age: selection.age ?? '65-plus',
    });

    const outlineLayer: VisualizationSpec['layers'][number] = {
      id: 'regions-outline',
      sourceId: 'regions',
      geometry: 'polygon',
      paint: { fillOpacity: 0, lineColor: '#111827', lineWidth: 2 },
    };

    return {
      ...spec,
      layers: [...spec.layers, outlineLayer],
      // The map's own layer-toggle control, anchored to the same bottom-left
      // corner the left sidebar opens over. `GeoVisProvider` auto-mounts it.
      control: {
        id: 'layers',
        label: 'Camadas',
        position: 'bottom-left',
        trigger: 'click',
        items: [
          { id: 'fill', label: 'Preenchimento', layers: ['regions-fill'] },
          { id: 'outline', label: 'Contorno', layers: ['regions-outline'] },
        ],
      },
    };
  }, [selection]);

  return (
    <GeovisWorkspace
      config={{
        ...workspaceConfig,
        leftSidebar: { ...workspaceConfig.leftSidebar, initialState: 'open' },
      }}
      visualizationSpec={visualizationSpec}
      variables={selection}
      onVariableChange={setSelection}
    />
  );
};

/**
 * The map carries its own `control` — the layer-toggle button anchored to the
 * bottom-left corner. The left sidebar opens over that same corner, so the
 * workspace shifts the control clear of it while the sidebar is open: its
 * `control.offset.x` grows to slide the button right along the bottom edge,
 * and snaps back when the sidebar closes. The story starts with the sidebar
 * open (button already clear); close and reopen the menu to watch it slide.
 */
export const LayerControlClearsSidebar: Story = {
  render: () => {
    return <LayerControlClearsSidebarStory />;
  },
};

/**
 * The `metadata` slot's default panel needs no config at all: it reads
 * `spec.sources.length` straight off the live spec and shows a pluralized
 * source count, appearing automatically the moment the spec has at least one
 * source (this demo spec is hand-authored rather than built from a `mapType`
 * shorthand, so no "Map type: …" line appears here — when an application sets
 * `spec.mapType`, e.g. `'choropleth'`, that line renders too). Open the
 * details panel to see it.
 */
export const MetadataDefaultPanel: Story = {
  render: () => {
    return <WorkspaceStory config={workspaceConfig} />;
  },
};

/** The three demo color scales this fixture builder knows how to render. */
const KNOWN_VARIABLES = [
  'cumulative-rate',
  'cumulative-proportion',
  'range',
] as const;

/**
 * Drives the two-menus-in-one-tab variant: holds the shared selection both
 * blocks write into, and derives the map spec from both keys. The 30 indicator
 * values are demo labels, so each is mapped deterministically onto one of the
 * three real color scales `buildSpec` knows; the age value is real, and scales
 * the metric. Picking in either block recolors the map, which is how the two
 * menus can be told apart at a glance.
 */
const GroupedControlsStory = () => {
  const [selection, setSelection] = React.useState(() => {
    return getInitialSelection({ config: groupedWorkspaceConfig });
  });

  const visualizationSpec = React.useMemo(() => {
    const selected = selection.variable ?? 'pop-total';

    const index =
      [...selected].reduce((sum, char) => {
        return sum + char.charCodeAt(0);
      }, 0) % KNOWN_VARIABLES.length;

    return buildSpec({
      variable: KNOWN_VARIABLES[index],
      age: selection.age ?? '65-plus',
    });
  }, [selection]);

  return (
    <GeovisWorkspace
      config={groupedWorkspaceConfig}
      visualizationSpec={visualizationSpec}
      variables={selection}
      onVariableChange={setSelection}
    />
  );
};

/**
 * **Two menus sharing one tab.** "Faixa etária" (three variations) and
 * "Indicador" (thirty) are both `variations` controls inside a single `filters`
 * body, so they stack as collapsible blocks instead of claiming a tab each.
 *
 * ## What to check
 *
 * 1. One tab in the bar, two headings inside it. Collapse either block — the
 *    other stays put.
 * 2. Pick an age: the map recolors, because that block drives `selection.age`.
 *    Pick an indicator: it recolors again, from `selection.variable`. Two
 *    independent menus, one shared selection object.
 * 3. Both defaults are seeded before any click — `getInitialSelection` reads a
 *    `variations` control the same way it reads a `variations` body.
 *
 * Declared as bodies these two menus would need a tab each; the tab bar, the
 * header and the gate all work per section, so comparing them would cost a
 * switch. The body form is unchanged and still the right shape for a tab given
 * over to one long menu — `RichLeftSidebar` and `PerVariationFilters` show it.
 */
export const GroupedControls: Story = {
  render: () => {
    return <GroupedControlsStory />;
  },
};

/**
 * Drives the rich sidebar: seeds the shared `variable` selection from the
 * config's default variation and maps whichever variation is picked onto one of
 * the three real color scales `buildSpec` knows, so the map recolors as
 * variations are chosen. The filter controls (timeline, chips, locator) are
 * visual-only for now.
 */
const SidebarPreviewStory = () => {
  const [selection, setSelection] = React.useState({ variable: 'farms' });

  const visualizationSpec = React.useMemo(() => {
    const selected = selection.variable ?? 'farms';

    const index =
      [...selected].reduce((sum, char) => {
        return sum + char.charCodeAt(0);
      }, 0) % KNOWN_VARIABLES.length;

    return buildSpec({ variable: KNOWN_VARIABLES[index], age: '65-plus' });
  }, [selection]);

  return (
    <GeovisWorkspace
      config={sidebarPreviewConfig}
      visualizationSpec={visualizationSpec}
      variables={selection}
      onVariableChange={setSelection}
    />
  );
};

/**
 * A rich left sidebar with three icon tabs whose header mirrors the active tab.
 * "Variações" is a flat list of icon-led variations (tagged by group) that
 * recolor the map through the shared selection; "Filtros" holds emoji chips
 * (their count shown as a badge on that tab alone) and a município locator; and
 * "Linha do Tempo" holds the timeline with play/pause.
 *
 * The last two tabs show that a `filters` body is a body, not a tab: splitting
 * the controls across two sections gives each its own header, its own gate, and
 * — for the timeline — a HUD that follows only it. The filter controls are
 * visual-only for now (local state, not yet wired to the map).
 */
export const RichLeftSidebar: Story = {
  render: () => {
    return <SidebarPreviewStory />;
  },
};
