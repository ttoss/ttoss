import * as fslUi from '@ttoss/fsl-ui';
import { ENTITIES, type Entity } from '@ttoss/fsl-ui/semantics';

/**
 * The component catalog, derived at module scope from the package's own
 * `*Meta` exports — the same auto-discovery the fsl-ui contract tests use.
 * There is no hand-maintained list: a component ships, it appears here.
 */
export interface CatalogEntry {
  name: string;
  structure: string;
  composition?: string;
}

interface MetaShape {
  displayName: string;
  entity: Entity;
  structure: string;
  composition?: string;
}

export const CATALOG: Record<Entity, CatalogEntry[]> = (() => {
  const byEntity = Object.fromEntries(
    ENTITIES.map((entity) => {
      return [entity, [] as CatalogEntry[]];
    })
  ) as Record<Entity, CatalogEntry[]>;

  for (const [exportName, value] of Object.entries(fslUi)) {
    if (!exportName.endsWith('Meta')) continue;
    const meta = value as unknown as MetaShape;
    byEntity[meta.entity].push({
      name: meta.displayName,
      structure: meta.structure,
      composition: meta.composition,
    });
  }

  for (const entries of Object.values(byEntity)) {
    entries.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }

  return byEntity;
})();

/** One-line role of each Entity, distilled from the semantic model. */
export const ENTITY_SUMMARY: Record<Entity, string> = {
  Action: 'Triggers an operation — carries authorial emphasis (evaluation).',
  Input:
    'Accepts a value the user types or adjusts — validation is the invalid State.',
  Selection:
    'Chooses among known options — surfaces the selected/checked States.',
  Collection:
    'A surface of items; selectable items keep Selection chrome (ADR-007).',
  Overlay: 'Floats above the page — dialogs, menus, popovers, tooltips.',
  Navigation: 'Moves the user between locations or sections.',
  Disclosure: 'Reveals and hides content in place.',
  Feedback: 'Communicates system status back to the user.',
  Structure: 'Frames, rhythm, and typography — the composition layer.',
};
