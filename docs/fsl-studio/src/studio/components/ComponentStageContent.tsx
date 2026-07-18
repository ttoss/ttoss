import { findEntry } from './catalog';
import { useComponentStore } from './componentStore';
import { findPage } from './examplePages';
import { previewFor } from './previews';

/**
 * The stage subject when the Component lens is active: the selected
 * component's live preview (props-driven, from the registry), an example
 * page, or — for a catalog entry with no registry preview — a semantic
 * identity card so the entry is still meaningful on the stage (PRD §14).
 */
export const ComponentStageContent = () => {
  const store = useComponentStore();

  if (store.selection.kind === 'page') {
    const page = findPage(store.selection.id);
    return <>{page?.render()}</>;
  }

  const entry = findEntry(store.selection.key);
  if (!entry) {
    return null;
  }

  const preview = previewFor(entry.meta.displayName);
  if (preview) {
    return (
      <>
        {preview.render({
          evaluation: store.evaluation,
          consequence: store.consequence,
        })}
      </>
    );
  }

  return (
    <div className="component-identity-card">
      <p className="component-name">{entry.meta.displayName}</p>
      <p className="theme-hint">
        {entry.meta.entity} · {entry.meta.structure}
        {entry.meta.composition ? ` · ${entry.meta.composition}` : ''}
      </p>
      <p className="theme-hint">
        No standalone preview — this part is exercised inside a composite. See
        the example pages for it in context.
      </p>
    </div>
  );
};
