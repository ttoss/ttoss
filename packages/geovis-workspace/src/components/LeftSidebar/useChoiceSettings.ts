import * as React from 'react';

import type {
  GeovisWorkspaceSelection,
  GeovisWorkspaceSidebarChoiceSetting,
  GeovisWorkspaceSidebarSection,
} from '../../context/GeovisWorkspaceContext';
import { useGeovisWorkspace } from '../../hooks/useGeovisWorkspace';
import { isGateOpen, settingsControls } from './useSections';

/** Every `choice` setting in the sidebar's settings bodies. */
const findChoices = (
  sections: GeovisWorkspaceSidebarSection[]
): GeovisWorkspaceSidebarChoiceSetting[] => {
  return sections.flatMap((section) => {
    if (section.body.kind !== 'settings') return [];
    return settingsControls(section.body.blocks).flatMap((control) => {
      return control.kind === 'choice' ? [control] : [];
    });
  });
};

const isAvailable = ({
  control,
  value,
  sections,
  selection,
}: {
  control: GeovisWorkspaceSidebarChoiceSetting;
  value: string | undefined;
  sections: GeovisWorkspaceSidebarSection[];
  selection: GeovisWorkspaceSelection;
}): boolean => {
  const option = control.options.find((candidate) => {
    return candidate.value === value;
  });
  return (
    option !== undefined &&
    isGateOpen({ gate: option.enabledWhen, sections, selection })
  );
};

/**
 * The value a choice publishes: the reader's pick while its option is
 * available, the first available option while its gate is closed.
 */
const resolveEffective = ({
  control,
  picked,
  sections,
  selection,
}: {
  control: GeovisWorkspaceSidebarChoiceSetting;
  picked: string | undefined;
  sections: GeovisWorkspaceSidebarSection[];
  selection: GeovisWorkspaceSelection;
}): string | undefined => {
  if (isAvailable({ control, value: picked, sections, selection })) {
    return picked;
  }
  return control.options.find((option) => {
    return isGateOpen({ gate: option.enabledWhen, sections, selection });
  })?.value;
};

const initialPick = ({
  control,
  selection,
}: {
  control: GeovisWorkspaceSidebarChoiceSetting;
  selection: GeovisWorkspaceSelection;
}): string | undefined => {
  return (
    selection[control.menuId] ??
    control.defaultValue ??
    control.options[0]?.value
  );
};

/** What the choice controls read and do, keyed by `menuId`. */
export interface ChoiceSettingsState {
  /** The value a choice currently publishes, if it has any. */
  effective: (menuId: string) => string | undefined;
  /** Records the reader's pick and publishes it. */
  pick: (params: { menuId: string; value: string }) => void;
}

/**
 * The lifted state of every `choice` setting: the reader's picks and the value
 * each choice publishes.
 *
 * Lifted above the tabs for the reason the timeline and the chips are: a gate
 * closes when another menu moves — a variation picked in another tab — and the
 * fallback has to reach the selection then, not when the settings tab is next
 * opened. Holding the picks here is also what lets one survive that detour:
 * switch to a variation that cannot extrude and `2d` is published; switch back
 * and the `3d` the reader chose is published again.
 *
 * A value the app writes into the selection that names an available option is
 * adopted as the pick, so a permalink or a controlled value is followed. Only a
 * value this hook did not publish counts: the fallback it wrote while a gate was
 * closed must not overwrite the pick it stood in for.
 *
 * @param sections - The sidebar's sections.
 * @returns The choices' state.
 *
 * @example
 * const choices = useChoiceSettings(sections);
 * choices.effective('view'); // '2d' while a point variation is active
 */
export const useChoiceSettings = (
  sections: GeovisWorkspaceSidebarSection[]
): ChoiceSettingsState => {
  const { selection, setSelection } = useGeovisWorkspace();
  const choices = findChoices(sections);

  const [picks, setPicks] = React.useState<Record<string, string | undefined>>(
    () => {
      return Object.fromEntries(
        choices.map((control) => {
          return [control.menuId, initialPick({ control, selection })];
        })
      );
    }
  );

  // The last value each choice published, to tell the app's writes from ours.
  const published = React.useRef<Record<string, string>>({});

  const publish = ({ menuId, value }: { menuId: string; value: string }) => {
    published.current[menuId] = value;
    setSelection({ menuId, value });
  };

  const resolved = choices.map((control) => {
    const picked = picks[control.menuId] ?? initialPick({ control, selection });
    return {
      control,
      effective: resolveEffective({ control, picked, sections, selection }),
    };
  });

  // Guarded writes only, for the reason `useSettingValue` gives: `selection`
  // and `setSelection` change identity every render.
  React.useEffect(() => {
    for (const { control, effective } of resolved) {
      const current = selection[control.menuId];
      const adopt =
        current !== undefined &&
        current !== effective &&
        current !== published.current[control.menuId] &&
        isAvailable({ control, value: current, sections, selection });
      if (adopt) {
        setPicks((previous) => {
          return { ...previous, [control.menuId]: current };
        });
      } else if (effective !== undefined && current !== effective) {
        publish({ menuId: control.menuId, value: effective });
      }
    }
  });

  return {
    effective: (menuId) => {
      return resolved.find(({ control }) => {
        return control.menuId === menuId;
      })?.effective;
    },
    pick: ({ menuId, value }) => {
      setPicks((previous) => {
        return { ...previous, [menuId]: value };
      });
      publish({ menuId, value });
    },
  };
};

/**
 * Shares the lifted choice state with the controls inside the tabs. Provided by
 * the left sidebar, the only place settings tabs render.
 */
export const ChoiceSettingsContext =
  React.createContext<ChoiceSettingsState | null>(null);
