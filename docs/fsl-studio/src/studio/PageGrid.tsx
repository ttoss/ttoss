import { EXAMPLE_PAGES } from './components/examplePages';

/**
 * The grid altitude (PRD F1.4): every example page rendered compact,
 * side by side — the semantic-drift view. One theme edit re-themes all of
 * them at once, which is exactly where drift becomes visible.
 */
export const PageGrid = () => {
  return (
    <div className="stage-grid">
      {EXAMPLE_PAGES.map((page) => {
        return (
          <section
            key={page.id}
            className="stage-grid-cell"
            aria-label={page.label}
          >
            <h3 className="stage-grid-title">{page.label}</h3>
            {page.render()}
          </section>
        );
      })}
    </div>
  );
};
