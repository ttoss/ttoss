import { defineMessages } from '@ttoss/react-i18n';

export const messages = defineMessages({
  newColorScale: {
    defaultMessage: 'Nova escala de cor',
    description:
      'Label of the button that opens the editor for building a color ramp.',
  },
  chooseBaseColor: {
    defaultMessage: 'Escolha a cor base',
    description: 'Heading of the color-ramp editor, above the base swatches.',
  },
  customColor: {
    defaultMessage: 'Cor personalizada',
    description:
      'Accessible label for the free color input in the color-ramp editor.',
  },
  colorScaleName: {
    defaultMessage: 'Nome da escala',
    description: 'Placeholder of the name field in the color-ramp editor.',
  },
  addColorScale: {
    defaultMessage: 'Adicionar',
    description:
      'Label of the button that saves the ramp built in the color-ramp editor.',
  },
  cancelColorScale: {
    defaultMessage: 'Cancelar',
    description:
      'Accessible label for the button that closes the color-ramp editor.',
  },
  customizeStyles: {
    defaultMessage: 'Customizar estilos',
    description:
      'Tooltip (title) of the pipette button that opens the custom color picker in the color-ramp editor.',
  },
  customColorScaleName: {
    defaultMessage: '{base} personalizado',
    description:
      'Default name of a color ramp saved without one, built from the base color preset named `base`.',
  },
  toneRowLabel: {
    defaultMessage: 'Tons · clique para ajustar',
    description:
      'Heading of the row of tones in the color-ramp editor; each tone opens the custom color picker.',
  },
  resetTones: {
    defaultMessage: 'Restaurar',
    description:
      'Button in the color-ramp editor that drops every tone adjustment, back to the ramp built from the base color.',
  },
  toneTitle: {
    defaultMessage: 'Tom {index} · {color}',
    description:
      'Tooltip and accessible name of one tone in the color-ramp editor: its position and hex code.',
  },
  colorPickerSaturation: {
    defaultMessage: 'Saturação e brilho',
    description:
      'Accessible label for the square of the custom color picker that sets saturation and brightness.',
  },
  colorPickerHue: {
    defaultMessage: 'Matiz',
    description: 'Accessible label for the hue bar of the custom color picker.',
  },
  colorPickerHex: {
    defaultMessage: 'Hexadecimal',
    description:
      'Accessible label for the hex code field of the custom color picker.',
  },
  colorPickerHexUnit: {
    defaultMessage: 'Hex',
    description:
      'Short caption beside the hex code field of the custom color picker.',
  },
  colorPickerCancel: {
    defaultMessage: 'Cancelar',
    description:
      'Label of the button that closes the custom color picker without applying the color.',
  },
  colorPickerApply: {
    defaultMessage: 'Aplicar',
    description:
      'Label of the button that applies the color chosen in the custom color picker.',
  },
  removeColorScale: {
    defaultMessage: 'Remover escala',
    description:
      'Accessible label for the button that removes a ramp the reader built.',
  },
  detailsTitle: {
    defaultMessage: 'Details',
    description: 'Default title shown in the right sidebar when none is set.',
  },
  noSelection: {
    defaultMessage: 'Select an item to view details.',
    description: 'Message shown in the right sidebar when nothing is selected.',
  },
  openMenu: {
    defaultMessage: 'Open menu',
    description: 'Accessible label for the button that opens the left sidebar.',
  },
  closeMenu: {
    defaultMessage: 'Close menu',
    description:
      'Accessible label for the button that closes the left sidebar.',
  },
  openDetails: {
    defaultMessage: 'Open details',
    description:
      'Accessible label for the button that opens the right sidebar.',
  },
  closeDetails: {
    defaultMessage: 'Close details',
    description:
      'Accessible label for the button that closes the right sidebar.',
  },
  coldStartTitle: {
    defaultMessage: 'Map could not be shown',
    description:
      'Title shown in the map area on first mount when the spec fails before anything has ever resolved.',
  },
  settingDecrease: {
    defaultMessage: 'Decrease',
    description:
      "Accessible label for the button that steps a setting's slider down.",
  },
  settingIncrease: {
    defaultMessage: 'Increase',
    description:
      "Accessible label for the button that steps a setting's slider up.",
  },
  dismissInspector: {
    defaultMessage: 'Dismiss selection',
    description:
      'Accessible label for the button that clears the inspector panel selection.',
  },
  inspectorNoValue: {
    defaultMessage: 'No value',
    description:
      'Shown in the inspector panel when the selected feature has no bound value.',
  },
  metadataMapType: {
    defaultMessage: 'Map type: {map_type}',
    description: "Metadata panel: the spec's mapType, when set.",
  },
  metadataSourceCount: {
    defaultMessage: '{count, plural, one {# source} other {# sources}}',
    description: 'Metadata panel: number of data sources in the current spec.',
  },
  layerVisibilityToggle: {
    defaultMessage: 'Toggle visibility of layer {layer_id}',
    description:
      'Accessible label for the checkbox that toggles a layer in the layer-list controls variant.',
  },
  scrollGroupsBackward: {
    defaultMessage: 'Scroll groups backward',
    description:
      'Accessible label for the arrow that scrolls the grouped-menu carousel to earlier groups.',
  },
  scrollGroupsForward: {
    defaultMessage: 'Scroll groups forward',
    description:
      'Accessible label for the arrow that scrolls the grouped-menu carousel to later groups.',
  },
  clearFilters: {
    defaultMessage: 'Limpar {count, plural, one {# filtro} other {# filtros}}',
    description:
      'Chips filter: action clearing the selected chips, counting them.',
  },
  locatorSelected: {
    defaultMessage: 'Selecionado',
    description: 'Locator filter: heading above the currently selected place.',
  },
  locatorClearSearch: {
    defaultMessage: 'Limpar busca',
    description:
      'Locator filter: accessible label for the button clearing the search field.',
  },
  locatorRemoveSelection: {
    defaultMessage: 'Remover seleção',
    description:
      'Locator filter: accessible label for the button clearing the chosen place.',
  },
  locatorNoResults: {
    defaultMessage: 'Nada corresponde a "{query}"',
    description:
      'Locator filter: shown when a long-enough query matches no option.',
  },
  locatorRecent: {
    defaultMessage: 'Buscas recentes',
    description: 'Locator filter: heading above the recently picked places.',
  },
  timelineIntervalLabel: {
    defaultMessage: 'Intervalo de reprodução',
    description: 'Timeline filter: label for the playback interval input.',
  },
  timelineIntervalUnit: {
    defaultMessage: 's',
    description:
      'Timeline filter: seconds unit shown after the playback interval. Abbreviated.',
  },
  play: {
    defaultMessage: 'Play',
    description:
      'Label for the timeline button that auto-advances the current value in the preview sidebar.',
  },
  pause: {
    defaultMessage: 'Pause',
    description:
      'Label for the timeline button that stops the auto-advancing value in the preview sidebar.',
  },
  timelineHudCount: {
    defaultMessage: '{count} rec.',
    description:
      'Abbreviated record count beside the current value in the compact timeline bar anchored to the map.',
  },
  timelineHudClose: {
    defaultMessage: 'Close timeline',
    description:
      'Accessible label for the button that dismisses the compact timeline bar anchored to the map.',
  },
  timelineHudPrevious: {
    defaultMessage: 'Previous step',
    description:
      'Accessible label for the back stepper in the compact timeline bar anchored to the map.',
  },
  timelineHudNext: {
    defaultMessage: 'Next step',
    description:
      'Accessible label for the forward stepper in the compact timeline bar anchored to the map.',
  },
});
