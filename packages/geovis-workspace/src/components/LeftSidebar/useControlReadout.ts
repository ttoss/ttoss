import * as React from 'react';

import type { GeovisWorkspaceSidebarSettingsControl } from '../../context/GeovisWorkspaceContext';
import { useGeovisWorkspace } from '../../hooks/useGeovisWorkspace';
import { resolveBearing, useFormatBearing } from './BearingSettingControl';
import { sliderReadout } from './SliderSettingControl';
import { ChoiceSettingsContext } from './useChoiceSettings';

/** What a sub-block heading reads on its right, and how loudly. */
export interface ControlReadout {
  text: string;
  /**
   * `'value'` for the setting's own value (`3×`, `NE · 45°`); `'unit'` for what
   * a chosen option is counted in, which names rather than measures and so
   * reads quieter.
   */
  tone: 'value' | 'unit';
}

/**
 * The readout a sub-block heading shows in its control's place: a slider's
 * rung, a bearing's `NE · 45°`, the chosen option's `unit`. Nothing for a
 * toggle, a color ramp, or a choice whose chosen option declares no unit.
 *
 * Read from the shared selection, which each control publishes to, so the
 * heading and the control agree without the control rendering outside its
 * own box. Before a control has published, its default stands in.
 *
 * @param control - The sub-block's control.
 * @returns The readout, if the control has one.
 *
 * @example
 * useControlReadout(extrusionSlider); // { text: '3×', tone: 'value' }
 */
export const useControlReadout = (
  control: GeovisWorkspaceSidebarSettingsControl
): ControlReadout | undefined => {
  const { selection } = useGeovisWorkspace();
  const choices = React.useContext(ChoiceSettingsContext);
  const formatBearing = useFormatBearing();
  const raw = selection[control.menuId];

  if (control.kind === 'slider') {
    return { text: sliderReadout({ control, raw }), tone: 'value' };
  }

  if (control.kind === 'bearing') {
    return {
      text: formatBearing(resolveBearing({ control, raw })),
      tone: 'value',
    };
  }

  if (control.kind === 'choice') {
    const effective = choices?.effective(control.menuId);
    const unit = control.options.find((option) => {
      return option.value === effective;
    })?.unit;
    return unit === undefined ? undefined : { text: unit, tone: 'unit' };
  }

  return undefined;
};
