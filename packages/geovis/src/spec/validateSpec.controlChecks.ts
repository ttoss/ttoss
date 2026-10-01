import { isLayerControlGroup } from './layerControl';
import type { GeoVisIssue } from './result';
import type { VisualizationSpec } from './types';

/**
 * Rejects a layer control whose entries — toggles and categories, at either
 * level — repeat an id. Each toggle's on/off state is remembered by its id, so
 * two toggles sharing one would flip together, and a category sharing a
 * toggle's id would be indistinguishable from it.
 *
 * @param spec - The spec, already schema-valid.
 * @returns One issue per repeated id, pointing at its second occurrence.
 *
 * @example
 * validateLayerControlIds({ ...spec, control: { id: 'c', items: [a, { ...b, id: a.id }] } });
 * // [{ code: 'duplicate-control-item-id', subject: { path: '/control/items/1', id: 'a' }, ... }]
 */
export const validateLayerControlIds = (
  spec: VisualizationSpec
): GeoVisIssue[] => {
  const issues: GeoVisIssue[] = [];
  const seen = new Set<string>();

  const visit = (id: string, path: string) => {
    if (seen.has(id)) {
      issues.push({
        code: 'duplicate-control-item-id',
        subject: { path, id },
        message: `Layer control entry id "${id}" is used more than once; each toggle and category needs its own.`,
      });
      return;
    }
    seen.add(id);
  };

  for (const [index, entry] of (spec.control?.items ?? []).entries()) {
    const path = `/control/items/${index}`;
    visit(entry.id, path);
    if (isLayerControlGroup(entry)) {
      for (const [itemIndex, item] of entry.items.entries()) {
        visit(item.id, `${path}/items/${itemIndex}`);
      }
    }
  }

  return issues;
};
