import { ToggleButton, ToggleButtonGroup } from '@ttoss/fsl-ui';
import * as React from 'react';

import { type Lens, LENS_EMPTY_STATE, LENS_LABELS, LENSES } from './lenses';
import { Stage } from './Stage';
import { ThemeInspector } from './theme/ThemeInspector';
import { ThemeNavigator } from './theme/ThemeNavigator';

/**
 * The Studio shell: navigator / stage / inspector, with the lens switcher in
 * the header. Lenses swap the side panels; the stage never resets (PRD §6.2).
 */
export const StudioShell = () => {
  const [lens, setLens] = React.useState<Lens>('theme');

  return (
    <div className="studio">
      <header className="studio-header">
        <span className="studio-brand">FSL Studio</span>
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
      </header>
      <div className="studio-body">
        <aside className="studio-navigator" aria-label="Navigator">
          {lens === 'theme' ? (
            <ThemeNavigator />
          ) : (
            <p className="studio-empty-state">
              {LENS_EMPTY_STATE[lens].navigator}
            </p>
          )}
        </aside>
        <Stage />
        <aside className="studio-inspector" aria-label="Inspector">
          {lens === 'theme' ? (
            <ThemeInspector />
          ) : (
            <p className="studio-empty-state">
              {LENS_EMPTY_STATE[lens].inspector}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
};
