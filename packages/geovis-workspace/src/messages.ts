import { defineMessages } from '@ttoss/react-i18n';

export const messages = defineMessages({
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
});
