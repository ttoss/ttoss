import * as fslUi from '@ttoss/fsl-ui';
import {
  type ComponentMeta,
  type Consequence,
  ENTITIES,
  type Entity,
  ENTITY_CONSEQUENCE,
  ENTITY_EVALUATION,
  type Evaluation,
} from '@ttoss/fsl-ui/semantics';

/**
 * Component Lab catalog (PRD F3.1) — auto-discovered from `@ttoss/fsl-ui`.
 *
 * Every `*Meta` export is the semantic identity of a component (or a composite
 * sub-part). We enumerate the barrel's exports and keep those shaped like a
 * `ComponentMeta`, so a new component appears in the Studio with zero
 * registration here (same auto-discovery philosophy as fsl-ui's contract
 * tests — PRD AD-6).
 */

export interface CatalogEntry {
  /** The export name, e.g. `buttonMeta`. Stable id for selection/URLs. */
  key: string;
  meta: ComponentMeta;
}

export const isComponentMeta = (value: unknown): value is ComponentMeta => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.displayName === 'string' &&
    typeof record.entity === 'string' &&
    typeof record.structure === 'string'
  );
};

export const CATALOG: readonly CatalogEntry[] = Object.entries(
  fslUi as Record<string, unknown>
)
  .filter(([key, value]) => {
    return key.endsWith('Meta') && isComponentMeta(value);
  })
  .map(([key, value]) => {
    return { key, meta: value as ComponentMeta };
  })
  .sort((a, b) => {
    return a.meta.displayName.localeCompare(b.meta.displayName);
  });

export interface EntityGroup {
  entity: Entity;
  entries: CatalogEntry[];
}

/** The catalog grouped by Entity, in the canonical entity order. */
export const catalogByEntity = (): EntityGroup[] => {
  return ENTITIES.map((entity) => {
    return {
      entity,
      entries: CATALOG.filter((entry) => {
        return entry.meta.entity === entity;
      }),
    };
  }).filter((group) => {
    return group.entries.length > 0;
  });
};

export const findEntry = (key: string): CatalogEntry | undefined => {
  return CATALOG.find((entry) => {
    return entry.key === key;
  });
};

/**
 * Legal authorial props for an entity, straight from the FSL legality
 * matrices (PRD AD-6). The Component Lab offers only these values, so an
 * illegal combination is not merely disabled — it cannot be expressed.
 */
export const legalEvaluations = (entity: Entity): readonly Evaluation[] => {
  return ENTITY_EVALUATION[entity];
};

export const legalConsequences = (entity: Entity): readonly Consequence[] => {
  return ENTITY_CONSEQUENCE[entity];
};

/**
 * A stable public link to the Layer-2 authoring contract for an entity. The
 * CONTRACT ships in the package tarball; the GitHub source is the durable URL
 * the Studio can point to (PRD F3.4).
 */
export const CONTRACT_URL =
  'https://github.com/ttoss/ttoss/blob/main/packages/fsl-ui/src/tokens/CONTRACT.md';
