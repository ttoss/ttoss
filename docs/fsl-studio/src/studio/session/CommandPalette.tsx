import * as React from 'react';

import { useComponentStore } from '../components/componentStore';
import { useThemeStore } from '../theme/themeStore';
import { buildCommands, filterCommands } from './commands';
import { useSession } from './sessionStore';

/**
 * ⌘K command palette (PRD F1.5, §6.5): tokens of work — lenses, altitudes,
 * presets, components, pages — reachable from the keyboard. Opens on
 * Cmd/Ctrl+K (or the header button), filters as you type, arrow keys +
 * Enter execute, Escape closes. Combobox/listbox semantics with
 * `aria-activedescendant` keep it screen-reader honest.
 */
export const CommandPalette = () => {
  const session = useSession();
  const theme = useThemeStore();
  const component = useComponentStore();

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setOpen((prev) => {
          return !prev;
        });
        setQuery('');
        setActive(0);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      return window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const commands = React.useMemo(() => {
    return buildCommands({ session, theme, component });
  }, [session, theme, component]);

  const results = React.useMemo(() => {
    return filterCommands(commands, query);
  }, [commands, query]);

  const clampedActive = Math.min(active, Math.max(results.length - 1, 0));

  const close = () => {
    setOpen(false);
    setQuery('');
    setActive(0);
  };

  const runCommand = (index: number) => {
    const command = results[index];
    if (command) {
      command.run();
    }
    close();
  };

  if (!open) {
    return (
      <button
        type="button"
        className="palette-open"
        aria-label="Open command palette"
        onClick={() => {
          return setOpen(true);
        }}
      >
        ⌘K
      </button>
    );
  }

  return (
    <div
      className="palette-overlay"
      data-testid="palette-overlay"
      // Backdrop: a pointer-only dismiss affordance. Keyboard users close
      // with Escape (handled on the combobox input below).
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          close();
        }
      }}
    >
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <input
          // A user-invoked palette must receive focus to stay keyboard-operable.
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          type="text"
          className="palette-input"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-listbox"
          aria-activedescendant={
            results.length > 0 ? `palette-option-${clampedActive}` : undefined
          }
          aria-label="Search commands"
          placeholder="Type a command…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActive(Math.min(clampedActive + 1, results.length - 1));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActive(Math.max(clampedActive - 1, 0));
            } else if (event.key === 'Enter') {
              event.preventDefault();
              runCommand(clampedActive);
            } else if (event.key === 'Escape') {
              event.preventDefault();
              close();
            }
          }}
        />
        <ul id="palette-listbox" role="listbox" className="palette-list">
          {results.length === 0 ? (
            <li className="palette-empty" role="presentation">
              No matching command — try a component name, a preset, or a lens.
            </li>
          ) : (
            results.map((command, index) => {
              return (
                // Keyboard interaction lives on the combobox input
                // (aria-activedescendant pattern); the option's click is the
                // pointer path of the same command.
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                <li
                  key={command.id}
                  id={`palette-option-${index}`}
                  role="option"
                  aria-selected={index === clampedActive}
                  className="palette-option"
                  onClick={() => {
                    return runCommand(index);
                  }}
                >
                  {command.title}
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
};
