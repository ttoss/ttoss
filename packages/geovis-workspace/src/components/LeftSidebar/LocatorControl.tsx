import { Box } from '@ttoss/ui';
import * as React from 'react';

import type {
  GeovisWorkspaceSelection,
  GeovisWorkspaceSidebarLocatorFilter,
} from '../../context/GeovisWorkspaceContext';
import { useGeovisWorkspace } from '../../hooks/useGeovisWorkspace';
import { matchesQuery } from './locatorMatch';
import { locatorPanels } from './locatorPanels';
import { LocatorRecentSearches, LocatorSelectedCard } from './LocatorPicks';
import { LocatorNoResults, LocatorResults } from './LocatorResults';
import { LocatorSearchInput } from './LocatorSearchInput';
import { useLocatorCamera } from './useLocatorCamera';
import { useMarkedFeature } from './useMarkedFeature';

type LocatorOption = GeovisWorkspaceSidebarLocatorFilter['options'][number];

/** How many picks the "recent" row remembers. */
const RECENTS_LIMIT = 5;

/** Milliseconds a blur waits before closing the list, so a pick still lands. */
const BLUR_GRACE_MS = 150;

/** The option the shared selection names, if the list holds it yet. */
const findSelected = ({
  options,
  menuId,
  selection,
}: {
  options: LocatorOption[];
  menuId?: string;
  selection: GeovisWorkspaceSelection;
}) => {
  if (!menuId) return null;

  return (
    options.find((option) => {
      return option.id === selection[menuId];
    }) ?? null
  );
};

/**
 * The locator filter: a search field over the options the config declares, its
 * results, the recent picks, and a card for the current one.
 *
 * The field is a combobox: `role="combobox"` with `aria-controls` and
 * `aria-activedescendant` is what lets the arrow keys move a cursor through the
 * list without moving focus out of the input, which is the only way the query
 * stays editable while the list is being walked.
 *
 * A pick moves the camera to the entry's own `view`, through `runtime.setView()`
 * — or, for an entry naming a `viewPresetId`, by dispatching `set-view-preset`,
 * which the spec bounds and the action log records. Either way the sidebar
 * renders inside `GeoVisProvider`, so it reaches the runtime without any prop,
 * and the move never rebuilds the spec. A rejected dispatch (a preset the spec
 * does not declare) is committed as the runtime's result and surfaces in the
 * warnings panel, so it is never silent.
 *
 * The pick is also reported through `selection[menuId]`.
 *
 * Clearing reports the empty string back and leaves the camera alone: the
 * selection says what is chosen, which is nothing, while the map still shows
 * where the last pick took it.
 *
 * @param params.control - The locator's spec.
 * @returns The control.
 *
 * @example
 * <LocatorControl control={{ kind: 'locator', options: [{ id: '1', label: 'Santos' }] }} />
 */
export const LocatorControl = ({
  control,
}: {
  control: GeovisWorkspaceSidebarLocatorFilter;
}) => {
  const { options, placeholder, minChars = 2, menuId } = control;

  const { selection, setSelection } = useGeovisWorkspace();
  const moveCamera = useLocatorCamera();

  const baseId = React.useId();
  const listboxId = `${baseId}-listbox`;
  const optionId = (index: number) => {
    return `${baseId}-option-${index}`;
  };

  const [search, setSearch] = React.useState('');

  /*
   * What the control itself has to say about the choice: an entry once picked,
   * `null` once explicitly cleared, and `undefined` while it has no opinion —
   * which is the state it starts in, and the one that lets the shared selection
   * speak instead.
   */
  const [picked, setPicked] = React.useState<LocatorOption | null | undefined>(
    undefined
  );

  /*
   * Derived rather than stored, so an entry the selection names is on the card
   * whenever the options hold it — on the first render for an app restoring a
   * permalink, and equally on the render a list loaded from a file arrives in.
   * The field is left empty either way: the query is how an entry was found,
   * not what it is, and the camera is left to the spec's own `view`.
   */
  const selected =
    picked !== undefined
      ? picked
      : findSelected({ options, menuId, selection });
  useMarkedFeature(selected);

  const [recents, setRecents] = React.useState<LocatorOption[]>([]);
  const [showDrop, setShowDrop] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [cursor, setCursor] = React.useState(0);

  const matches =
    search.length >= minChars
      ? options.filter((option) => {
          return matchesQuery({ label: option.label, query: search });
        })
      : [];

  const panels = locatorPanels({
    showDrop,
    query: search,
    minChars,
    matchCount: matches.length,
    recentCount: recents.length,
  });

  const pick = (option: LocatorOption) => {
    setPicked(option);
    setSearch(option.label);
    setShowDrop(false);

    moveCamera(option);

    if (menuId) {
      setSelection({ menuId, value: option.id });
    }

    setRecents((current) => {
      return [
        option,
        ...current.filter((entry) => {
          return entry.id !== option.id;
        }),
      ].slice(0, RECENTS_LIMIT);
    });
  };

  /*
   * Dropping the pick publishes the empty string, the same "nothing chosen" the
   * chips publish when their last one goes: a selection still holding an id the
   * card no longer shows would restore, from a permalink, an entry the user had
   * removed. The camera stays where it is — a journey already made is not
   * undone by clearing the search that started it.
   */
  const clearSelected = () => {
    setPicked(null);

    if (menuId) {
      setSelection({ menuId, value: '' });
    }
  };

  const clearAll = () => {
    setSearch('');
    setCursor(0);
    clearSelected();
  };

  /*
   * Arrow keys move the cursor and never the caret, so the query stays editable
   * while the list is walked. The cursor clamps at both ends rather than
   * wrapping: a list that jumps from last to first reads as a scroll that lost
   * its place.
   */
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setShowDrop(false);
      return;
    }

    if (event.key === 'Enter' && panels.results) {
      event.preventDefault();
      pick(matches[cursor]);
      return;
    }

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

    event.preventDefault();
    setShowDrop(true);

    if (matches.length === 0) return;

    setCursor((current) => {
      const next = current + (event.key === 'ArrowDown' ? 1 : -1);
      return Math.min(matches.length - 1, Math.max(0, next));
    });
  };

  return (
    <Box>
      <LocatorSearchInput
        value={search}
        placeholder={placeholder}
        focused={focused}
        listboxId={listboxId}
        activeOptionId={panels.results ? optionId(cursor) : undefined}
        expanded={panels.results}
        onChange={(next) => {
          setSearch(next);
          setShowDrop(true);
          setCursor(0);
          if (!next) {
            clearSelected();
          }
        }}
        onFocus={() => {
          setFocused(true);
          setShowDrop(true);
        }}
        onBlur={() => {
          setFocused(false);
          // A pick is a `mousedown` on an option, which lands before the click
          // that would follow — closing on blur alone would unmount the row
          // under the pointer first.
          setTimeout(() => {
            setShowDrop(false);
          }, BLUR_GRACE_MS);
        }}
        onKeyDown={onKeyDown}
        onClear={clearAll}
      />

      {panels.results ? (
        <LocatorResults
          options={matches}
          query={search}
          listboxId={listboxId}
          optionId={optionId}
          cursor={cursor}
          onPick={pick}
          onHover={setCursor}
        />
      ) : null}

      {panels.empty ? <LocatorNoResults query={search} /> : null}

      {panels.recents ? (
        <LocatorRecentSearches options={recents} onPick={pick} />
      ) : null}

      {selected ? (
        <LocatorSelectedCard option={selected} onClear={clearSelected} />
      ) : null}
    </Box>
  );
};
