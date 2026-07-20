import { Heading, Stack } from '@ttoss/fsl-ui';

import { catalogByEntity } from './catalog';
import { useComponentStore } from './componentStore';
import { EXAMPLE_PAGES } from './examplePages';

/**
 * Component lens navigator (PRD F3.1): the full auto-discovered catalog
 * grouped by Entity, plus the example-pages group. Selecting an item sets the
 * stage subject.
 */
export const ComponentNavigator = () => {
  const store = useComponentStore();
  const groups = catalogByEntity();

  return (
    <Stack gap="md">
      {groups.map((group) => {
        return (
          <Stack key={group.entity} gap="xs">
            <Heading level={2} size="title-sm">
              {group.entity}
            </Heading>
            <ul className="component-list">
              {group.entries.map((entry) => {
                const active =
                  store.selection.kind === 'component' &&
                  store.selection.key === entry.key;
                return (
                  <li key={entry.key}>
                    <button
                      type="button"
                      className="component-item"
                      aria-current={active ? 'true' : undefined}
                      onClick={() => {
                        return store.selectComponent(entry.key);
                      }}
                    >
                      {entry.meta.displayName}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Stack>
        );
      })}

      <Stack gap="xs">
        <Heading level={2} size="title-sm">
          Example pages
        </Heading>
        <ul className="component-list">
          {EXAMPLE_PAGES.map((page) => {
            const active =
              store.selection.kind === 'page' && store.selection.id === page.id;
            return (
              <li key={page.id}>
                <button
                  type="button"
                  className="component-item"
                  aria-current={active ? 'true' : undefined}
                  onClick={() => {
                    return store.selectPage(page.id);
                  }}
                >
                  {page.label}
                </button>
              </li>
            );
          })}
        </ul>
      </Stack>
    </Stack>
  );
};
