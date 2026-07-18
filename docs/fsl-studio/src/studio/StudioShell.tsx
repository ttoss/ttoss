import { ToggleButton, ToggleButtonGroup } from '@ttoss/fsl-ui';
import * as React from 'react';

import { ColorModeToggle } from './ColorModeToggle';
import { ComponentInspector } from './components/ComponentInspector';
import { ComponentNavigator } from './components/ComponentNavigator';
import { ComponentStageContent } from './components/ComponentStageContent';
import { useComponentStore } from './components/componentStore';
import { EXAMPLE_PAGES, findPage } from './components/examplePages';
import { type Lens, LENS_EMPTY_STATE, LENS_LABELS, LENSES } from './lenses';
import { PageGrid } from './PageGrid';
import { CommandPalette } from './session/CommandPalette';
import { type Altitude, ALTITUDES } from './session/sessionState';
import { useSession } from './session/sessionStore';
import { Stage } from './Stage';
import { StageSample } from './StageSample';
import { ThemeInspector } from './theme/ThemeInspector';
import { ThemeNavigator } from './theme/ThemeNavigator';
import { useThemeStore } from './theme/themeStore';

/**
 * Peripheral broken-ref counter (PRD §6.4-P2): validation is ambient — a
 * discreet header signal, never a modal or toast. The per-token badges live
 * on the offending rows in the navigator and the diff.
 */
const RefErrorsCounter = () => {
  const { brokenRefs } = useThemeStore();
  if (brokenRefs.length === 0) {
    return null;
  }
  return (
    <span className="studio-ref-errors">
      ⚠ {brokenRefs.length} ref error{brokenRefs.length === 1 ? '' : 's'}
    </span>
  );
};

const ALTITUDE_LABELS: Record<Altitude, string> = {
  component: 'Component',
  page: 'Page',
  grid: 'Grid',
};

/**
 * The Studio shell: navigator / stage / inspector, with the lens switcher
 * and command palette in the header and the altitude switcher on the stage.
 * Lenses swap the side panels and the stage subject; the stage frame (the
 * light/dark panes) and the altitude never reset on a lens switch
 * (PRD §6.2, F1.4).
 */
export const StudioShell = () => {
  const { lens, altitude, setLens, setAltitude, goHome } = useSession();
  const componentStore = useComponentStore();
  const { selection } = componentStore;

  const renderSubject = React.useCallback(() => {
    if (altitude === 'grid') {
      return <PageGrid />;
    }
    if (altitude === 'page') {
      // The selected example page, or the first one as the useful default —
      // never an empty stage (PRD §6.2).
      const pageId =
        selection.kind === 'page' ? selection.id : EXAMPLE_PAGES[0].id;
      return <>{findPage(pageId)?.render()}</>;
    }
    if (lens === 'components') {
      return <ComponentStageContent />;
    }
    return <StageSample />;
  }, [lens, altitude, selection]);

  return (
    <div className="studio">
      <header className="studio-header">
        <button type="button" className="studio-brand" onClick={goHome}>
          FSL Studio
        </button>
        <RefErrorsCounter />
        <ToggleButtonGroup
          aria-label="Lens"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[lens]}
          onSelectionChange={(keys) => {
            // Single selection + disallowEmptySelection: RAC guarantees
            // exactly one key, and the only ids in the group are lenses.
            setLens([...keys][0] as Lens);
          }}
        >
          {LENSES.map((id) => {
            return (
              <ToggleButton key={id} id={id}>
                {LENS_LABELS[id]}
              </ToggleButton>
            );
          })}
        </ToggleButtonGroup>
        <CommandPalette />
        <ColorModeToggle />
      </header>
      <div className="studio-body">
        <aside className="studio-navigator" aria-label="Navigator">
          {lens === 'theme' ? <ThemeNavigator /> : null}
          {lens === 'components' ? <ComponentNavigator /> : null}
          {lens === 'generate' ? (
            <p className="studio-empty-state">
              {LENS_EMPTY_STATE.generate.navigator}
            </p>
          ) : null}
        </aside>
        <Stage
          renderSubject={renderSubject}
          toolbar={
            <ToggleButtonGroup
              aria-label="Stage altitude"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[altitude]}
              onSelectionChange={(keys) => {
                setAltitude([...keys][0] as Altitude);
              }}
            >
              {ALTITUDES.map((id) => {
                return (
                  <ToggleButton key={id} id={id}>
                    {ALTITUDE_LABELS[id]}
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
          }
        />
        <aside className="studio-inspector" aria-label="Inspector">
          {lens === 'theme' ? <ThemeInspector /> : null}
          {lens === 'components' ? <ComponentInspector /> : null}
          {lens === 'generate' ? (
            <p className="studio-empty-state">
              {LENS_EMPTY_STATE.generate.inspector}
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
};
