import {
  resolveLegend,
  useGeoVis,
  type VisualizationSpec,
} from '@ttoss/geovis';
import * as React from 'react';

import { resolveMenuValue } from '../components/LeftSidebar/useSections';
import type {
  GeovisWorkspaceSelection,
  GeovisWorkspaceSidebarSection,
  GeovisWorkspaceSidebarVariation,
} from '../context/GeovisWorkspaceContext';
import { useTimelineContext } from '../context/TimelineContext';
import { useGeovisWorkspace } from '../hooks/useGeovisWorkspace';

/**
 * The first variations menu in the sidebar — a `variations` section, else a
 * `variations` block inside a `filters` section — with its variations flattened.
 * It is the menu that recolors the map, so its picked row is what the map shows.
 */
const findVariationsMenu = (
  sections: GeovisWorkspaceSidebarSection[]
):
  | { menuId: string; variations: GeovisWorkspaceSidebarVariation[] }
  | undefined => {
  for (const section of sections) {
    if (section.body.kind === 'variations') {
      return {
        menuId: section.body.menuId,
        variations: section.body.groups.flatMap((group) => {
          return group.variations;
        }),
      };
    }
  }

  for (const section of sections) {
    if (section.body.kind !== 'filters') continue;

    for (const block of section.body.blocks) {
      if (block.control.kind === 'variations') {
        return {
          menuId: block.control.menuId,
          variations: block.control.variations,
        };
      }
    }
  }

  return undefined;
};

/**
 * Label of the variation the map currently shows, if the sidebar has a
 * variations menu and its value matches one of the rows.
 */
const resolveActiveVariationLabel = ({
  sections,
  selection,
}: {
  sections: GeovisWorkspaceSidebarSection[];
  selection: GeovisWorkspaceSelection;
}): string | undefined => {
  const menu = findVariationsMenu(sections);

  if (!menu) return undefined;

  const value = resolveMenuValue({ sections, selection, menuId: menu.menuId });

  return menu.variations.find((variation) => {
    return variation.value === value;
  })?.label;
};

/**
 * The legend the map is painted from: the first layer's `activeLegendId` that
 * resolves, else the spec's first top-level legend. Its title names the file
 * when no variation does.
 */
const resolveExportLegendId = (spec: VisualizationSpec): string | undefined => {
  for (const layer of spec.layers) {
    if (layer.activeLegendId && resolveLegend(spec, layer.activeLegendId)) {
      return layer.activeLegendId;
    }
  }

  return spec.legends?.[0]?.id;
};

/** What the export knows about the map besides its frame. */
export interface MapExportContent {
  /** Names the file: the map's title and the timeline's value, if any. */
  title: { label?: string; year?: number };
}

/**
 * Gathers what the export needs about the map, from the same places the
 * workspace already shows it: the title — the active variation's label (else
 * the legend's or the spec's title) with the timeline's value when a timeline
 * is declared — is what the suggested file name is built from.
 *
 * @returns The title.
 *
 * @example
 * const { title } = useMapExportContent();
 */
export const useMapExportContent = (): MapExportContent => {
  const { config, selection } = useGeovisWorkspace();
  const { spec } = useGeoVis();
  const timeline = useTimelineContext();

  const sections = config.leftSidebar?.sections;
  const year = timeline.filter ? timeline.value : undefined;

  return React.useMemo(() => {
    const legendId = resolveExportLegendId(spec);
    const legendSpec = legendId ? resolveLegend(spec, legendId) : undefined;

    const label =
      resolveActiveVariationLabel({ sections: sections ?? [], selection }) ??
      legendSpec?.title ??
      spec.title;

    return { title: { label, year } };
  }, [spec, sections, selection, year]);
};
